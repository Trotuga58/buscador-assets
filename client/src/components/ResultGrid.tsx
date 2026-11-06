import type { Asset } from '../../../shared/types.ts';
import { EMPTY_MESSAGE } from '../logic.ts';
import { ResultCard } from './ResultCard.tsx';

interface Props {
  results: Asset[]; searched: boolean; favoriteIds?: Set<string>; onToggleFavorite?: (a: Asset) => void; emptyMessage?: string;
}

export function ResultGrid({ results, searched, favoriteIds, onToggleFavorite, emptyMessage = EMPTY_MESSAGE }: Props) {
  if (searched && results.length === 0) return <p className="empty">{emptyMessage}</p>;
  return (
    <div className="grid">
      {results.map((a) => (
        <ResultCard key={a.id} asset={a} favorite={favoriteIds?.has(a.id) ?? false} onToggleFavorite={onToggleFavorite} />
      ))}
    </div>
  );
}
