import type { AssetType, License, SourceStatus } from '../../shared/types.ts';

export const TABS: Array<{ type: AssetType | 'all'; label: string }> = [
  { type: 'all', label: 'Todo' },
  { type: 'model3d', label: '3D' },
  { type: 'sprite', label: '2D' },
  { type: 'audio', label: 'Audio' },
  { type: 'font', label: 'Fuentes' },
  { type: 'code', label: 'Código' },
];

const LICENSE_LABEL: Record<License, string> = { cc0: 'CC0', 'cc-by': 'CC BY', ofl: 'OFL', 'apache-2.0': 'Apache 2.0' };
export const licenseLabel = (l: License): string => LICENSE_LABEL[l];

/** Mensaje en español para una fuente que no respondió; null si fue bien. */
export function sourceMessage(s: SourceStatus): string | null {
  if (s.ok) return null;
  if (s.error === 'sin-configurar') return `${s.source}: sin configurar (falta su clave en el archivo .env)`;
  if (s.error === 'timeout') return `${s.source} tardó demasiado en responder`;
  return `${s.source} no respondió`;
}

export const EMPTY_MESSAGE = 'No se encontró nada con licencia libre. Prueba con otras palabras o con otra pestaña.';

import type { Asset } from '../../shared/types.ts';

export type PreviewKind = 'model' | 'audio' | 'image' | null;

export function previewKind(a: Asset): PreviewKind {
  if (!a.previewUrl) return null;
  if (a.type === 'model3d') return 'model';
  if (a.type === 'audio') return 'audio';
  if (a.type === 'sprite') return 'image';
  return null;
}

export async function copyAttribution(text: string, clipboard: { writeText(t: string): Promise<void> } | undefined): Promise<boolean> {
  if (!clipboard) return false;
  try { await clipboard.writeText(text); return true; } catch { return false; }
}

export const KEY_HELP: Array<{ name: string; label: string; url: string }> = [
  { name: 'FREESOUND_API_KEY', label: 'Freesound (sonidos y música)', url: 'https://freesound.org/apiv2/apply' },
  { name: 'POLYPIZZA_API_KEY', label: 'Poly Pizza (modelos 3D)', url: 'https://poly.pizza' },
  { name: 'SKETCHFAB_API_KEY', label: 'Sketchfab (modelos 3D)', url: 'https://sketchfab.com/settings/password' },
  { name: 'GOOGLE_FONTS_API_KEY', label: 'Google Fonts (fuentes)', url: 'https://developers.google.com/fonts/docs/developer_api' },
];

/** Webs que no podemos consultar con garantías: se abren aparte y se revisa la licencia allí. */
export function externalLinks(query: string, type: AssetType | 'all'): Array<{ label: string; url: string }> {
  const q = encodeURIComponent(query.trim());
  if (!query.trim()) return [];
  const oga = (artType: number, label: string) => ({
    label: `OpenGameArt: ${label}`,
    url: `https://opengameart.org/art-search-advanced?keys=${q}&field_art_type_tid%5B%5D=${artType}&sort_by=count&sort_order=DESC`,
  });
  const itch = { label: 'itch.io: assets gratis para juegos', url: `https://itch.io/game-assets/free?q=${q}` };
  if (type === 'sprite') return [oga(9, 'arte 2D'), itch];
  if (type === 'model3d') return [oga(10, 'arte 3D'), itch];
  if (type === 'audio') return [oga(12, 'música'), oga(13, 'efectos de sonido')];
  if (type === 'all') return [oga(9, '2D'), oga(10, '3D'), itch];
  return [];
}
