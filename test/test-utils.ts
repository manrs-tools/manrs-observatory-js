import type { FetchLike } from "../src/http";

export interface MockCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

export interface MockResponseSpec {
  status?: number;
  body?: unknown;
  bodyText?: string;
  networkError?: boolean;
}

export interface MockFetch {
  fetch: FetchLike;
  calls: MockCall[];
}

/** Builds a fake `fetch` that returns queued responses in order, recording every call made. */
export function createMockFetch(responses: MockResponseSpec[]): MockFetch {
  const calls: MockCall[] = [];
  let index = 0;

  const fetchImpl: FetchLike = async (input, init) => {
    const url = typeof input === "string" ? input : input.toString();
    const headers: Record<string, string> = {};
    if (init?.headers) {
      for (const [key, value] of Object.entries(init.headers as Record<string, string>)) {
        headers[key] = value;
      }
    }

    const method = init?.method ?? "GET";
    calls.push({ url, method, headers, body: init?.body as string | undefined });

    const spec = responses[index];
    index++;

    if (!spec) {
      throw new Error(`Unexpected fetch call #${calls.length}: ${method} ${url}`);
    }
    if (spec.networkError) {
      throw new TypeError("network error");
    }

    const bodyText = spec.bodyText ?? (spec.body !== undefined ? JSON.stringify(spec.body) : "");
    // The Fetch spec forbids a non-null body on null-body statuses (204/205/304); use null instead of "".
    return new Response(bodyText === "" ? null : bodyText, { status: spec.status ?? 200 });
  };

  return { fetch: fetchImpl, calls };
}
