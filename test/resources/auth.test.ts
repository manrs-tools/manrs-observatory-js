import { describe, expect, it } from "vitest";
import { Client } from "../../src/client";
import { createMockFetch } from "../test-utils";

describe("AuthResource", () => {
  it("login() posts credentials and unwraps the `key` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { key: { key: "sk-abc", id: "key-1" } } }]);
    const client = new Client({ fetch });

    const key = await client.auth.login("user@example.com", "hunter2");

    expect(key).toEqual({ key: "sk-abc", id: "key-1" });
    expect(calls[0]!.body).toBe(JSON.stringify({ login: { email: "user@example.com", password: "hunter2" } }));
  });

  it("login() throws when the `key` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(client.auth.login("user@example.com", "hunter2")).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 200,
      message: 'login response missing "key"',
    });
  });

  it("register() posts the registration payload with no response body", async () => {
    const { fetch, calls } = createMockFetch([{ status: 204, bodyText: "" }]);
    const client = new Client({ fetch });

    await client.auth.register({
      email: "user@example.com",
      firstName: "Ada",
      lastName: "Lovelace",
      password: "hunter2",
      privacyConsent: true,
      termsConsent: true,
    });

    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/auth/register");
  });

  it("verifyEmail() posts to the token-specific path with no body", async () => {
    const { fetch, calls } = createMockFetch([{ status: 204, bodyText: "" }]);
    const client = new Client({ fetch });

    await client.auth.verifyEmail("tok-abc");

    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/auth/verify/tok-abc");
    expect(calls[0]!.method).toBe("POST");
  });

  it("verifyEmail() encodes special characters in the token", async () => {
    const { fetch, calls } = createMockFetch([{ status: 204, bodyText: "" }]);
    const client = new Client({ fetch });

    await client.auth.verifyEmail("tok/with?special#chars");

    expect(calls[0]!.url).toBe(
      "https://observatory.manrs.org/api/v2/auth/verify/tok%2Fwith%3Fspecial%23chars",
    );
  });

  it("createPasswordResetToken() posts the email with no response body", async () => {
    const { fetch, calls } = createMockFetch([{ status: 204, bodyText: "" }]);
    const client = new Client({ fetch });

    const result = await client.auth.createPasswordResetToken("user@example.com");

    expect(result).toBeUndefined();
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/auth/reset-password");
    expect(JSON.parse(calls[0]!.body!)).toEqual({ email: "user@example.com" });
  });

  it("resetPassword() posts the new password to the token-specific path", async () => {
    const { fetch, calls } = createMockFetch([{ status: 204, bodyText: "" }]);
    const client = new Client({ fetch });

    await client.auth.resetPassword("reset-token", "new-password");

    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/auth/reset-password/reset-token");
    expect(JSON.parse(calls[0]!.body!)).toEqual({ password: "new-password" });
  });

  it("resetPassword() encodes special characters in the token", async () => {
    const { fetch, calls } = createMockFetch([{ status: 204, bodyText: "" }]);
    const client = new Client({ fetch });

    await client.auth.resetPassword("tok/with?special#chars", "new-password");

    expect(calls[0]!.url).toBe(
      "https://observatory.manrs.org/api/v2/auth/reset-password/tok%2Fwith%3Fspecial%23chars",
    );
  });
});
