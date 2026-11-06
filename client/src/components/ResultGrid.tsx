import type { Asset } from '../../../shared/types.ts';
import { EMPTY_MESSAGE } from '../logic.ts';
import { AssetTile } from './AssetTile.tsx';

interface Props {
  results: Asset[]; searched: boolean; onOpen?: (a: Asset) => void; emptyMessage?: string;
  /** Se conservan por compatibilidad con quien los pase; el detalle es quien los usa. */
  favoriteIds?: Set<string>; onToggleFavorite?: (a: Asset) => void;
}

export function ResultGrid({ results, searched, onOpen, emptyMessage = EMPTY_MESSAGE }: Props) {
  if (searched && results.length === 0) return <p className="empty">{emptyMessage}</p>;
  return (
    <div className="grid">
      {results.map((a) => <AssetTile key={a.id} asset={a} onOpen={onOpen ?? (() => {})} />)}
    </div>
  );
}
