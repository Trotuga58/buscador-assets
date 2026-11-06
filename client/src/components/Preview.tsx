import type { Asset } from '../../../shared/types.ts';
import { previewKind } from '../logic.ts';

export function Preview({ asset }: { asset: Asset }) {
  const kind = previewKind(asset);
  if (kind === 'model') return <model-viewer className="thumb" src={asset.previewUrl!} alt={`Modelo 3D: ${asset.title}`} camera-controls />;
  if (kind === 'audio') return <audio controls preload="none" src={asset.previewUrl!} aria-label={`Escuchar ${asset.title}`} />;
  if (kind === 'image') return <img className="thumb" src={asset.previewUrl!} alt={asset.title} loading="lazy" />;
  return null;
}
