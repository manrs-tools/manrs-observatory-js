import { describe, expect, it } from "vitest";
import { Client } from "../../src/client";
import { createMockFetch } from "../test-utils";

const FEEDBACK_DATA = {
  incidentID: "inc-001",
  reportMonth: "2024-01",
  asn: 13335,
  feedbackType: "false-positive",
  id: "fb-001",
  participantID: "part-001",
};

const SUMMARY_ROW = {
  asn: 13335,
  asnHolder: "Cloudflare",
  m1: 2,
  m1c: 1,
  m2: 0,
  m2c: 0,
};

describe("IncidentFeedbackResource", () => {
  it("create() sends the feedback under a `feedback` key and unwraps the response", async () => {
    const { fetch, calls } = createMockFetch([{ body: { feedback: FEEDBACK_DATA } }]);
    const client = new Client({ fetch });

    const fb = await client.incidentFeedback.create({
      incidentID: "inc-001",
      reportMonth: "2024-01",
      asn: 13335,
      feedbackType: "false-positive",
    });

    expect(fb).toEqual(FEEDBACK_DATA);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/incident-feedback");
    expect(JSON.parse(calls[0]!.body!)).toEqual({
      feedback: {
        incidentID: "inc-001",
        reportMonth: "2024-01",
        asn: 13335,
        feedbackType: "false-positive",
      },
    });
  });

  it("create() throws when the `feedback` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(
      client.incidentFeedback.create({
        incidentID: "inc-001",
        reportMonth: "2024-01",
        asn: 13335,
        feedbackType: "false-positive",
      }),
    ).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 200,
      message: 'create response missing "feedback"',
    });
  });

  it("delete() sends a DELETE request and returns void", async () => {
    const { fetch, calls } = createMockFetch([{ status: 204, bodyText: "" }]);
    const client = new Client({ fetch });

    const result = await client.incidentFeedback.delete("fb-001");

    expect(result).toBeUndefined();
    expect(calls[0]!.method).toBe("DELETE");
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/incident-feedback/fb-001");
  });

  it("get() unwraps the `feedback` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { feedback: FEEDBACK_DATA } }]);
    const client = new Client({ fetch });

    const fb = await client.incidentFeedback.get("fb-001");

    expect(fb).toEqual(FEEDBACK_DATA);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/incident-feedback/fb-001");
  });

  it("get() throws when the `feedback` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(client.incidentFeedback.get("fb-001")).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 200,
      message: 'Incident feedback fb-001 response missing "feedback"',
    });
  });

  it("find() unwraps the `feedbacks` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { feedbacks: [FEEDBACK_DATA] } }]);
    const client = new Client({ fetch });

    const items = await client.incidentFeedback.find();

    expect(items).toEqual([FEEDBACK_DATA]);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/incident-feedback");
  });

  it("find(filter) sends filter params", async () => {
    const { fetch, calls } = createMockFetch([{ body: { feedbacks: [] } }]);
    const client = new Client({ fetch });

    await client.incidentFeedback.find({ asn: 13335, reportMonth: "2024-01" });

    expect(calls[0]!.url).toContain("asn=13335");
    expect(calls[0]!.url).toContain("reportMonth=2024-01");
  });

  it("findPaged() iterates across pages and forwards the page token", async () => {
    const { fetch, calls } = createMockFetch([
      { body: { feedbacks: [FEEDBACK_DATA], nextPageToken: "tok2" } },
      { body: { feedbacks: [] } },
    ]);
    const client = new Client({ fetch });

    const pages = await client.incidentFeedback.findPaged().toArray();

    expect(pages).toEqual([FEEDBACK_DATA]);
    expect(calls[1]!.url).toContain("pageToken=tok2");
  });

  it("summary() unwraps the `incidents` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { incidents: [SUMMARY_ROW] } }]);
    const client = new Client({ fetch });

    const rows = await client.incidentFeedback.summary();

    expect(rows).toEqual([SUMMARY_ROW]);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/incidents/summary");
  });
});
