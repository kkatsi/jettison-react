import { cn } from '@shared/utils/cn';

/** Two seed colours, hatched — the seed generates artwork rather than shipping images. */
export type ArtworkColours = { from: string; to: string };

/** Sized by the caller: `size-8` in a row, `size-24` on a detail header. */
export function Artwork({ artwork, className }: { artwork: ArtworkColours; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('flex-none rounded-sm', className)}
      // Inline because the values are data, not design decisions.
      style={{
        background: artwork.from,
        backgroundImage: `repeating-linear-gradient(135deg, ${artwork.to} 0 3px, transparent 3px 7px)`,
      }}
    />
  );
}
