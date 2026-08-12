// =============================================================================
// The console's navigation — one entry per section, owned by a module.
// =============================================================================
// The sidebar is composed from this list rather than hardcoded in the layout, so
// that throwing a module overboard takes its nav entry with it: the `module`
// field is what `scripts/unregister-module.mjs` matches when the jettison test
// ejects one (the same mechanical edit it makes in store.ts and router.tsx).
// =============================================================================

export type NavItem = {
  /** The module that owns the destination. */
  module: string;
  to: string;
  label: string;
};

// jettison:nav:start — one line per section
// prettier-ignore
export const NAV: readonly NavItem[] = [
  { module: 'catalog',        to: '/catalog',      label: 'Catalog' },
  { module: 'catalog',        to: '/distribution', label: 'Distribution' },
  { module: 'release-editor', to: '/releases/new', label: 'New Release' },
  { module: 'analytics',      to: '/analytics',    label: 'Analytics' },
  { module: 'activity',       to: '/activity',     label: 'Activity' },
];
// jettison:nav:end

/** The topbar title for a path — the longest matching section wins. */
export function navTitleFor(pathname: string): string {
  const match = [...NAV]
    .filter((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0];

  return match?.label ?? 'Console';
}
