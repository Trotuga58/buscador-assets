import type { Asset } from '../../../shared/types.ts';
import { ResultGrid } from './ResultGrid.tsx';

export function Favorites({ items, onToggle }: { items: Asset[]; onToggle: (a: Asset) => void }) {
  return (
    <section aria-label="Favoritos">
      <h2>Favoritos</h2>
      <ResultGrid results={items} searched favoriteIds={new Set(items.map((i) => i.id))} onToggleFavorite={onToggle}
        emptyMessage="Aún no has guardado ningún favorito." />
    </section>
  );
}
