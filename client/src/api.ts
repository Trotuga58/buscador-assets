import type { AssetType, SearchResponse } from '../../shared/types.ts';

export async function search(q: string, type: AssetType | 'all', fetchFn: typeof fetch = fetch): Promise<SearchResponse> {
  const res = await fetchFn(`/api/search?${new URLSearchParams({ q, type })}`);
  if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
  return (await res.json()) as SearchResponse;
}

import type { Asset } from '../../shared/types.ts';

async function ok(res: Response): Promise<Response> {
  if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
  return res;
}

export async function listFavorites(fetchFn: typeof fetch = fetch): Promise<Asset[]> {
  return (await (await ok(await fetchFn('/api/favorites'))).json()) as Asset[];
}

export async function addFavorite(a: Asset, fetchFn: typeof fetch = fetch): Promise<void> {
  await ok(await fetchFn('/api/favorites', { method: 'POST', body: JSON.stringify(a), headers: { 'content-type': 'application/json' } }));
}

export async function removeFavorite(id: string, fetchFn: typeof fetch = fetch): Promise<void> {
  await ok(await fetchFn(`/api/favorites/${encodeURIComponent(id)}`, { method: 'DELETE' }));
}
