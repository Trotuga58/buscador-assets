import type { Adapter, Asset, AssetType } from '../../../shared/types.ts';
import { normalizeLicense } from '../license.ts';
import { makeAsset } from './util.ts';

export interface CuratedEntry {
  title: string; author: string; type: AssetType; license: string; licenseUrl: string; url: string; tags: string[];
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function createCuratedAdapter(data: CuratedEntry[]): Adapter {
  const entries = data.flatMap((e) => {
    const license = normalizeLicense(e.license);
    return license === 'cc0' || license === 'cc-by' ? [{ e, license, hay: fold([e.title, e.author, ...e.tags].join(' ')) }] : [];
  });

  return {
    name: 'Lista curada',
    types: ['sprite', 'model3d', 'audio', 'code'],
    requiresKey: null,
    async search(query, type) {
      const words = fold(query).split(/\s+/).filter(Boolean);
      const out: Asset[] = [];
      for (const { e, license, hay } of entries) {
        if (e.type !== type || !words.every((w) => hay.includes(w))) continue;
        out.push(makeAsset({
          id: fold(e.title).replace(/[^a-z0-9]+/g, '-'), type: e.type, title: e.title, author: e.author, license,
          licenseUrl: e.licenseUrl, sourceName: 'Lista curada', sourceUrl: e.url, downloadUrl: null,
        }));
      }
      return out;
    },
  };
}
