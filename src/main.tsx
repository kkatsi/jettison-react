import { createRoot } from 'react-dom/client';

import '@shared/ui/theme.css';
import { Button, EmptyState, Panel } from '@shared/ui';

// Slice 2a: the theme and the kit, on screen. The app shell (store, router,
// providers, layout) replaces this render in slice 2c.
const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from index.html');

createRoot(root).render(
  <div className="flex h-full items-center justify-center p-8">
    <Panel padding="flush" className="flex h-100 w-full max-w-200 flex-col">
      <EmptyState
        title="Nothing in the pipeline"
        description="Releases appear here once submitted for distribution. Nothing is currently on its way to stores."
        actions={
          <>
            <Button>New release</Button>
            <Button variant="secondary">View catalog</Button>
          </>
        }
        footnote="3 drafts waiting in Catalog"
      />
    </Panel>
  </div>,
);
