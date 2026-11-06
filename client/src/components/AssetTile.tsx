import type { Asset } from '../../../shared/types.ts';
import { TYPE_GLYPH, licenseLabel, licenseNote } from '../logic.ts';

interface Props { asset: Asset; onOpen: (a: Asset) => void }

/** Ficha de la rejilla: solo miniatura, título y licencia. El detalle (visor, descarga…) se abre al pulsar. */
export function AssetTile({ asset, onOpen }: Props) {
  return (
    <button type="button" className="tile" aria-haspopup="dialog" onClick={() => onOpen(asset)}>
      <span className="stage">
        {asset.thumbnailUrl ? (
          <img className="thumb" src={asset.thumbnailUrl} alt={`Miniatura de ${asset.title}`} loading="lazy" />
        ) : (
          <span className="thumb thumb-placeholder" role="img" aria-label="Sin miniatura"><span aria-hidden="true">{TYPE_GLYPH[asset.type]}</span></span>
        )}
        <span className="badge" data-license={asset.license} title={licenseNote(asset.license)}>{licenseLabel(asset.license)}</span>
      </span>
      <span className="tile-body">
        <strong>{asset.title}</strong>
        <span className="author">de {asset.author}, en {asset.sourceName}</span>
      </span>
    </button>
  );
}
