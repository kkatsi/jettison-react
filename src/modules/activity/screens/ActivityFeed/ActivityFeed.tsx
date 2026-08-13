import { Search } from 'lucide-react';

import { Button, FilterSelect, Input, ScreenFallback } from '@shared/ui';

import { RANGE_OPTIONS, TYPE_OPTIONS } from '../../constants';
import { EventRow } from './EventRow';
import { useActivityFeed } from './useActivityFeed';

// The architecture's event vocabulary, on screen: every row is a fact that may
// cross a module boundary, named exactly as `shared/events/` names it.
export function ActivityFeed() {
  const { isLoading, failure, groups, isEmpty, resultLabel, filters } = useActivityFeed();

  if (isLoading) return <ScreenFallback />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-15 flex-none items-center gap-2 border-b border-line px-6">
        <div className="relative w-75">
          <Search className="pointer-events-none absolute top-2 left-2.5 size-3.5 text-dim" />
          <Input
            value={filters.query}
            onChange={(event) => filters.onQuery(event.target.value)}
            placeholder="Search events, releases, people"
            className="h-7.5 bg-panel pl-8 text-sm"
          />
        </div>

        <FilterSelect
          label="Type"
          options={TYPE_OPTIONS}
          value={filters.type}
          onValueChange={filters.onType}
        />
        <FilterSelect
          label="Range"
          options={RANGE_OPTIONS}
          value={filters.range}
          onValueChange={filters.onRange}
        />

        {filters.isActive ? (
          <Button variant="ghost" size="sm" className="h-7.5 text-idle" onClick={filters.onReset}>
            Reset
          </Button>
        ) : null}

        <span className="ml-auto font-mono text-xs text-faint">{resultLabel}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.day}>
            <div className="flex h-8.5 items-center gap-2.5 border-b border-line/70 px-6">
              <span className="font-mono text-2xs tracking-[0.08em] text-dim">{group.label}</span>
              <div className="h-px flex-1 bg-panel" />
              <span className="font-mono text-2xs text-dim">
                {group.events.length} {group.events.length === 1 ? 'event' : 'events'}
              </span>
            </div>
            {group.events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        ))}

        {failure ? (
          <Notice>
            <span>The activity feed could not be loaded.</span>
            <Button variant="outline" size="sm" onClick={failure.retry}>
              Try again
            </Button>
          </Notice>
        ) : null}

        {isEmpty ? (
          <Notice>
            <span className="text-subtle">No events match these filters</span>
            <button type="button" className="text-sm text-brand" onClick={filters.onReset}>
              Clear filters
            </button>
          </Notice>
        ) : null}

        {groups.length > 0 ? (
          <div className="flex h-13 items-center justify-center font-mono text-xs text-dim">
            end of retained events · 90 days
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-50 flex-col items-center justify-center gap-2 font-mono text-xs text-dim">
      {children}
    </div>
  );
}
