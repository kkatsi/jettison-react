// Promoted out of the catalogue screen when the board asked for it too (Ch. 2 §6).
// No React, no store, no fetching (R5).

/** Everything this needs of a release — the two fields, not the type. */
type Credited = { artistId: string; artistName: string };

/** The artist filter's options, taken from the releases on screen rather than a second endpoint. */
export function artistOptions(releases: readonly Credited[]): { value: string; label: string }[] {
  const names = new Map<string, string>();
  for (const release of releases) names.set(release.artistId, release.artistName);

  return [...names]
    .sort(([, a], [, b]) => a.localeCompare(b))
    .map(([value, label]) => ({ value, label }));
}
