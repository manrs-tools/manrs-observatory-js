/**
 * Returns a copy of `value` without its read-only fields, so an object fetched from the API can be
 * sent straight back on a create or update. The API populates those fields itself and validates
 * them when present, so a stale or foreign value would otherwise fail the request.
 */
export function writable<T extends object>(value: T, readOnly: ReadonlySet<keyof T>): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(value) as (keyof T)[]) {
    if (!readOnly.has(key)) out[key] = value[key];
  }
  return out;
}
