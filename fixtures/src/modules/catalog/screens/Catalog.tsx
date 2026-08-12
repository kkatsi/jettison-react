// COMPLIANT — the view renders: design system, child components, its own hook.
import { Button } from '@shared/ui';

import { useCatalog } from './useCatalog';

export function Catalog() {
  const { releases, onRefresh } = useCatalog();

  return (
    <section>
      <Button onClick={onRefresh}>Refresh</Button>
      <ul>
        {releases.map((release) => (
          <li key={release}>{release}</li>
        ))}
      </ul>
    </section>
  );
}
