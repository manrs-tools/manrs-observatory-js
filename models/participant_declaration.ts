// Code generated from internal models; DO NOT EDIT.

export const ActionStatusConformant = "conformant";

export const ActionStatusNonConformant = "non-conformant";

export const ActionStatusPending = "pending";

export const ActionStatusPlanned = "planned";

export interface ActionDeclaration {
  comments: string;
  conformant: boolean;
  description: string;
  status?: string;
}

export type Declaration = Record<string, ActionDeclaration>;
