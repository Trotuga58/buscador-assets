import { useEffect, useState, type FormEvent } from 'react';
import type { Asset, AssetType, SearchResponse } from '../../shared/types.ts';
import { addFavorite, getSettings, listFavorites, removeFavorite, saveSettings, search } from './api.ts';
import { TABS } from './logic.ts';
import { ResultGrid } from './components/ResultGrid.tsx';
import { ExternalSearch } from './components/ExternalSearch.tsx';
import { SettingsPanel } from './components/SettingsPanel.tsx';
import { Favorites } from './components/Favorites.tsx';
import { SourceStatusBar } from './components/SourceStatusBar.tsx';

export function App() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<AssetType | 'all'>('all');
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [favorites, setFavorites] = useState<Asset[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [keyStatus, setKeyStatus] = useState<Record<string, boolean>>({});
  useEffect(() => { getSettings().then(setKeyStatus).catch(() => setKeyStatus({})); }, []);
  useEffect(() => { listFavorites().then(setFavorites).catch(() => setFavorites([])); }, []);

  async function toggleFavorite(a: Asset) {
    const isFav = favorites.some((f) => f.id === a.id);
    try {
      if (isFav) await removeFavorite(a.id); else await addFavorite(a);
      setFavorites(await listFavorites());
    } catch {
      setError('No se pudo actualizar los favoritos.');
    }
  }

  async function run(q: string, t: AssetType | 'all') {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setData(await search(q, t));
    } catch {
      setData(null);
      setError('No se pudo contactar con el servidor. ¿Está arrancado (npm run dev:server)?');
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = (e: FormEvent) => { e.preventDefault(); void run(query, type); };
  const pick = (t: AssetType | 'all') => { setType(t); void run(query, t); };

  return (
    <main>
      <h1>Buscador de assets libres</h1>
      <form onSubmit={onSubmit} role="search">
        <label htmlFor="q">Qué necesitas</label>
        <input id="q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="árbol, música tranquila, botón…" />
        <button type="submit">Buscar</button>
      </form>
      <div role="tablist" aria-label="Tipo de asset">
        {TABS.map((t) => (
          <button key={t.type} role="tab" aria-selected={t.type === type} onClick={() => pick(t.type)}>{t.label}</button>
        ))}
      </div>
      <button type="button" onClick={() => setShowFavorites((v) => !v)} aria-pressed={showFavorites}>
        Favoritos ({favorites.length})
      </button>
      <button type="button" onClick={() => setShowSettings((v) => !v)} aria-pressed={showSettings}>Ajustes</button>
      {showSettings && <SettingsPanel status={keyStatus} onSave={async (k) => { setKeyStatus(await saveSettings(k)); }} />}
      {showFavorites && <Favorites items={favorites} onToggle={toggleFavorite} />}
      {loading && <p role="status">Buscando…</p>}
      {error && <p role="alert">{error}</p>}
      {data && <SourceStatusBar sources={data.sources} />}
      {data && <ExternalSearch query={query} type={type} />}
      {data && <ResultGrid results={data.results} searched favoriteIds={new Set(favorites.map((f) => f.id))} onToggleFavorite={toggleFavorite} />}
    </main>
  );
}
