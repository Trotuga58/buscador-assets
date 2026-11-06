import type { Adapter, Asset, License } from '../../../shared/types.ts';
import { getJson, makeAsset, type FetchFn } from './util.ts';

interface GfItem { family: string }

const APACHE = new Set(['roboto', 'roboto condensed', 'roboto mono', 'roboto slab']);

export function createGoogleFontsAdapter(fetchFn: FetchFn = fetch, getKey = () => process.env.GOOGLE_FONTS_API_KEY): Adapter {
  let list: Promise<GfItem[]> | null = null;
  let loadedAt = 0;

  return {
    name: 'Google Fonts',
    types: ['font'],
    requiresKey: 'GOOGLE_FONTS_API_KEY',
    async search(query, type, signal) {
      if (type !== 'font') return [];
      if (!list || Date.now() - loadedAt > 24 * 60 * 60 * 1000) {
        loadedAt = Date.now();
        list = getJson<{ items?: GfItem[] }>(
          fetchFn, `https://www.googleapis.com/webfonts/v1/webfonts?key=${encodeURIComponent(getKey() ?? '')}&sort=popularity`, signal,
        ).then((d) => d.items ?? []).catch((e) => { list = null; throw e; });
      }
      const q = query.toLowerCase();
      const out: Asset[] = [];
      for (const it of await list) {
        if (!it.family.toLowerCase().includes(q)) continue;
        const license: License = APACHE.has(it.family.toLowerCase()) ? 'apache-2.0' : 'ofl';
        const slug = it.family.replace(/ /g, '+');
        out.push(makeAsset({
          id: slug, type: 'font', title: it.family, author: 'Google Fonts', license,
          licenseUrl: `https://fonts.google.com/specimen/${slug}/license`,
          sourceName: 'Google Fonts', sourceUrl: `https://fonts.google.com/specimen/${slug}`,
          downloadUrl: `https://fonts.google.com/download?family=${encodeURIComponent(it.family)}`,
        }));
        if (out.length >= 20) break;
      }
      return out;
    },
  };
}
