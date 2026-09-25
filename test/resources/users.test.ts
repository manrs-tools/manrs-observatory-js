import { describe, expect, it } from "vitest";
import { Client } from "../../src/client";
import { createMockFetch } from "../test-utils";

const USER_DATA = {
  id: "user-001",
  email: "alice@example.com",
  firstName: "Alice",
  lastName: "Smith",
  mailConformanceEnabled: true,
  mailListEnabled: false,
  password: "",
  role: "member",
  status: "active",
};

describe("UsersResource", () => {
  it("getDetails() returns the user together with their participants", async () => {
    const body = { user: USER_DATA, participants: [] };
    const { fetch, calls } = createMockFetch([{ body }]);
    const client = new Client({ fetch });

    expect(await client.users.getDetails("user-123")).toEqual(body);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/users/user-123");
  });

  it("getSessionUser() unwraps the `user` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { user: USER_DATA } }]);
    const client = new Client({ fetch });

    const user = await client.users.getSessionUser();

    expect(user).toEqual(USER_DATA);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/user");
  });

  it("getSessionUser() throws when the `user` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(client.users.getSessionUser()).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 200,
      message: 'getSessionUser response missing "user"',
    });
  });

  it("get() unwraps the `user` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { user: USER_DATA } }]);
    const client = new Client({ fetch });

    const user = await client.users.get("user-001");

    expect(user).toEqual(USER_DATA);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/users/user-001");
  });

  it("get() encodes special characters in the user ID", async () => {
    const { fetch, calls } = createMockFetch([{ body: { user: USER_DATA } }]);
    const client = new Client({ fetch });

    await client.users.get("user/with?special#chars");

    expect(calls[0]!.url).toBe(
      "https://observatory.manrs.org/api/v2/users/user%2Fwith%3Fspecial%23chars",
    );
  });

  it("get() throws when the `user` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(client.users.get("user-001")).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 200,
      message: 'User user-001 response missing "user"',
    });
  });

  it("find() unwraps the `users` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { users: [USER_DATA] } }]);
    const client = new Client({ fetch });

    const users = await client.users.find();

    expect(users).toEqual([USER_DATA]);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/users");
  });

  it("find() sends filter params", async () => {
    const { fetch, calls } = createMockFetch([{ body: { users: [] } }]);
    const client = new Client({ fetch });

    await client.users.find({ limit: 5 });

    expect(calls[0]!.url).toContain("limit=5");
  });

  it("findPaged() iterates across pages and forwards the page token", async () => {
    const { fetch, calls } = createMockFetch([
      { body: { users: [USER_DATA], nextPageToken: "tok2" } },
      { body: { users: [] } },
    ]);
    const client = new Client({ fetch });

    const pages = await client.users.findPaged().toArray();

    expect(pages).toEqual([USER_DATA]);
    expect(calls[1]!.url).toContain("pageToken=tok2");
  });

  it("update() sends the update under a `user` key and unwraps the response", async () => {
    const updated = { ...USER_DATA, firstName: "Alicia" };
    const { fetch, calls } = createMockFetch([{ body: { user: updated } }]);
    const client = new Client({ fetch });

    const user = await client.users.update("user-001", { firstName: "Alicia" });

    expect(user.firstName).toBe("Alicia");
    expect(calls[0]!.method).toBe("PATCH");
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/users/user-001");
    expect(JSON.parse(calls[0]!.body!)).toEqual({ user: { firstName: "Alicia" } });
  });

  it("update() throws when the `user` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(client.users.update("user-001", { firstName: "Alicia" })).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 200,
      message: 'User user-001 update response missing "user"',
    });
  });
});
