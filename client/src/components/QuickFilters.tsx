import { SPRITE_FILTERS } from '../logic.ts';

export function QuickFilters({ onPick }: { onPick: (query: string) => void }) {
  return (
    <ul className="chips quick" aria-label="Atajos de 2D">
      {SPRITE_FILTERS.map((f) => (
        <li key={f.label}><button type="button" onClick={() => onPick(f.query)}>{f.label}</button></li>
      ))}
    </ul>
  );
}
