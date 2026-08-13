import { MoreHorizontal } from 'lucide-react';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui';
import { cn } from '@shared/utils/cn';

export type RowAction = {
  label: string;
  onSelect: () => void;
  isDestructive?: boolean;
};

/**
 * The per-row menu. Every item comes from the row's view-model already decided —
 * this knows how to open a menu and nothing about releases.
 */
export function RowActions({ label, actions }: { label: string; actions: RowAction[] }) {
  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            // The row itself is a link to the release; the menu is not.
            onClick={(event) => event.stopPropagation()}
            className="size-7 text-dim hover:text-text data-popup-open:text-text"
          >
            <MoreHorizontal />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-48">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            onClick={(event) => {
              event.stopPropagation();
              action.onSelect();
            }}
            className={cn(action.isDestructive && 'text-danger data-highlighted:text-danger')}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
