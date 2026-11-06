import type { Asset } from '../../../shared/types.ts';
import { EMPTY_MESSAGE } from '../logic.ts';
import { ResultCard } from './ResultCard.tsx';

export function ResultGrid({ results, searched }: { results: Asset[]; searched: boolean }) {
  if (searched && results.length === 0) return <p className="empty">{EMPTY_MESSAGE}</p>;
  return <div className="grid">{results.map((a) => <ResultCard key={a.id} asset={a} />)}</div>;
}
