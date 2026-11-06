export type AssetType = 'model3d' | 'sprite' | 'audio' | 'font' | 'code';
export type License = 'cc0' | 'cc-by' | 'ofl' | 'apache-2.0';

export interface Asset {
  id: string;
  type: AssetType;
  title: string;
  author: string;
  license: License;
  licenseUrl: string;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  sourceName: string;
  sourceUrl: string;
  downloadUrl: string | null;
  attributionText: string;
}

export interface SourceStatus {
  source: string;
  ok: boolean;
  error?: 'sin-configurar' | 'timeout' | 'error';
}

export interface SearchResponse {
  results: Asset[];
  sources: SourceStatus[];
}

export interface Adapter {
  name: string;
  types: AssetType[];
  requiresKey: string | null;
  search(query: string, type: AssetType, signal: AbortSignal): Promise<Asset[]>;
}
