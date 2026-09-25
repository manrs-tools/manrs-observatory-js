import type {
  Participant,
  ParticipantBadgeFilter,
  ParticipantDetails,
  ParticipantFilter,
} from "../../models";
import { ManrsError } from "../errors";
import { PageIterator } from "../pagination";
import { buildPath, toQueryString, withPageToken } from "../query";
import { BaseResource } from "./base-resource";

export class ParticipantsResource extends BaseResource {
  /** Retrieve a single participant by ID. */
  async get(participantId: string): Promise<Participant> {
    const data = await this.http.get<{ participant?: Participant }>(
      `participants/${encodeURIComponent(participantId)}`,
    );
    if (!data.participant) {
      throw new ManrsError(`Participant ${participantId} response missing "participant"`, 200, {});
    }
    return data.participant;
  }

  /**
   * Retrieve a participant together with everything hanging off it: its action
   * declaration, member users, outstanding invites, testimonial and pending ASNs.
   * Which of those are populated depends on the caller's access.
   */
  getDetails(participantId: string): Promise<ParticipantDetails> {
    return this.http.get<ParticipantDetails>(`participants/${encodeURIComponent(participantId)}`);
  }

  /**
   * Return the participant's "MANRS Participant" badge as an SVG document. Public;
   * no API key required.
   */
  badge(participantId: string, filter?: ParticipantBadgeFilter): Promise<string> {
    return this.http.getText(
      buildPath(`participants/${encodeURIComponent(participantId)}/badge`, toQueryString(filter)),
    );
  }

  /** Return all participants matching the filter. */
  async find(filter?: ParticipantFilter): Promise<Participant[]> {
    const data = await this.http.get<{ participants?: Participant[] }>(
      buildPath("participants", toQueryString(filter)),
    );
    return data.participants ?? [];
  }

  /** Return a paginated iterator over participants. */
  findPaged(filter?: ParticipantFilter): PageIterator<Participant> {
    return new PageIterator(async (pageToken) => {
      const query = withPageToken(toQueryString(filter), pageToken);
      const data = await this.http.get<{ participants?: Participant[]; nextPageToken?: string }>(
        buildPath("participants", query),
      );
      return { items: data.participants ?? [], nextPageToken: data.nextPageToken };
    });
  }
}
