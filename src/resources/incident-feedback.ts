import type {
  IncidentFeedback,
  IncidentFeedbackFilter,
  IncidentSummaryFilter,
  IncidentSummaryRow,
} from "../../models";
import { IncidentFeedbackReadOnlyFields } from "../../models";
import { writable } from "../body";
import { ManrsError } from "../errors";
import { PageIterator } from "../pagination";
import { buildPath, toQueryString, withPageToken } from "../query";
import { BaseResource } from "./base-resource";

export class IncidentFeedbackResource extends BaseResource {
  /** Submit feedback on a routing incident. */
  async create(feedback: IncidentFeedback): Promise<IncidentFeedback> {
    const data = await this.http.post<{ feedback?: IncidentFeedback }>("incident-feedback", { feedback: writable(feedback, IncidentFeedbackReadOnlyFields) });
    if (!data.feedback) {
      throw new ManrsError('create response missing "feedback"', 200, {});
    }
    return data.feedback;
  }

  /** Delete incident feedback. */
  async delete(feedbackId: string): Promise<void> {
    await this.http.delete(`incident-feedback/${encodeURIComponent(feedbackId)}`);
  }

  /** Retrieve a single incident feedback record by ID. */
  async get(feedbackId: string): Promise<IncidentFeedback> {
    const data = await this.http.get<{ feedback?: IncidentFeedback }>(
      `incident-feedback/${encodeURIComponent(feedbackId)}`,
    );
    if (!data.feedback) {
      throw new ManrsError(`Incident feedback ${feedbackId} response missing "feedback"`, 200, {});
    }
    return data.feedback;
  }

  /** Return all incident feedback records matching the filter. */
  async find(filter?: IncidentFeedbackFilter): Promise<IncidentFeedback[]> {
    const data = await this.http.get<{ feedbacks?: IncidentFeedback[] }>(
      buildPath("incident-feedback", toQueryString(filter)),
    );
    return data.feedbacks ?? [];
  }

  /** Return a paginated iterator over incident feedback records. */
  findPaged(filter?: IncidentFeedbackFilter): PageIterator<IncidentFeedback> {
    return new PageIterator(async (pageToken) => {
      const query = withPageToken(toQueryString(filter), pageToken);
      const data = await this.http.get<{ feedbacks?: IncidentFeedback[]; nextPageToken?: string }>(
        buildPath("incident-feedback", query),
      );
      return { items: data.feedbacks ?? [], nextPageToken: data.nextPageToken };
    });
  }

  /** Return per-ASN incident summary rows. */
  async summary(filter?: IncidentSummaryFilter): Promise<IncidentSummaryRow[]> {
    const data = await this.http.get<{ incidents?: IncidentSummaryRow[] }>(
      buildPath("incidents/summary", toQueryString(filter)),
    );
    return data.incidents ?? [];
  }
}
