import { useEffect } from 'react';
import type { Asset } from '../../../shared/types.ts';
import { ResultCard } from './ResultCard.tsx';

interface Props { asset: Asset; onClose: () => void; favorite?: boolean; onToggleFavorite?: (a: Asset) => void }

/** Detalle de un asset en una ventana: vista previa grande, descarga, fuente y atribución. */
export function AssetDialog({ asset, onClose, favorite, onToggleFavorite }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={asset.title}>
        <button type="button" className="btn dialog-close" onClick={onClose} autoFocus>Cerrar</button>
        <ResultCard asset={asset} favorite={favorite} onToggleFavorite={onToggleFavorite} />
      </div>
    </div>
  );
}
