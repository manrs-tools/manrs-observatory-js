import { describe, expect, it } from "vitest";
import { buildPath, toQueryString, withPageToken } from "../src/query";

describe("toQueryString", () => {
  it("returns an empty string for no filter", () => {
    expect(toQueryString()).toBe("");
    expect(toQueryString(null)).toBe("");
    expect(toQueryString({})).toBe("");
  });

  it("omits undefined and null values", () => {
    expect(toQueryString({ a: undefined, b: null, c: "x" })).toBe("c=x");
  });

  it("joins array values with commas", () => {
    expect(toQueryString({ economies: ["US", "DE"] })).toBe("economies=US%2CDE");
  });

  it("omits empty arrays", () => {
    expect(toQueryString({ economies: [] })).toBe("");
  });

  it("serializes booleans as literal true/false", () => {
    expect(toQueryString({ valid: true })).toBe("valid=true");
    expect(toQueryString({ valid: false })).toBe("valid=false");
  });

  it("serializes Date values as ISO strings", () => {
    const date = new Date("2024-01-16T05:41:44.000Z");
    expect(toQueryString({ sourceDate: date })).toBe(`sourceDate=${encodeURIComponent(date.toISOString())}`);
  });

  it("stringifies numbers", () => {
    expect(toQueryString({ limit: 50, asn: 13335 })).toBe("limit=50&asn=13335");
  });

  it("throws on a plain object value instead of silently stringifying it", () => {
    expect(() => toQueryString({ region: { name: "ARIN" } })).toThrow(
      'Unsupported filter value for "region": objects are not serializable',
    );
  });
});

describe("withPageToken", () => {
  it("returns the original query when no token is given", () => {
    expect(withPageToken("limit=5", undefined)).toBe("limit=5");
    expect(withPageToken("limit=5", "")).toBe("limit=5");
  });

  it("appends the token to an existing query", () => {
    expect(withPageToken("limit=5", "tok-abc")).toBe("limit=5&pageToken=tok-abc");
  });

  it("sets the token when the query is empty", () => {
    expect(withPageToken("", "tok-abc")).toBe("pageToken=tok-abc");
  });
});

describe("buildPath", () => {
  it("returns the bare path when there is no query", () => {
    expect(buildPath("ases", "")).toBe("ases");
  });

  it("appends the query string with a `?`", () => {
    expect(buildPath("ases", "limit=5")).toBe("ases?limit=5");
  });
});
