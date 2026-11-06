import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { buildServer } from './index.ts';

const dir = await mkdtemp(join(tmpdir(), 'conn-'));
const mk = async (exePath?: string) => {
  const s = buildServer({ adapters: [], env: {}, cacheDir: dir, exePath });
  await new Promise<void>((r) => s.listen(0, '127.0.0.1', r));
  return { s, base: `http://127.0.0.1:${(s.address() as AddressInfo).port}` };
};
const opened: Array<{ s: { close(): void } }> = [];
after(() => { for (const o of opened) o.s.close(); });

test('/api/connect da el comando y los argumentos para el conector', async () => {
  const a = await mk('C:\\Users\\Jon\\Buscador-de-assets.exe'); opened.push(a);
  assert.deepEqual(await (await fetch(`${a.base}/api/connect`)).json(), { command: 'C:\\Users\\Jon\\Buscador-de-assets.exe', args: ['--mcp'] });
  const b = await mk(); opened.push(b);
  assert.deepEqual(await (await fetch(`${b.base}/api/connect`)).json(), { command: null, args: ['--mcp'] });
});
