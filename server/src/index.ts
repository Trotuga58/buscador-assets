import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { pathToFileURL } from 'node:url';
import type { Adapter, AssetType } from '../../shared/types.ts';
import { createCache } from './cache.ts';
import { runSearch } from './search.ts';
import { allAdapters } from './adapters/index.ts';
import { createFavorites } from './favorites.ts';
import { join } from 'node:path';
import type { Asset } from '../../shared/types.ts';

export interface ServerDeps {
  adapters: Adapter[];
  env: Record<string, string | undefined>;
  cacheDir: string;
  favoritesFile?: string;
}

const TYPES: Array<AssetType | 'all'> = ['all', 'model3d', 'sprite', 'audio', 'font', 'code'];
export const DAY_MS = 24 * 60 * 60 * 1000;

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage, max = 200_000): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => { size += c.length; if (size > max) { reject(new Error('demasiado grande')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export function buildServer(deps: ServerDeps): Server {
  const cache = createCache(deps.cacheDir, DAY_MS);
  const favorites = createFavorites(deps.favoritesFile ?? join(deps.cacheDir, 'favorites.json'));

  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/api/health') return sendJson(res, 200, { ok: true });

      if (req.method === 'GET' && url.pathname === '/api/search') {
        const q = url.searchParams.get('q');
        const type = (url.searchParams.get('type') ?? 'all') as AssetType | 'all';
        if (q === null) return sendJson(res, 400, { error: 'Falta el texto de búsqueda (q).' });
        if (!TYPES.includes(type)) return sendJson(res, 400, { error: `Tipo no válido. Usa: ${TYPES.join(', ')}.` });
        const out = await runSearch(deps.adapters, q, type, { cache, env: deps.env, timeoutMs: 8000 });
        return sendJson(res, 200, out);
      }

      if (url.pathname === '/api/favorites' && req.method === 'GET') return sendJson(res, 200, await favorites.list());

      if (url.pathname === '/api/favorites' && req.method === 'POST') {
        let asset: Asset;
        try { asset = JSON.parse(await readBody(req)) as Asset; } catch { return sendJson(res, 400, { error: 'El cuerpo no es JSON válido.' }); }
        if (!asset || typeof asset.id !== 'string' || typeof asset.title !== 'string' || typeof asset.sourceUrl !== 'string') {
          return sendJson(res, 400, { error: 'Falta información del asset (id, title, sourceUrl).' });
        }
        await favorites.add(asset);
        return sendJson(res, 200, { ok: true });
      }

      if (url.pathname.startsWith('/api/favorites/') && req.method === 'DELETE') {
        await favorites.remove(decodeURIComponent(url.pathname.slice('/api/favorites/'.length)));
        return sendJson(res, 200, { ok: true });
      }

      sendJson(res, 404, { error: 'No encontrado.' });
    } catch {
      sendJson(res, 500, { error: 'Error interno del servidor.' });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.loadEnvFile('.env'); } catch { /* sin .env: las fuentes con clave aparecerán como sin configurar */ }
  const server = buildServer({
    adapters: allAdapters, env: process.env, cacheDir: 'server/.cache', favoritesFile: 'server/.cache/favorites.json',
  });
  server.listen(3001, '127.0.0.1', () => console.log('Servidor en http://127.0.0.1:3001'));
}
