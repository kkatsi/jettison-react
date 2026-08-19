// A config that matches nothing is indistinguishable from one that is satisfied.
// This suite runs the real oxlint.config.ts against files that break each rule
// group on purpose, and fails if a rule stops firing.
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { beforeAll, describe, expect, it } from 'vitest';

const run = promisify(execFile);

const fixturesDirectory = fileURLToPath(new URL('.', import.meta.url));
const oxlint = fileURLToPath(new URL('../node_modules/.bin/oxlint', import.meta.url));

const LAYERS = 'jettison(layer-dependencies)';
const PRIVACY = 'jettison(module-privacy)';
const RESTRICTED = 'eslint(no-restricted-imports)';
const a11y = (rule: string) => `jsx-a11y(${rule})`;
const A11Y_VIEW = 'src/modules/catalog/violations/InaccessibleView.tsx';

/** Every violation fixture, with the rule that must fire on it. */
const VIOLATIONS: { file: string; rule: string; count?: number }[] = [
  { file: 'src/core/violations/imports-shared.ts', rule: LAYERS },
  { file: 'src/shared/violations/imports-module.ts', rule: LAYERS },
  { file: 'src/modules/catalog/violations/imports-sibling-module.ts', rule: LAYERS },
  { file: 'src/app/violations/deep-module-import.ts', rule: PRIVACY },
  { file: 'src/modules/catalog/violations/BadView.tsx', rule: RESTRICTED, count: 3 },
  { file: 'src/modules/catalog/services/violations/bad-service.ts', rule: RESTRICTED, count: 2 },
  // One file, four rules: the a11y set is only worth listing if it still fires.
  { file: A11Y_VIEW, rule: a11y('alt-text') },
  { file: A11Y_VIEW, rule: a11y('click-events-have-key-events') },
  { file: A11Y_VIEW, rule: a11y('no-static-element-interactions') },
  { file: A11Y_VIEW, rule: a11y('anchor-is-valid') },
];

/** Files that follow the architecture and must lint clean. */
const COMPLIANT = [
  'src/app/router.ts',
  'src/modules/catalog/screens/Catalog.tsx',
  'src/modules/catalog/screens/useCatalog.ts',
  'src/modules/catalog/services/release-status.ts',
  'src/modules/release-editor/services/release-eligibility.ts',
];

type Diagnostic = { code: string; filename: string };

/** Rules that fired, per fixture file. One lint run for the whole suite. */
const fired = new Map<string, string[]>();

// `--no-ignore` so the fixtures are linted even though the repo's own lint script
// skips them; cwd is fixtures/ so the plugin classifies `src/…` here exactly as it
// does in the app.
beforeAll(async () => {
  // Reports something, so a non-zero exit is the expected path. Config failures
  // land on stdout too (an unreadable config, or a Node too old to load a TS one),
  // so anything that is not JSON is a real failure worth printing whole.
  const { stdout } = await run(
    oxlint,
    ['--config', '../oxlint.config.ts', '--no-ignore', '--format=json', 'src'],
    { cwd: fixturesDirectory },
  ).catch((error: { stdout?: string }) => error);

  if (stdout === undefined || !stdout.startsWith('{')) {
    throw new Error(`oxlint did not report:\n${stdout ?? '(no output)'}`);
  }

  const report: { diagnostics: Diagnostic[] } = JSON.parse(stdout);

  for (const file of [...VIOLATIONS.map((entry) => entry.file), ...COMPLIANT]) fired.set(file, []);
  for (const diagnostic of report.diagnostics) {
    fired.get(diagnostic.filename)?.push(diagnostic.code);
  }
});

describe('the enforcement fires', () => {
  it.each(VIOLATIONS)('$file violates $rule', ({ file, rule, count }) => {
    const rules = fired.get(file);
    expect(rules).toContain(rule);
    if (count !== undefined) {
      expect(rules?.filter((code) => code === rule)).toHaveLength(count);
    }
  });
});

describe('the enforcement stays out of the way', () => {
  it.each(COMPLIANT)('%s lints clean', (file) => {
    expect(fired.get(file)).toEqual([]);
  });
});
