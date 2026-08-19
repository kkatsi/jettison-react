import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const origin = `http://localhost:${PORT}`;

// The browser proof. Vitest owns the decisions; these specs own what only a hand
// finds — a popup that shuts on release, a patch that outlives its own refetch.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),

  // No retries: the read-model lag is real time, so a race that passes on the second
  // run is a finding, not a flake.
  retries: 0,

  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  use: {
    baseURL: origin,
    ...devices['Desktop Chrome'],
    // The console is desktop-first, and the designs are drawn at this width.
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },

  // ponytail: chromium only. The claims here are about this app, not about engine
  // differences, and a service-worker backend is flakiest where it proves least.
  projects: [{ name: 'chromium' }],

  webServer: {
    // The built artifact, not the dev server — what ships is what is worth driving.
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: origin,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
