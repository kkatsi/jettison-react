// The mock's contract: seed data is typed from these and every handler parses its
// response through them, so drift shows up here instead of in a screen.
//
// The mock's contract, not the app's — modules declare their own DTO types and
// never import from src/mocks.

import { z } from 'zod';

export const releaseTypeSchema = z.enum(['Single', 'EP', 'Album']);

export const releaseStatusSchema = z.enum([
  'draft',
  'submitted',
  'in-review',
  'delivering',
  'live',
  'rejected',
]);

export const audioStatusSchema = z.enum(['uploading', 'processing', 'ready']);

export const deliveryStatusSchema = z.enum(['pending', 'in-review', 'delivered', 'rejected']);

/** Two colours, not an image — the seed's artwork is generated, and honest about it. */
export const artworkSchema = z.object({ from: z.string(), to: z.string() });

export const artistSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const storeSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const trackSchema = z.object({
  id: z.string(),
  releaseId: z.string(),
  number: z.number().int().positive(),
  title: z.string(),
  durationMs: z.number().int().positive(),
  isrc: z.string().length(12),
  audioStatus: audioStatusSchema,
  /** Set when the file arrived through the wizard; ingestion is timed from it. */
  uploadedAt: z.iso.datetime().nullish(),
});

/** What the stores check the cover against. The colours above are what we can render. */
export const artworkFileSchema = z.object({
  name: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const creditsSchema = z.object({
  composer: z.string(),
  producer: z.string(),
  publisher: z.string(),
  pLine: z.string(),
  cLine: z.string(),
});

export const deliverySchema = z.object({
  storeId: z.string(),
  status: deliveryStatusSchema,
  deliveredAt: z.iso.datetime().nullable(),
});

export const releaseSchema = z.object({
  id: z.string(),
  catalogNumber: z.string().regex(/^LOR-\d{4}$/),
  title: z.string(),
  artistId: z.string(),
  artistName: z.string(),
  type: releaseTypeSchema,
  status: releaseStatusSchema,
  releaseDate: z.iso.date(),
  submittedAt: z.iso.datetime().nullable(),
  artwork: artworkSchema,
  streams30d: z.number().int().nonnegative(),
  /** Sixteen days of streams for the catalogue's sparkline. Empty until a release is live. */
  streamsTrend: z.array(z.number().int().nonnegative()),
  deliveries: z.array(deliverySchema),

  // What the wizard fills in and nothing else reads yet. Absent on everything the
  // seed built, which is why they are optional rather than nullable.
  genre: z.string().nullish(),
  credits: creditsSchema.nullish(),
  artworkFile: artworkFileSchema.nullish(),
});

// The write contracts. A handler parses the body through these before it touches
// the write model — the one place the mock is allowed to be strict.

export const draftPatchSchema = z.object({
  title: z.string().max(120).optional(),
  artistId: z.string().optional(),
  type: releaseTypeSchema.optional(),
  releaseDate: z.iso.date().optional(),
  genre: z.string().nullish(),
  credits: creditsSchema.nullish(),
  artwork: artworkSchema.optional(),
  artworkFile: artworkFileSchema.nullish(),
});

export const audioUploadSchema = z.object({
  name: z.string().min(1),
  size: z.number().int().nonnegative(),
});

export const tracklistSchema = z.array(z.object({ id: z.string(), title: z.string() }));

export const activityEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    'domain/releases/submitted',
    'domain/releases/withdrawn',
    'domain/tracks/processed',
  ]),
  at: z.iso.datetime(),
  actor: z.string(),
  summary: z.string(),
  // Denormalised on purpose: a feed row names its release, and a feed that made
  // the client join 40 events against the catalogue would be a slow feed.
  release: z.object({
    id: z.string(),
    catalogNumber: z.string(),
    title: z.string(),
    artwork: artworkSchema,
  }),
});

export const dailyStatSchema = z.object({
  releaseId: z.string(),
  date: z.iso.date(),
  streams: z.number().int().nonnegative(),
  revenue: z.number().nonnegative(),
});

/** One scope, one window, and the window before it — what the analytics screen reads. */
export const analyticsReportSchema = z.object({
  scope: z.string(),
  days: z.number().int().positive(),
  from: z.iso.date(),
  to: z.iso.date(),
  series: z.array(
    z.object({
      date: z.iso.date(),
      streams: z.number().int().nonnegative(),
      revenue: z.number().nonnegative(),
    }),
  ),
  /** Null when the data does not reach back a second window. */
  previous: z
    .object({ streams: z.number().int().nonnegative(), revenue: z.number().nonnegative() })
    .nullable(),
  stores: z.array(
    z.object({
      storeId: z.string(),
      storeName: z.string(),
      streams: z.number().int().nonnegative(),
      previousStreams: z.number().int().nonnegative(),
    }),
  ),
  tracks: z.array(
    z.object({
      trackId: z.string(),
      title: z.string(),
      releaseId: z.string(),
      releaseTitle: z.string(),
      streams: z.number().int().nonnegative(),
      previousStreams: z.number().int().nonnegative(),
    }),
  ),
});

/** Detail carries its tracks; the list doesn't. */
export const releaseDetailSchema = releaseSchema.extend({
  tracks: z.array(trackSchema),
});

export type ReleaseType = z.infer<typeof releaseTypeSchema>;
export type ReleaseStatus = z.infer<typeof releaseStatusSchema>;
export type AudioStatus = z.infer<typeof audioStatusSchema>;
export type DeliveryStatus = z.infer<typeof deliveryStatusSchema>;
export type Artist = z.infer<typeof artistSchema>;
export type Store = z.infer<typeof storeSchema>;
export type ArtworkFile = z.infer<typeof artworkFileSchema>;
export type Credits = z.infer<typeof creditsSchema>;
export type Track = z.infer<typeof trackSchema>;
export type Delivery = z.infer<typeof deliverySchema>;
export type Release = z.infer<typeof releaseSchema>;
export type ReleaseDetail = z.infer<typeof releaseDetailSchema>;
export type ActivityEvent = z.infer<typeof activityEventSchema>;
export type DailyStat = z.infer<typeof dailyStatSchema>;
export type AnalyticsReport = z.infer<typeof analyticsReportSchema>;
