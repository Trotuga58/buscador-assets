import type { Adapter, Asset, AssetType, SearchResponse, SourceStatus } from '../../shared/types.ts';
import type { Cache } from './cache.ts';
import { toEnglish } from './translate.ts';

export interface SearchOptions {
  cache: Cache;
  env: Record<string, string | undefined>;
  timeoutMs: number;
}

const safeUrl = (u: string | null | undefined): boolean => {
  if (!u) return true;
  try { const p = new URL(u).protocol; return p === 'https:' || p === 'http:'; } catch { return false; }
};

/** Solo CC0 (dominio público): se usa sin atribuir ni cumplir condiciones. Todo lo demás (CC BY, OFL, Apache…) se descarta. */
export function isAllowed(a: Asset): boolean {
  if (!a.attributionText || !a.attributionText.trim()) return false;
  if (![a.sourceUrl, a.downloadUrl, a.previewUrl, a.thumbnailUrl, a.licenseUrl].every(safeUrl) || !a.sourceUrl) return false;
  return a.license === 'cc0';
}

const TYPE_ORDER: Record<string, number> = { sprite: 0, model3d: 1, audio: 2, font: 3, code: 4 };

class TimeoutError extends Error {}

async function withTimeout<T>(run: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const ctl = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { ctl.abort(); reject(new TimeoutError()); }, ms);
  });
  try {
    return await Promise.race([run(ctl.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function searchOne(adapter: Adapter, query: string, type: AssetType, o: SearchOptions): Promise<Asset[]> {
  const key = `${adapter.name}|${type}|${query.trim().toLowerCase()}`;
  const hit = await o.cache.get<Asset[]>(key);
  if (hit) return hit;
  const found = (await withTimeout((signal) => adapter.search(adapter.bilingual ? query.trim() : toEnglish(query), type, signal), o.timeoutMs)).filter(isAllowed);
  await o.cache.set(key, found);
  return found;
}

export async function runSearch(
  adapters: Adapter[], query: string, type: AssetType | 'all', o: SearchOptions,
): Promise<SearchResponse> {
  if (!query.trim()) return { results: [], sources: [] };

  const sources: SourceStatus[] = [];
  const results: Asset[] = [];

  await Promise.all(adapters.map(async (adapter) => {
    const types = type === 'all' ? adapter.types : adapter.types.filter((t) => t === type);
    if (types.length === 0) return;
    if (adapter.requiresKey && !o.env[adapter.requiresKey]) {
      sources.push({ source: adapter.name, ok: false, error: 'sin-configurar' });
      return;
    }
    const settled = await Promise.allSettled(types.map((t) => searchOne(adapter, query, t, o)));
    const failures = settled.filter((s): s is PromiseRejectedResult => s.status === 'rejected');
    for (const s of settled) if (s.status === 'fulfilled') results.push(...s.value);
    if (failures.length === 0) sources.push({ source: adapter.name, ok: true });
    else sources.push({
      source: adapter.name, ok: false,
      error: failures.some((f) => f.reason instanceof TimeoutError) ? 'timeout' : 'error',
    });
  }));

  const order = new Map(adapters.map((a, i) => [a.name, i]));
  sources.sort((a, b) => order.get(a.source)! - order.get(b.source)!);
  results.sort((a, b) => (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9)); // 2D primero; el orden dentro de cada tipo se conserva
  return { results, sources };
}
