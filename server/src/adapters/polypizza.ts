import type { Adapter, Asset } from '../../../shared/types.ts';
import { normalizeLicense } from '../license.ts';
import { getJson, makeAsset, type FetchFn } from './util.ts';

interface PpItem {
  ID: string; Title?: string; Thumbnail?: string; Download?: string; Licence?: string; Creator?: { Username?: string };
}

const LICENSE_URL = { cc0: 'https://creativecommons.org/publicdomain/zero/1.0/' } as const;

export function createPolyPizzaAdapter(fetchFn: FetchFn = fetch, getKey = () => process.env.POLYPIZZA_API_KEY): Adapter {
  return {
    name: 'Poly Pizza',
    types: ['model3d'],
    requiresKey: 'POLYPIZZA_API_KEY',
    async search(query, type, signal) {
      if (type !== 'model3d') return [];
      const data = await getJson<{ results?: PpItem[] }>(
        fetchFn, `https://api.poly.pizza/v1.1/search/${encodeURIComponent(query)}?Limit=20`, signal,
        { 'x-auth-token': getKey() ?? '' },
      );
      const out: Asset[] = [];
      for (const it of data.results ?? []) {
        const license = normalizeLicense(it.Licence);
        if (license !== 'cc0') continue;
        out.push(makeAsset({
          id: it.ID, type: 'model3d', title: it.Title, author: it.Creator?.Username, license,
          licenseUrl: LICENSE_URL[license], thumbnailUrl: it.Thumbnail || null,
          previewUrl: it.Download || null, sourceName: 'Poly Pizza', sourceUrl: `https://poly.pizza/m/${it.ID}`,
          downloadUrl: it.Download || null,
        }));
      }
      return out;
    },
  };
}
