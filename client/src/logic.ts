import type { AssetType, License, SourceStatus } from '../../shared/types.ts';

export const TABS: Array<{ type: AssetType | 'all'; label: string }> = [
  { type: 'all', label: 'Todo' },
  { type: 'sprite', label: '2D' },
  { type: 'model3d', label: '3D' },
  { type: 'audio', label: 'Audio' },
  { type: 'code', label: 'Código' },
];

const LICENSE_LABEL: Record<License, string> = { cc0: 'CC0', 'cc-by': 'CC BY', ofl: 'OFL', 'apache-2.0': 'Apache 2.0' };
export const licenseLabel = (l: License): string => LICENSE_LABEL[l];

/** Mensaje en español para una fuente que no respondió; null si fue bien. */
export function sourceMessage(s: SourceStatus): string | null {
  if (s.ok) return null;
  if (s.error === 'sin-configurar') return `${s.source}: sin configurar (pon su clave en Ajustes)`;
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

const LICENSE_NOTE: Record<License, string> = {
  cc0: 'Dominio público: uso libre, sin obligación de atribuir',
  'cc-by': 'Uso libre, incluso comercial, pero hay que atribuir al autor',
  ofl: 'Fuente libre (SIL OFL): se puede usar en proyectos comerciales',
  'apache-2.0': 'Licencia Apache 2.0: uso libre, conserva el aviso de licencia',
};
export const licenseNote = (l: License): string => LICENSE_NOTE[l];

export const EXAMPLES = ['personajes pixel art', 'mazmorra', 'plataformas', 'espada', 'música épica'];

/** Pictograma que ocupa el lugar de la miniatura cuando la fuente no la da. */
export const TYPE_GLYPH: Record<AssetType, string> = { model3d: '3D', sprite: '2D', audio: '♪', font: 'Aa', code: '</>' };

export const DEFAULT_TYPE: AssetType | 'all' = 'sprite';

/** Atajos del 2D: pixel art para juegos tipo plataformas o RPG. */
export const SPRITE_FILTERS: Array<{ label: string; query: string }> = [
  { label: 'Personajes', query: 'personajes pixel art' },
  { label: 'Enemigos', query: 'enemigos pixel art' },
  { label: 'Tilesets', query: 'tileset pixel art' },
  { label: 'Interfaz', query: 'interfaz botones' },
  { label: 'Fondos', query: 'fondos pixel art' },
  { label: 'Efectos', query: 'efectos particulas' },
];

/** La búsqueda se lanza sola al escribir, pero no con 0 o 1 letra. */
export function canSearchWhileTyping(q: string): boolean { return q.trim().length >= 2; }

/** Bloque para pegar en la configuración de Claude Desktop. Sin ruta real (modo desarrollo) usa una de ejemplo. */
export function connectConfig(command: string | null): string {
  return JSON.stringify({ mcpServers: { 'buscador-assets': { command: command ?? 'C:\\RUTA\\Buscador-de-assets.exe', args: ['--mcp'] } } }, null, 2);
}
