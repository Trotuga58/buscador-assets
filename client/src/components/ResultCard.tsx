import type { Asset } from '../../../shared/types.ts';
import { licenseLabel, previewKind } from '../logic.ts';
import { CopyAttribution } from './CopyAttribution.tsx';
import { Preview } from './Preview.tsx';

interface Props { asset: Asset; favorite?: boolean; onToggleFavorite?: (a: Asset) => void }

export function ResultCard({ asset, favorite = false, onToggleFavorite }: Props) {
  const kind = previewKind(asset);
  const thumb = asset.thumbnailUrl ? (
    <img className="thumb" src={asset.thumbnailUrl} alt={`Miniatura de ${asset.title}`} loading="lazy" />
  ) : (
    <div className="thumb thumb-placeholder" role="img" aria-label="Sin miniatura">Sin miniatura</div>
  );
  return (
    <article className="card" data-type={asset.type}>
      {kind === 'model' || kind === 'image' ? <Preview asset={asset} /> : thumb}
      {kind === 'audio' && <Preview asset={asset} />}
      <h3>{asset.title}</h3>
      <p className="author">de {asset.author} · {asset.sourceName}</p>
      <p>
        <a className="badge" href={asset.licenseUrl || undefined} target="_blank" rel="noreferrer">{licenseLabel(asset.license)}</a>
      </p>
      <p className="actions">
        <a href={asset.sourceUrl} target="_blank" rel="noreferrer">Ir a la fuente</a>
        {asset.downloadUrl && <a href={asset.downloadUrl} target="_blank" rel="noreferrer">Descargar</a>}
        <CopyAttribution text={asset.attributionText} />
        {onToggleFavorite && (
          <button type="button" onClick={() => onToggleFavorite(asset)}>
            {favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          </button>
        )}
      </p>
    </article>
  );
}
