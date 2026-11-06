import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Asset } from '../../shared/types.ts';
import { TABS, DEFAULT_TYPE, SPRITE_FILTERS, sourceMessage, licenseLabel, licenseNote } from './logic.ts';
import { search } from './api.ts';
import { ResultGrid } from './components/ResultGrid.tsx';
import { SourceStatusBar } from './components/SourceStatusBar.tsx';

const asset = (o: Partial<Asset> = {}): Asset => ({
  id: 'a1', type: 'model3d', title: 'Árbol bajo', author: 'Ana', license: 'cc-by', licenseUrl: 'https://l',
  thumbnailUrl: 'https://t/1.png', previewUrl: null, sourceName: 'Poly Pizza', sourceUrl: 'https://s/1', downloadUrl: null,
  attributionText: 'x', ...o,
});

test('las pestañas piden los tipos esperados', () => {
  assert.deepEqual(TABS.map((t) => [t.label, t.type]), [
    ['Todo', 'all'], ['2D', 'sprite'], ['3D', 'model3d'], ['Audio', 'audio'], ['Fuentes', 'font'], ['Código', 'code'],
  ]);
});

test('search() pide /api/search con q y type codificados', async () => {
  let url = '';
  const f = (async (u: string) => { url = u; return new Response('{"results":[],"sources":[]}'); }) as unknown as typeof fetch;
  await search('árbol bajo', 'model3d', f);
  assert.equal(url, '/api/search?q=%C3%A1rbol+bajo&type=model3d');
  await assert.rejects(search('x', 'all', (async () => new Response('x', { status: 500 })) as unknown as typeof fetch), /500/);
});

test('ficha: título, autor, fuente y distintivo de licencia', () => {
  const html = renderToStaticMarkup(<ResultGrid results={[asset()]} searched />);
  for (const part of ["Árbol bajo", "de Ana", "Poly Pizza", "CC BY"]) assert.ok(html.includes(part), part);
});

test('sin miniatura → marcador de reserva, no <img>', () => {
  const html = renderToStaticMarkup(<ResultGrid results={[asset({ thumbnailUrl: null })]} searched />);
  assert.ok(html.includes('thumb-placeholder'));
  assert.ok(!html.includes('<img'));
});

test('lista vacía tras buscar → mensaje de nada encontrado; antes de buscar no', () => {
  assert.ok(renderToStaticMarkup(<ResultGrid results={[]} searched />).includes('No se encontró nada con licencia libre'));
  assert.ok(!renderToStaticMarkup(<ResultGrid results={[]} searched={false} />).includes('No se encontró'));
});

test('fuentes caídas se avisan en español; las que fueron bien no', () => {
  assert.equal(sourceMessage({ source: 'Openverse', ok: true }), null);
  assert.equal(sourceMessage({ source: 'Openverse', ok: false, error: 'error' }), 'Openverse no respondió');
  assert.match(sourceMessage({ source: 'Freesound', ok: false, error: 'sin-configurar' })!, /Freesound.*sin configurar.*Ajustes/);
  assert.match(sourceMessage({ source: 'Sketchfab', ok: false, error: 'timeout' })!, /Sketchfab.*tardó/);
  const html = renderToStaticMarkup(<SourceStatusBar sources={[{ source: 'A', ok: true }, { source: 'B', ok: false, error: 'error' }]} />);
  assert.ok(html.includes('B no respondió') && !html.includes('A no'));
  assert.equal(renderToStaticMarkup(<SourceStatusBar sources={[{ source: 'A', ok: true }]} />), '');
});

test('licenseLabel cubre todas las licencias', () => {
  assert.deepEqual((['cc0', 'cc-by', 'ofl', 'apache-2.0'] as const).map(licenseLabel), ['CC0', 'CC BY', 'OFL', 'Apache 2.0']);
});

test('licenseNote explica en una frase si hay que atribuir', () => {
  assert.match(licenseNote('cc0'), /sin obligaci/i);
  assert.match(licenseNote('cc-by'), /atribu/i);
  assert.match(licenseNote('ofl'), /fuente|libre/i);
  assert.match(licenseNote('apache-2.0'), /atribu|aviso|licencia/i);
});

test('la tarjeta marca la licencia con data-license y una nota (title)', () => {
  const html = renderToStaticMarkup(<ResultGrid results={[asset({ license: 'cc0' })]} searched />);
  assert.ok(html.includes('data-license="cc0"'));
  assert.ok(/title="[^"]*sin obligaci/i.test(html));
});

test('sin miniatura el marcador muestra el pictograma del tipo', () => {
  const html = renderToStaticMarkup(<ResultGrid results={[asset({ thumbnailUrl: null, type: 'audio', previewUrl: null })]} searched />);
  assert.ok(html.includes('♪') && html.includes('aria-label="Sin miniatura"'));
  assert.ok(renderToStaticMarkup(<ResultGrid results={[asset({ thumbnailUrl: null, type: 'font' })]} searched />).includes('Aa'));
});

test('el 2D es la pestaña por defecto y tiene filtros rápidos de pixel art', () => {
  assert.equal(DEFAULT_TYPE, 'sprite');
  const labels = SPRITE_FILTERS.map((f) => f.label);
  for (const l of ['Personajes', 'Enemigos', 'Tilesets', 'Interfaz', 'Fondos', 'Efectos']) assert.ok(labels.includes(l), l);
  assert.ok(SPRITE_FILTERS.every((f) => f.query.includes('pixel art') || f.label === 'Interfaz' || f.label === 'Efectos'));
});
