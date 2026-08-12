// The sidebar reads this instead of hardcoding links, so ejecting a module takes
// its nav entry with it — that's what the `module` field is for.

export type NavItem = {
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

/** Topbar title for a path; longest matching section wins. */
export function navTitleFor(pathname: string): string {
  const match = [...NAV]
    .filter((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0];

  return match?.label ?? 'Console';
}
