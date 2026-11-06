import type { Asset } from '../../../shared/types.ts';
import { ResultGrid } from './ResultGrid.tsx';

export function Favorites({ items, onOpen }: { items: Asset[]; onOpen: (a: Asset) => void }) {
  return (
    <section aria-label="Favoritos">
      <h2>Favoritos</h2>
      <ResultGrid results={items} searched onOpen={onOpen}
        emptyMessage="Aún no has guardado ningún favorito." />
    </section>
  );
}
