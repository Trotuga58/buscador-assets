import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSketchfabAdapter } from './sketchfab.ts';

const fx = (n: string) => JSON.parse(readFileSync(new URL(`./__fixtures__/${n}.json`, import.meta.url), 'utf8'));
const sig = new AbortController().signal;
function mk() {
  const calls: Array<{ url: string; headers: Record<string, string> }> = [];
  const f = (async (url: string, init: RequestInit) => {
    calls.push({ url, headers: init.headers as Record<string, string> });
    return new Response(JSON.stringify(url.includes('license=cc0') ? fx('sketchfab-cc0') : fx('sketchfab-by')), { status: 200 });
  }) as unknown as typeof fetch;
  return { f, calls };
}

test('hace una consulta por licencia (cc0 y by) y une los resultados', async () => {
  const { f, calls } = mk();
  const out = await createSketchfabAdapter(f, () => 'K').search('castle', 'model3d', sig);
  assert.equal(calls.length, 2);
  assert.ok(calls.some((c) => c.url.includes('license=cc0')));
  assert.ok(calls.some((c) => c.url.includes('license=by') && !c.url.includes('by-')));
  assert.deepEqual(out.map((a) => a.id).sort(), ['sketchfab:s1', 'sketchfab:s2']);
});

test('sin descarga directa: previewUrl y downloadUrl null, enlaza a la página', async () => {
  const { f } = mk();
  const a = (await createSketchfabAdapter(f, () => 'K').search('castle', 'model3d', sig)).find((x) => x.id === 'sketchfab:s1')!;
  assert.equal(a.previewUrl, null);
  assert.equal(a.downloadUrl, null);
  assert.equal(a.sourceUrl, 'https://sketchfab.com/3d-models/castle-s1');
  assert.equal(a.author, 'Dan');
  assert.equal(a.thumbnailUrl, 'https://media.sketchfab.com/s1-256.jpg');
  assert.equal(a.license, 'cc0');
});

test('descarta licencias no libres aunque la API las devuelva; autor y miniatura de reserva', async () => {
  const { f } = mk();
  const out = await createSketchfabAdapter(f, () => 'K').search('x', 'model3d', sig);
  assert.ok(!out.some((a) => a.id === 'sketchfab:s3'));
  const robot = out.find((a) => a.id === 'sketchfab:s2')!;
  assert.equal(robot.author, 'eve');
  assert.equal(robot.thumbnailUrl, null);
});

test('envía la clave como Token', async () => {
  const { f, calls } = mk();
  await createSketchfabAdapter(f, () => 'ABC').search('x', 'model3d', sig);
  assert.equal(calls[0].headers['authorization'], 'Token ABC');
});
