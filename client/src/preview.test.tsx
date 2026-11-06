import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Asset } from '../../shared/types.ts';
import { previewKind, copyAttribution } from './logic.ts';
import { Preview } from './components/Preview.tsx';
import { CopyAttribution } from './components/CopyAttribution.tsx';
import { ResultCard } from './components/ResultCard.tsx';
import { listFavorites, addFavorite, removeFavorite } from './api.ts';

const asset = (o: Partial<Asset> = {}): Asset => ({
  id: 'a:1', type: 'model3d', title: 'T', author: 'A', license: 'cc0', licenseUrl: 'https://l', thumbnailUrl: 'https://t',
  previewUrl: 'https://p/x.glb', sourceName: 'S', sourceUrl: 'https://s', downloadUrl: null, attributionText: '"T" de A', ...o,
});

test('previewKind según tipo y previewUrl', () => {
  assert.equal(previewKind(asset()), 'model');
  assert.equal(previewKind(asset({ type: 'audio', previewUrl: 'https://p/x.mp3' })), 'audio');
  assert.equal(previewKind(asset({ type: 'sprite', previewUrl: 'https://p/x.png' })), 'image');
  assert.equal(previewKind(asset({ previewUrl: null })), null);
  assert.equal(previewKind(asset({ type: 'font', previewUrl: 'https://p/f' })), null);
});

test('Preview pinta model-viewer, audio con controles o img', () => {
  assert.match(renderToStaticMarkup(<Preview asset={asset()} />), /<model-viewer[^>]*src="https:\/\/p\/x\.glb"/);
  const audio = renderToStaticMarkup(<Preview asset={asset({ type: 'audio', previewUrl: 'https://p/x.mp3' })} />);
  assert.match(audio, /<audio[^>]*controls/);
  assert.match(audio, /src="https:\/\/p\/x\.mp3"/);
  assert.match(renderToStaticMarkup(<Preview asset={asset({ type: 'sprite', previewUrl: 'https://p/x.png' })} />), /<img[^>]*src="https:\/\/p\/x\.png"/);
  assert.equal(renderToStaticMarkup(<Preview asset={asset({ previewUrl: null })} />), '');
});

test('copyAttribution copia el texto y devuelve true; falla → false; sin portapapeles → false', async () => {
  let copied = '';
  assert.equal(await copyAttribution('hola', { writeText: async (t: string) => { copied = t; } }), true);
  assert.equal(copied, 'hola');
  assert.equal(await copyAttribution('x', { writeText: async () => { throw new Error('no'); } }), false);
  assert.equal(await copyAttribution('x', undefined), false);
});

test('CopyAttribution muestra el botón en español', () => {
  assert.ok(renderToStaticMarkup(<CopyAttribution text="x" />).includes('Copiar atribución'));
});

test('tarjeta: Descargar solo si hay downloadUrl', () => {
  assert.ok(!renderToStaticMarkup(<ResultCard asset={asset()} />).includes('Descargar'));
  const html = renderToStaticMarkup(<ResultCard asset={asset({ downloadUrl: 'https://d/x.glb' })} />);
  assert.ok(html.includes('Descargar') && html.includes('href="https://d/x.glb"'));
});

test('tarjeta: audio mantiene miniatura y reproductor; modelo usa visor en lugar de miniatura', () => {
  const audio = renderToStaticMarkup(<ResultCard asset={asset({ type: 'audio', previewUrl: 'https://p/x.mp3' })} />);
  assert.ok(audio.includes('<audio') && audio.includes('https://t'));
  const model = renderToStaticMarkup(<ResultCard asset={asset()} />);
  assert.ok(model.includes('<model-viewer'));
});

test('tarjeta: botón de favoritos solo con manejador; el texto depende del estado', () => {
  assert.ok(!renderToStaticMarkup(<ResultCard asset={asset()} />).includes('favoritos'));
  assert.ok(renderToStaticMarkup(<ResultCard asset={asset()} favorite={false} onToggleFavorite={() => {}} />).includes('Guardar en favoritos'));
  assert.ok(renderToStaticMarkup(<ResultCard asset={asset()} favorite onToggleFavorite={() => {}} />).includes('Quitar de favoritos'));
});

test('api de favoritos: rutas y métodos', async () => {
  const calls: Array<[string, string | undefined, string | undefined]> = [];
  const f = (async (u: string, init?: RequestInit) => {
    calls.push([u, init?.method, init?.body as string | undefined]);
    return new Response(u === '/api/favorites' && !init?.method ? '[]' : '{"ok":true}');
  }) as unknown as typeof fetch;
  assert.deepEqual(await listFavorites(f), []);
  await addFavorite(asset(), f);
  await removeFavorite('a:1', f);
  assert.deepEqual(calls[1].slice(0, 2), ['/api/favorites', 'POST']);
  assert.equal(JSON.parse(calls[1][2]!).id, 'a:1');
  assert.deepEqual(calls[2].slice(0, 2), ['/api/favorites/a%3A1', 'DELETE']);
});
