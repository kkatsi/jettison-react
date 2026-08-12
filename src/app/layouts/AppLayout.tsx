import { Outlet } from 'react-router';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAppLayout } from './useAppLayout';

/** The console frame: sidebar, topbar, and whichever screen the router mounted. */
export function AppLayout() {
  const { title, backend } = useAppLayout();

  return (
    <div className="grid h-full grid-cols-[232px_1fr] overflow-hidden">
      <Sidebar />
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <Topbar title={title} backend={backend} />
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
