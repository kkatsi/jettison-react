// Step 2's one hook (R2). It also owns the one thing in this console the backend
// does without being asked: audio ingestion, watched to completion and announced.

import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router';

import { trackProcessed } from '@shared/events';
import type { Tone } from '@shared/ui';

import { useAddTrackMutation, useDraftQuery, useSaveTracksMutation } from '../../api/endpoints';
import type { AudioStatus, ReleaseDraft } from '../../api/types';
import { AUDIO } from '../../constants';
import {
  audioStatuses,
  isIngesting,
  moveItem,
  newlyReady,
  readyCount,
} from '../../services/tracklist';

/** How often to ask while a file is being ingested. Nothing polls once it is done. */
const POLL_MS = 1200;

/** The same debounce as the rest of the wizard: a sentence is one save. */
const DEBOUNCE_MS = 800;

export type TrackRow = {
  id: string;
  number: string;
  title: string;
  audio: { label: string; tone: Tone; status: AudioStatus };
  duration: string;
  onTitle: (title: string) => void;
  onRemove: () => void;
  isDropTarget: boolean;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDrop: () => void;
};

export type TracksModel = {
  rows: TrackRow[];
  /** '6 tracks · 5 ready'. */
  summary: string;
  isEmpty: boolean;
  isUploading: boolean;
  onFiles: (files: FileList | null) => void;
};

export function useTracksStep(): TracksModel {
  const { id = '' } = useParams();
  const [addTrack, { isLoading: isUploading }] = useAddTrackMutation();
  const [saveTracks] = useSaveTracksMutation();
  const { data: release } = useDraftQuery(id);
  const tracks = release?.tracks ?? [];

  // Ingestion progress is computed when someone reads it, so asking is the only
  // way to watch a file finish. A second subscription to the same query is how
  // this screen asks for that, and only for as long as it can change: RTK polls
  // at the shortest interval any subscriber wants.
  useDraftQuery(id, { pollingInterval: POLL_MS, skip: !isIngesting(tracks) });

  useIngestionAnnouncements(release);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Titles are typed straight into the row, and the tracklist is written as a
  // whole — so what has been typed waits here until the debounce fires.
  const edited = useRef(new Map<string, string>());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const entries = () =>
    tracks.map((track) => ({ id: track.id, title: edited.current.get(track.id) ?? track.title }));

  const write = (next: { id: string; title: string }[]) => void saveTracks({ id, tracks: next });

  return {
    rows: tracks.map((track, index) => ({
      id: track.id,
      number: String(index + 1).padStart(2, '0'),
      title: track.title,
      audio: { ...AUDIO[track.audioStatus], status: track.audioStatus },
      duration: track.duration,

      onTitle: (title) => {
        edited.current.set(track.id, title);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => write(entries()), DEBOUNCE_MS);
      },

      onRemove: () => write(entries().filter((entry) => entry.id !== track.id)),

      isDropTarget: overIndex === index && dragIndex !== index,
      onDragStart: () => setDragIndex(index),
      onDragEnter: () => setOverIndex(index),
      onDrop: () => {
        if (dragIndex !== null) write(moveItem(entries(), dragIndex, index));
        setDragIndex(null);
        setOverIndex(null);
      },
    })),

    summary: `${tracks.length} ${tracks.length === 1 ? 'track' : 'tracks'} · ${readyCount(tracks)} ready`,
    isEmpty: tracks.length === 0,
    isUploading,

    onFiles: (files) => {
      // One at a time: every upload answers with the whole release, and two
      // answers racing would leave the second one's track missing.
      void [...(files ?? [])].reduce<Promise<unknown>>(
        (queue, file) =>
          queue.then(() => addTrack({ id, file: { name: file.name, size: file.size } }).unwrap()),
        Promise.resolve(),
      );
    },
  };
}

/**
 * Ingestion finishing is the backend telling us something nobody asked for, and
 * this screen is the only one watching — so it is the one that announces it
 * (Ch. 4 §5). Catalog patches its own detail cache; activity logs a line.
 */
function useIngestionAnnouncements(release: ReleaseDraft | undefined): void {
  const dispatch = useDispatch();
  const before = useRef<ReadonlyMap<string, AudioStatus>>(new Map());

  useEffect(() => {
    if (!release) return;

    for (const track of newlyReady(before.current, release.tracks)) {
      dispatch(
        trackProcessed({
          actor: 'Audio pipeline',
          trackTitle: track.title,
          release: {
            id: release.id,
            catalogNumber: release.catalogNumber,
            title: release.title,
            artwork: release.artwork,
          },
        }),
      );
    }

    before.current = audioStatuses(release.tracks);
  }, [dispatch, release]);
}
