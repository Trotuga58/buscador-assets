import type { Asset } from '../../../shared/types.ts';
import { licenseLabel } from '../logic.ts';

export function ResultCard({ asset }: { asset: Asset }) {
  return (
    <article className="card" data-type={asset.type}>
      {asset.thumbnailUrl ? (
        <img className="thumb" src={asset.thumbnailUrl} alt={`Miniatura de ${asset.title}`} loading="lazy" />
      ) : (
        <div className="thumb thumb-placeholder" role="img" aria-label="Sin miniatura">Sin miniatura</div>
      )}
      <h3>{asset.title}</h3>
      <p className="author">de {asset.author} · {asset.sourceName}</p>
      <p>
        <a className="badge" href={asset.licenseUrl || undefined} target="_blank" rel="noreferrer">{licenseLabel(asset.license)}</a>
      </p>
      <p><a href={asset.sourceUrl} target="_blank" rel="noreferrer">Ir a la fuente</a></p>
    </article>
  );
}
