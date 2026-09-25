/**
 * Serializes a filter object into a query string. Arrays are joined with
 * commas (explode: false semantics, matching the OpenAPI spec); undefined
 * and null values are omitted.
 */
export function toQueryString(filter?: object | null): string {
  if (!filter) return "";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      params.set(key, value.join(","));
      continue;
    }

    if (value instanceof Date) {
      params.set(key, value.toISOString());
      continue;
    }

    if (typeof value === "boolean") {
      params.set(key, value ? "true" : "false");
      continue;
    }

    if (typeof value === "object") {
      throw new TypeError(`Unsupported filter value for "${key}": objects are not serializable`);
    }

    params.set(key, String(value));
  }

  return params.toString();
}

/** Appends a pagination token to an existing query string. */
export function withPageToken(query: string, pageToken: string | undefined): string {
  if (!pageToken) return query;
  const params = new URLSearchParams(query);
  params.set("pageToken", pageToken);
  return params.toString();
}

/** Joins a base path with a query string, omitting the `?` when there are no params. */
export function buildPath(path: string, query: string): string {
  return query ? `${path}?${query}` : path;
}
