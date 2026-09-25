import { RequestExecutor, type FetchLike } from "./http";
import { AsesResource } from "./resources/ases";
import { AuthResource } from "./resources/auth";
import { EmailsResource } from "./resources/emails";
import { FavoritesResource } from "./resources/favorites";
import { IncidentFeedbackResource } from "./resources/incident-feedback";
import { InvitesResource } from "./resources/invites";
import { ApiKeysResource } from "./resources/keys";
import { ParticipantsResource } from "./resources/participants";
import { RoasResource } from "./resources/roas";
import { StatsResource } from "./resources/stats";
import { TestimonialsResource } from "./resources/testimonials";
import { TicketsResource } from "./resources/tickets";
import { UsersResource } from "./resources/users";

export interface ClientOptions {
  /** API key sent as `Authorization: Bearer <apiKey>`. Omit to make unauthenticated requests. */
  apiKey?: string;
  /** Overrides the API base URL. Defaults to the production MANRS Observatory endpoint. */
  baseUrl?: string;
  /** Request timeout in milliseconds. Defaults to 30s. */
  timeoutMs?: number;
  /** Logs each request/response to stderr. WARNING: may log secrets (passwords, API keys, tokens). */
  debug?: boolean;
  /** Number of retry attempts for idempotent requests on network errors or 502/503/504. Defaults to 3. */
  retries?: number;
  /** Custom fetch implementation. Defaults to the global `fetch`. */
  fetch?: FetchLike;
}

/**
 * Client for the MANRS Observatory API.
 *
 * @example
 * ```ts
 * const client = new Client({ apiKey: "your-api-key" });
 * const participants = await client.participants.find({ limit: 10 });
 * ```
 */
export class Client {
  protected readonly http: RequestExecutor;

  readonly auth: AuthResource;
  readonly keys: ApiKeysResource;
  readonly users: UsersResource;
  readonly participants: ParticipantsResource;
  readonly ases: AsesResource;
  readonly tickets: TicketsResource;
  readonly emails: EmailsResource;
  readonly roas: RoasResource;
  readonly stats: StatsResource;
  readonly favorites: FavoritesResource;
  readonly incidentFeedback: IncidentFeedbackResource;
  readonly invites: InvitesResource;
  readonly testimonials: TestimonialsResource;

  constructor(options: ClientOptions = {}) {
    this.http = new RequestExecutor(options);

    // Built through overridable factories so a subclass can substitute an extended
    // resource under the same property name.
    this.auth = this.createAuthResource();
    this.users = this.createUsersResource();
    this.participants = this.createParticipantsResource();
    this.ases = this.createAsesResource();
    this.tickets = this.createTicketsResource();
    this.emails = this.createEmailsResource();
    this.stats = this.createStatsResource();
    this.incidentFeedback = this.createIncidentFeedbackResource();
    this.invites = this.createInvitesResource();
    this.testimonials = this.createTestimonialsResource();

    this.keys = new ApiKeysResource(this.http);
    this.roas = new RoasResource(this.http);
    this.favorites = new FavoritesResource(this.http);
  }

  /** Replaces the API key used for requests. */
  setApiKey(apiKey: string): void {
    this.http.setApiKey(apiKey);
  }

  /** Updates the request timeout in milliseconds. */
  setTimeout(timeoutMs: number): void {
    this.http.setTimeout(timeoutMs);
  }

  /** Returns the API server version string. */
  async getVersion(): Promise<string> {
    const data = await this.http.get<{ version: string }>("version");
    return data.version;
  }

  protected createAuthResource(): AuthResource {
    return new AuthResource(this.http);
  }

  protected createUsersResource(): UsersResource {
    return new UsersResource(this.http);
  }

  protected createParticipantsResource(): ParticipantsResource {
    return new ParticipantsResource(this.http);
  }

  protected createAsesResource(): AsesResource {
    return new AsesResource(this.http);
  }

  protected createTicketsResource(): TicketsResource {
    return new TicketsResource(this.http);
  }

  protected createEmailsResource(): EmailsResource {
    return new EmailsResource(this.http);
  }

  protected createStatsResource(): StatsResource {
    return new StatsResource(this.http);
  }

  protected createIncidentFeedbackResource(): IncidentFeedbackResource {
    return new IncidentFeedbackResource(this.http);
  }

  protected createInvitesResource(): InvitesResource {
    return new InvitesResource(this.http);
  }

  protected createTestimonialsResource(): TestimonialsResource {
    return new TestimonialsResource(this.http);
  }
}
