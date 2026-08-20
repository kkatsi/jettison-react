// The jettison test's other half. `rm -rf src/modules/<name>` throws the module
// overboard; this strips the lines in the app shell that referenced it.
//
//   node scripts/unregister-module.mjs activity
//
// Two rules, both mechanical — which is the point. If unregistering a module ever
// needs judgement, the module was not jettisonable:
//
//   1. any line importing from `@modules/<name>`
//   2. inside a `// jettison:<thing>:start/end` region, any line naming the module
//
// Everything else in the shell is untouched, so a failing type-check after this
// script means a real dependency on the ejected module — exactly what we test for.

import { readFileSync, writeFileSync } from 'node:fs';

/** The files that are allowed to know a module exists. */
const SHELL_FILES = ['src/app/store.ts', 'src/app/routes.tsx', 'src/app/navigation.ts'];

const MARKER = /^\s*\/\/ jettison:(\w+):(start|end)\b/;

const name = process.argv[2];
// Kebab-case, because that is what a module folder is called — and because every
// pattern below is built from this string, so anything else would be a regex.
if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error('usage: node scripts/unregister-module.mjs <module-name>');
  process.exit(1);
}

const camel = name.replace(/-(\w)/g, (_, letter) => letter.toUpperCase());
const pascal = camel[0].toUpperCase() + camel.slice(1);

/** The import path, which is exact: `@modules/activity` must not match `@modules/activity-log`. */
const importPath = new RegExp(`@modules/${name}(?![\\w-])`);

/** How else the shell spells this module: route spread, reactions call, slice key. Substrings
    on purpose — the shell says `activityRoutes` and `registerActivityReactions`, so a whole-word
    match would strip neither. Loose is safe only because it applies inside a marker region: four
    hand-written lines where a collision with another module's name is visible on sight. */
const mentions = [camel, pascal, `'${name}'`];

let removed = 0;

for (const file of SHELL_FILES) {
  const lines = readFileSync(file, 'utf8').split('\n');
  let insideRegion = false;

  const kept = lines.filter((line) => {
    const marker = MARKER.exec(line);
    if (marker) {
      insideRegion = marker[2] === 'start';
      return true;
    }

    const registers =
      importPath.test(line) || (insideRegion && mentions.some((mention) => line.includes(mention)));

    if (registers) removed += 1;
    return !registers;
  });

  if (kept.length !== lines.length) writeFileSync(file, kept.join('\n'));
}

// A module that was never registered is a silent pass, and a silent pass is a
// green CI job that tested nothing.
if (removed === 0) {
  console.error(`unregister-module: nothing referenced '${name}' in the app shell`);
  process.exit(1);
}

console.log(`unregister-module: dropped ${removed} line(s) referencing '${name}'`);
