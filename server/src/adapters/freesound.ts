import type { Adapter, Asset } from '../../../shared/types.ts';
import { normalizeLicense } from '../license.ts';
import { getJson, makeAsset, type FetchFn } from './util.ts';

interface FsItem {
  id: number; name?: string; username?: string; license?: string; url?: string;
  previews?: Record<string, string>; images?: Record<string, string>;
}

export function createFreesoundAdapter(fetchFn: FetchFn = fetch, getKey = () => process.env.FREESOUND_API_KEY): Adapter {
  return {
    name: 'Freesound',
    types: ['audio'],
    requiresKey: 'FREESOUND_API_KEY',
    async search(query, type, signal) {
      if (type !== 'audio') return [];
      const params = new URLSearchParams({
        query, page_size: '20', fields: 'id,name,username,license,url,previews,images',
        filter: 'license:"Creative Commons 0"',
      });
      const data = await getJson<{ results?: FsItem[] }>(fetchFn, `https://freesound.org/apiv2/search/text/?${params}`, signal, {
        authorization: `Token ${getKey() ?? ''}`,
      });
      const out: Asset[] = [];
      for (const it of data.results ?? []) {
        const license = normalizeLicense(it.license);
        if (license !== 'cc0' || !it.url) continue;
        out.push(makeAsset({
          id: String(it.id), type: 'audio', title: it.name, author: it.username, license, licenseUrl: it.license ?? '',
          thumbnailUrl: it.images?.waveform_m ?? null,
          previewUrl: it.previews?.['preview-hq-mp3'] ?? it.previews?.['preview-lq-mp3'] ?? null,
          sourceName: 'Freesound', sourceUrl: it.url, downloadUrl: null,
        }));
      }
      return out;
    },
  };
}
