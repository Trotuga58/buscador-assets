import type { AssetType } from '../../../shared/types.ts';
import { externalLinks } from '../logic.ts';

export function ExternalSearch({ query, type }: { query: string; type: AssetType | 'all' }) {
  const links = externalLinks(query, type);
  if (links.length === 0) return null;
  return (
    <aside className="external" aria-label="Buscar también en otras webs">
      <p>Buscar también en otras webs (revisa allí la licencia de cada recurso):</p>
      <ul>
        {links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noreferrer">{l.label}</a></li>)}
      </ul>
    </aside>
  );
}
