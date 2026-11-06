import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Asset } from '../../shared/types.ts';
import { AssetTile } from './components/AssetTile.tsx';
import { AssetDialog } from './components/AssetDialog.tsx';
import { ConnectClaude } from './components/ConnectClaude.tsx';
import { ResultGrid } from './components/ResultGrid.tsx';
import { connectConfig, canSearchWhileTyping } from './logic.ts';

const asset = (o: Partial<Asset> = {}): Asset => ({
  id: 'a1', type: 'model3d', title: 'Espada', author: 'Ana', license: 'cc-by', licenseUrl: 'https://l',
  thumbnailUrl: 'https://t/1.png', previewUrl: 'https://p/x.glb', sourceName: 'Poly Pizza', sourceUrl: 'https://s/1', downloadUrl: 'https://d/x.glb',
  attributionText: '"Espada" de Ana', ...o,
});

test('la ficha de la rejilla es un botón con miniatura grande, título, autor y licencia; sin visores pesados', () => {
  const html = renderToStaticMarkup(<AssetTile asset={asset()} onOpen={() => {}} />);
  assert.match(html, /^<button[^>]*class="tile"/);
  for (const part of ['Espada', 'de Ana', 'CC BY', 'data-license="cc-by"', 'https://t/1.png']) assert.ok(html.includes(part), part);
  assert.ok(!html.includes('<model-viewer') && !html.includes('<audio'));
  assert.ok(!html.includes('<a '), 'un botón no puede contener enlaces');
});

test('la rejilla usa fichas y abre el detalle', () => {
  const html = renderToStaticMarkup(<ResultGrid results={[asset()]} searched onOpen={() => {}} />);
  assert.ok(html.includes('class="tile"') && !html.includes('Copiar atribución'));
});

test('el detalle es un diálogo con vista previa, descarga, fuente, atribución y cerrar', () => {
  const html = renderToStaticMarkup(<AssetDialog asset={asset()} onClose={() => {}} />);
  assert.match(html, /role="dialog"[^>]*aria-modal="true"/);
  for (const part of ['Espada', '<model-viewer', 'Descargar', 'href="https://s/1"', 'Copiar atribución', 'Cerrar']) assert.ok(html.includes(part), part);
});

test('buscar mientras se escribe solo a partir de 2 letras', () => {
  assert.equal(canSearchWhileTyping(''), false);
  assert.equal(canSearchWhileTyping(' a '), false);
  assert.equal(canSearchWhileTyping('es'), true);
});

test('connectConfig: bloque listo para pegar, con ruta real o de ejemplo', () => {
  const real = JSON.parse(connectConfig('C:\\Apps\\Buscador-de-assets.exe'));
  assert.deepEqual(real, { mcpServers: { 'buscador-assets': { command: 'C:\\Apps\\Buscador-de-assets.exe', args: ['--mcp'] } } });
  assert.match(JSON.parse(connectConfig(null)).mcpServers['buscador-assets'].command, /Buscador-de-assets\.exe$/);
});

test('ConnectClaude explica los pasos y muestra la configuración', () => {
  const html = renderToStaticMarkup(<ConnectClaude command="C:\\Apps\\B.exe" />);
  for (const part of ['Conectar con Claude', 'claude_desktop_config.json', 'mcpServers', 'Copiar configuración', '--mcp']) assert.ok(html.includes(part), part);
});
