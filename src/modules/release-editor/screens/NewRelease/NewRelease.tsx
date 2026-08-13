import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  ScreenFallback,
} from '@shared/ui';

import { useNewRelease } from './useNewRelease';

// On screen for as long as it takes the label to issue a catalogue number.
export function NewRelease() {
  const { failure } = useNewRelease();

  if (!failure) return <ScreenFallback />;

  return (
    <Empty className="flex-1">
      <EmptyHeader>
        <EmptyTitle className="text-lg">The draft could not be started</EmptyTitle>
        <EmptyDescription>
          Nothing was created, so nothing is half-made — the catalogue number is still the label's
          to issue.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={failure.onRetry}>Try again</Button>
      </EmptyContent>
    </Empty>
  );
}
