import { describe, expect, it } from "vitest";
import { Client } from "../../src/client";
import { createMockFetch } from "../test-utils";

const USER_DATA = {
  email: "alice@example.com",
  firstName: "Alice",
  lastName: "Smith",
  mailConformanceEnabled: true,
  mailListEnabled: false,
  password: "",
  role: "member",
  status: "active",
  id: "user-001",
};

describe("InvitesResource", () => {
  it("redeem() unwraps the `user` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { user: USER_DATA } }]);
    const client = new Client({ fetch });

    const user = await client.invites.redeem("tok-abc", "s3cret-pass");

    expect(user).toEqual(USER_DATA);
    expect(calls[0]!.method).toBe("POST");
    expect(JSON.parse(calls[0]!.body!)).toEqual({ password: "s3cret-pass" });
  });

  it("redeem() throws when the `user` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(client.invites.redeem("tok-abc", "s3cret-pass")).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 200,
      message: 'redeem response missing "user"',
    });
  });

  it("redeem() sends to the token-specific endpoint", async () => {
    const { fetch, calls } = createMockFetch([{ body: { user: USER_DATA } }]);
    const client = new Client({ fetch });

    await client.invites.redeem("tok-xyz", "s3cret-pass");

    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/invites/tok-xyz/redeem");
  });
});
