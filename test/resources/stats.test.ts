import { describe, expect, it } from "vitest";
import { Client } from "../../src/client";
import type { StatsHistory } from "../../models";
import { createMockFetch } from "../test-utils";

const DATES_AVAILABLE = {
  dataRange: ["2023-01", "2023-02"],
  incompleteMonths: ["2023-02"],
};

const CONFORMANCE_PAYLOAD = {
  measurementDate: "2024-06-01",
  participants: [{ asn: 13335, m1: true }],
  type: "netops",
};

const DASHBOARD_STATISTICS = {
  keyFigures: [],
  incidents: { routeMisoriginations: 0, routeLeaks: 0, bogonAnnouncements: 0 },
  culprits: { total: 0 },
  irr: { total: 0, registered: 0, unregistered: 0 },
  rpki: { total: 0, valid: 0, unknown: 0, invalid: 0 },
  rov: { valid: 0 },
};

const COMPARISON_GROUP = {
  title: "Filtering",
  dataPoints: [
    {
      format: "percent",
      groupID: "filtering",
      implemented: true,
      metricID: "m1",
      monthID: "2023-01",
      scenarioID: "baseline",
      value: 42,
    },
  ],
};

const STATS_HISTORY: StatsHistory = {
  statistics: [],
  history: [],
  coverage: [{ monthID: "2023-01", asns: 100, asnsWithIncidents: 4, claimedASNs: 80 }],
  participantsByType: [{ monthID: "2023-01", type: "netops", count: 42 }],
};

const STATS_OVERVIEW = {
  months: [],
  live: { participants: 10, users: 5, totalASNs: 100, claimedASNs: 80 },
};

describe("StatsResource", () => {
  it("filters() unwraps the `datesAvailable` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { datesAvailable: DATES_AVAILABLE } }]);
    const client = new Client({ fetch });

    const result = await client.stats.filters();

    expect(result).toEqual(DATES_AVAILABLE);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/filters");
  });

  it("filters() throws when the `datesAvailable` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(client.stats.filters()).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 200,
      message: 'filters response missing "datesAvailable"',
    });
  });

  it("conformance() returns the raw response with no envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: CONFORMANCE_PAYLOAD }]);
    const client = new Client({ fetch });

    const result = await client.stats.conformance();

    expect(result).toEqual(CONFORMANCE_PAYLOAD);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/scores/conformance");
  });

  it("conformance(participantType) sends the `type` query param", async () => {
    const { fetch, calls } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await client.stats.conformance("netops");

    expect(calls[0]!.url).toContain("type=netops");
  });

  it("conformance(participantType) encodes special characters in the query param", async () => {
    const { fetch, calls } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await client.stats.conformance("net ops&more");

    const url = new URL(calls[0]!.url);
    expect(url.searchParams.get("type")).toBe("net ops&more");
    expect(calls[0]!.url).not.toContain("net ops&more");
  });

  it("summary(filter) deserializes the DashboardStatistics under the `scores` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { scores: DASHBOARD_STATISTICS } }]);
    const client = new Client({ fetch });

    const result = await client.stats.summary();

    expect(result).toEqual(DASHBOARD_STATISTICS);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/scores/summary");
  });

  it("summary() throws when the `scores` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(client.stats.summary()).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 200,
      message: 'summary response missing "scores"',
    });
  });

  it("summary(filter) sends filter params", async () => {
    const { fetch, calls } = createMockFetch([{ body: { scores: DASHBOARD_STATISTICS } }]);
    const client = new Client({ fetch });

    await client.stats.summary({ region: "ARIN", manrs: "yes" });

    expect(calls[0]!.url).toContain("region=ARIN");
    expect(calls[0]!.url).toContain("manrs=yes");
  });

  it("comparison() posts the selection and scenarios and unwraps the `groups` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { groups: [COMPARISON_GROUP] } }]);
    const client = new Client({ fetch });

    const selection = { timeRange: { start: "2023-01", duration: 6 } };
    const scenario = { id: "s1", selection };

    const result = await client.stats.comparison(selection, [scenario], "participants");

    expect(result).toEqual([COMPARISON_GROUP]);
    expect(calls[0]!.method).toBe("POST");
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/stats/comparison");
    expect(JSON.parse(calls[0]!.body!)).toEqual({
      selection,
      scenarios: [scenario],
      manrs: "participants",
    });
  });

  it("comparison() omits scenarios and manrs when they aren't given", async () => {
    const { fetch, calls } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    const selection = { timeRange: { start: "2023-01", duration: 6 } };

    expect(await client.stats.comparison(selection)).toEqual([]);
    expect(JSON.parse(calls[0]!.body!)).toEqual({ selection });
  });

  it("history(filter) unwraps the `history` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { history: STATS_HISTORY } }]);
    const client = new Client({ fetch });

    const result = await client.stats.history({ region: "ARIN" });

    expect(result).toEqual(STATS_HISTORY);
    expect(calls[0]!.url).toContain("stats/history");
  });

  it("history() omits the trailing `?` when no filter is given", async () => {
    const { fetch, calls } = createMockFetch([{ body: { history: STATS_HISTORY } }]);
    const client = new Client({ fetch });

    await client.stats.history();

    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/stats/history");
  });

  it("history(filter) sends filter params", async () => {
    const { fetch, calls } = createMockFetch([{ body: { history: STATS_HISTORY } }]);
    const client = new Client({ fetch });

    await client.stats.history({ region: "ARIN" });

    expect(calls[0]!.url).toContain("region=ARIN");
  });

  it("overview() unwraps the `overview` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { overview: STATS_OVERVIEW } }]);
    const client = new Client({ fetch });

    const result = await client.stats.overview();

    expect(result).toEqual(STATS_OVERVIEW);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/stats/overview");
  });

  it("overview() throws when the `overview` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(client.stats.overview()).rejects.toMatchObject({
      name: "ManrsError",
      message: 'overview response missing "overview"',
    });
  });

  it("history() throws when the `history` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(client.stats.history()).rejects.toMatchObject({
      name: "ManrsError",
      message: 'history response missing "history"',
    });
  });

  it("filters(filter) sends the month and type params", async () => {
    const { fetch, calls } = createMockFetch([{ body: { datesAvailable: DATES_AVAILABLE } }]);
    const client = new Client({ fetch });

    await client.stats.filters({ month: "2023-01", type: "netops" });

    expect(calls[0]!.url).toContain("month=2023-01");
    expect(calls[0]!.url).toContain("type=netops");
  });

  it("dashboardFilters() returns the whole filter payload", async () => {
    const body = {
      ases: [{ asn: 13335, organization: "Cloudflare, Inc." }],
      datesAvailable: DATES_AVAILABLE,
      geo: { id: "economy", type: "economy", data: [] },
      manrs: [{ label: "MANRS participants", value: "participants" }],
      month: "2023-01",
    };
    const { fetch, calls } = createMockFetch([{ body }]);
    const client = new Client({ fetch });

    expect(await client.stats.dashboardFilters({ month: "2023-01" })).toEqual(body);
    expect(calls[0]!.url).toContain("filters?month=2023-01");
  });
});
