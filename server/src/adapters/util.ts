import type { Asset, AssetType, License } from '../../../shared/types.ts';
import { buildAttribution } from '../license.ts';

export type FetchFn = typeof fetch;

export async function getJson<T>(fetchFn: FetchFn, url: string, signal: AbortSignal, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetchFn(url, { signal, headers: { accept: 'application/json', ...headers } });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${new URL(url).hostname}`);
  return (await res.json()) as T;
}

export interface RawAsset {
  id: string; type: AssetType; title?: string | null; author?: string | null; license: License; licenseUrl: string;
  thumbnailUrl?: string | null; previewUrl?: string | null; sourceName: string; sourceUrl: string; downloadUrl?: string | null;
}

/** Rellena valores de reserva y construye la atribución. */
export function makeAsset(r: RawAsset): Asset {
  const title = r.title?.trim() || 'Sin título';
  const author = r.author?.trim() || 'Desconocido';
  return {
    id: `${r.sourceName.toLowerCase().replace(/\s+/g, '')}:${r.id}`,
    type: r.type, title, author, license: r.license, licenseUrl: r.licenseUrl,
    thumbnailUrl: r.thumbnailUrl ?? null, previewUrl: r.previewUrl ?? null,
    sourceName: r.sourceName, sourceUrl: r.sourceUrl, downloadUrl: r.downloadUrl ?? null,
    attributionText: buildAttribution({ title, author, license: r.license, sourceName: r.sourceName, sourceUrl: r.sourceUrl }),
  };
}
