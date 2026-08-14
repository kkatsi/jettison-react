import {
  Artwork,
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
} from '@shared/ui';

import { useRef } from 'react';

import type { ScopeOption } from '../api/types';
import type { ScopeGroup } from '../services/scope';

export type ScopePickerProps = {
  groups: ScopeGroup[];
  selected: ScopeOption | null;
  onSelect: (option: ScopeOption) => void;
};

/** What the numbers are about: the whole label, one artist, or one release. */
export function ScopePicker({ groups, selected, onSelect }: ScopePickerProps) {
  // The search field lives inside the popup, so the popup has no input to hang
  // off: without this it anchors to the hidden one at the end of the document.
  const anchor = useRef<HTMLButtonElement>(null);

  return (
    <Combobox
      items={groups}
      value={selected}
      // Base UI allows clearing; this picker never does — there is always a scope.
      onValueChange={(option: ScopeOption | null) => option && onSelect(option)}
      // The search matches what the row shows — a catalogue number finds its release.
      itemToStringLabel={(option: ScopeOption) => `${option.label} ${option.meta}`}
      isItemEqualToValue={(a: ScopeOption, b: ScopeOption) => a.value === b.value}
    >
      <ComboboxTrigger
        ref={anchor}
        className="flex h-8.5 min-w-59 items-center gap-2.5 rounded-lg border border-line bg-panel px-3 text-left hover:border-line-strong"
      >
        <ScopeArt option={selected} className="size-5.5" />
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-medium">{selected?.label ?? 'All releases'}</span>
          <span className="font-mono text-3xs text-faint">{selected?.meta ?? ''}</span>
        </span>
      </ComboboxTrigger>

      <ComboboxContent anchor={anchor} align="start" className="w-80">
        <ComboboxInput placeholder="Search releases and artists" />
        <ComboboxEmpty>Nothing under that name</ComboboxEmpty>

        <ComboboxList>
          <ComboboxCollection>
            {(group: ScopeGroup) => (
              <ComboboxGroup key={group.value} items={group.items}>
                <ComboboxLabel className="px-1.5 font-mono text-3xs tracking-[0.09em] text-dim uppercase">
                  {group.value}
                </ComboboxLabel>

                <ComboboxCollection>
                  {(option: ScopeOption) => (
                    <ComboboxItem key={option.value} value={option} className="h-9 gap-2.5">
                      <ScopeArt option={option} className="size-5.5" />
                      <span className="min-w-0 flex-1 truncate text-sm">{option.label}</span>
                      <span className="font-mono text-2xs text-faint">{option.meta}</span>
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            )}
          </ComboboxCollection>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/** The whole label has no cover of its own, so it gets the panel's own colours. */
function ScopeArt({ option, className }: { option: ScopeOption | null; className: string }) {
  return option?.artwork ? (
    <Artwork artwork={option.artwork} className={className} />
  ) : (
    <span aria-hidden className={`${className} flex-none rounded-sm bg-line-strong`} />
  );
}
