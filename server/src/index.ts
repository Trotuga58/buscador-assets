import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { Adapter, AssetType } from '../../shared/types.ts';
import { createCache } from './cache.ts';
import { isAllowed, runSearch } from './search.ts';
import { allAdapters } from './adapters/index.ts';
import { createFavorites } from './favorites.ts';
import { join, normalize, extname, sep, resolve } from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { createSettings } from './settings.ts';
import type { Asset } from '../../shared/types.ts';

export interface ServerDeps {
  adapters: Adapter[];
  env: Record<string, string | undefined>;
  cacheDir: string;
  favoritesFile?: string;
  settingsFile?: string;
  staticDir?: string;
}

const TYPES: Array<AssetType | 'all'> = ['all', 'model3d', 'sprite', 'audio', 'font', 'code'];
export const DAY_MS = 24 * 60 * 60 * 1000;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.map': 'application/json',
};

async function serveStatic(root: string, pathname: string, res: ServerResponse): Promise<boolean> {
  let rel: string;
  try { rel = decodeURIComponent(pathname); } catch { return false; }
  const base = resolve(root);
  const target = resolve(base, '.' + normalize('/' + rel));
  if (target !== base && !target.startsWith(base + sep)) return false;
  let file = target;
  try {
    if (!(await stat(file)).isFile()) throw new Error();
  } catch {
    if (extname(rel)) return false;
    file = join(base, 'index.html');
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream' });
    res.end(body);
    return true;
  } catch { return false; }
}

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
  const settings = createSettings(deps.settingsFile ?? join(deps.cacheDir, 'settings.json'), deps.env);
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
        if (!(req.headers['content-type'] ?? '').startsWith('application/json')) {
          return sendJson(res, 415, { error: 'El contenido debe enviarse como application/json.' });
        }
        let asset: Asset;
        try { asset = JSON.parse(await readBody(req)) as Asset; } catch { return sendJson(res, 400, { error: 'El cuerpo no es JSON válido.' }); }
        if (!asset || typeof asset.id !== 'string' || typeof asset.title !== 'string' || typeof asset.sourceUrl !== 'string' || !isAllowed(asset)) {
          return sendJson(res, 400, { error: 'Asset no válido: faltan datos, la licencia no es libre o hay enlaces que no son http(s).' });
        }
        await favorites.add(asset);
        return sendJson(res, 200, { ok: true });
      }

      if (url.pathname.startsWith('/api/favorites/') && req.method === 'DELETE') {
        let id: string;
        try { id = decodeURIComponent(url.pathname.slice('/api/favorites/'.length)); } catch { return sendJson(res, 400, { error: 'Identificador mal codificado.' }); }
        await favorites.remove(id);
        return sendJson(res, 200, { ok: true });
      }

      if (url.pathname === '/api/settings' && req.method === 'GET') return sendJson(res, 200, settings.status());

      if (url.pathname === '/api/settings' && req.method === 'PUT') {
        if (!(req.headers['content-type'] ?? '').startsWith('application/json')) {
          return sendJson(res, 415, { error: 'El contenido debe enviarse como application/json.' });
        }
        let body: unknown;
        try { body = JSON.parse(await readBody(req)); } catch { return sendJson(res, 400, { error: 'El cuerpo no es JSON válido.' }); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) return sendJson(res, 400, { error: 'Se esperaba un objeto con las claves.' });
        await settings.update(body as Record<string, unknown>);
        return sendJson(res, 200, settings.status());
      }

      if (deps.staticDir && (req.method === 'GET' || req.method === 'HEAD') && !url.pathname.startsWith('/api/')
        && await serveStatic(deps.staticDir, url.pathname, res)) return;

      sendJson(res, 404, { error: 'No encontrado.' });
    } catch {
      sendJson(res, 500, { error: 'Error interno del servidor.' });
    }
  });
}
