// =============================================================================
// The design-system kit — the single door to every visual primitive.
// =============================================================================
// Screens and features import from `@shared/ui`, never from a file inside it and
// never from a UI library directly. One door means a primitive can be swapped
// (or a library dropped) without touching a single screen.
//
// Components arrive when a screen needs them, not by template (Ch. 2 §5). Today
// the shell needs four; the catalog's table, filters and dialogs bring theirs.
// =============================================================================

export { Badge, type BadgeProps } from './Badge';
export { Button, type ButtonProps } from './Button';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { Panel, type PanelProps } from './Panel';
