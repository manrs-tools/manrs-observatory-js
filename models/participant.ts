// Code generated from internal models; DO NOT EDIT.
import type { Invite } from "./invite";
import type { Declaration } from "./participant_declaration";
import type { Testimonial } from "./testimonial";
import type { User } from "./user";

export const ParticipantStatusApproved = "approved";

export const ParticipantStatusPending = "pending";

export const ParticipantStatusRejected = "rejected";

export const ParticipantStatusSuspended = "suspended";

export const ParticipantTypeCDN = "cdn";

export const ParticipantTypeIXP = "ixp";

export const ParticipantTypeNetOps = "netops";

export const ParticipantTypePartner = "partner";

export const ParticipantTypeVendor = "vendor";

export const RegionAll = "*";

export const ExternalIDProviderIXF = "ixf";

export const ExternalIDProviderPeeringDBIX = "peeringDBIX";

export const ExternalIDProviderPeeringDBNet = "peeringDBNet";

export interface ExternalID {
  provider: string;
  id: string;
}

export interface Participant {
  id?: string;
  approved?: string;
  created?: string;
  deleted?: boolean;
  updated?: string;
  abbreviation?: string;
  asns?: number[];
  accessASNs?: number[];
  economies?: string[];
  rirs?: string[];
  hideScores?: boolean;
  externalIDs?: ExternalID[];
  legacyID?: number;
  logoURL?: string;
  name: string;
  primaryUserID?: string;
  regions?: string[];
  status?: string;
  type: string;
  url?: string;
}

export interface ParticipantBadgeFilter {
  layout?: string;
  style?: string;
  download?: boolean;
}

export interface ParticipantDetails {
  declaration?: Declaration;
  invites?: Invite[];
  participant?: Participant | null;
  pendingASNs?: number[];
  testimonial?: Testimonial | null;
  users?: User[];
}

export interface ParticipantFilter {
  limit?: number;
  ids?: string[];
  legacyID?: number;
  abbreviation?: string;
  asn?: number;
  name?: string;
  primaryUserID?: string;
  region?: string;
  status?: string;
  type?: string;
  deleted?: boolean;
  memberOf?: boolean;
}
