import type { Asset } from '../../../shared/types.ts';
import { TYPE_GLYPH, licenseLabel, licenseNote, previewKind } from '../logic.ts';
import { CopyAttribution } from './CopyAttribution.tsx';
import { Preview } from './Preview.tsx';

interface Props { asset: Asset; favorite?: boolean; onToggleFavorite?: (a: Asset) => void }

export function ResultCard({ asset, favorite = false, onToggleFavorite }: Props) {
  const kind = previewKind(asset);
  const thumb = asset.thumbnailUrl ? (
    <img className="thumb" src={asset.thumbnailUrl} alt={`Miniatura de ${asset.title}`} loading="lazy" />
  ) : (
    <div className="thumb thumb-placeholder" role="img" aria-label="Sin miniatura"><span aria-hidden="true">{TYPE_GLYPH[asset.type]}</span></div>
  );
  return (
    <article className="card" data-type={asset.type}>
      <div className="stage">
        {kind === 'model' || kind === 'image' ? <Preview asset={asset} /> : thumb}
        <a className="badge" data-license={asset.license} href={asset.licenseUrl || undefined} target="_blank" rel="noreferrer"
          title={licenseNote(asset.license)}>{licenseLabel(asset.license)}</a>
      </div>
      <div className="card-body">
        <h3>{asset.title}</h3>
        <p className="author">de {asset.author}, en {asset.sourceName}</p>
        {kind === 'audio' && <Preview asset={asset} />}
        <div className="actions">
          {asset.downloadUrl && <a className="btn btn-primary" href={asset.downloadUrl} target="_blank" rel="noreferrer">Descargar</a>}
          <a className="btn" href={asset.sourceUrl} target="_blank" rel="noreferrer">Ir a la fuente</a>
          <CopyAttribution text={asset.attributionText} />
          {onToggleFavorite && (
            <button type="button" className="btn btn-fav" aria-pressed={favorite} onClick={() => onToggleFavorite(asset)}>
              {favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
