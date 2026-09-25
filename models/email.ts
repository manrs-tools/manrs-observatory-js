// Code generated from internal models; DO NOT EDIT.

export interface Email {
  id?: string;
  created?: string;
  body?: string;
  recipient: string;
  subject: string;
  userID?: string;
}

export interface EmailFilter {
  limit?: number;
  recipient?: string;
  subject?: string;
  userID?: string;
}
