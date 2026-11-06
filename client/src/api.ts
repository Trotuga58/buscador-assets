import type { AssetType, SearchResponse } from '../../shared/types.ts';

export async function search(q: string, type: AssetType | 'all', fetchFn: typeof fetch = fetch): Promise<SearchResponse> {
  const res = await fetchFn(`/api/search?${new URLSearchParams({ q, type })}`);
  if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
  return (await res.json()) as SearchResponse;
}
