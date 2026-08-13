import { describe, expect, it } from 'vitest';

import { adjacentSteps, isStepSlug, railSteps, stepCounter } from './wizard-steps';

describe('railSteps', () => {
  it('splits the rail into behind, here and ahead', () => {
    expect(railSteps('artwork').map((step) => step.status)).toEqual([
      'done',
      'done',
      'current',
      'ahead',
    ]);
  });

  it('ticks the steps the wizard has moved past', () => {
    expect(railSteps('artwork').map((step) => step.number)).toEqual(['✓', '✓', '3', '4']);
  });

  it('marks the last step, because the connecting line stops there', () => {
    expect(railSteps('details').filter((step) => step.isLast)).toHaveLength(1);
  });
});

describe('adjacentSteps', () => {
  it('has nothing before the first step or after the last', () => {
    expect(adjacentSteps('details').previous).toBeNull();
    expect(adjacentSteps('review').next).toBeNull();
  });

  it('walks the order the label fills a release in', () => {
    expect(adjacentSteps('tracks')).toEqual({ previous: 'details', next: 'artwork' });
  });
});

describe('the rest', () => {
  it('counts the step for the footer', () => {
    expect(stepCounter('tracks')).toBe('2 of 4');
  });

  it('refuses a URL segment that is not a step', () => {
    expect(isStepSlug('details')).toBe(true);
    expect(isStepSlug('mastering')).toBe(false);
  });
});
