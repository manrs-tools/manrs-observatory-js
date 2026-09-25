import { describe, expect, it } from "vitest";
import { Client } from "../src/client";
import { ManrsError } from "../src/errors";
import { createMockFetch } from "./test-utils";

describe("Client", () => {
  it("exposes every public resource", () => {
    const client = new Client({ apiKey: "test-key" });

    expect(client.auth).toBeDefined();
    expect(client.keys).toBeDefined();
    expect(client.users).toBeDefined();
    expect(client.participants).toBeDefined();
    expect(client.ases).toBeDefined();
    expect(client.tickets).toBeDefined();
    expect(client.emails).toBeDefined();
    expect(client.roas).toBeDefined();
    expect(client.stats).toBeDefined();
    expect(client.favorites).toBeDefined();
    expect(client.incidentFeedback).toBeDefined();
    expect(client.invites).toBeDefined();
    expect(client.testimonials).toBeDefined();
  });

  it("getVersion returns the server version string", async () => {
    const { fetch, calls } = createMockFetch([{ body: { version: "1.2.3" } }]);
    const client = new Client({ fetch });

    const version = await client.getVersion();

    expect(version).toBe("1.2.3");
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/version");
  });

  it("setApiKey updates the Authorization header used by resources", async () => {
    const { fetch, calls } = createMockFetch([{ body: { as: {} } }]);
    const client = new Client({ apiKey: "old-key", fetch });

    client.setApiKey("new-key");
    await client.ases.get(13335);

    expect(calls[0]!.headers.Authorization).toBe("Bearer new-key");
  });

  it("propagates a ManrsError from a resource call", async () => {
    const { fetch } = createMockFetch([{ status: 404, body: { title: "Not Found" } }]);
    const client = new Client({ fetch });

    await expect(client.participants.get("missing")).rejects.toBeInstanceOf(ManrsError);
  });
});
