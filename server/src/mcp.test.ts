import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Asset, SearchResponse } from '../../shared/types.ts';
import { createMcp, type McpDeps } from './mcp.ts';

const asset = (o: Partial<Asset> = {}): Asset => ({
  id: 'pp:1', type: 'model3d', title: 'Espada', author: 'Ana', license: 'cc-by', licenseUrl: 'https://l',
  thumbnailUrl: null, previewUrl: null, sourceName: 'Poly Pizza', sourceUrl: 'https://s/1', downloadUrl: 'https://d/espada.glb',
  attributionText: '"Espada" de Ana (CC BY)', ...o,
});
const pack = asset({ id: 'cur:2', title: 'Pack pixel', type: 'sprite', license: 'cc0', downloadUrl: null, sourceUrl: 'https://s/pack', sourceName: 'Lista curada' });

function make(over: Partial<McpDeps> = {}) {
  const calls: { search: unknown[]; download: Asset[] } = { search: [], download: [] };
  const deps: McpDeps = {
    search: async (q, type) => {
      calls.search.push([q, type]);
      const out: SearchResponse = { results: [asset(), pack], sources: [{ source: 'Freesound', ok: false, error: 'sin-configurar' }] };
      return out;
    },
    download: async (a) => { calls.download.push(a); return { folder: '/d/espada-1', file: '/d/espada-1/espada.glb', bytes: 3 }; },
    ...over,
  };
  const call = async (name: string, args: unknown, id = 7) =>
    (await createMcp(deps).handle({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } })) as any;
  return { deps, calls, mcp: createMcp(deps) };
}
const text = (r: any): string => r.result.content.map((c: any) => c.text).join('\n');

test('initialize anuncia herramientas y devuelve el id; initialized no responde', async () => {
  const { mcp } = make();
  const r = (await mcp.handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } })) as any;
  assert.equal(r.id, 1);
  assert.equal(r.result.protocolVersion, '2025-06-18');
  assert.ok(r.result.capabilities.tools);
  assert.equal(r.result.serverInfo.name, 'buscador-assets');
  assert.equal(await mcp.handle({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
  assert.deepEqual(((await mcp.handle({ jsonrpc: '2.0', id: 2, method: 'ping' })) as any).result, {});
});

test('tools/list: search_assets y download_asset con esquema', async () => {
  const { mcp } = make();
  const r = (await mcp.handle({ jsonrpc: '2.0', id: 3, method: 'tools/list' })) as any;
  const names = r.result.tools.map((t: any) => t.name);
  assert.deepEqual(names.sort(), ['download_asset', 'search_assets']);
  const s = r.result.tools.find((t: any) => t.name === 'search_assets');
  assert.deepEqual(s.inputSchema.required, ['query']);
  assert.ok(s.inputSchema.properties.type.enum.includes('model3d'));
});

test('search_assets: lista id, licencia y si se puede descargar; avisa de fuentes caídas', async () => {
  const { calls, mcp } = make();
  const r = (await mcp.handle({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'search_assets', arguments: { query: 'espada', type: 'model3d' } } })) as any;
  assert.deepEqual(calls.search[0], ['espada', 'model3d']);
  const t = text(r);
  for (const part of ['pp:1', 'Espada', 'CC BY', 'cur:2', 'CC0', 'Freesound']) assert.ok(t.includes(part), part);
  assert.match(t, /pp:1[\s\S]*descargable: sí/);
  assert.match(t, /cur:2[\s\S]*descargable: no/);
  assert.ok(!r.result.isError);
});

test('search_assets: sin texto es un error; respeta limit', async () => {
  const { mcp } = make();
  const bad = (await mcp.handle({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'search_assets', arguments: {} } })) as any;
  assert.equal(bad.result.isError, true);
  const one = (await mcp.handle({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'search_assets', arguments: { query: 'x', limit: 1 } } })) as any;
  assert.ok(text(one).includes('pp:1') && !text(one).includes('cur:2'));
});

test('download_asset: pide buscar antes; luego descarga y da ruta, atribución y cómo importarlo en Blender', async () => {
  const { calls, mcp } = make();
  const call = (name: string, args: unknown) => mcp.handle({ jsonrpc: '2.0', id: 9, method: 'tools/call', params: { name, arguments: args } }) as Promise<any>;
  const antes = await call('download_asset', { id: 'pp:1' });
  assert.equal(antes.result.isError, true);
  assert.match(text(antes), /search_assets/);
  await call('search_assets', { query: 'espada' });
  const r = await call('download_asset', { id: 'pp:1' });
  assert.equal(calls.download[0].id, 'pp:1');
  const t = text(r);
  for (const part of ['/d/espada-1/espada.glb', '"Espada" de Ana (CC BY)', 'bpy.ops.import_scene.gltf']) assert.ok(t.includes(part), part);
  assert.ok(!r.result.isError);
});

test('download_asset de algo sin descarga directa: da el enlace y no descarga', async () => {
  const { calls, mcp } = make();
  const call = (name: string, args: unknown) => mcp.handle({ jsonrpc: '2.0', id: 9, method: 'tools/call', params: { name, arguments: args } }) as Promise<any>;
  await call('search_assets', { query: 'pixel' });
  const r = await call('download_asset', { id: 'cur:2' });
  assert.equal(calls.download.length, 0);
  assert.ok(text(r).includes('https://s/pack'));
  assert.ok(!r.result.isError);
});

test('si la descarga falla → isError con el motivo', async () => {
  const { mcp } = make({ download: async () => { throw new Error('Respuesta 404'); } });
  const call = (name: string, args: unknown) => mcp.handle({ jsonrpc: '2.0', id: 9, method: 'tools/call', params: { name, arguments: args } }) as Promise<any>;
  await call('search_assets', { query: 'espada' });
  const r = await call('download_asset', { id: 'pp:1' });
  assert.equal(r.result.isError, true);
  assert.match(text(r), /404/);
});

test('métodos y herramientas desconocidos → error JSON-RPC con el id', async () => {
  const { mcp } = make();
  const m = (await mcp.handle({ jsonrpc: '2.0', id: 11, method: 'nope' })) as any;
  assert.equal(m.id, 11); assert.equal(m.error.code, -32601);
  const t = (await mcp.handle({ jsonrpc: '2.0', id: 12, method: 'tools/call', params: { name: 'nope' } })) as any;
  assert.equal(t.error.code, -32602);
});
