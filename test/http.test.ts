import { describe, expect, it, vi } from "vitest";
import { ManrsError } from "../src/errors";
import type { FetchLike } from "../src/http";
import { ENDPOINT_URL, RequestExecutor } from "../src/http";
import { createMockFetch } from "./test-utils";

/** A fetch that hangs until its AbortSignal fires, then rejects like a real aborted fetch would. */
function createHangingFetch(): { fetch: FetchLike; callCount: () => number } {
  let callCount = 0;
  const fetchImpl: FetchLike = (_input, init) => {
    callCount++;
    return new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const err = new Error("This operation was aborted");
        err.name = "AbortError";
        reject(err);
      });
    });
  };
  return { fetch: fetchImpl, callCount: () => callCount };
}

/** A fetch whose headers arrive at once but whose body never finishes until the AbortSignal fires. */
function createStalledBodyFetch(): FetchLike {
  return (_input, init) =>
    Promise.resolve({
      status: 200,
      text: () =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const err = new Error("This operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        }),
    } as unknown as Response);
}

describe("RequestExecutor", () => {
  it("calls the global fetch with the global object as its receiver", async () => {
    const { fetch } = createMockFetch([{ body: { ok: true } }]);
    vi.stubGlobal("fetch", function (this: unknown, ...args: Parameters<FetchLike>) {
      if (this !== globalThis) {
        throw new TypeError("Failed to execute 'fetch' on 'Window': Illegal invocation");
      }
      return fetch(...args);
    });

    try {
      const http = new RequestExecutor();
      await expect(http.get("ping")).resolves.toEqual({ ok: true });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("sends the Authorization header when an API key is set", async () => {
    const { fetch, calls } = createMockFetch([{ body: { ok: true } }]);
    const http = new RequestExecutor({ apiKey: "my-secret-key", fetch });

    await http.get("ping");

    expect(calls[0]!.headers.Authorization).toBe("Bearer my-secret-key");
  });

  it("omits the Authorization header without an API key", async () => {
    const { fetch, calls } = createMockFetch([{ body: { ok: true } }]);
    const http = new RequestExecutor({ fetch });

    await http.get("ping");

    expect(calls[0]!.headers.Authorization).toBeUndefined();
  });

  it("setApiKey updates the header used on subsequent requests", async () => {
    const { fetch, calls } = createMockFetch([{ body: {} }, { body: {} }]);
    const http = new RequestExecutor({ apiKey: "old-key", fetch });

    await http.get("ping");
    http.setApiKey("new-key");
    await http.get("ping");

    expect(calls[0]!.headers.Authorization).toBe("Bearer old-key");
    expect(calls[1]!.headers.Authorization).toBe("Bearer new-key");
  });

  it("sends standard headers and the client version", async () => {
    const { fetch, calls } = createMockFetch([{ body: {} }]);
    const http = new RequestExecutor({ fetch });

    await http.get("ping");

    expect(calls[0]!.headers.Accept).toBe("application/json");
    expect(calls[0]!.headers["Manrs-Client-Version"]).toBeTruthy();
  });

  it("does not set Accept-Encoding (forbidden header in browser fetch)", async () => {
    const { fetch, calls } = createMockFetch([{ body: {} }]);
    const http = new RequestExecutor({ fetch });

    await http.get("ping");

    expect(calls[0]!.headers["Accept-Encoding"]).toBeUndefined();
  });

  it("JSON-encodes the request body and sets Content-Type", async () => {
    const { fetch, calls } = createMockFetch([{ body: {} }]);
    const http = new RequestExecutor({ fetch });

    await http.post("things", { name: "test" });

    expect(calls[0]!.headers["Content-Type"]).toBe("application/json");
    expect(calls[0]!.body).toBe(JSON.stringify({ name: "test" }));
  });

  it("sends requests against the configured base URL", async () => {
    const { fetch, calls } = createMockFetch([{ body: {} }]);
    const http = new RequestExecutor({ baseUrl: "https://example.test/api", fetch });

    await http.get("ases/13335");

    expect(calls[0]!.url).toBe("https://example.test/api/ases/13335");
  });

  it("parses a successful JSON response", async () => {
    const { fetch } = createMockFetch([{ body: { as: { id: 13335, name: "Cloudflare" } } }]);
    const http = new RequestExecutor({ fetch });

    const data = await http.get<{ as: { id: number; name: string } }>("ases/13335");

    expect(data.as).toEqual({ id: 13335, name: "Cloudflare" });
  });

  it("wraps a malformed JSON success response in a ManrsError", async () => {
    const { fetch } = createMockFetch([{ status: 200, bodyText: "<html>not json</html>" }]);
    const http = new RequestExecutor({ fetch });

    await expect(http.get("ping")).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 200,
      message: expect.stringContaining("Invalid JSON response"),
    });
  });

  it("returns undefined for an empty response body", async () => {
    const { fetch } = createMockFetch([{ status: 204, bodyText: "" }]);
    const http = new RequestExecutor({ fetch });

    const data = await http.delete("things/1");

    expect(data).toBeUndefined();
  });

  it("throws a ManrsError with status code and parsed body on 4xx", async () => {
    const { fetch } = createMockFetch([{ status: 404, body: { title: "Not Found" } }]);
    const http = new RequestExecutor({ fetch });

    await expect(http.get("participants/missing")).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 404,
      message: "Not Found (HTTP 404)",
    });
  });

  it("includes validation error details in the thrown message", async () => {
    const { fetch } = createMockFetch([
      {
        status: 422,
        body: { detail: "Validation failed", errors: [{ message: "invalid id", path: "/id" }] },
      },
    ]);
    const http = new RequestExecutor({ fetch });

    let caught: unknown;
    try {
      await http.get("participants/bad-id");
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(ManrsError);
    expect((caught as ManrsError).message).toBe("Validation failed (HTTP 422): invalid id (at /id)");
    expect((caught as ManrsError).body).toEqual({
      detail: "Validation failed",
      errors: [{ message: "invalid id", path: "/id" }],
    });
  });

  it("retries a GET on a 503 and succeeds on the next attempt", async () => {
    const { fetch, calls } = createMockFetch([{ status: 503 }, { body: { ok: true } }]);
    const http = new RequestExecutor({ fetch, retries: 1 });

    const data = await http.get<{ ok: boolean }>("ping");

    expect(data.ok).toBe(true);
    expect(calls).toHaveLength(2);
  }, 10_000);

  it("does not retry a non-idempotent method on a 503", async () => {
    const { fetch, calls } = createMockFetch([{ status: 503, body: { title: "Unavailable" } }]);
    const http = new RequestExecutor({ fetch, retries: 3 });

    await expect(http.post("things", {})).rejects.toMatchObject({ statusCode: 503 });
    expect(calls).toHaveLength(1);
  });

  it("gives up after exhausting retries", async () => {
    const { fetch, calls } = createMockFetch([{ status: 503 }, { status: 503 }]);
    const http = new RequestExecutor({ fetch, retries: 1 });

    await expect(http.get("ping")).rejects.toMatchObject({ statusCode: 503 });
    expect(calls).toHaveLength(2);
  }, 10_000);

  it("retries a GET on a network error", async () => {
    const { fetch, calls } = createMockFetch([{ networkError: true }, { body: { ok: true } }]);
    const http = new RequestExecutor({ fetch, retries: 1 });

    const data = await http.get<{ ok: boolean }>("ping");

    expect(data.ok).toBe(true);
    expect(calls).toHaveLength(2);
  }, 10_000);

  it("wraps an exhausted timeout in a ManrsError with statusCode 0", async () => {
    vi.useFakeTimers();
    try {
      const { fetch } = createHangingFetch();
      const http = new RequestExecutor({ fetch, timeoutMs: 1000, retries: 0 });

      const assertion = expect(http.get("ping")).rejects.toMatchObject({
        name: "ManrsError",
        statusCode: 0,
        message: "Request timed out after 1000ms",
      });

      await vi.advanceTimersByTimeAsync(1000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it("shares one deadline across retries instead of resetting the timeout per attempt", async () => {
    vi.useFakeTimers();
    try {
      const { fetch, callCount } = createHangingFetch();
      const http = new RequestExecutor({ fetch, timeoutMs: 1000, retries: 2 });

      const assertion = expect(http.get("ping")).rejects.toMatchObject({
        name: "ManrsError",
        statusCode: 0,
      });

      // If the timeout were reset per attempt, exhausting 2 retries would take 3000ms+
      // of fetch attempts alone. Advancing by exactly the overall budget should be
      // enough to finish, with no room left for a second attempt.
      await vi.advanceTimersByTimeAsync(1000);
      await assertion;

      expect(callCount()).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("times out a body read that stalls after the headers arrive", async () => {
    vi.useFakeTimers();
    try {
      const http = new RequestExecutor({ fetch: createStalledBodyFetch(), timeoutMs: 1000, retries: 0 });

      const assertion = expect(http.getText("participants/1/badge")).rejects.toMatchObject({
        name: "ManrsError",
        statusCode: 0,
        message: "Request timed out after 1000ms",
      });

      await vi.advanceTimersByTimeAsync(1000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it("getRaw returns the raw response bytes", async () => {
    const { fetch } = createMockFetch([{ bodyText: "binary-content" }]);
    const http = new RequestExecutor({ fetch });

    const buffer = await http.getRaw("tickets/1/attachments/2");

    expect(Buffer.from(buffer).toString()).toBe("binary-content");
  });

  it("getRaw throws a ManrsError on failure", async () => {
    const { fetch } = createMockFetch([{ status: 403, body: { title: "Forbidden" } }]);
    const http = new RequestExecutor({ fetch });

    await expect(http.getRaw("tickets/1/attachments/2")).rejects.toMatchObject({ statusCode: 403 });
  });

  it("getText returns the response body verbatim", async () => {
    const { fetch } = createMockFetch([{ bodyText: "<svg/>" }]);
    const http = new RequestExecutor({ fetch });

    expect(await http.getText("participants/1/badge")).toBe("<svg/>");
  });

  it("getText throws a ManrsError on failure", async () => {
    const { fetch } = createMockFetch([{ status: 404, body: { title: "Not Found" } }]);
    const http = new RequestExecutor({ fetch });

    await expect(http.getText("participants/1/badge")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("put sends a PUT with a JSON body", async () => {
    const { fetch, calls } = createMockFetch([{ status: 204, bodyText: "" }]);
    const http = new RequestExecutor({ fetch });

    await http.put("settings/ticket-assignees/General", { assignee: "user-1" });

    expect(calls[0]!.method).toBe("PUT");
    expect(calls[0]!.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(calls[0]!.body!)).toEqual({ assignee: "user-1" });
  });

  it("does not retry a PUT on a 503", async () => {
    const { fetch, calls } = createMockFetch([{ status: 503 }]);
    const http = new RequestExecutor({ fetch });

    await expect(http.put("settings/ticket-assignees/General", {})).rejects.toMatchObject({
      statusCode: 503,
    });
    expect(calls.length).toBe(1);
  });

  describe("debug logging", () => {
    it("redacts a nested password in the logged request body", async () => {
      const { fetch } = createMockFetch([{ body: { key: "sk-abc" } }]);
      const http = new RequestExecutor({ fetch, debug: true });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await http.post("auth/login", { login: { email: "user@example.com", password: "hunter2" } });

      const bodyLine = errorSpy.mock.calls.map((call) => call[0]).find((line) => line.startsWith("> body:"));
      expect(bodyLine).toBeDefined();
      expect(bodyLine).not.toContain("hunter2");
      expect(bodyLine).toContain("REDACTED");
      expect(bodyLine).toContain("user@example.com");

      errorSpy.mockRestore();
    });

    it("redacts a nested secret in a logged error response body", async () => {
      const { fetch } = createMockFetch([
        {
          status: 422,
          body: { title: "Invalid", submitted: { password: "hunter2", email: "user@example.com" } },
        },
      ]);
      const http = new RequestExecutor({ fetch, debug: true });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(http.post("auth/login", {})).rejects.toBeInstanceOf(ManrsError);

      const bodyLine = errorSpy.mock.calls.map((call) => call[0]).find((line) => line.includes("submitted"));
      expect(bodyLine).toBeDefined();
      expect(bodyLine).not.toContain("hunter2");
      expect(bodyLine).toContain("REDACTED");
      expect(bodyLine).toContain("user@example.com");

      errorSpy.mockRestore();
    });

    it.each([
      "invites/secret-path-token/redeem",
      "auth/reset-password/secret-path-token",
      "auth/verify/secret-path-token",
    ])("redacts the token in the logged URL for %s", async (path) => {
      const { fetch } = createMockFetch([{ body: {} }]);
      const http = new RequestExecutor({ fetch, debug: true });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await http.post(path, { password: "hunter2" });

      const urlLines = errorSpy.mock.calls.map((call) => call[0]).filter((line) => line.includes(ENDPOINT_URL));
      expect(urlLines.length).toBe(2);
      for (const line of urlLines) {
        expect(line).not.toContain("secret-path-token");
        expect(line).toContain("***REDACTED***");
      }

      errorSpy.mockRestore();
    });

    it("redacts a token in the logged query string", async () => {
      const { fetch } = createMockFetch([{ body: {} }]);
      const http = new RequestExecutor({ fetch, debug: true });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await http.get("invites?token=secret-query-token&limit=10");

      const requestLine = errorSpy.mock.calls.map((call) => call[0]).find((line) => line.startsWith("> GET"));
      expect(requestLine).not.toContain("secret-query-token");
      expect(requestLine).toContain("token=***REDACTED***");
      expect(requestLine).toContain("limit=10");

      errorSpy.mockRestore();
    });

    it("leaves non-sensitive request bodies unchanged", async () => {
      const { fetch } = createMockFetch([{ body: { ok: true } }]);
      const http = new RequestExecutor({ fetch, debug: true });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await http.post("things", { name: "widget", count: 3 });

      const bodyLine = errorSpy.mock.calls.map((call) => call[0]).find((line) => line.startsWith("> body:"));
      expect(bodyLine).toContain('"name":"widget"');
      expect(bodyLine).toContain('"count":3');
      expect(bodyLine).not.toContain("REDACTED");

      errorSpy.mockRestore();
    });
  });
});
