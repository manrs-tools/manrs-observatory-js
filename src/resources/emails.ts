import type { Email, EmailFilter } from "../../models";
import { ManrsError } from "../errors";
import { PageIterator } from "../pagination";
import { buildPath, toQueryString, withPageToken } from "../query";
import { BaseResource } from "./base-resource";

export class EmailsResource extends BaseResource {
  /** Retrieve a single sent email by ID. */
  async getSent(emailId: string): Promise<Email> {
    const data = await this.http.get<{ email?: Email }>(`emails/sent/${encodeURIComponent(emailId)}`);
    if (!data.email) {
      throw new ManrsError(`Email ${emailId} response missing "email"`, 200, {});
    }
    return data.email;
  }

  /** Return all sent emails matching the filter. */
  async findSent(filter?: EmailFilter): Promise<Email[]> {
    const data = await this.http.get<{ emails?: Email[] }>(buildPath("emails/sent", toQueryString(filter)));
    return data.emails ?? [];
  }

  /** Return a paginated iterator over sent emails. */
  findSentPaged(filter?: EmailFilter): PageIterator<Email> {
    return new PageIterator(async (pageToken) => {
      const query = withPageToken(toQueryString(filter), pageToken);
      const data = await this.http.get<{ emails?: Email[]; nextPageToken?: string }>(
        buildPath("emails/sent", query),
      );
      return { items: data.emails ?? [], nextPageToken: data.nextPageToken };
    });
  }
}
