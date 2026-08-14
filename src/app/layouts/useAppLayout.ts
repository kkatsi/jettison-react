import { useState } from 'react';
import { useLocation, useMatches, useNavigate } from 'react-router';

import { config, urlForCacheMode } from '@core/config/config';

import { NAV, navTitleFor } from '../navigation';
import type { NaiveBannerProps } from './NaiveBanner';
import type { BackendIndicator } from './Topbar';

/** Copy for the topbar; the view never maps a code to a string. */
const BACKEND = {
  label: 'simulated backend',
  /** Named for what turning it on does, not for the strategy it selects. */
  demo: 'naive cache demo',
};

const NAIVE_BANNER = {
  label: 'NAIVE CACHE',
  sublabel: 'demo mode',
  description:
    'A write invalidates the cache and refetches straight away. The backend projects its read model a couple of seconds later, so the list comes back without the release you just submitted and overwrites the cache with it. In events mode the new row is written into the cache first, then confirmed once the read model has caught up.',
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

  const isNaive = config.cacheMode === 'naive';
  // Looked up rather than hardcoded: throw the editor overboard and the button
  // goes with it, the same way its nav entry does.
  const demo = NAV.find((item) => item.module === DEMO_MODULE);

  return {
    title: navTitleFor(pathname),
    backend: {
      label: BACKEND.label,
      degraded: isNaive,
      demo: {
        label: BACKEND.demo,
        isOn: isNaive,
        // A reload, not a re-render: config is frozen and read once, and the
        // demo is worth more from an empty cache.
        onToggle: (isOn: boolean) =>
          window.location.assign(urlForCacheMode(isOn ? 'naive' : 'events')),
      },
    },
    // The screen's own route, not the URL: a screen with child routes of its own
    // would otherwise be torn down and rebuilt every time one of them changed.
    screenKey: matches[1]?.id ?? pathname,

    banner:
      isNaive && !isDismissed
        ? {
            ...NAIVE_BANNER,
            action: demo
              ? { label: NAIVE_BANNER.action, onSelect: () => void navigate(demo.to) }
              : null,
            onDismiss: () => setIsDismissed(true),
          }
        : null,
  };
}
