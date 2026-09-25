import { describe, expect, it } from "vitest";
import { Client } from "../../src/client";
import { createMockFetch } from "../test-utils";

const TICKET_DATA = {
  id: "tix-1",
  priority: "medium",
  queue: "General",
  status: "open",
  subject: "Help",
  type: "ticket",
};

describe("TicketsResource", () => {
  it("create() sends the ticket under a `ticket` key and unwraps the response", async () => {
    const { fetch, calls } = createMockFetch([{ body: { ticket: TICKET_DATA } }]);
    const client = new Client({ fetch });

    const ticket = await client.tickets.create({
      priority: "medium",
      queue: "General",
      status: "open",
      subject: "Help",
      type: "ticket",
    });

    expect(ticket).toEqual(TICKET_DATA);
    expect(JSON.parse(calls[0]!.body!)).toEqual({
      ticket: { priority: "medium", queue: "General", status: "open", subject: "Help", type: "ticket" },
    });
  });

  it("create() throws when the `ticket` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(
      client.tickets.create({
        priority: "medium",
        queue: "General",
        status: "open",
        subject: "Help",
        type: "ticket",
      }),
    ).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 200,
      message: 'create response missing "ticket"',
    });
  });

  it("get() unwraps the `ticket` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { ticket: TICKET_DATA } }]);
    const client = new Client({ fetch });

    const ticket = await client.tickets.get("tix-1");

    expect(ticket).toEqual(TICKET_DATA);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/tickets/tix-1");
  });

  it("get() throws when the `ticket` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(client.tickets.get("tix-1")).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 200,
      message: 'Ticket tix-1 response missing "ticket"',
    });
  });

  it("find() unwraps the `tickets` envelope and sends filter params", async () => {
    const { fetch, calls } = createMockFetch([{ body: { tickets: [TICKET_DATA] } }]);
    const client = new Client({ fetch });

    const tickets = await client.tickets.find({ limit: 3, status: ["open"] });

    expect(tickets).toEqual([TICKET_DATA]);
    expect(calls[0]!.url).toContain("limit=3");
    expect(calls[0]!.url).toContain("status=open");
  });

  it("findPaged() iterates across pages and forwards the page token", async () => {
    const { fetch, calls } = createMockFetch([
      { body: { tickets: [TICKET_DATA], nextPageToken: "tok2" } },
      { body: { tickets: [] } },
    ]);
    const client = new Client({ fetch });

    const pages = await client.tickets.findPaged().toArray();

    expect(pages).toEqual([TICKET_DATA]);
    expect(calls[1]!.url).toContain("pageToken=tok2");
  });

  it("update() sends the update under a `ticket` key and unwraps the response", async () => {
    const updated = { ...TICKET_DATA, status: "closed" };
    const { fetch, calls } = createMockFetch([{ body: { ticket: updated } }]);
    const client = new Client({ fetch });

    const ticket = await client.tickets.update("tix-1", { status: "closed" });

    expect(ticket.status).toBe("closed");
    expect(JSON.parse(calls[0]!.body!)).toEqual({ ticket: { status: "closed" } });
  });

  it("update() throws when the `ticket` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(client.tickets.update("tix-1", { status: "closed" })).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 200,
      message: 'Ticket tix-1 update response missing "ticket"',
    });
  });

  it("downloadAttachment() returns raw bytes via getRaw", async () => {
    const { fetch, calls } = createMockFetch([{ bodyText: "%PDF-1.4 fake content" }]);
    const client = new Client({ fetch });

    const buffer = await client.tickets.downloadAttachment("tix-1", "att-1");

    expect(Buffer.from(buffer).toString()).toBe("%PDF-1.4 fake content");
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/tickets/tix-1/attachments/att-1");
  });

  it("downloadAttachment() encodes special characters in both path segments", async () => {
    const { fetch, calls } = createMockFetch([{ bodyText: "content" }]);
    const client = new Client({ fetch });

    await client.tickets.downloadAttachment("tix/1", "att?1");

    expect(calls[0]!.url).toBe(
      "https://observatory.manrs.org/api/v2/tickets/tix%2F1/attachments/att%3F1",
    );
  });

  it("downloadAttachment() throws a ManrsError on failure", async () => {
    const { fetch } = createMockFetch([{ status: 404, body: { title: "Not Found" } }]);
    const client = new Client({ fetch });

    await expect(client.tickets.downloadAttachment("tix-1", "missing")).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 404,
    });
  });

  it("createReply() posts the reply and returns void", async () => {
    const { fetch, calls } = createMockFetch([{ status: 204, bodyText: "" }]);
    const client = new Client({ fetch });

    const result = await client.tickets.createReply({ ticketID: "tix-1", message: "We're on it" });

    expect(result).toBeUndefined();
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/ticket-replies");
  });

  it("createReply() omits `attachments` when none are given", async () => {
    const { fetch, calls } = createMockFetch([{ status: 204, bodyText: "" }]);
    const client = new Client({ fetch });

    const reply = { ticketID: "tix-1", message: "We're on it" };
    await client.tickets.createReply(reply);

    expect(JSON.parse(calls[0]!.body!)).toEqual({ reply });
  });

  it("createReply() posts attachments alongside the reply", async () => {
    const { fetch, calls } = createMockFetch([{ status: 204, bodyText: "" }]);
    const client = new Client({ fetch });

    const reply = { ticketID: "tix-1", message: "See attached" };
    const attachments = [
      { filename: "log.txt", contentType: "text/plain", data: "bG9nCg==" },
    ];
    await client.tickets.createReply(reply, attachments);

    expect(JSON.parse(calls[0]!.body!)).toEqual({ reply, attachments });
  });
});
