import { describe, expect, it } from "vitest";
import { Client } from "../../src/client";
import { createMockFetch } from "../test-utils";

const FAVORITE_DATA = {
  id: "fav-001",
  name: "My ASN",
  selection: "asn:13335",
  userID: "user-001",
};

describe("FavoritesResource", () => {
  it("create() sends the favorite under a `favorite` key and unwraps the response", async () => {
    const { fetch, calls } = createMockFetch([{ body: { favorite: FAVORITE_DATA } }]);
    const client = new Client({ fetch });

    const favorite = await client.favorites.create({ name: "My ASN", selection: "asn:13335" });

    expect(favorite).toEqual(FAVORITE_DATA);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/favorites");
    expect(JSON.parse(calls[0]!.body!)).toEqual({
      favorite: { name: "My ASN", selection: "asn:13335" },
    });
  });

  it("create() throws when the `favorite` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(
      client.favorites.create({ name: "My ASN", selection: "asn:13335" }),
    ).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 200,
      message: 'create response missing "favorite"',
    });
  });

  it("delete() sends a DELETE request and resolves to undefined", async () => {
    const { fetch, calls } = createMockFetch([{ status: 204, bodyText: "" }]);
    const client = new Client({ fetch });

    const result = await client.favorites.delete("fav-001");

    expect(result).toBeUndefined();
    expect(calls[0]!.method).toBe("DELETE");
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/favorites/fav-001");
  });

  it("get() unwraps the `favorite` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { favorite: FAVORITE_DATA } }]);
    const client = new Client({ fetch });

    const favorite = await client.favorites.get("fav-001");

    expect(favorite).toEqual(FAVORITE_DATA);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/favorites/fav-001");
  });

  it("get() throws when the `favorite` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(client.favorites.get("fav-001")).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 200,
      message: 'Favorite fav-001 response missing "favorite"',
    });
  });

  it("find() unwraps the `favorites` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { favorites: [FAVORITE_DATA] } }]);
    const client = new Client({ fetch });

    const favorites = await client.favorites.find();

    expect(favorites).toEqual([FAVORITE_DATA]);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/favorites");
  });

  it("find(filter) sends filter params", async () => {
    const { fetch, calls } = createMockFetch([{ body: { favorites: [] } }]);
    const client = new Client({ fetch });

    await client.favorites.find({ limit: 5 });

    expect(calls[0]!.url).toContain("limit=5");
  });

  it("findPaged() iterates across pages and forwards the page token", async () => {
    const { fetch, calls } = createMockFetch([
      { body: { favorites: [FAVORITE_DATA], nextPageToken: "tok2" } },
      { body: { favorites: [] } },
    ]);
    const client = new Client({ fetch });

    const pages = await client.favorites.findPaged().toArray();

    expect(pages).toEqual([FAVORITE_DATA]);
    expect(calls[1]!.url).toContain("pageToken=tok2");
  });

  it("update() sends the update under an `update` key and unwraps the response", async () => {
    const updated = { ...FAVORITE_DATA, name: "Renamed" };
    const { fetch, calls } = createMockFetch([{ body: { favorite: updated } }]);
    const client = new Client({ fetch });

    const favorite = await client.favorites.update("fav-001", { name: "Renamed" });

    expect(favorite.name).toBe("Renamed");
    expect(calls[0]!.method).toBe("PATCH");
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/favorites/fav-001");
    expect(JSON.parse(calls[0]!.body!)).toEqual({ update: { name: "Renamed" } });
  });

  it("update() throws when the `favorite` envelope is missing", async () => {
    const { fetch } = createMockFetch([{ body: {} }]);
    const client = new Client({ fetch });

    await expect(client.favorites.update("fav-001", { name: "Renamed" })).rejects.toMatchObject({
      name: "ManrsError",
      statusCode: 200,
      message: 'Favorite fav-001 update response missing "favorite"',
    });
  });
});
