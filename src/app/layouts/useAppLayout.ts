import { useState } from 'react';
import { useLocation, useMatches, useNavigate } from 'react-router';

import { config, urlForCacheMode, type CacheMode } from '@core/config/config';

import { NAV, navTitleFor } from '../navigation';
import type { NaiveBannerProps } from './NaiveBanner';
import type { BackendIndicator } from './Topbar';

/** Copy keyed by cache mode; the view never maps a code to a string. */
const MODES: { value: CacheMode; label: string; sublabel: string }[] = [
  { value: 'events', label: 'events', sublabel: 'patch, then verify' },
  { value: 'naive', label: 'naive', sublabel: 'invalidate and hope' },
];

const NAIVE_BANNER = {
  title: 'Naive cache mode — a release you submit will vanish for about 2.5 seconds.',
  description:
    'The mutation succeeds and invalidates the Releases tag, so every list refetches. But the backend has only written to its command store; the read model the list endpoint serves has not been projected yet. The refetch wins the race, returns a list without the release you just created, and the query library replaces the cache with it.',
  sequence: [
    'submit ok',
    'invalidateTags([Releases])',
    'refetch beats the projection',
    'stale list overwrites the cache',
  ],
  remedy:
    'Patch-then-verify writes the new row into the cache first and invalidates only once the read model has caught up, so the refetch confirms the row instead of deleting it (Ch. 4 §5).',
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
      sublabel: MODES.find((mode) => mode.value === config.cacheMode)?.sublabel ?? '',
      degraded: isNaive,
      modes: MODES.map((mode) => ({
        value: mode.value,
        label: mode.label,
        isCurrent: mode.value === config.cacheMode,
        // A reload, not a re-render: config is frozen and read once, and the
        // demo is worth more from an empty cache.
        onSelect: () => window.location.assign(urlForCacheMode(mode.value)),
      })),
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
