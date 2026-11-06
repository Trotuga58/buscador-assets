import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Asset } from '../../shared/types.ts';
import { isAllowed } from './search.ts';

export interface DownloadResult { folder: string; file: string; bytes: number }
export interface DownloadOptions { fetchFn?: typeof fetch; maxBytes?: number }

const MAX_BYTES = 200 * 1024 * 1024;
const EXT_BY_TYPE: Record<string, string> = {
  'model/gltf-binary': '.glb', 'model/gltf+json': '.gltf', 'application/zip': '.zip', 'audio/mpeg': '.mp3', 'audio/ogg': '.ogg',
  'audio/wav': '.wav', 'image/png': '.png', 'image/jpeg': '.jpg', 'font/ttf': '.ttf', 'font/otf': '.otf', 'font/woff2': '.woff2',
};

const slug = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'asset';

function fileName(url: string, contentType: string | null): string {
  let last = '';
  try { last = decodeURIComponent(new URL(url).pathname.split('/').pop() ?? ''); } catch { /* se queda vacío */ }
  const safe = last.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^\.+/, '').replace(/\.{2,}/g, '.').slice(0, 80);
  if (/\.[A-Za-z0-9]{2,5}$/.test(safe)) return safe;
  const ext = EXT_BY_TYPE[(contentType ?? '').split(';')[0].trim().toLowerCase()] ?? '.bin';
  return (safe || 'archivo') + ext;
}

/** Baja el archivo del asset a `dir/<nombre>-<id>/` y deja un LICENCIA.txt con la atribución. */
export async function downloadAsset(asset: Asset, dir: string, o: DownloadOptions = {}): Promise<DownloadResult> {
  const fetchFn = o.fetchFn ?? fetch;
  const max = o.maxBytes ?? MAX_BYTES;
  if (!asset.downloadUrl) throw new Error('Este asset no tiene descarga directa: hay que bajarlo desde la página de su autor.');
  if (!isAllowed(asset) || !/^https?:\/\//i.test(asset.downloadUrl)) throw new Error('No es un asset permitido (licencia o enlace no válidos).');

  const res = await fetchFn(asset.downloadUrl, { redirect: 'follow' });
  if (!res.ok) throw new Error(`La descarga respondió ${res.status}`);
  const declared = Number(res.headers.get('content-length') ?? 0);
  if (declared > max) throw new Error('El archivo es demasiado grande.');
  const body = new Uint8Array(await res.arrayBuffer());
  if (body.byteLength > max) throw new Error('El archivo es demasiado grande.');

  const folder = join(dir, `${slug(asset.title)}-${createHash('sha1').update(asset.id).digest('hex').slice(0, 8)}`);
  await mkdir(folder, { recursive: true });
  const file = join(folder, fileName(asset.downloadUrl, res.headers.get('content-type')));
  await writeFile(file, body);
  await writeFile(join(folder, 'LICENCIA.txt'), [
    asset.attributionText, '', `Licencia: ${asset.license.toUpperCase()}`, `Texto de la licencia: ${asset.licenseUrl}`, `Fuente: ${asset.sourceUrl}`, '',
  ].join('\n'));
  return { folder, file, bytes: body.byteLength };
}
