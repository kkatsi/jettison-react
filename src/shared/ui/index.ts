// The kit, and the only door to it. Screens import from '@shared/ui'; nothing
// outside this folder imports @base-ui/react.
//
// Components come from shadcn (`npx shadcn add <name>`) and are ours once added.
// Customise in a sibling file, not inside a generated one, so `--overwrite` stays
// a safe way to take upstream fixes. Add them when a screen needs them.

export { Badge, badgeVariants } from './badge';
export { Button, buttonVariants } from './button';
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from './dialog';
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
export {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './empty';
export { FilterSelect, type FilterOption } from './filter-select';
export { Input } from './input';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
export { Skeleton } from './skeleton';
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

// Ours — shadcn has no equivalent.
export { Artwork, type ArtworkColours } from './artwork';
export { ScreenErrorBoundary } from './screen-error-boundary';
export { Sparkline } from './sparkline';
export { StatTile } from './stat-tile';
export { StatusBadge, TONE_TEXT, type Tone } from './status-badge';
