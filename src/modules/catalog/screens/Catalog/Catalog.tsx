import { Search } from 'lucide-react';

import {
  Button,
  Card,
  FilterSelect,
  Input,
  StatTile,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/ui';
import { cn } from '@shared/utils/cn';

import { CATALOG_COLUMNS } from './columns';
import { ReleaseRow } from './ReleaseRow';
import { useCatalog } from './useCatalog';

// The label's whole catalogue, dense enough that the filters earn their place.
export function Catalog() {
  const {
    isLoading,
    failure,
    tiles,
    rows,
    isEmpty,
    resultLabel,
    footerLabel,
    filters,
    pagination,
  } = useCatalog();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-6">
      <div className="grid flex-none grid-cols-4 gap-3">
        {tiles.map((tile) => (
          <StatTile key={tile.label} {...tile} />
        ))}
      </div>

      <div className="flex flex-none items-center gap-2">
        <div className="relative w-65">
          <Search className="pointer-events-none absolute top-2 left-2.5 size-3.5 text-dim" />
          <Input
            value={filters.query}
            onChange={(event) => filters.onQuery(event.target.value)}
            placeholder="Search releases, artists, cat. no."
            className="h-7.5 bg-panel pl-8 text-sm"
          />
        </div>

        <FilterSelect
          label="Artist"
          options={filters.artists}
          value={filters.artist}
          onValueChange={filters.onArtist}
        />
        <FilterSelect
          label="Type"
          options={filters.types}
          value={filters.type}
          onValueChange={filters.onType}
        />
        <FilterSelect
          label="Status"
          options={filters.stages}
          value={filters.stage}
          onValueChange={filters.onStage}
        />

        {filters.isActive ? (
          <Button variant="ghost" size="sm" className="h-7.5 text-idle" onClick={filters.onReset}>
            Reset
          </Button>
        ) : null}

        <span className="ml-auto font-mono text-xs text-faint">{resultLabel}</span>
      </div>

      <Card className="min-h-60 flex-1 gap-0 overflow-hidden py-0">
        {/* The kit wraps every table in its own scroll container, so that is what
            gets the height and does the scrolling — the header sticks to it, and
            the footer below stays put instead of being painted over. */}
        <div className="min-h-0 flex-1 *:data-[slot=table-container]:h-full *:data-[slot=table-container]:overflow-y-auto">
          <Table className="table-fixed">
            <colgroup>
              {CATALOG_COLUMNS.map((width, index) => (
                <col key={index} className={width} />
              ))}
            </colgroup>

            <TableHeader className="sticky top-0 z-10 bg-panel">
              <TableRow className="h-9 border-line hover:bg-transparent">
                <TableHead className="pl-4 text-xs font-medium text-idle">Release</TableHead>
                <TableHead className="text-xs font-medium text-idle">Artist</TableHead>
                <TableHead className="text-xs font-medium text-idle">Type</TableHead>
                <TableHead className="text-xs font-medium text-idle">Status</TableHead>
                <TableHead className="text-xs font-medium text-idle">Release date</TableHead>
                {/* Right-aligned, like the values under them — a number column
                    reads up the right edge. */}
                <TableHead className="text-right text-xs font-medium text-idle">Trend</TableHead>
                <TableHead className="pr-4 text-right text-xs font-medium text-idle">
                  Streams · 30d
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((release) => (
                <ReleaseRow key={release.id} release={release} />
              ))}
            </TableBody>
          </Table>

          {isLoading ? <Notice>Loading the catalogue…</Notice> : null}

          {failure ? (
            <Notice>
              <span>The catalogue could not be loaded.</span>
              <Button variant="outline" size="sm" onClick={failure.retry}>
                Try again
              </Button>
            </Notice>
          ) : null}

          {isEmpty ? (
            <Notice>
              <span className="text-subtle">No releases match these filters</span>
              <button type="button" className="text-sm text-brand" onClick={filters.onReset}>
                Clear filters
              </button>
            </Notice>
          ) : null}
        </div>

        <div className="flex h-11 flex-none items-center justify-between border-t border-line px-4 text-xs text-idle">
          <span className="font-mono">{footerLabel}</span>

          <div className="flex items-center gap-1">
            <PageButton onClick={pagination.onPrevious} disabled={!pagination.hasPrevious}>
              Prev
            </PageButton>
            {pagination.pages.map((page) => (
              <PageButton
                key={page.key}
                onClick={page.onSelect}
                disabled={!page.onSelect}
                isCurrent={page.isCurrent}
              >
                {page.label}
              </PageButton>
            ))}
            <PageButton onClick={pagination.onNext} disabled={!pagination.hasNext}>
              Next
            </PageButton>
          </div>
        </div>
      </Card>
    </div>
  );
}

type PageButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
  isCurrent?: boolean;
  children: React.ReactNode;
};

function PageButton({ onClick, disabled, isCurrent, children }: PageButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={isCurrent ? 'page' : undefined}
      className={cn(
        'h-6.5 min-w-6.5 rounded-lg border border-line px-2 font-mono text-xs text-subtle',
        'hover:border-line-strong hover:text-text disabled:border-transparent disabled:text-dim disabled:hover:text-dim',
        isCurrent && 'border-brand/40 bg-brand/14 text-brand-soft',
      )}
    >
      {children}
    </button>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-50 flex-col items-center justify-center gap-2 font-mono text-xs text-dim">
      {children}
    </div>
  );
}
