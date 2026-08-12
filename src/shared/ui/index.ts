// The kit, and the only door to it. Screens import from '@shared/ui'; nothing
// outside this folder imports @base-ui/react.
//
// Components come from shadcn (`npx shadcn add <name>`) and are ours once added.
// Customise in a sibling file, not inside a generated one, so `--overwrite` stays
// a safe way to take upstream fixes. Add them when a screen needs them.

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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './empty';

// Ours — shadcn has no equivalent.
export { ScreenErrorBoundary } from './screen-error-boundary';
