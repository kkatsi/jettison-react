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
  label: 'NAIVE CACHE',
  sublabel: 'demo mode',
  description:
    'Submitting invalidates the Releases tag, so every list refetches. The backend has the write, but the read model those lists are served from has not been projected yet — the refetch returns a catalogue without the new release, and replaces the cache with it.',
  remedy:
    'Patch-then-verify writes the row into the cache first and invalidates only once the read model has caught up, so the refetch confirms the row instead of deleting it (Ch. 4 §5).',
  action: 'Start a release',
};

/** Margins so the first and last marker sit on the axis rather than over its ends. */
const AXIS_INSET = 8;

const asDuration = (ms: number) =>
  ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;

/** The race, drawn from the timings this console is actually running. */
function raceFromConfig() {
  const at = (ms: number) => AXIS_INSET + (ms / config.readModelLagMs) * (100 - 2 * AXIS_INSET);
  const refetch = at(config.networkMs);
  const projected = at(config.readModelLagMs);

  return {
    marks: [
      {
        left: refetch,
        time: asDuration(config.networkMs),
        label: 'refetch lands',
        tone: 'warning' as const,
      },
      {
        left: projected,
        time: asDuration(config.readModelLagMs),
        label: 'read model ready',
        tone: 'live' as const,
      },
    ],
    window: {
      left: refetch,
      // Turn the lag down far enough and there is no race left to draw.
      width: Math.max(0, projected - refetch),
      label: `cached list is missing it for ${asDuration(config.readModelLagMs - config.networkMs)}`,
    },
  };
}

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
            race: raceFromConfig(),
            action: demo
              ? { label: NAIVE_BANNER.action, onSelect: () => void navigate(demo.to) }
              : null,
            onDismiss: () => setIsDismissed(true),
          }
        : null,
  };
}
