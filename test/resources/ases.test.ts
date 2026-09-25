import { describe, expect, it } from "vitest";
import { Client } from "../../src/client";
import type { IncidentRow } from "../../models";
import { createMockFetch } from "../test-utils";

const AS_DATA = {
  id: 13335,
  name: "Cloudflare",
  organization: "Cloudflare, Inc.",
  economy: "US",
  region: "ARIN",
  rir: "ARIN",
  visible: true,
};

describe("AsesResource", () => {
  it("get() unwraps the `as` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { as: AS_DATA } }]);
    const client = new Client({ fetch });

    const as = await client.ases.get(13335);

    expect(as).toEqual(AS_DATA);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/ases/13335");
  });

  it("get() throws when the `as` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(client.ases.get(13335)).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 200,
      message: 'AS 13335 response missing "as"',
    });
  });

  it("find() unwraps the `ases` envelope and sends filter params", async () => {
    const { fetch, calls } = createMockFetch([{ body: { ases: [AS_DATA] } }]);
    const client = new Client({ fetch });

    const results = await client.ases.find({ economies: ["US", "DE"], limit: 50 });

    expect(results).toEqual([AS_DATA]);
    const url = new URL(calls[0]!.url);
    expect(url.searchParams.get("limit")).toBe("50");
    expect(url.searchParams.get("economies")).toBe("US,DE");
  });

  it("approvedAsns() unwraps the `asns` envelope", async () => {
    const { fetch } = createMockFetch([{ body: { asns: [13335, 15169, 32934] } }]);
    const client = new Client({ fetch });

    expect(await client.ases.approvedAsns()).toEqual([13335, 15169, 32934]);
  });

  it("scores() unwraps the `scores` envelope and sends filter params", async () => {
    const { fetch, calls } = createMockFetch([
      { body: { scores: [{ asn: 13335, asnHolder: "Cloudflare" }] } },
    ]);
    const client = new Client({ fetch });

    const scores = await client.ases.scores({ asns: [13335] });

    expect(scores).toEqual([{ asn: 13335, asnHolder: "Cloudflare" }]);
    expect(calls[0]!.url).toContain("scores");
    expect(calls[0]!.url).toContain("asns=13335");
  });

  it("scoresDetailed() sends the asn filter param and unwraps `score`", async () => {
    const { fetch, calls } = createMockFetch([{ body: { score: { contactInfoValid: true } } }]);
    const client = new Client({ fetch });

    const detail = await client.ases.scoresDetailed({ asn: 13335 });

    expect(detail.contactInfoValid).toBe(true);
    expect(calls[0]!.url).toContain("asn=13335");
    expect(calls[0]!.url).toContain("scores/details");
  });

  it("scoresDetailed() throws when the `score` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(client.ases.scoresDetailed({ asn: 13335 })).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 200,
      message: 'scoresDetailed response missing "score"',
    });
  });

  it("scoreHistory() unwraps the `history` envelope from the same endpoint", async () => {
    const point = { month: "2023-01", filtering: 100 };
    const { fetch, calls } = createMockFetch([{ body: { history: [point] } }]);
    const client = new Client({ fetch });

    expect(await client.ases.scoreHistory({ asn: 13335 })).toEqual([point]);
    expect(calls[0]!.url).toContain("scores/details");
    expect(calls[0]!.url).toContain("asn=13335");
  });

  it("scoreHistory() returns an empty array when there is no history", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    expect(await client.ases.scoreHistory({ asn: 13335 })).toEqual([]);
  });

  it("incidents() unwraps the `incidents` envelope and sends filter params", async () => {
    const row: IncidentRow = {
      asn: 13335,
      id: "inc-001",
      metricType: "M2_GRIP",
      isCulprit: true,
      startTime: "2026-05-01T12:00:00Z",
      endTime: "2026-05-01T13:00:00Z",
      duration: 3600,
      ipPrefix: "192.0.2.0/24",
      cleared: true,
    };
    const { fetch, calls } = createMockFetch([{ body: { incidents: [row] } }]);
    const client = new Client({ fetch });

    const incidents = await client.ases.incidents({ asns: [13335] });

    expect(incidents).toEqual([row]);
    expect(incidents[0]!.asn).toBe(13335);
    expect(incidents[0]!.cleared).toBe(true);
    expect(calls[0]!.url).toContain("asns=13335");
  });

  it("details() unwraps the `data` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { data: [{ asn: 13335, holder: "Cloudflare" }] } }]);
    const client = new Client({ fetch });

    const rows = await client.ases.details({ region: "ARIN" });

    expect(rows).toEqual([{ asn: 13335, holder: "Cloudflare" }]);
    expect(calls[0]!.url).toContain("region=ARIN");
  });

  it("returns an empty array when a list envelope is empty", async () => {
    const { fetch } = createMockFetch([{ body: { ases: [] } }]);
    const client = new Client({ fetch });

    expect(await client.ases.find()).toEqual([]);
  });
});
