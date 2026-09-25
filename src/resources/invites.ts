import type { User } from "../../models";
import { ManrsError } from "../errors";
import { BaseResource } from "./base-resource";

export class InvitesResource extends BaseResource {
  /** Redeem an invite token to join as a participant, setting the new account's password. */
  async redeem(token: string, password: string): Promise<User> {
    const data = await this.http.post<{ user?: User }>(`invites/${encodeURIComponent(token)}/redeem`, { password });
    if (!data.user) {
      throw new ManrsError('redeem response missing "user"', 200, {});
    }
    return data.user;
  }
}
