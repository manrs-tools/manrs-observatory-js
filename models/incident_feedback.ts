// Code generated from internal models; DO NOT EDIT.

export const FeedbackTypeIncident = "incident";

export const FeedbackTypeIncidentIncorrectData = "incidentIncorrectData";

export const FeedbackTypeLateralPeer = "lateralPeer";

export const FeedbackTypeLegitimateUpdate = "legitimateUpdate";

export const AuditorDecisionApproved = "approved";

export const AuditorDecisionRejected = "rejected";

export interface IncidentFeedback {
  id?: string;
  created?: string;
  incidentID: string;
  reportMonth: string;
  asn: number;
  participantID?: string;
  feedbackType: string;
  comment?: string;
  cleared?: boolean;
  auditorID?: string;
  auditorDecision?: string;
  auditorComment?: string;
  auditorReviewed?: string;
}

/** Fields of IncidentFeedback the API populates itself; a write ignores or rejects them. */
export const IncidentFeedbackReadOnlyFields: ReadonlySet<keyof IncidentFeedback> = new Set<keyof IncidentFeedback>(["auditorComment", "auditorDecision", "auditorID", "auditorReviewed", "cleared", "created", "id"]);

export interface IncidentFeedbackFilter {
  limit?: number;
  incidentID?: string;
  reportMonth?: string;
  asn?: number;
  participantID?: string;
}
