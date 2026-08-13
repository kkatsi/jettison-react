// Server response → UI shape, and nothing else (Ch. 4 §1). The boundary where
// the backend's shape stops mattering — which is why it is tested first.

import type {
  DeliveryDto,
  Release,
  ReleaseDetail,
  ReleaseDetailDto,
  ReleaseDto,
  StoreDelivery,
  StoreDto,
  Track,
  TrackDto,
} from './types';

/** Nothing to show. Not '0' — a release with no streams hasn't earned a zero. */
const NONE = '—';

export function toRelease(dto: ReleaseDto): Release {
  return {
    id: dto.id,
    catalogNumber: dto.catalogNumber,
    title: dto.title,
    artistId: dto.artistId,
    artistName: dto.artistName,
    type: dto.type,
    status: dto.status,
    releaseDate: dto.releaseDate,
    submittedAt: dto.submittedAt,
    submittedLabel: formatTimestamp(dto.submittedAt),
    artwork: dto.artwork,
    streamsLabel: formatStreams(dto.streams30d),
    streams30d: dto.streams30d,
    streamsTrend: dto.streamsTrend,
    deliveries: dto.deliveries,
  };
}

export function toReleaseDetail(dto: ReleaseDetailDto): ReleaseDetail {
  return {
    ...toRelease(dto),
    tracks: [...dto.tracks].sort((a, b) => a.number - b.number).map(toTrack),
  };
}

export function toTrack(dto: TrackDto): Track {
  return {
    id: dto.id,
    number: dto.number,
    title: dto.title,
    duration: formatDuration(dto.durationMs),
    isrc: dto.isrc,
    audioStatus: dto.audioStatus,
  };
}

/**
 * The join the detail screen needs: deliveries are keyed by store, the panel
 * lists stores. A store the release was never sent to still gets a row — the
 * label needs to see the gap, not have it hidden by an inner join.
 */
export function toStoreDeliveries(
  deliveries: readonly DeliveryDto[],
  stores: readonly StoreDto[],
): StoreDelivery[] {
  return stores.map((store) => {
    const delivery = deliveries.find((candidate) => candidate.storeId === store.id);

    return {
      storeId: store.id,
      storeName: store.name,
      status: delivery?.status ?? 'pending',
      deliveredLabel: formatTimestamp(delivery?.deliveredAt ?? null),
    };
  });
}

/** Millions to two decimals, thousands whole — the range a label reads at a glance. */
export function formatStreams(streams: number): string {
  if (streams <= 0) return NONE;
  if (streams >= 1_000_000) return `${(streams / 1_000_000).toFixed(2)}M`;
  if (streams >= 1000) return `${Math.round(streams / 1000)}K`;
  return String(streams);
}

/** UTC, like every timestamp the console shows — a label delivers across time zones. */
export function formatTimestamp(iso: string | null): string {
  if (!iso) return NONE;
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

export function formatDuration(durationMs: number): string {
  const seconds = Math.round(durationMs / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
