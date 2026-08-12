// A boundaries config that matches nothing is indistinguishable from one that
// is satisfied. This suite runs the real eslint.config.js against files that
// break each rule group on purpose, and fails if a rule stops firing.
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const fixturesDir = fileURLToPath(new URL('.', import.meta.url));
const configFile = fileURLToPath(new URL('../eslint.config.js', import.meta.url));

const BOUNDARIES = 'boundaries/dependencies';
const RESTRICTED = '@typescript-eslint/no-restricted-imports';

/** Every violation fixture, with the rule that must fire on it. */
const VIOLATIONS: Array<{ file: string; rule: string; count?: number }> = [
  { file: 'src/core/violations/imports-shared.ts', rule: BOUNDARIES },
  { file: 'src/shared/violations/imports-module.ts', rule: BOUNDARIES },
  { file: 'src/modules/catalog/violations/imports-sibling-module.ts', rule: BOUNDARIES },
  { file: 'src/app/violations/deep-module-import.ts', rule: BOUNDARIES },
  { file: 'src/modules/catalog/violations/BadView.tsx', rule: RESTRICTED, count: 3 },
  { file: 'src/modules/catalog/services/violations/bad-service.ts', rule: RESTRICTED, count: 2 },
];

/** Files that follow the architecture and must lint clean. */
const COMPLIANT = [
  'src/app/router.ts',
  'src/modules/catalog/screens/Catalog.tsx',
  'src/modules/catalog/screens/useCatalog.ts',
  'src/modules/catalog/services/release-status.ts',
  'src/modules/release-editor/services/release-eligibility.ts',
];

// `ignore: false` so the fixtures are linted even though the repo's own lint
// script skips them; cwd is fixtures/ so element patterns match `src/…` here
// exactly as they do in the app.
const eslint = new ESLint({ cwd: fixturesDir, overrideConfigFile: configFile, ignore: false });

async function rulesFiredIn(file: string): Promise<string[]> {
  const [result] = await eslint.lintFiles([file]);
  if (!result) throw new Error(`ESLint returned no result for ${file}`);
  return result.messages.map((message) => message.ruleId ?? 'fatal');
}

describe('the enforcement fires', () => {
  it.each(VIOLATIONS)('$file violates $rule', async ({ file, rule, count }) => {
    const fired = await rulesFiredIn(file);
    expect(fired).toContain(rule);
    if (count !== undefined) {
      expect(fired.filter((id) => id === rule)).toHaveLength(count);
    }
  });
});

describe('the enforcement stays out of the way', () => {
  it.each(COMPLIANT)('%s lints clean', async (file) => {
    expect(await rulesFiredIn(file)).toEqual([]);
  });
});
