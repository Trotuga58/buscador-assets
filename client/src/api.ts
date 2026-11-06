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

export async function getSettings(fetchFn: typeof fetch = fetch): Promise<Record<string, boolean>> {
  return (await (await ok(await fetchFn('/api/settings'))).json()) as Record<string, boolean>;
}

export async function saveSettings(keys: Record<string, string>, fetchFn: typeof fetch = fetch): Promise<Record<string, boolean>> {
  const res = await ok(await fetchFn('/api/settings', { method: 'PUT', body: JSON.stringify(keys), headers: { 'content-type': 'application/json' } }));
  return (await res.json()) as Record<string, boolean>;
}

export async function getConnect(fetchFn: typeof fetch = fetch): Promise<{ command: string | null; args: string[] }> {
  return (await (await ok(await fetchFn('/api/connect'))).json()) as { command: string | null; args: string[] };
}
