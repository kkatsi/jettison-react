import { useLocation } from 'react-router';

import { config } from '@core/config/config';

import { navTitleFor } from '../navigation';
import type { BackendIndicator } from './Topbar';

/** Copy keyed by cache mode; the view never maps a code to a string. */
const BACKEND_COPY: Record<typeof config.cacheMode, BackendIndicator> = {
  events: { label: 'Live', sublabel: 'simulated backend', degraded: false },
  naive: { label: 'Naive cache', sublabel: 'demo mode', degraded: true },
};

/** The layout's one view-model. */
export function useAppLayout(): { title: string; backend: BackendIndicator } {
  const { pathname } = useLocation();

  return {
    title: navTitleFor(pathname),
    backend: BACKEND_COPY[config.cacheMode],
  };
}
