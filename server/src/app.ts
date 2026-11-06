import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { join } from 'node:path';
import { buildServer } from './index.ts';
import { allAdapters } from './adapters/index.ts';
import { createSettings } from './settings.ts';
import { createCache } from './cache.ts';
import { runSearch } from './search.ts';
import { downloadAsset } from './downloads.ts';
import { createMcp } from './mcp.ts';
import { serveStdio } from './mcp-stdio.ts';
import { DAY_MS } from './index.ts';

export interface StartOptions { port: number; dataDir: string; staticDir?: string; exePath?: string }

/** Arranca el servidor en 127.0.0.1. Lo usan `npm run dev:server` y la app de escritorio. */
export async function startServer(o: StartOptions): Promise<{ server: Server; port: number }> {
  await createSettings(join(o.dataDir, 'settings.json'), process.env).load();
  const server = buildServer({
    adapters: allAdapters, env: process.env, cacheDir: join(o.dataDir, 'cache'),
    favoritesFile: join(o.dataDir, 'favorites.json'), settingsFile: join(o.dataDir, 'settings.json'), staticDir: o.staticDir, exePath: o.exePath,
  });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(o.port, '127.0.0.1', resolve); });
  return { server, port: (server.address() as AddressInfo).port };
}

export interface McpOptions { dataDir: string; downloadsDir: string }

/** Modo conector: habla MCP por entrada/salida estándar hasta que Claude cierra la conexión. */
export async function startMcp(o: McpOptions): Promise<void> {
  await createSettings(join(o.dataDir, 'settings.json'), process.env).load();
  const cache = createCache(join(o.dataDir, 'cache'), DAY_MS);
  const mcp = createMcp({
    search: (q, type) => runSearch(allAdapters, q, type, { cache, env: process.env, timeoutMs: 8000 }),
    download: (asset) => downloadAsset(asset, o.downloadsDir),
  });
  await serveStdio((m) => mcp.handle(m));
}
