import { describe, expect, it } from "vitest";
import { PageIterator } from "../src/pagination";

describe("PageIterator", () => {
  it("iterates across multiple pages", async () => {
    let calls = 0;
    const iterator = new PageIterator<number>(async (pageToken) => {
      calls++;
      if (!pageToken) return { items: [1, 2], nextPageToken: "page2" };
      if (pageToken === "page2") return { items: [3], nextPageToken: "page3" };
      return { items: [4] };
    });

    const results: number[] = [];
    for await (const item of iterator) {
      results.push(item);
    }

    expect(results).toEqual([1, 2, 3, 4]);
    expect(calls).toBe(3);
  });

  it("stops when the first page has no next token", async () => {
    let calls = 0;
    const iterator = new PageIterator<number>(async () => {
      calls++;
      return { items: [1] };
    });

    expect(await iterator.toArray()).toEqual([1]);
    expect(calls).toBe(1);
  });

  it("stops immediately on an empty first page", async () => {
    const iterator = new PageIterator<number>(async () => ({ items: [] }));
    expect(await iterator.toArray()).toEqual([]);
  });

  it("continues past an empty intermediate page when a next token is present", async () => {
    let calls = 0;
    const iterator = new PageIterator<number>(async (pageToken) => {
      calls++;
      if (!pageToken) return { items: [], nextPageToken: "page2" };
      return { items: [1, 2] };
    });

    expect(await iterator.toArray()).toEqual([1, 2]);
    expect(calls).toBe(2);
  });

  it("does not fetch the next page when stopped early", async () => {
    let calls = 0;
    const iterator = new PageIterator<number>(async () => {
      calls++;
      return { items: [1, 2], nextPageToken: "page2" };
    });

    for await (const item of iterator) {
      expect(item).toBe(1);
      break;
    }

    expect(calls).toBe(1);
  });

  it("forwards the page token to each fetch", async () => {
    const seenTokens: (string | undefined)[] = [];
    const iterator = new PageIterator<number>(async (pageToken) => {
      seenTokens.push(pageToken);
      if (!pageToken) return { items: [1], nextPageToken: "tok-abc" };
      return { items: [2] };
    });

    await iterator.toArray();

    expect(seenTokens).toEqual([undefined, "tok-abc"]);
  });

  it("toArray respects a limit without over-fetching", async () => {
    let calls = 0;
    const iterator = new PageIterator<number>(async (pageToken) => {
      calls++;
      const page = Number(pageToken ?? "0");
      return { items: [page * 2, page * 2 + 1], nextPageToken: String(page + 1) };
    });

    const results = await iterator.toArray(3);

    expect(results).toEqual([0, 1, 2]);
    expect(calls).toBe(2);
  });
});
