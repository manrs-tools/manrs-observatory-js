import { describe, expect, it } from "vitest";
import { Client } from "../../src/client";
import { createMockFetch } from "../test-utils";

const EMAIL_DATA = {
  id: "email-001",
  recipient: "alice@example.com",
  subject: "Welcome",
  userID: "user-001",
};

describe("EmailsResource", () => {
  it("getSent() unwraps the `email` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { email: EMAIL_DATA } }]);
    const client = new Client({ fetch });

    const email = await client.emails.getSent("email-001");

    expect(email).toEqual(EMAIL_DATA);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/emails/sent/email-001");
  });

  it("getSent() throws when the `email` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(client.emails.getSent("email-001")).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 200,
      message: 'Email email-001 response missing "email"',
    });
  });

  it("findSent() unwraps the `emails` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { emails: [EMAIL_DATA] } }]);
    const client = new Client({ fetch });

    const emails = await client.emails.findSent();

    expect(emails).toEqual([EMAIL_DATA]);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/emails/sent");
  });

  it("findSent(filter) sends filter params", async () => {
    const { fetch, calls } = createMockFetch([{ body: { emails: [] } }]);
    const client = new Client({ fetch });

    await client.emails.findSent({ recipient: "alice@example.com" });

    expect(calls[0]!.url).toContain("recipient=alice%40example.com");
  });

  it("findSentPaged() iterates across pages", async () => {
    const { fetch, calls } = createMockFetch([
      { body: { emails: [EMAIL_DATA], nextPageToken: "tok2" } },
      { body: { emails: [] } },
    ]);
    const client = new Client({ fetch });

    const pages = await client.emails.findSentPaged().toArray();

    expect(pages).toEqual([EMAIL_DATA]);
    expect(calls[1]!.url).toContain("pageToken=tok2");
  });
});
