import type { APIKey, Register } from "../../models";
import { ManrsError } from "../errors";
import { BaseResource } from "./base-resource";

export class AuthResource extends BaseResource {
  /** Authenticate and return an API key. */
  async login(email: string, password: string): Promise<APIKey> {
    const data = await this.http.post<{ key?: APIKey }>("auth/login", { login: { email, password } });
    if (!data.key) {
      throw new ManrsError('login response missing "key"', 200, {});
    }
    return data.key;
  }

  /** Register a new user account. */
  async register(register: Register): Promise<void> {
    await this.http.post("auth/register", register);
  }

  /** Send a password-reset email to the given address. */
  async createPasswordResetToken(email: string): Promise<void> {
    await this.http.post("auth/reset-password", { email });
  }

  /** Reset the password using a password-reset token. */
  async resetPassword(token: string, password: string): Promise<void> {
    await this.http.post(`auth/reset-password/${encodeURIComponent(token)}`, { password });
  }

  /** Verify an email address using its validation token. */
  async verifyEmail(token: string): Promise<void> {
    await this.http.post(`auth/verify/${encodeURIComponent(token)}`);
  }
}
