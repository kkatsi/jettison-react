import { NavLink } from 'react-router';

import { cn } from '@shared/utils/cn';

import { NAV } from '../navigation';

export function Sidebar() {
  return (
    <aside className="flex h-full flex-col overflow-hidden border-r border-line">
      <div className="flex h-14 items-center gap-3 border-b border-line px-5">
        {/* The mark: a label in low orbit. */}
        <div className="relative flex size-5.5 flex-none items-center justify-center rounded-full border border-line-strong">
          <div className="size-1.75 rounded-full bg-brand" />
          <div className="absolute top-0 right-0.5 size-0.75 rounded-full bg-text" />
        </div>
        <div className="leading-none">
          <div className="flex items-baseline gap-1 font-display text-lg font-extrabold tracking-tight text-bright">
            <span>LOW</span>
            <span className="text-brand">/</span>
            <span>ORBIT</span>
          </div>
          <div className="mt-1.5 font-mono text-3xs tracking-[0.26em] text-faint">
            RECORDS · EST 2014
          </div>
        </div>
      </div>

      <nav className="flex flex-col px-3 pt-3.5">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'relative flex h-8.5 items-center rounded-md px-3',
                isActive
                  ? 'bg-raised font-medium text-text'
                  : 'text-subtle hover:bg-panel hover:text-text',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <span className="absolute top-2.25 -left-3 h-4 w-0.5 rounded-r-sm bg-brand" />
                ) : null}
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 border-t border-line p-3">
        <div className="flex size-6.5 items-center justify-center rounded bg-line-strong text-xs font-semibold text-subtle">
          MK
        </div>
        <div className="leading-snug">
          <div className="text-sm font-medium">Mara Kessler</div>
          <div className="text-xs text-idle">Label manager</div>
        </div>
      </div>
    </aside>
  );
}
