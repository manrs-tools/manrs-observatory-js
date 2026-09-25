import { ManrsError, errorMessageFromBody } from "./errors";

export const DEFAULT_TIMEOUT_MS = 30_000;
export const DEFAULT_RETRIES = 3;
export const ENDPOINT_URL = "https://observatory.manrs.org/api/v2";
export const DOCS_URL = "https://observatory.manrs.org/api/v2/docs";
export const SDK_VERSION = "1.0.0";

export type FetchLike = typeof fetch;

export interface RequestExecutorOptions {
  /** API key sent as `Authorization: Bearer <apiKey>`. Omit to make unauthenticated requests. */
  apiKey?: string;
  /** Overrides the API base URL. Defaults to the production MANRS Observatory endpoint. */
  baseUrl?: string;
  /** Request timeout in milliseconds. Defaults to 30s. */
  timeoutMs?: number;
  /** Logs each request/response (method, URL, status, and bodies) to stderr. */
  debug?: boolean;
  /** Number of retry attempts for idempotent requests on network errors or 502/503/504. Defaults to 3. */
  retries?: number;
  /** Custom fetch implementation. Defaults to the global `fetch`. */
  fetch?: FetchLike;
}

const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);
const RETRYABLE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function backoffMs(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 8000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SENSITIVE_BODY_KEYS = new Set(["password", "apikey", "key", "token", "secret"]);

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactValue);
  if (value === null || typeof value !== "object") return value;

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    result[key] = SENSITIVE_BODY_KEYS.has(key.toLowerCase()) ? "***REDACTED***" : redactValue(val);
  }
  return result;
}

/**
 * Redacts sensitive fields (password, key, token, etc.) anywhere in a JSON body before it's
 * written to debug logs. The search recurses because the actual secret is nested at least one level
 * deep in every request this SDK sends (e.g. `login`'s `{ login: { password } }`, `keys`'s
 * `{ key: apiKey }`). Falls back to the raw text if it isn't JSON.
 */
function redactSecrets(text: string): string {
  try {
    return JSON.stringify(redactValue(JSON.parse(text)));
  } catch {
    return text;
  }
}

const SENSITIVE_PATH_PARENTS = new Set(["invites", "reset-password", "verify"]);

/**
 * Redacts sensitive query values, and the path segment that directly follows an `invites`,
 * `reset-password` or `verify` segment, before a URL is written to debug logs.
 */
function redactUrl(url: string): string {
  const queryIndex = url.indexOf("?");
  const segments = (queryIndex === -1 ? url : url.slice(0, queryIndex)).split("/");
  for (let i = 1; i < segments.length; i++) {
    if (SENSITIVE_PATH_PARENTS.has(segments[i - 1]!) && segments[i]) segments[i] = "***REDACTED***";
  }
  const base = segments.join("/");
  if (queryIndex === -1) return base;

  const params = new URLSearchParams(url.slice(queryIndex + 1));
  for (const key of [...params.keys()]) {
    if (SENSITIVE_BODY_KEYS.has(key.toLowerCase())) params.set(key, "***REDACTED***");
  }
  return `${base}?${params.toString()}`;
}

/**
 * Low-level HTTP client shared by every resource. Handles auth headers,
 * JSON encoding/decoding, retries, and error parsing. Not part of the
 * public API surface; resources call it via `BaseResource`.
 */
export class RequestExecutor {
  private apiKey: string;
  private readonly baseUrl: string;
  private timeoutMs: number;
  private readonly debug: boolean;
  private readonly retries: number;
  private readonly fetchImpl: FetchLike;

  constructor(options: RequestExecutorOptions = {}) {
    this.apiKey = options.apiKey ?? "";
    this.baseUrl = (options.baseUrl ?? ENDPOINT_URL).replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.debug = options.debug ?? false;
    this.retries = options.retries ?? DEFAULT_RETRIES;

    const fetchImpl = options.fetch ?? globalThis.fetch?.bind(globalThis);
    if (!fetchImpl) {
      throw new Error(
        "No fetch implementation available in this environment; provide one via the `fetch` client option.",
      );
    }
    this.fetchImpl = fetchImpl;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  setTimeout(timeoutMs: number): void {
    this.timeoutMs = timeoutMs;
  }

  get<T = unknown>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  delete<T = unknown>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  /** Performs a GET and returns the raw response bytes, for binary payloads like ticket attachments. */
  async getRaw(path: string): Promise<ArrayBuffer> {
    const { body } = await this.doFetch("GET", path, undefined, (res) => res.arrayBuffer());
    return body;
  }

  /** Performs a GET and returns the response body as text, for non-JSON payloads like SVG badges. */
  async getText(path: string): Promise<string> {
    const { body } = await this.doFetch("GET", path, undefined, (res) => res.text());
    return body;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const { status, body: text } = await this.doFetch(method, path, body, (res) => res.text());

    if (!text) {
      return undefined as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new ManrsError(`Invalid JSON response: ${message}`, status, {});
    }
  }

  /**
   * Sends the request and reads the body with `read`, all inside one timeout. `fetch` resolves once
   * headers arrive, so the timer has to stay armed until the body read settles or a stalled body
   * would hang the caller indefinitely. Error statuses are thrown here as ManrsError.
   */
  private async doFetch<B>(
    method: string,
    path: string,
    body: unknown,
    read: (res: Response) => Promise<B>,
  ): Promise<{ status: number; body: B }> {
    const deadline = Date.now() + this.timeoutMs;
    const url = `${this.baseUrl}/${path}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Manrs-Client-Version": SDK_VERSION,
    };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    let requestBody: string | undefined;
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify(body);
    }

    for (let attempt = 0; ; attempt++) {
      if (this.debug) {
        console.error(`> ${method} ${redactUrl(url)}`);
        if (requestBody) console.error(`> body: ${redactSecrets(requestBody)}`);
      }

      const canRetry = attempt < this.retries && RETRYABLE_METHODS.has(method);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), Math.max(deadline - Date.now(), 0));

      try {
        const res = await this.fetchImpl(url, { method, headers, body: requestBody, signal: controller.signal });

        if (this.debug) {
          console.error(`< ${method} ${redactUrl(url)} ${res.status}`);
        }

        if (RETRYABLE_STATUS_CODES.has(res.status) && canRetry && Date.now() < deadline) {
          await res.body?.cancel();
        } else if (res.status >= 400) {
          throw this.buildErrorFromText(res.status, await res.text());
        } else {
          return { status: res.status, body: await read(res) };
        }
      } catch (err) {
        if (err instanceof ManrsError) {
          throw err;
        }
        if (!canRetry || Date.now() >= deadline) {
          const message =
            err instanceof Error && err.name === "AbortError"
              ? `Request timed out after ${this.timeoutMs}ms`
              : err instanceof Error
                ? err.message
                : String(err);
          throw new ManrsError(message, 0, {});
        }
      } finally {
        clearTimeout(timeout);
      }

      await sleep(backoffMs(attempt));
    }
  }

  private buildErrorFromText(statusCode: number, text: string): ManrsError {
    let parsedBody: Record<string, unknown> = {};
    if (text) {
      try {
        parsedBody = JSON.parse(text) as Record<string, unknown>;
      } catch {
        parsedBody = {};
      }
    }

    if (this.debug && text) {
      console.error(redactSecrets(text));
    }

    return new ManrsError(errorMessageFromBody(parsedBody, statusCode), statusCode, parsedBody);
  }
}
