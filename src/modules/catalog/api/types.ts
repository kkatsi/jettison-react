// DTOs first, then the shapes the screens actually render. Nothing here is
// imported from src/mocks — the mock's schemas are the backend's contract, this
// is the module's reading of it (Ch. 4 §1).

export type ReleaseType = 'Single' | 'EP' | 'Album';

export type ReleaseStatus =
  'draft' | 'submitted' | 'in-review' | 'delivering' | 'live' | 'rejected';

export type DeliveryStatus = 'pending' | 'in-review' | 'delivered' | 'rejected';

export type AudioStatus = 'uploading' | 'processing' | 'ready';

export type Artwork = { from: string; to: string };

export type DeliveryDto = {
  storeId: string;
  status: DeliveryStatus;
  deliveredAt: string | null;
};

export type TrackDto = {
  id: string;
  releaseId: string;
  number: number;
  title: string;
  durationMs: number;
  isrc: string;
  audioStatus: AudioStatus;
};

export type ReleaseDto = {
  id: string;
  catalogNumber: string;
  title: string;
  artistId: string;
  artistName: string;
  type: ReleaseType;
  status: ReleaseStatus;
  releaseDate: string;
  submittedAt: string | null;
  artwork: Artwork;
  streams30d: number;
  streamsTrend: number[];
  deliveries: DeliveryDto[];
};

export type ReleaseDetailDto = ReleaseDto & { tracks: TrackDto[] };

export type StoreDto = { id: string; name: string };

/** One row of the catalogue, and of the distribution board — same release, one shape. */
export type Release = {
  id: string;
  catalogNumber: string;
  title: string;
  artistId: string;
  artistName: string;
  type: ReleaseType;
  status: ReleaseStatus;
  /** Already display-ready: the backend speaks ISO dates, the console shows them. */
  releaseDate: string;
  submittedAt: string | null;
  /** '2026-08-11 09:12', or an em dash for a release nobody has submitted. */
  submittedLabel: string;
  artwork: Artwork;
  /** '1.28M' · '482K' · '—'. The raw count survives it: the stat tiles sum on it. */
  streamsLabel: string;
  streams30d: number;
  streamsTrend: number[];
  deliveries: DeliveryDto[];
};

export type Track = {
  id: string;
  number: number;
  title: string;
  /** '3:42'. */
  duration: string;
  isrc: string;
  audioStatus: AudioStatus;
};

export type ReleaseDetail = Release & { tracks: Track[] };

/** One line of a release's history, as the detail screen shows it. */
export type ActivityEntryDto = {
  id: string;
  type: string;
  at: string;
  actor: string;
  summary: string;
};

export type ActivityEntry = {
  id: string;
  /** '2026-05-08 09:12'. */
  at: string;
  actor: string;
  summary: string;
  /** Which colour the dot gets — the module's own reading of the event name. */
  kind: 'submitted' | 'withdrawn' | 'processed';
};

/** A release's standing at one store, with the store named rather than keyed. */
export type StoreDelivery = {
  storeId: string;
  storeName: string;
  status: DeliveryStatus;
  /** '2026-05-09 14:02', or an em dash while the store still has it. */
  deliveredLabel: string;
};
