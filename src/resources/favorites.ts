import type { Favorite, FavoriteFilter, FavoriteUpdate } from "../../models";
import { FavoriteReadOnlyFields } from "../../models";
import { writable } from "../body";
import { ManrsError } from "../errors";
import { PageIterator } from "../pagination";
import { buildPath, toQueryString, withPageToken } from "../query";
import { BaseResource } from "./base-resource";

export class FavoritesResource extends BaseResource {
  /** Create a new favorite. */
  async create(favorite: Favorite): Promise<Favorite> {
    const data = await this.http.post<{ favorite?: Favorite }>("favorites", { favorite: writable(favorite, FavoriteReadOnlyFields) });
    if (!data.favorite) {
      throw new ManrsError('create response missing "favorite"', 200, {});
    }
    return data.favorite;
  }

  /** Delete a favorite. */
  async delete(favoriteId: string): Promise<void> {
    await this.http.delete(`favorites/${encodeURIComponent(favoriteId)}`);
  }

  /** Retrieve a single favorite by ID. */
  async get(favoriteId: string): Promise<Favorite> {
    const data = await this.http.get<{ favorite?: Favorite }>(`favorites/${encodeURIComponent(favoriteId)}`);
    if (!data.favorite) {
      throw new ManrsError(`Favorite ${favoriteId} response missing "favorite"`, 200, {});
    }
    return data.favorite;
  }

  /** Return all favorites. */
  async find(filter?: FavoriteFilter): Promise<Favorite[]> {
    const data = await this.http.get<{ favorites?: Favorite[] }>(buildPath("favorites", toQueryString(filter)));
    return data.favorites ?? [];
  }

  /** Return a paginated iterator over favorites. */
  findPaged(filter?: FavoriteFilter): PageIterator<Favorite> {
    return new PageIterator(async (pageToken) => {
      const query = withPageToken(toQueryString(filter), pageToken);
      const data = await this.http.get<{ favorites?: Favorite[]; nextPageToken?: string }>(
        buildPath("favorites", query),
      );
      return { items: data.favorites ?? [], nextPageToken: data.nextPageToken };
    });
  }

  /** Update a favorite. */
  async update(favoriteId: string, update: FavoriteUpdate): Promise<Favorite> {
    const data = await this.http.patch<{ favorite?: Favorite }>(`favorites/${encodeURIComponent(favoriteId)}`, {
      update,
    });
    if (!data.favorite) {
      throw new ManrsError(`Favorite ${favoriteId} update response missing "favorite"`, 200, {});
    }
    return data.favorite;
  }
}
