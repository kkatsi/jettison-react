// The four enforcement sections, to merge into the target repo's oxlint config.
//
//   1+2  layers and module privacy — the local plugin, because no linter ships them
//   3    R1: views render — a .tsx never fetches, dispatches or navigates
//   4    R5: services decide — business logic is React-free and store-free
//
// Every rule ships as `error`. Warnings are wallpaper within a week. In a migration
// nothing needs grandfathering: the plugin classifies by path, so folders that have
// not adopted the layout are unconstrained, and every adopted one is a ratchet.
//
// Merge, do not replace: keep the target repo's existing rules, ignores and plugins.

/** Files whose whole job is to decide something — R5 applies to all of them. */
const SERVICE_FILES = ['**/services/**/*.ts', '**/*-rules.ts', '**/*-eligibility.ts'];

/** R1's one exemption: something has to mount the store and the router. */
const COMPOSITION_ROOT = ['src/main.tsx', 'src/app/providers.tsx'];

export const jettisonEnforcement = {
  jsPlugins: [{ name: 'jettison', specifier: './tools/oxlint/jettison/index.ts' }],

  rules: {
    'jettison/layer-dependencies': 'error',
    'jettison/module-privacy': 'error',
  },

  overrides: [
    // 3. R1 — VIEWS RENDER. A view may import React, styles, design-system and
    // child components, its own colocated hook, and types. Type-only imports stay
    // allowed: a view is welcome to know the shape of its props. It is the runtime
    // reach that is banned. Adjust the package names to the target repo's stack —
    // its store, its router, its HTTP client.
    {
      files: ['**/*.tsx'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'react-redux',
                allowTypeImports: true,
                message: 'R1: a view never touches the store — move it to the colocated hook.',
              },
              {
                name: 'react-router',
                importNames: ['useNavigate'],
                message: 'R1: navigation is a handler — the hook returns it, the view calls it.',
              },
              {
                name: 'axios',
                allowTypeImports: true,
                message: 'R1: a view never speaks HTTP — data arrives through its hook.',
              },
            ],
            patterns: [
              {
                group: ['**/api', '**/api/*', '@core/api', '@core/api/*'],
                allowTypeImports: true,
                message: 'R1: a view never imports endpoints — its colocated hook does.',
              },
              {
                group: ['@app/*'],
                allowTypeImports: true,
                message: 'R1: a view never reaches into the app shell (store, router, providers).',
              },
            ],
          },
        ],
      },
    },

    { files: COMPOSITION_ROOT, rules: { 'no-restricted-imports': 'off' } },

    // 4. R5 — SERVICES DECIDE. Services are where the money-losing bugs live, so
    // they are kept trivially testable: input object in, issue codes out. No mocks,
    // no DOM, nothing to mount.
    {
      files: SERVICE_FILES,
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['react', 'react-*', '@reduxjs/*', 'react-router*'],
                allowTypeImports: true,
                message: 'R5: services are React-free and store-free — plain functions only.',
              },
              {
                group: ['@app/*', '**/api', '**/api/*', '@core/api', '@core/api/*'],
                allowTypeImports: true,
                message:
                  'R5: a service decides, it does not fetch — pass the data in as arguments.',
              },
            ],
          },
        ],
      },
    },
  ],
} as const;
