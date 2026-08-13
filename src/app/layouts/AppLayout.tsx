import { NuqsAdapter } from 'nuqs/adapters/react-router/v8';
import { Suspense } from 'react';
import { Outlet } from 'react-router';

import { ScreenFallback } from '@shared/ui';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAppLayout } from './useAppLayout';

// The console frame: sidebar, topbar, and whatever the router mounted.
export function AppLayout() {
  const { title, backend, screenKey } = useAppLayout();

  return (
    <div className="grid h-full grid-cols-[232px_1fr] overflow-hidden">
      <Sidebar />
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <Topbar title={title} backend={backend} />
        {/* No padding here: screens differ — the catalogue is a padded page, the
            activity feed is full-bleed rows — so each screen owns its own chrome. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Filters live in the URL on every screen in this console (Ch. 4 §2),
              so the adapter that makes that one hook call sits above all of them
              — in app, never inside a module, or ejecting that module would take
              the other screens' filters with it (ADR-004). */}
          <NuqsAdapter>
            {/* Keyed per path: React shows a fallback for a mount, not an update,
                so without it the old screen sits there while the chunk downloads. */}
            <Suspense key={screenKey} fallback={<ScreenFallback />}>
              <Outlet />
            </Suspense>
          </NuqsAdapter>
        </div>
      </main>
    </div>
  );
}
