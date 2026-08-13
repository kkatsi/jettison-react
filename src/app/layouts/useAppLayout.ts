import { useLocation, useMatches } from 'react-router';

import { config } from '@core/config/config';

import { navTitleFor } from '../navigation';
import type { BackendIndicator } from './Topbar';

/** Copy keyed by cache mode; the view never maps a code to a string. */
const BACKEND_COPY: Record<typeof config.cacheMode, BackendIndicator> = {
  events: { label: 'Live', sublabel: 'simulated backend', degraded: false },
  naive: { label: 'Naive cache', sublabel: 'demo mode', degraded: true },
};

/** The layout's one view-model. */
export function useAppLayout(): {
  title: string;
  backend: BackendIndicator;
  /** Keys the screen slot: a mount, not an update, or React holds the old screen. */
  screenKey: string;
} {
  const { pathname } = useLocation();
  const matches = useMatches();

  return {
    title: navTitleFor(pathname),
    backend: BACKEND_COPY[config.cacheMode],
    // The screen's own route, not the URL: a screen with child routes of its own
    // would otherwise be torn down and rebuilt every time one of them changed.
    screenKey: matches[1]?.id ?? pathname,
  };
}
