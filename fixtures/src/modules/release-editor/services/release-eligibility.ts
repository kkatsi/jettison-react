// COMPLIANT — the worked example: input object in, issue codes out.
export type ReleaseDraft = { artworkUrl: string | null; tracksProcessing: number };

export function releaseIssues(draft: ReleaseDraft): string[] {
  const issues: string[] = [];
  if (!draft.artworkUrl) issues.push('artwork-missing');
  if (draft.tracksProcessing > 0) issues.push('audio-still-processing');
  return issues;
}
