// Copy for this screen, keyed by the codes its services return (R6). Colocated
// because one screen reads it — it climbs to the module's constants.ts when a
// second one does (Ch. 2 §6).

import type { TrendDirection } from './catalog-summary';

/** What the sparkline says, for a reader who cannot see it. */
export const TREND_LABEL = {
  rising: 'Streams rising over the last 16 days',
  falling: 'Streams falling over the last 16 days',
  steady: 'Streams steady over the last 16 days',
  none: 'No streams to chart yet',
} satisfies Record<TrendDirection, string>;
