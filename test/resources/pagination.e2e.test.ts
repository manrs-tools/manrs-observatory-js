import { describe, expect, it } from "vitest";
import { Client } from "../../src/client";
import { createMockFetch } from "../test-utils";

const PARTICIPANT = { id: "part-1", name: "Network A", deleted: false, hideScores: false, type: "netops" };

describe("findPaged() end-to-end", () => {
  it("iterates across multiple pages until nextPageToken is absent", async () => {
    const { fetch, calls } = createMockFetch([
      { body: { participants: [{ ...PARTICIPANT, id: "part-1" }], nextPageToken: "tok-page2" } },
      { body: { participants: [{ ...PARTICIPANT, id: "part-2" }], nextPageToken: "tok-page3" } },
      { body: { participants: [{ ...PARTICIPANT, id: "part-3" }] } },
    ]);
    const client = new Client({ fetch });

    const results = [];
    for await (const p of client.participants.findPaged()) {
      results.push(p.id);
    }

    expect(results).toEqual(["part-1", "part-2", "part-3"]);
    expect(calls).toHaveLength(3);
  });

  it("sends the page token on the next request", async () => {
    const { fetch, calls } = createMockFetch([
      { body: { participants: [PARTICIPANT], nextPageToken: "tok-abc" } },
      { body: { participants: [] } },
    ]);
    const client = new Client({ fetch });

    await client.participants.findPaged().toArray();

    expect(calls[1]!.url).toContain("pageToken=tok-abc");
  });

  it("stops after one page when there is no next token", async () => {
    const { fetch, calls } = createMockFetch([{ body: { participants: [PARTICIPANT] } }]);
    const client = new Client({ fetch });

    const results = await client.participants.findPaged().toArray();

    expect(results).toHaveLength(1);
    expect(calls).toHaveLength(1);
  });

  it("does not fetch subsequent pages when consumption stops early", async () => {
    const { fetch, calls } = createMockFetch([
      { body: { participants: [PARTICIPANT], nextPageToken: "tok-page2" } },
    ]);
    const client = new Client({ fetch });

    for await (const _p of client.participants.findPaged()) {
      break;
    }

    expect(calls).toHaveLength(1);
  });

  it("forwards filter params on every page", async () => {
    const { fetch, calls } = createMockFetch([
      { body: { participants: [PARTICIPANT], nextPageToken: "tok-page2" } },
      { body: { participants: [] } },
    ]);
    const client = new Client({ fetch });

    await client.participants.findPaged({ status: "approved", limit: 5 }).toArray();

    for (const call of calls) {
      expect(call.url).toContain("status=approved");
      expect(call.url).toContain("limit=5");
    }
  });
});
