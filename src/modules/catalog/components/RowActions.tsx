import { MoreHorizontal } from 'lucide-react';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui';

export type RowAction = {
  label: string;
  onSelect: () => void;
  isDestructive?: boolean;
};

/** Destructive items sort last, behind a rule — never where a hand expects the safe one. */
export function RowActions({ label, actions }: { label: string; actions: RowAction[] }) {
  if (actions.length === 0) return null;

  const ordinary = actions.filter((action) => !action.isDestructive);
  const destructive = actions.filter((action) => action.isDestructive);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            // The row itself opens the release; the menu is not the row.
            onClick={(event) => event.stopPropagation()}
            className="size-7 text-dim hover:text-text data-popup-open:text-text"
          >
            <MoreHorizontal />
          </Button>
        }
      />

      {/* The registry ships one density and no size prop, so the console's own is
          set here rather than inside the generated file — 32px rows, matching the
          sidebar and the filter controls. The separator bleeds to the popup's
          edges, so its own -mx-1 is corrected for this padding. */}
      <DropdownMenuContent align="end" className="min-w-52 p-1.5">
        {ordinary.map((action) => (
          <Item key={action.label} action={action} />
        ))}

        {ordinary.length > 0 && destructive.length > 0 ? (
          <DropdownMenuSeparator className="-mx-1.5 my-1.5" />
        ) : null}

        {destructive.map((action) => (
          <Item key={action.label} action={action} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Item({ action }: { action: RowAction }) {
  return (
    <DropdownMenuItem
      variant={action.isDestructive ? 'destructive' : 'default'}
      className="px-2.5 py-1.5 text-base"
      onClick={(event) => {
        event.stopPropagation();
        action.onSelect();
      }}
    >
      {action.label}
    </DropdownMenuItem>
  );
}
