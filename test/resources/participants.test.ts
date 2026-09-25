import { describe, expect, it } from "vitest";
import { Client } from "../../src/client";
import { createMockFetch } from "../test-utils";

const PARTICIPANT = {
  id: "part-123",
  name: "Example Network",
  deleted: false,
  hideScores: false,
  type: "netops",
  status: "approved",
  asns: [65001, 65002],
  regions: ["ARIN"],
};

describe("ParticipantsResource", () => {
  it("getDetails() returns the full participant envelope", async () => {
    const body = {
      participant: PARTICIPANT,
      declaration: { "1.1": { conformant: true, status: "conformant" } },
      invites: [],
      pendingASNs: [64500],
      testimonial: null,
      users: [],
    };
    const { fetch, calls } = createMockFetch([{ body }]);
    const client = new Client({ fetch });

    expect(await client.participants.getDetails("part-123")).toEqual(body);
    expect(calls[0]!.url).toBe(
      "https://observatory.manrs.org/api/v2/participants/part-123",
    );
  });

  it("badge() returns the raw SVG document and sends the badge options", async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    const { fetch, calls } = createMockFetch([{ bodyText: svg }]);
    const client = new Client({ fetch });

    const result = await client.participants.badge("part-123", {
      layout: "card",
      style: "dark",
      download: true,
    });

    expect(result).toBe(svg);
    expect(calls[0]!.url).toContain("participants/part-123/badge?");
    expect(calls[0]!.url).toContain("layout=card");
    expect(calls[0]!.url).toContain("style=dark");
    expect(calls[0]!.url).toContain("download=true");
  });

  it("badge() omits the trailing `?` when no options are given", async () => {
    const { fetch, calls } = createMockFetch([{ bodyText: "<svg/>" }]);
    const client = new Client({ fetch });

    await client.participants.badge("part-123");

    expect(calls[0]!.url).toBe(
      "https://observatory.manrs.org/api/v2/participants/part-123/badge",
    );
  });

  it("get() unwraps the `participant` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { participant: PARTICIPANT } }]);
    const client = new Client({ fetch });

    const participant = await client.participants.get("part-123");

    expect(participant).toEqual(PARTICIPANT);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/participants/part-123");
  });

  it("get() throws when the `participant` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(client.participants.get("part-123")).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 200,
      message: 'Participant part-123 response missing "participant"',
    });
  });

  it("find() unwraps the `participants` envelope and returns multiple results", async () => {
    const second = { ...PARTICIPANT, id: "part-456", name: "Another Network" };
    const { fetch, calls } = createMockFetch([{ body: { participants: [PARTICIPANT, second] } }]);
    const client = new Client({ fetch });

    const results = await client.participants.find();

    expect(results).toEqual([PARTICIPANT, second]);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/participants");
  });

  it("find() sends filter params", async () => {
    const { fetch, calls } = createMockFetch([{ body: { participants: [] } }]);
    const client = new Client({ fetch });

    await client.participants.find({ status: "approved", type: "ixp", limit: 10 });

    expect(calls[0]!.url).toContain("status=approved");
    expect(calls[0]!.url).toContain("type=ixp");
    expect(calls[0]!.url).toContain("limit=10");
  });

  it("find() omits unset filter fields from the query string", async () => {
    const { fetch, calls } = createMockFetch([{ body: { participants: [] } }]);
    const client = new Client({ fetch });

    await client.participants.find({ status: "approved" });

    expect(calls[0]!.url).toContain("status=approved");
    expect(calls[0]!.url).not.toContain("limit=");
    expect(calls[0]!.url).not.toContain("type=");
  });

  it("find() returns an empty array when the response has no participants", async () => {
    const { fetch } = createMockFetch([{ body: { participants: [] } }]);
    const client = new Client({ fetch });

    expect(await client.participants.find()).toEqual([]);
  });
});
