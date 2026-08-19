// The kit's only door: nothing outside this folder imports @base-ui/react.
// Components come from shadcn and are ours once added — customise in a sibling
// file, never inside a generated one, so `--overwrite` stays safe.
//
// Each block mirrors what its generated file exports, including the parts no screen
// uses yet. Mirroring is mechanical; a hand-picked subset means editing this file
// twice for every `shadcn add`, and an unused name costs one line and tree-shakes away.

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
} from './combobox';
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
export {
  TimeSeriesChart,
  type TimeSeriesBand,
  type TimeSeriesChartProps,
  type TimeSeriesPoint,
} from './time-series-chart';
export { StatTile } from './stat-tile';
export { StatusBadge, TONE_TEXT, type Tone } from './status-badge';
