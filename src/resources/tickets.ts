import type {
  ReplyAttachmentUpload,
  Ticket,
  TicketFilter,
  TicketReply,
  TicketUpdate,
} from "../../models";
import { TicketReadOnlyFields, TicketReplyReadOnlyFields } from "../../models";
import { writable } from "../body";
import { ManrsError } from "../errors";
import { PageIterator } from "../pagination";
import { buildPath, toQueryString, withPageToken } from "../query";
import { BaseResource } from "./base-resource";

export class TicketsResource extends BaseResource {
  /** Create a new ticket. */
  async create(ticket: Ticket): Promise<Ticket> {
    const data = await this.http.post<{ ticket?: Ticket }>("tickets", { ticket: writable(ticket, TicketReadOnlyFields) });
    if (!data.ticket) {
      throw new ManrsError('create response missing "ticket"', 200, {});
    }
    return data.ticket;
  }

  /** Retrieve a single ticket by ID. */
  async get(ticketId: string): Promise<Ticket> {
    const data = await this.http.get<{ ticket?: Ticket }>(`tickets/${encodeURIComponent(ticketId)}`);
    if (!data.ticket) {
      throw new ManrsError(`Ticket ${ticketId} response missing "ticket"`, 200, {});
    }
    return data.ticket;
  }

  /** Return all tickets matching the filter. */
  async find(filter?: TicketFilter): Promise<Ticket[]> {
    const data = await this.http.get<{ tickets?: Ticket[] }>(buildPath("tickets", toQueryString(filter)));
    return data.tickets ?? [];
  }

  /** Return a paginated iterator over tickets. */
  findPaged(filter?: TicketFilter): PageIterator<Ticket> {
    return new PageIterator(async (pageToken) => {
      const query = withPageToken(toQueryString(filter), pageToken);
      const data = await this.http.get<{ tickets?: Ticket[]; nextPageToken?: string }>(buildPath("tickets", query));
      return { items: data.tickets ?? [], nextPageToken: data.nextPageToken };
    });
  }

  /** Update a ticket. */
  async update(ticketId: string, update: TicketUpdate): Promise<Ticket> {
    const data = await this.http.patch<{ ticket?: Ticket }>(`tickets/${encodeURIComponent(ticketId)}`, {
      ticket: update,
    });
    if (!data.ticket) {
      throw new ManrsError(`Ticket ${ticketId} update response missing "ticket"`, 200, {});
    }
    return data.ticket;
  }

  /** Download a ticket attachment's binary content. */
  downloadAttachment(ticketId: string, attachmentId: string): Promise<ArrayBuffer> {
    return this.http.getRaw(
      `tickets/${encodeURIComponent(ticketId)}/attachments/${encodeURIComponent(attachmentId)}`,
    );
  }

  /** Create a reply to a ticket, optionally with base64-encoded file attachments. */
  async createReply(reply: TicketReply, attachments?: ReplyAttachmentUpload[]): Promise<void> {
    await this.http.post("ticket-replies", attachments?.length ? { reply: writable(reply, TicketReplyReadOnlyFields), attachments } : { reply: writable(reply, TicketReplyReadOnlyFields) });
  }
}
