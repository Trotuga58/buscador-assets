import type { Adapter, Asset } from '../../../shared/types.ts';
import { normalizeLicense } from '../license.ts';
import { getJson, makeAsset, type FetchFn } from './util.ts';

interface SfItem {
  uid: string; name?: string; viewerUrl?: string; user?: { displayName?: string; username?: string };
  license?: { slug?: string; url?: string } | null; thumbnails?: { images?: Array<{ url: string; width: number }> };
}

function pickThumb(images: Array<{ url: string; width: number }> = []): string | null {
  if (images.length === 0) return null;
  const sorted = [...images].sort((a, b) => a.width - b.width);
  return (sorted.find((i) => i.width >= 200) ?? sorted[sorted.length - 1]).url;
}

export function createSketchfabAdapter(fetchFn: FetchFn = fetch, getKey = () => process.env.SKETCHFAB_API_KEY): Adapter {
  return {
    name: 'Sketchfab',
    types: ['model3d'],
    requiresKey: 'SKETCHFAB_API_KEY',
    async search(query, type, signal) {
      if (type !== 'model3d') return [];
      const pages = await Promise.all(['cc0', 'by'].map((slug) => {
        const params = new URLSearchParams({ type: 'models', q: query, license: slug, count: '20' });
        return getJson<{ results?: SfItem[] }>(fetchFn, `https://api.sketchfab.com/v3/search?${params}`, signal, {
          authorization: `Token ${getKey() ?? ''}`,
        });
      }));
      const out: Asset[] = [];
      for (const it of pages.flatMap((p) => p.results ?? [])) {
        const license = normalizeLicense(it.license?.slug);
        if (license !== 'cc0' && license !== 'cc-by') continue;
        out.push(makeAsset({
          id: it.uid, type: 'model3d', title: it.name,
          author: it.user?.displayName || it.user?.username, license, licenseUrl: it.license?.url ?? '',
          thumbnailUrl: pickThumb(it.thumbnails?.images), previewUrl: null,
          sourceName: 'Sketchfab', sourceUrl: it.viewerUrl ?? `https://sketchfab.com/models/${it.uid}`, downloadUrl: null,
        }));
      }
      return out;
    },
  };
}
