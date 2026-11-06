import type { Adapter, Asset, AssetType } from '../../../shared/types.ts';
import { normalizeLicense } from '../license.ts';
import { getJson, makeAsset, type FetchFn } from './util.ts';

interface OvItem {
  id: string; title?: string | null; creator?: string | null; license?: string | null; license_url?: string | null;
  url?: string | null; thumbnail?: string | null; foreign_landing_url?: string | null;
}

const ENDPOINT: Partial<Record<AssetType, { path: string; as: AssetType }>> = {
  audio: { path: 'audio', as: 'audio' },
};

export function createOpenverseAdapter(fetchFn: FetchFn = fetch): Adapter {
  return {
    name: 'Openverse',
    types: ['audio'],
    requiresKey: null,
    async search(query, type, signal) {
      const ep = ENDPOINT[type];
      if (!ep) return [];
      const params = new URLSearchParams({ q: query, license: 'cc0', page_size: '20' });
      const data = await getJson<{ results?: OvItem[] }>(fetchFn, `https://api.openverse.org/v1/${ep.path}/?${params}`, signal);
      const out: Asset[] = [];
      for (const it of data.results ?? []) {
        const license = normalizeLicense(it.license);
        if (license !== 'cc0' || !it.url) continue;
        out.push(makeAsset({
          id: it.id, type: ep.as, title: it.title, author: it.creator, license,
          licenseUrl: it.license_url ?? '', thumbnailUrl: it.thumbnail ?? null,
          previewUrl: it.url, sourceName: 'Openverse', sourceUrl: it.foreign_landing_url ?? it.url, downloadUrl: it.url,
        }));
      }
      return out;
    },
  };
}
