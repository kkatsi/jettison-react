// What stops a release being submitted. Pure functions returning codes, never
// copy (R5, R6) — constants.ts owns the words, the hook owns the actions.

/** Stores need a week to ingest, index and schedule a release. */
export const MIN_LEAD_DAYS = 7;

const DAY_MS = 86400000;

/**
 * Whole days between today and the street date. Both are calendar dates, so this
 * counts days, not hours — a release date is not a time.
 */
export function leadDays(releaseDate: string, today: string): number {
  const from = Date.parse(`${today}T00:00:00Z`);
  const to = Date.parse(`${releaseDate}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;

  return Math.round((to - from) / DAY_MS);
}

export function hasEnoughLead(releaseDate: string, today: string): boolean {
  return leadDays(releaseDate, today) >= MIN_LEAD_DAYS;
}
