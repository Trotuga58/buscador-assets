import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGoogleFontsAdapter } from './googlefonts.ts';

const fx = JSON.parse(readFileSync(new URL('./__fixtures__/googlefonts.json', import.meta.url), 'utf8'));
const sig = new AbortController().signal;
function mk() {
  const calls: string[] = [];
  const f = (async (url: string) => { calls.push(url); return new Response(JSON.stringify(fx), { status: 200 }); }) as unknown as typeof fetch;
  return { f, calls };
}

test('filtra por nombre de familia sin distinguir mayúsculas', async () => {
  const { f } = mk();
  const out = await createGoogleFontsAdapter(f, () => 'K').search('ROBOTO', 'font', sig);
  assert.deepEqual(out.map((a) => a.title), ['Roboto', 'Roboto Mono']);
});

test('licencias: Roboto* apache-2.0, el resto ofl; todas type font', async () => {
  const { f } = mk();
  const a = createGoogleFontsAdapter(f, () => 'K');
  const roboto = (await a.search('roboto', 'font', sig))[0];
  assert.equal(roboto.license, 'apache-2.0');
  assert.equal(roboto.type, 'font');
  const lob = (await a.search('lobster', 'font', sig))[0];
  assert.equal(lob.license, 'ofl');
  assert.ok(lob.attributionText.includes('Lobster'));
});

test('enlaces: página, licencia y descarga', async () => {
  const { f } = mk();
  const o = (await createGoogleFontsAdapter(f, () => 'K').search('open sans', 'font', sig))[0];
  assert.equal(o.sourceUrl, 'https://fonts.google.com/specimen/Open+Sans');
  assert.equal(o.downloadUrl, 'https://fonts.google.com/download?family=Open%20Sans');
  assert.equal(o.thumbnailUrl, null);
  assert.equal(o.author, 'Google Fonts');
});

test('envía la clave y reutiliza la lista entre búsquedas', async () => {
  const { f, calls } = mk();
  const a = createGoogleFontsAdapter(f, () => 'LLAVE');
  await a.search('roboto', 'font', sig);
  await a.search('lobster', 'font', sig);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].includes('key=LLAVE'));
});

test('otro tipo → vacío sin llamar', async () => {
  const { f, calls } = mk();
  assert.deepEqual(await createGoogleFontsAdapter(f, () => 'K').search('x', 'audio', sig), []);
  assert.equal(calls.length, 0);
});
