// Code generated from internal models; DO NOT EDIT.
import type { Participant } from "./participant";

export const SessionUserKey = "sessionUser";

export const UserRoleAdmin = "admin";

export const UserRoleAnonymous = "anonymous";

export const UserRoleAspirant = "aspirant";

export const UserRoleParticipant = "participant";

export const UserRolePartner = "partner";

export const UserRoleResearcher = "researcher";

export const UserStatusActive = "active";

export const UserStatusPending = "pending";

export const UserStatusSuspended = "suspended";

export interface User {
  id?: string;
  created?: string;
  updated?: string;
  email: string;
  firstName: string;
  lastName: string;
  mailConformanceEnabled: boolean;
  mailListEnabled: boolean;
  participantIDs?: string[];
  password: string;
  role: string;
  status: string;
}

export interface UserDetails {
  user?: User | null;
  participants?: Participant[];
}

export interface UserFilter {
  limit?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  mailConformanceEnabled?: boolean;
  mailListEnabled?: boolean;
  participantID?: string;
  role?: string;
  status?: string;
}

export interface UserUpdate {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  mailConformanceEnabled?: boolean | null;
  mailListEnabled?: boolean | null;
  participantIDs?: string[] | null;
  password?: string | null;
  role?: string | null;
  status?: string | null;
}
