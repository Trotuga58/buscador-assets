import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Asset, AssetType, SearchResponse } from '../../shared/types.ts';
import { addFavorite, getConnect, getSettings, listFavorites, removeFavorite, saveSettings, search } from './api.ts';
import { DEFAULT_TYPE, EXAMPLES, TABS, canSearchWhileTyping } from './logic.ts';
import { AssetDialog } from './components/AssetDialog.tsx';
import { QuickFilters } from './components/QuickFilters.tsx';
import { ExternalSearch } from './components/ExternalSearch.tsx';
import { SettingsPanel } from './components/SettingsPanel.tsx';
import { Favorites } from './components/Favorites.tsx';
import { ResultGrid } from './components/ResultGrid.tsx';
import { SourceStatusBar } from './components/SourceStatusBar.tsx';

export function App() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<AssetType | 'all'>(DEFAULT_TYPE);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Asset[]>([]);
  const [panel, setPanel] = useState<'favorites' | 'settings' | null>(null);
  const [keyStatus, setKeyStatus] = useState<Record<string, boolean>>({});
  const [connectCommand, setConnectCommand] = useState<string | null>(null);
  const [open, setOpen] = useState<Asset | null>(null);
  const lastKey = useRef('');
  const ticket = useRef(0);

  useEffect(() => { listFavorites().then(setFavorites).catch(() => setFavorites([])); }, []);
  useEffect(() => { getSettings().then(setKeyStatus).catch(() => setKeyStatus({})); }, []);
  useEffect(() => { getConnect().then((c) => setConnectCommand(c.command)).catch(() => setConnectCommand(null)); }, []);

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
    lastKey.current = `${t}|${q.trim()}`;
    const mine = ++ticket.current;
    setPanel(null);
    setLoading(true);
    setError(null);
    try {
      const out = await search(q, t);
      if (mine === ticket.current) setData(out);
    } catch {
      if (mine !== ticket.current) return;
      setData(null);
      setError('No se pudo contactar con el servidor. ¿Está arrancado (npm run dev:server)?');
    } finally {
      if (mine === ticket.current) setLoading(false);
    }
  }

  // Buscar mientras se escribe (como Poly Pizza): espera un momento tras la última letra y descarta respuestas viejas.
  useEffect(() => {
    if (!query.trim()) { ticket.current++; lastKey.current = ''; setData(null); setLoading(false); return; }
    if (!canSearchWhileTyping(query) || lastKey.current === `${type}|${query.trim()}`) return;
    const timer = setTimeout(() => { void run(query, type); }, 350);
    return () => clearTimeout(timer);
  }, [query, type]);

  const onSubmit = (e: FormEvent) => { e.preventDefault(); void run(query, type); };
  const pick = (t: AssetType | 'all') => setType(t);
  const example = (q: string) => setQuery(q);
  const quick = (q: string) => { setType('sprite'); setQuery(q); };
  const toggle = (p: 'favorites' | 'settings') => setPanel((cur) => (cur === p ? null : p));

  return (
    <div className="shell">
      <header className="top">
        <h1>Buscador de assets</h1>
        <nav aria-label="Secciones">
          <button type="button" className="btn" aria-pressed={panel === 'favorites'} onClick={() => toggle('favorites')}>
            Favoritos ({favorites.length})
          </button>
          <button type="button" className="btn" aria-pressed={panel === 'settings'} onClick={() => toggle('settings')}>Ajustes</button>
        </nav>
      </header>

      <main>
        <form onSubmit={onSubmit} role="search" className="finder">
          <label htmlFor="q" className="sr-only">Qué necesitas</label>
          <input id="q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Qué necesitas: espada, mazmorra, música épica…" autoFocus />
          <button type="submit" className="btn btn-primary btn-big">Buscar</button>
        </form>

        <div role="tablist" aria-label="Tipo de asset" className="tabs">
          {TABS.map((t) => (
            <button key={t.type} role="tab" aria-selected={t.type === type} onClick={() => pick(t.type)}>{t.label}</button>
          ))}
        </div>

        {type === 'sprite' && <QuickFilters onPick={quick} />}

        {panel === 'settings' && <SettingsPanel status={keyStatus} connectCommand={connectCommand} onSave={async (k) => { setKeyStatus(await saveSettings(k)); }} />}
        {panel === 'favorites' && <Favorites items={favorites} onOpen={setOpen} />}

        {!panel && (
          <>
            {loading && <p role="status" className="note">Buscando…</p>}
            {error && <p role="alert" className="note note-error">{error}</p>}
            {data && <SourceStatusBar sources={data.sources} />}
            {data && <ExternalSearch query={query} type={type} />}
            {data && <ResultGrid results={data.results} searched onOpen={setOpen} />}
            {!data && !loading && !error && (
              <section className="intro">
                <p>Sprites pixel art, modelos 3D, sonidos y fuentes con licencia libre, listos para usar en tus juegos.</p>
                <p className="legend">
                  <span className="badge" data-license="cc0">CC0</span> sin obligación de atribuir.{' '}
                  <span className="badge" data-license="cc-by">CC BY</span> hay que atribuir: usa el botón Copiar atribución.
                </p>
                <p>Prueba con:</p>
                <ul className="chips">
                  {EXAMPLES.map((x) => <li key={x}><button type="button" onClick={() => example(x)}>{x}</button></li>)}
                </ul>
              </section>
            )}
          </>
        )}
      </main>

      {open && (
        <AssetDialog asset={open} onClose={() => setOpen(null)} favorite={favorites.some((f) => f.id === open.id)} onToggleFavorite={toggleFavorite} />
      )}
    </div>
  );
}
