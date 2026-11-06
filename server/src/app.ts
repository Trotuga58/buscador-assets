import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { join } from 'node:path';
import { buildServer } from './index.ts';
import { allAdapters } from './adapters/index.ts';
import { createSettings } from './settings.ts';

export interface StartOptions { port: number; dataDir: string; staticDir?: string }

/** Arranca el servidor en 127.0.0.1. Lo usan `npm run dev:server` y la app de escritorio. */
export async function startServer(o: StartOptions): Promise<{ server: Server; port: number }> {
  await createSettings(join(o.dataDir, 'settings.json'), process.env).load();
  const server = buildServer({
    adapters: allAdapters, env: process.env, cacheDir: join(o.dataDir, 'cache'),
    favoritesFile: join(o.dataDir, 'favorites.json'), settingsFile: join(o.dataDir, 'settings.json'), staticDir: o.staticDir,
  });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(o.port, '127.0.0.1', resolve); });
  return { server, port: (server.address() as AddressInfo).port };
}
