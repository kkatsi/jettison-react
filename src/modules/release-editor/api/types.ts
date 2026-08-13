// DTOs first, then the shapes the wizard renders. The mock's schemas are the
// backend's contract; this is the module's reading of it (Ch. 4 §1).

export type ReleaseType = 'Single' | 'EP' | 'Album';

export type AudioStatus = 'uploading' | 'processing' | 'ready';

export type Artwork = { from: string; to: string };

/** What the stores measure the cover against. The colours are what we can render. */
export type ArtworkFile = { name: string; width: number; height: number };

export type Credits = {
  composer: string;
  producer: string;
  publisher: string;
  pLine: string;
  cLine: string;
};

export type TrackDto = {
  id: string;
  number: number;
  title: string;
  durationMs: number;
  isrc: string;
  audioStatus: AudioStatus;
};

export type ReleaseDraftDto = {
  id: string;
  catalogNumber: string;
  title: string;
  artistId: string;
  artistName: string;
  type: ReleaseType;
  status: string;
  releaseDate: string;
  submittedAt: string | null;
  artwork: Artwork;
  genre?: string | null;
  credits?: Credits | null;
  artworkFile?: ArtworkFile | null;
  deliveries: { storeId: string }[];
  tracks: TrackDto[];
};

export type ArtistDto = { id: string; name: string };

export type DraftTrack = {
  id: string;
  number: number;
  title: string;
  isrc: string;
  audioStatus: AudioStatus;
  /** '3:42', or an em dash while the file is still on its way. */
  duration: string;
  /** The raw length survives it: the review step sums a running time. */
  durationMs: number;
};

/** The release as the wizard edits it — every optional field already resolved. */
export type ReleaseDraft = {
  id: string;
  catalogNumber: string;
  title: string;
  artistId: string;
  artistName: string;
  type: ReleaseType;
  /** Anything but `draft` and the stores have it: the wizard is read-only. */
  status: string;
  releaseDate: string;
  submittedAt: string | null;
  genre: string;
  credits: Credits;
  artwork: Artwork;
  artworkFile: ArtworkFile | null;
  tracks: DraftTrack[];
  /** Who the release goes to, and the only thing the submission event needs. */
  storeIds: string[];
};

/** What one save sends. Absent keys are untouched, not cleared. */
export type DraftPatch = Partial<{
  title: string;
  artistId: string;
  type: ReleaseType;
  releaseDate: string;
  genre: string;
  credits: Credits;
  artwork: Artwork;
  /** Null removes the cover; absent leaves it alone. */
  artworkFile: ArtworkFile | null;
}>;
