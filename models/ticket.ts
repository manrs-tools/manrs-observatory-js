// Code generated from internal models; DO NOT EDIT.

export const TicketQueueCDNApplications = "CDN Applications";

export const TicketQueueFeedback = "Feedback";

export const TicketQueueGeneral = "General";

export const TicketQueueIXPApplications = "IXP Applications";

export const TicketQueueNetOpsApplications = "NetOps Applications";

export const TicketQueuePartnerApplications = "Partner Applications";

export const TicketQueueVendorApplications = "Vendor Applications";

export const TicketTypeTicket = "ticket";

export const TicketTypeApplication = "application";

export const TicketPriorityHigh = "high";

export const TicketPriorityLow = "low";

export const TicketPriorityMedium = "medium";

export const TicketStatusAnswered = "answered";

export const TicketStatusApproved = "approved";

export const TicketStatusClosed = "closed";

export const TicketStatusInProgress = "in progress";

export const TicketStatusOnHold = "on hold";

export const TicketStatusOpen = "open";

export const TicketStatusRejected = "rejected";

export const TicketStatusUserResponse = "user response";

export interface ReplyAttachmentUpload {
  filename: string;
  contentType?: string;
  data: string;
}

export interface Ticket {
  id?: string;
  created?: string;
  assignedTo?: string;
  emails?: string[];
  lastReplyAt?: string;
  priority: string;
  queue: string;
  replies?: TicketReply[];
  attachments?: TicketAttachment[];
  status: string;
  subject: string;
  type: string;
  userID?: string;
  participantID?: string;
  asns?: number[];
  userName?: string;
}

/** Fields of Ticket the API populates itself; a write ignores or rejects them. */
export const TicketReadOnlyFields: ReadonlySet<keyof Ticket> = new Set<keyof Ticket>(["attachments", "created", "id", "lastReplyAt", "replies", "userName"]);

export interface TicketAttachment {
  id?: string;
  created?: string;
  ticketID: string;
  replyID?: string;
  userID?: string;
  filename: string;
  contentType: string;
  size: number;
  inline?: boolean;
  url?: string;
}

export interface TicketFilter {
  limit?: number;
  userID?: string;
  participantID?: string;
  asns?: number[];
  assignedTo?: string;
  type?: string;
  queue?: string;
  status?: string[];
  statusNot?: string[];
}

export interface TicketReply {
  created?: string;
  id?: string;
  ticketID: string;
  userID?: string;
  attachments?: TicketAttachment[];
  email?: string;
  mailed?: boolean;
  message: string;
  staff?: boolean;
  userName?: string;
}

/** Fields of TicketReply the API populates itself; a write ignores or rejects them. */
export const TicketReplyReadOnlyFields: ReadonlySet<keyof TicketReply> = new Set<keyof TicketReply>(["attachments", "created", "id", "mailed", "staff", "userName"]);

export interface TicketUpdate {
  queue?: string | null;
  type?: string | null;
  priority?: string | null;
  subject?: string | null;
  status?: string | null;
  userID?: string | null;
  participantID?: string | null;
  assignedTo?: string | null;
  emails?: string[] | null;
  asns?: number[] | null;
  reply?: string | null;
}
