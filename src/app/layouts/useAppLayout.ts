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
export function useAppLayout(): {
  title: string;
  backend: BackendIndicator;
  /**
   * Identity for the screen slot. React Router navigates inside a transition, and
   * React will not replace visible content with a fallback during one — so a
   * screen whose code is still downloading leaves the *previous* screen on show,
   * doing nothing, until the chunk lands. Keying the boundary on the path makes
   * each screen a fresh mount instead of an update, which is what lets its
   * fallback appear the moment the link is clicked.
   */
  screenKey: string;
} {
  const { pathname } = useLocation();

  return {
    title: navTitleFor(pathname),
    backend: BACKEND_COPY[config.cacheMode],
    screenKey: pathname,
  };
}
