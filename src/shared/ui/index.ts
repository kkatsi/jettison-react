// =============================================================================
// The design-system kit — the single door to every visual primitive.
// =============================================================================
// Screens and features import from `@shared/ui`, never from a file inside it and
// never from a UI library directly. One door means a primitive can be swapped —
// or its library replaced — without touching a single screen.
//
// Components come from shadcn, on Base UI primitives:
//
//   npx shadcn add <component>     → lands in this folder, becomes ours
//
// Generated code is owned code (the shadcn model), so customising it is expected;
// keeping customisations in a *sibling* file rather than inside the generated one
// keeps `shadcn add --overwrite` a safe way to take upstream fixes.
//
// Components arrive when a screen needs them, not by template (Ch. 2 §5). The
// shell needs three; the catalogue's table, filters and dialogs bring theirs.
// =============================================================================

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

// Ours — shadcn has no equivalent, and every module wraps its screens with it.
export { ScreenErrorBoundary } from './screen-error-boundary';
