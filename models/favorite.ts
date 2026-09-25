// Code generated from internal models; DO NOT EDIT.

export interface Favorite {
  created?: string;
  id?: string;
  manrs?: string;
  name: string;
  selection: string;
  userID?: string;
}

/** Fields of Favorite the API populates itself; a write ignores or rejects them. */
export const FavoriteReadOnlyFields: ReadonlySet<keyof Favorite> = new Set<keyof Favorite>(["created", "id", "userID"]);

export interface FavoriteFilter {
  limit?: number;
  id?: string;
}

export interface FavoriteUpdate {
  manrs?: string | null;
  name?: string | null;
  selection?: string | null;
}
