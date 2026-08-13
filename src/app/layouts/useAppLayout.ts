import { useState } from 'react';
import { useLocation, useMatches, useNavigate } from 'react-router';

import { config } from '@core/config/config';

import { NAV, navTitleFor } from '../navigation';
import type { NaiveBannerProps } from './NaiveBanner';
import type { BackendIndicator } from './Topbar';

/** Copy keyed by cache mode; the view never maps a code to a string. */
const BACKEND_COPY: Record<typeof config.cacheMode, BackendIndicator> = {
  events: { label: 'Live', sublabel: 'simulated backend', degraded: false },
  naive: { label: 'Naive cache', sublabel: 'demo mode', degraded: true },
};

const NAIVE_BANNER = {
  title: 'Naive cache mode: watch submitted releases vanish.',
  description:
    'This is the bug Jettison prevents — the refetch beats the backend’s read model, so a release you just submitted disappears until the projection catches up.',
  action: 'Start a release',
};

/** The demo's own path, and the module that owns it. */
const DEMO_MODULE = 'release-editor';

/** The layout's one view-model. */
export function useAppLayout(): {
  title: string;
  backend: BackendIndicator;
  /** Keys the screen slot: a mount, not an update, or React holds the old screen. */
  screenKey: string;
  banner: NaiveBannerProps | null;
} {
  const { pathname } = useLocation();
  const matches = useMatches();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  // Looked up rather than hardcoded: throw the editor overboard and the button
  // goes with it, the same way its nav entry does.
  const demo = NAV.find((item) => item.module === DEMO_MODULE);

  return {
    title: navTitleFor(pathname),
    backend: BACKEND_COPY[config.cacheMode],
    // The screen's own route, not the URL: a screen with child routes of its own
    // would otherwise be torn down and rebuilt every time one of them changed.
    screenKey: matches[1]?.id ?? pathname,

    banner:
      config.cacheMode === 'naive' && !isDismissed
        ? {
            title: NAIVE_BANNER.title,
            description: NAIVE_BANNER.description,
            action: demo
              ? { label: NAIVE_BANNER.action, onSelect: () => void navigate(demo.to) }
              : null,
            onDismiss: () => setIsDismissed(true),
          }
        : null,
  };
}
