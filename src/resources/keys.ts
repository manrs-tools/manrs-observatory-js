import type { APIKey, APIKeyFilter, APIKeyUpdate } from "../../models";
import { APIKeyReadOnlyFields } from "../../models";
import { writable } from "../body";
import { ManrsError } from "../errors";
import { PageIterator } from "../pagination";
import { buildPath, toQueryString, withPageToken } from "../query";
import { BaseResource } from "./base-resource";

export class ApiKeysResource extends BaseResource {
  /** Create a new API key. */
  async create(apiKey: APIKey): Promise<APIKey> {
    const data = await this.http.post<{ key?: APIKey }>("keys", { key: writable(apiKey, APIKeyReadOnlyFields) });
    if (!data.key) {
      throw new ManrsError('create response missing "key"', 200, {});
    }
    return data.key;
  }

  /** Delete an API key by ID. */
  async delete(keyId: string): Promise<void> {
    await this.http.delete(`keys/${encodeURIComponent(keyId)}`);
  }

  /** Retrieve a single API key by ID. */
  async get(keyId: string): Promise<APIKey> {
    const data = await this.http.get<{ key?: APIKey }>(`keys/${encodeURIComponent(keyId)}`);
    if (!data.key) {
      throw new ManrsError(`API key ${keyId} response missing "key"`, 200, {});
    }
    return data.key;
  }

  /** Return all API keys matching the filter. */
  async find(filter?: APIKeyFilter): Promise<APIKey[]> {
    const data = await this.http.get<{ keys?: APIKey[] }>(buildPath("keys", toQueryString(filter)));
    return data.keys ?? [];
  }

  /** Return a paginated iterator over API keys. */
  findPaged(filter?: APIKeyFilter): PageIterator<APIKey> {
    return new PageIterator(async (pageToken) => {
      const query = withPageToken(toQueryString(filter), pageToken);
      const data = await this.http.get<{ keys?: APIKey[]; nextPageToken?: string }>(buildPath("keys", query));
      return { items: data.keys ?? [], nextPageToken: data.nextPageToken };
    });
  }

  /** Update an API key. */
  async update(keyId: string, update: APIKeyUpdate): Promise<APIKey> {
    const data = await this.http.patch<{ key?: APIKey }>(`keys/${encodeURIComponent(keyId)}`, { key: update });
    if (!data.key) {
      throw new ManrsError(`API key ${keyId} update response missing "key"`, 200, {});
    }
    return data.key;
  }
}
