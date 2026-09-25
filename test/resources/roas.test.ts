import { describe, expect, it } from "vitest";
import { Client } from "../../src/client";
import { createMockFetch } from "../test-utils";

const ROA_DATA = {
  asn: 13335,
  ipPrefix: "1.1.1.0/24",
  ipVersion: 4,
  maxLength: 24,
  notAfter: "2025-12-31T00:00:00Z",
  notBefore: "2024-01-01T00:00:00Z",
  source: "ARIN",
  valid: true,
};

const ROA_STATS_ENTITY = { label: "Cloudflare", type: "asn", value: "13335" };

const ROA_STATS_RECORD_DATA = {
  asn: 13335,
  asnName: "Cloudflare",
  economy: "US",
  ipPrefix: "1.1.1.0/24",
  ipVersion: 4,
  status: "valid",
};

const ROA_STAT_DATA = {
  asn: 13335,
  coveringROAs: ["roa-001"],
  ipPrefix: "1.1.1.0/24",
  ipVersion: 4,
  sourceDate: "2024-06-01T00:00:00Z",
  state: "valid",
};

describe("RoasResource", () => {
  it("find() unwraps the `roas` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { roas: [ROA_DATA] } }]);
    const client = new Client({ fetch });

    const roas = await client.roas.find();

    expect(roas).toEqual([ROA_DATA]);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/roas");
  });

  it("find() sends filter params", async () => {
    const { fetch, calls } = createMockFetch([{ body: { roas: [] } }]);
    const client = new Client({ fetch });

    await client.roas.find({ limit: 20, ipPrefix: "1.1.1.0/24" });

    expect(calls[0]!.url).toContain("limit=20");
    expect(calls[0]!.url).toContain("ipPrefix=1.1.1.0%2F24");
  });

  it("findPaged() iterates across pages", async () => {
    const { fetch, calls } = createMockFetch([
      { body: { roas: [ROA_DATA], nextPageToken: "tok2" } },
      { body: { roas: [] } },
    ]);
    const client = new Client({ fetch });

    const pages = await client.roas.findPaged().toArray();

    expect(pages).toEqual([ROA_DATA]);
    expect(calls[1]!.url).toContain("pageToken=tok2");
  });

  it("stats() unwraps the `summary` envelope", async () => {
    const { fetch, calls } = createMockFetch([
      { body: { summary: { entity: ROA_STATS_ENTITY, dateFetched: "2024-06-01" } } },
    ]);
    const client = new Client({ fetch });

    const detail = await client.roas.stats({ asn: 13335 });

    expect(detail).toEqual({ entity: ROA_STATS_ENTITY, dateFetched: "2024-06-01" });
    expect(calls[0]!.url).toContain("stats/roas");
    expect(calls[0]!.url).toContain("asn=13335");
  });

  it("findPrefixRecords() unwraps the `records` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { records: [ROA_STATS_RECORD_DATA] } }]);
    const client = new Client({ fetch });

    const records = await client.roas.findPrefixRecords();

    expect(records).toEqual([ROA_STATS_RECORD_DATA]);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/stats/roas/records");
  });

  it("findPrefixRecordsPaged() iterates across pages", async () => {
    const { fetch, calls } = createMockFetch([
      { body: { records: [ROA_STATS_RECORD_DATA], nextPageToken: "tok2" } },
      { body: { records: [] } },
    ]);
    const client = new Client({ fetch });

    const pages = await client.roas.findPrefixRecordsPaged().toArray();

    expect(pages).toEqual([ROA_STATS_RECORD_DATA]);
    expect(calls[1]!.url).toContain("pageToken=tok2");
  });

  it("findAnnouncementRecords() unwraps the `stats` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { stats: [ROA_STAT_DATA] } }]);
    const client = new Client({ fetch });

    const records = await client.roas.findAnnouncementRecords();

    expect(records).toEqual([ROA_STAT_DATA]);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/roa-stats");
  });

  it("findAnnouncementRecords() sends filter params", async () => {
    const { fetch, calls } = createMockFetch([{ body: { stats: [] } }]);
    const client = new Client({ fetch });

    await client.roas.findAnnouncementRecords({ state: "valid", ipVersion: 4 });

    expect(calls[0]!.url).toContain("state=valid");
    expect(calls[0]!.url).toContain("ipVersion=4");
  });

  it("findAnnouncementRecordsPaged() iterates across pages", async () => {
    const { fetch, calls } = createMockFetch([
      { body: { stats: [ROA_STAT_DATA], nextPageToken: "tok2" } },
      { body: { stats: [] } },
    ]);
    const client = new Client({ fetch });

    const pages = await client.roas.findAnnouncementRecordsPaged().toArray();

    expect(pages).toEqual([ROA_STAT_DATA]);
    expect(calls[1]!.url).toContain("pageToken=tok2");
  });
});
