// The kit's only door: nothing outside this folder imports @base-ui/react.
// Components come from shadcn and are ours once added — customise in a sibling
// file, never inside a generated one, so `--overwrite` stays safe.

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
export { Switch } from './switch';
// `toast` is re-exported so nothing outside the kit imports the library directly,
// the same rule that keeps @base-ui/react in here.
export { Toaster } from './sonner';
export { toast } from 'sonner';
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
export { ScreenFallback } from './screen-fallback';
export { Sparkline } from './sparkline';
export { StatTile } from './stat-tile';
export { StatusBadge, TONE_TEXT, type Tone } from './status-badge';
