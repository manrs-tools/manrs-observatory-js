import type { User, UserDetails, UserFilter, UserUpdate } from "../../models";
import { ManrsError } from "../errors";
import { PageIterator } from "../pagination";
import { buildPath, toQueryString, withPageToken } from "../query";
import { BaseResource } from "./base-resource";

export class UsersResource extends BaseResource {
  /** Return the user associated with the current API key. */
  async getSessionUser(): Promise<User> {
    const data = await this.http.get<{ user?: User }>("user");
    if (!data.user) {
      throw new ManrsError('getSessionUser response missing "user"', 200, {});
    }
    return data.user;
  }

  /** Retrieve a single user by ID. */
  async get(userId: string): Promise<User> {
    const data = await this.http.get<{ user?: User }>(`users/${encodeURIComponent(userId)}`);
    if (!data.user) {
      throw new ManrsError(`User ${userId} response missing "user"`, 200, {});
    }
    return data.user;
  }

  /** Retrieve a user together with the participants they belong to. */
  getDetails(userId: string): Promise<UserDetails> {
    return this.http.get<UserDetails>(`users/${encodeURIComponent(userId)}`);
  }

  /** Return all users matching the filter. */
  async find(filter?: UserFilter): Promise<User[]> {
    const data = await this.http.get<{ users?: User[] }>(buildPath("users", toQueryString(filter)));
    return data.users ?? [];
  }

  /** Return a paginated iterator over users. */
  findPaged(filter?: UserFilter): PageIterator<User> {
    return new PageIterator(async (pageToken) => {
      const query = withPageToken(toQueryString(filter), pageToken);
      const data = await this.http.get<{ users?: User[]; nextPageToken?: string }>(buildPath("users", query));
      return { items: data.users ?? [], nextPageToken: data.nextPageToken };
    });
  }

  /** Update a user account. */
  async update(userId: string, update: UserUpdate): Promise<User> {
    const data = await this.http.patch<{ user?: User }>(`users/${encodeURIComponent(userId)}`, { user: update });
    if (!data.user) {
      throw new ManrsError(`User ${userId} update response missing "user"`, 200, {});
    }
    return data.user;
  }
}
