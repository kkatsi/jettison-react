import { useLocation } from 'react-router';

import { config } from '@core/config/config';

import { navTitleFor } from '../navigation';
import type { BackendIndicator } from './Topbar';

/** Copy keyed by the cache mode — the view never maps a code to a string (R6). */
const BACKEND_COPY: Record<typeof config.cacheMode, BackendIndicator> = {
  events: { label: 'Live', sublabel: 'simulated backend', degraded: false },
  naive: { label: 'Naive cache', sublabel: 'demo mode', degraded: true },
};

/** The layout's one view-model (R3): what the chrome renders, already decided. */
export function useAppLayout(): { title: string; backend: BackendIndicator } {
  const { pathname } = useLocation();

  return {
    title: navTitleFor(pathname),
    backend: BACKEND_COPY[config.cacheMode],
  };
}
