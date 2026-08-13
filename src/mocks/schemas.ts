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
});

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
export type Track = z.infer<typeof trackSchema>;
export type Delivery = z.infer<typeof deliverySchema>;
export type Release = z.infer<typeof releaseSchema>;
export type ReleaseDetail = z.infer<typeof releaseDetailSchema>;
export type ActivityEvent = z.infer<typeof activityEventSchema>;
export type DailyStat = z.infer<typeof dailyStatSchema>;
