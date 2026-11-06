import type { Asset, AssetType, SearchResponse } from '../../shared/types.ts';
import { licenseText } from './license.ts';
import type { DownloadResult } from './downloads.ts';

export interface McpDeps {
  search(query: string, type: AssetType | 'all'): Promise<SearchResponse>;
  download(asset: Asset): Promise<DownloadResult>;
}

type Msg = { jsonrpc?: string; id?: number | string | null; method?: string; params?: any };
const SUPPORTED = ['2025-06-18', '2025-03-26', '2024-11-05'];
const TYPES = ['all', 'sprite', 'model3d', 'audio', 'font', 'code'];
const MAX_REMEMBERED = 500;

const TOOLS = [
  {
    name: 'search_assets',
    description: 'Busca assets de videojuegos con licencia libre (solo CC0 y CC BY; las fuentes también OFL/Apache). Devuelve id, título, autor, licencia y si se puede descargar. '
      + 'Para pixel art usa type "sprite"; para modelos 3D, "model3d". Las búsquedas funcionan mejor en inglés o español sencillo ("sword", "espada", "dungeon tileset").',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Qué se busca, p. ej. "espada" o "pixel art knight".' },
        type: { type: 'string', enum: TYPES, description: 'Tipo de asset. Por defecto "all".' },
        limit: { type: 'integer', minimum: 1, maximum: 25, description: 'Cuántos resultados devolver (por defecto 10).' },
      },
      required: ['query'],
    },
  },
  {
    name: 'download_asset',
    description: 'Descarga a este ordenador un asset encontrado con search_assets (usa su id) y devuelve la ruta del archivo, la atribución y cómo importarlo en Blender. '
      + 'Solo funciona con los resultados "descargable: sí"; el resto solo tienen enlace a la página del autor.',
    inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'El id que devolvió search_assets.' } }, required: ['id'] },
  },
];

const ok = (text: string) => ({ content: [{ type: 'text', text }] });
const fail = (text: string) => ({ content: [{ type: 'text', text }], isError: true });

/** Cómo meter el archivo en Blender (Python), según la extensión. */
export function blenderHint(file: string): string {
  const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
  const p = JSON.stringify(file);
  if (ext === '.glb' || ext === '.gltf') return `Blender: bpy.ops.import_scene.gltf(filepath=${p})`;
  if (ext === '.fbx') return `Blender: bpy.ops.import_scene.fbx(filepath=${p})`;
  if (ext === '.obj') return `Blender: bpy.ops.wm.obj_import(filepath=${p})`;
  if (ext === '.png' || ext === '.jpg') return `Blender: bpy.data.images.load(${p}) (imagen; úsala como textura)`;
  if (ext === '.zip') return 'Es un .zip: descomprímelo y importa el modelo que lleve dentro (.glb, .fbx u .obj).';
  return 'Importa el archivo con el importador de Blender que corresponda a su formato.';
}

export function createMcp(deps: McpDeps) {
  const seen = new Map<string, Asset>();
  const remember = (a: Asset) => {
    seen.delete(a.id); seen.set(a.id, a);
    if (seen.size > MAX_REMEMBERED) seen.delete(seen.keys().next().value as string);
  };

  async function searchAssets(args: any) {
    const query = typeof args?.query === 'string' ? args.query.trim() : '';
    if (!query) return fail('Falta el texto de búsqueda (query).');
    const type = TYPES.includes(args?.type) ? args.type : 'all';
    const limit = Math.min(25, Math.max(1, Number.isInteger(args?.limit) ? args.limit : 10));
    const out = await deps.search(query, type);
    const shown = out.results.slice(0, limit);
    shown.forEach(remember);
    const lines = shown.map((a) => [
      `- id: ${a.id}`, `  ${a.title} (${a.type}) de ${a.author}, en ${a.sourceName}`,
      `  licencia: ${licenseText(a.license)}${a.license === 'cc0' ? '' : ' (hay que atribuir)'}`,
      `  descargable: ${a.downloadUrl ? 'sí' : 'no (solo enlace)'}`, `  página: ${a.sourceUrl}`,
    ].join('\n'));
    const down = out.sources.filter((s) => !s.ok).map((s) => `${s.source}: ${s.error}`);
    return ok([
      shown.length ? `${shown.length} resultados:` : 'No se encontró nada con licencia libre.',
      ...lines, ...(down.length ? ['', `Fuentes que no respondieron: ${down.join('; ')}`] : []),
    ].join('\n'));
  }

  async function downloadAsset(args: any) {
    const id = typeof args?.id === 'string' ? args.id : '';
    const asset = seen.get(id);
    if (!asset) return fail('No conozco ese id. Busca primero con search_assets y usa un id de sus resultados.');
    if (!asset.downloadUrl) {
      return ok(`"${asset.title}" no tiene descarga directa. Hay que bajarlo desde la página de su autor: ${asset.sourceUrl}\nLicencia: ${licenseText(asset.license)}. ${asset.attributionText}`);
    }
    try {
      const r = await deps.download(asset);
      return ok([
        `Descargado: ${r.file} (${r.bytes} bytes)`, `Carpeta (con LICENCIA.txt): ${r.folder}`,
        `Atribución a incluir en el juego: ${asset.attributionText}`, blenderHint(r.file),
      ].join('\n'));
    } catch (e) {
      return fail(`No se pudo descargar: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return {
    async handle(msg: Msg): Promise<object | null> {
      const reply = (result: unknown) => ({ jsonrpc: '2.0', id: msg.id ?? null, result });
      const error = (code: number, message: string) => ({ jsonrpc: '2.0', id: msg.id ?? null, error: { code, message } });
      if (msg.id === undefined) return null; // notificaciones: no se responde
      switch (msg.method) {
        case 'initialize': {
          const asked = msg.params?.protocolVersion;
          return reply({
            protocolVersion: SUPPORTED.includes(asked) ? asked : SUPPORTED[0], capabilities: { tools: {} },
            serverInfo: { name: 'buscador-assets', version: '1.1.0' },
          });
        }
        case 'ping': return reply({});
        case 'tools/list': return reply({ tools: TOOLS });
        case 'tools/call': {
          const name = msg.params?.name;
          if (name === 'search_assets') return reply(await searchAssets(msg.params?.arguments));
          if (name === 'download_asset') return reply(await downloadAsset(msg.params?.arguments));
          return error(-32602, `Herramienta desconocida: ${String(name)}`);
        }
        default: return error(-32601, `Método no soportado: ${String(msg.method)}`);
      }
    },
  };
}
