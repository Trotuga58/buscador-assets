# Buscador de assets libres: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una web de uso personal que busca assets libres (3D, 2D, audio, fuentes, código) en varias fuentes y los muestra con licencia, atribución lista para copiar y vista previa.

**Architecture:** Servidor Node + TypeScript con un adaptador por fuente que devuelve un formato común; un agregador los consulta en paralelo, cachea en disco y tolera fallos por fuente. Cliente React + TypeScript (Vite) que consume `GET /api/search`.

**Tech Stack:** Node 20+, TypeScript, Fastify, Vitest, React, Vite, `@google/model-viewer`.

**Spec:** `diseno-buscador-assets.md` (aprobado 2026-11-06).

## Global Constraints

- Solo licencias `cc0` y `cc-by`. Cualquier resultado con licencia desconocida, NC o ND se descarta en el servidor, nunca llega al cliente.
- Todo resultado lleva `attributionText` no vacío (aunque sea CC0, con el autor y la fuente).
- No se aloja ni redistribuye ningún archivo: solo enlaces (`sourceUrl`, `downloadUrl`).
- Las claves de API viven solo en `.env` (nunca en el cliente ni en git). Existe `.env.example`.
- Servidor escucha solo en `127.0.0.1`.
- Interfaz en español. Todo en TypeScript, tipos compartidos en `shared/types.ts`.
- Cada adaptador implementa la misma interfaz; si uno falla, los demás siguen.
- Caché en disco con caducidad de 24 h.
- Las respuestas de las APIs externas se anotaron de memoria en el diseño: cada adaptador debe verificarse contra la API real antes de darse por bueno (ver Task 10).

## Review Focus

- Una fuente devuelve un resultado con licencia ausente, rara o NC: se descarta, no se muestra como libre.
- Una fuente tarda o falla (timeout, 429, 500): el resto de resultados llega y el cliente dice qué fuente falló.
- Búsqueda vacía o solo espacios: respuesta clara sin consultar fuentes.
- Resultado sin miniatura, sin autor o con título vacío: se muestra con valores de reserva sin romper la cuadrícula.
- Falta la clave de una fuente en `.env`: esa fuente se marca como "sin configurar", el resto funciona.

---

## Estructura de archivos

- `shared/types.ts`: tipos comunes.
- `server/src/license.ts`: normaliza licencias a `cc0 | cc-by | null`.
- `server/src/cache.ts`: caché en disco.
- `server/src/adapters/*.ts`: un archivo por fuente.
- `server/src/search.ts`: agregador.
- `server/src/index.ts`: servidor Fastify y rutas.
- `server/data/curated.json`: lista curada.
- `client/src/*`: interfaz.

### Task 1: Andamiaje, tipos y licencias

**Files:**
- Create: `package.json` (workspaces `server`, `client`), `server/package.json`, `server/tsconfig.json`, `shared/types.ts`, `server/src/license.ts`, `.gitignore` (incluye `.env`, `server/.cache/`), `.env.example`
- Test: `server/src/license.test.ts`

**Interfaces:**
- Produces:
  - `type AssetType = 'model3d' | 'sprite' | 'audio' | 'font' | 'code'`
  - `type License = 'cc0' | 'cc-by'`
  - `interface Asset { id: string; type: AssetType; title: string; author: string; license: License; licenseUrl: string; thumbnailUrl: string | null; previewUrl: string | null; sourceName: string; sourceUrl: string; downloadUrl: string | null; attributionText: string }`
  - `interface SourceStatus { source: string; ok: boolean; error?: 'sin-configurar' | 'timeout' | 'error' }`
  - `interface SearchResponse { results: Asset[]; sources: SourceStatus[] }`
  - `interface Adapter { name: string; types: AssetType[]; requiresKey: string | null; search(query: string, type: AssetType, signal: AbortSignal): Promise<Asset[]> }`
  - `normalizeLicense(raw: string | null | undefined): License | null`
  - `buildAttribution(a: { title: string; author: string; license: License; sourceName: string; sourceUrl: string }): string`

- [ ] **Step 1: Escribir tests** en `license.test.ts`: `normalizeLicense('CC0 1.0')`→`'cc0'`; `'cc0'`, `'Creative Commons 0'`, `'publicdomain/zero'`→`'cc0'`; `'CC BY 4.0'`, `'by'`, `'CC-BY-3.0'`→`'cc-by'`; `'CC BY-NC 4.0'`, `'by-sa'`, `'by-nd'`, `''`, `null`, `'all rights reserved'`→`null`; `buildAttribution` incluye título, autor, licencia y URL de origen.
- [ ] **Step 2: Ejecutar** `npm test -w server` y comprobar que falla (módulo no existe).
- [ ] **Step 3: Implementar** `license.ts`. Tratar `by-sa` y `by-nc*` como `null` (SA obliga a compartir igual, fuera del alcance "sin preocuparse").
- [ ] **Step 4: Ejecutar** los tests y comprobar que pasan.
- [ ] **Step 5: Commit** `feat: andamiaje, tipos y normalización de licencias`.

### Task 2: Caché y agregador

**Files:**
- Create: `server/src/cache.ts`, `server/src/search.ts`
- Test: `server/src/cache.test.ts`, `server/src/search.test.ts`

**Interfaces:**
- Consumes: `Adapter`, `Asset`, `SearchResponse` (Task 1).
- Produces:
  - `createCache(dir: string, ttlMs: number): { get<T>(key: string): Promise<T | null>; set<T>(key: string, value: T): Promise<void> }`
  - `runSearch(adapters: Adapter[], query: string, type: AssetType | 'all', opts: { cache: ReturnType<typeof createCache>; env: Record<string, string | undefined>; timeoutMs: number }): Promise<SearchResponse>`

- [ ] **Step 1: Tests de caché**: `set` luego `get` devuelve el valor; con `ttlMs` vencido devuelve `null`; clave con caracteres raros no rompe (se usa hash como nombre de archivo).
- [ ] **Step 2: Tests del agregador** con adaptadores falsos: (a) uno falla y otro responde → `results` del bueno y `sources` con `ok:false, error:'error'` para el malo; (b) uno que tarda más que `timeoutMs` → `error:'timeout'`; (c) adaptador con `requiresKey` y `env` sin esa clave → `error:'sin-configurar'` y no se llama a `search`; (d) consulta `'   '` → `{results:[],sources:[]}` sin llamar a nadie; (e) segunda llamada igual usa la caché (el adaptador falso se invoca una vez); (f) resultado con `attributionText` vacío o licencia fuera de `cc0|cc-by` se descarta.
- [ ] **Step 3: Ejecutar** y comprobar que fallan.
- [ ] **Step 4: Implementar** ambos. Consultas con `Promise.allSettled` y un `AbortController` por adaptador. No cachear fallos.
- [ ] **Step 5: Ejecutar** y comprobar que pasan.
- [ ] **Step 6: Commit** `feat: caché en disco y agregador tolerante a fallos`.

### Task 3: Servidor y ruta de búsqueda

**Files:**
- Create: `server/src/index.ts`, `server/src/adapters/index.ts` (lista `allAdapters: Adapter[]`, de momento vacía)
- Test: `server/src/index.test.ts`

**Interfaces:**
- Consumes: `runSearch`, `createCache`.
- Produces: `buildServer(deps: { adapters: Adapter[]; env: Record<string,string|undefined>; cacheDir: string }): FastifyInstance` con `GET /api/search?q=&type=` (`type` ∈ `AssetType | 'all'`, por defecto `all`) y `GET /api/health`.

- [ ] **Step 1: Tests** con `fastify.inject`: `/api/health`→200; `/api/search?q=arbol&type=model3d` devuelve `SearchResponse`; `type=invalido`→400 con mensaje en español; falta `q`→400.
- [ ] **Step 2: Ejecutar** y comprobar que fallan.
- [ ] **Step 3: Implementar** `buildServer` y el arranque en `index.ts` (host `127.0.0.1`, puerto 3001, carga de `.env` con `process.loadEnvFile` o `dotenv`).
- [ ] **Step 4: Ejecutar** y comprobar que pasan.
- [ ] **Step 5: Commit** `feat: servidor y ruta de búsqueda`.

### Task 4: Adaptador Openverse (imágenes y audio)

**Files:**
- Create: `server/src/adapters/openverse.ts`, `server/src/adapters/__fixtures__/openverse-images.json`, `openverse-audio.json`
- Test: `server/src/adapters/openverse.test.ts`

**Interfaces:**
- Consumes: `Adapter`, `normalizeLicense`, `buildAttribution`.
- Produces: `createOpenverseAdapter(fetchFn?: typeof fetch): Adapter` con `name: 'Openverse'`, `types: ['sprite','audio']`, `requiresKey: null`.

- [ ] **Step 1: Tests** con `fetchFn` simulado y fixtures: mapea imágenes a `type:'sprite'` y audios a `type:'audio'`; usa `license_url` para el campo `licenseUrl`; descarta resultados con licencia `by-sa`/`by-nc`; título vacío → `'Sin título'`; autor ausente → `'Desconocido'`; pide solo licencias `cc0,by` en la consulta (parámetro `license`).
- [ ] **Step 2: Ejecutar** y comprobar que fallan.
- [ ] **Step 3: Implementar** contra la API pública de Openverse; los fixtures se rellenan con una respuesta real (ver Task 10).
- [ ] **Step 4: Ejecutar** y comprobar que pasan; registrar el adaptador en `allAdapters`.
- [ ] **Step 5: Commit** `feat: adaptador Openverse`.

### Task 5: Adaptadores 3D (Poly Pizza y Sketchfab)

**Files:**
- Create: `server/src/adapters/polypizza.ts`, `server/src/adapters/sketchfab.ts`, fixtures JSON de cada uno
- Test: `server/src/adapters/polypizza.test.ts`, `server/src/adapters/sketchfab.test.ts`

**Interfaces:**
- Produces: `createPolyPizzaAdapter(fetchFn?)` (`requiresKey: 'POLYPIZZA_API_KEY'`) y `createSketchfabAdapter(fetchFn?)` (`requiresKey: 'SKETCHFAB_API_KEY'`), ambos `types: ['model3d']`.

- [ ] **Step 1: Tests** por adaptador, con fixtures: mapeo al formato común; `previewUrl` es un `.glb` cuando la fuente lo da, o `null` si no (Sketchfab sin descarga directa → `downloadUrl: null` y se enlaza a la página); licencia fuera de `cc0|cc-by` se descarta; la clave se envía en la cabecera o parámetro que pida cada API.
- [ ] **Step 2: Ejecutar** y comprobar que fallan.
- [ ] **Step 3: Implementar** ambos. Sketchfab: filtrar en la propia consulta por licencias CC0/CC-BY.
- [ ] **Step 4: Ejecutar** y comprobar que pasan; registrar ambos.
- [ ] **Step 5: Commit** `feat: adaptadores Poly Pizza y Sketchfab`.

### Task 6: Adaptador Freesound

**Files:**
- Create: `server/src/adapters/freesound.ts`, fixture JSON
- Test: `server/src/adapters/freesound.test.ts`

**Interfaces:**
- Produces: `createFreesoundAdapter(fetchFn?)` con `types: ['audio']`, `requiresKey: 'FREESOUND_API_KEY'`.

- [ ] **Step 1: Tests**: mapea nombre, usuario, licencia y `previewUrl` (MP3 de previsualización); descarta licencias NC y sampling+; `downloadUrl: null` (la descarga exige cuenta) y `sourceUrl` apunta a la página del sonido.
- [ ] **Step 2: Ejecutar**, fallan.
- [ ] **Step 3: Implementar** con filtro de licencia en la consulta.
- [ ] **Step 4: Ejecutar**, pasan; registrar.
- [ ] **Step 5: Commit** `feat: adaptador Freesound`.

### Task 7: Fuentes (Google Fonts) y lista curada

**Files:**
- Create: `server/src/adapters/googlefonts.ts`, `server/src/adapters/curated.ts`, `server/data/curated.json`, fixture de Google Fonts
- Test: `server/src/adapters/googlefonts.test.ts`, `server/src/adapters/curated.test.ts`

**Interfaces:**
- Produces: `createGoogleFontsAdapter(fetchFn?)` (`types: ['font']`, `requiresKey: 'GOOGLE_FONTS_API_KEY'`) y `createCuratedAdapter(data: CuratedEntry[])` (`types: ['sprite','model3d','audio','code']`, `requiresKey: null`) con `interface CuratedEntry { title: string; author: string; type: AssetType; license: string; licenseUrl: string; url: string; tags: string[] }`.

- [ ] **Step 1: Tests de Google Fonts**: sus licencias son OFL o Apache, no CC. Por eso `License` se amplía con `'ofl' | 'apache-2.0'`, válidas solo para `type:'font'`. El test comprueba que una fuente con licencia OFL llega con `license:'ofl'` y atribución, y que el filtro de Task 2 acepta `ofl`/`apache-2.0` únicamente cuando `type==='font'` (en otro tipo se descarta).
- [ ] **Step 2: Tests de la lista curada**: búsqueda por título y por etiqueta sin distinguir mayúsculas ni tildes; filtra por `type`; entradas cuya licencia no normaliza a `cc0|cc-by` se descartan al cargar.
- [ ] **Step 3: Ejecutar**, fallan.
- [ ] **Step 4: Implementar** ambos; ajustar `License` en `shared/types.ts` y el filtro de `search.ts` y `normalizeLicense` (nuevos tests ahí). Rellenar `curated.json` con al menos 10 packs (Kenney, OpenGameArt CC0, etc.) cuya licencia el usuario o yo comprobemos en su página.
- [ ] **Step 5: Ejecutar** toda la suite, pasa.
- [ ] **Step 6: Commit** `feat: Google Fonts, lista curada y licencias de fuentes`.

### Task 8: Cliente: búsqueda, cuadrícula y estado por fuente

**Files:**
- Create: `client/package.json`, `client/vite.config.ts` (proxy `/api` → `127.0.0.1:3001`), `client/index.html`, `client/src/main.tsx`, `client/src/App.tsx`, `client/src/api.ts`, `client/src/components/ResultGrid.tsx`, `client/src/components/SourceStatusBar.tsx`
- Test: `client/src/App.test.tsx` (Vitest + Testing Library)

**Interfaces:**
- Consumes: `SearchResponse` y `Asset` de `shared/types.ts`.
- Produces: `search(q: string, type: AssetType | 'all'): Promise<SearchResponse>` en `api.ts`.

- [ ] **Step 1: Tests** con `search` simulado: pestañas "Todo, 3D, 2D, Audio, Fuentes, Código" cambian el `type` pedido; se muestran las tarjetas con título, autor y distintivo de licencia; una fuente con `ok:false` aparece como "Openverse no respondió" (o "sin configurar" con el texto de ayuda); una tarjeta sin `thumbnailUrl` muestra un marcador de reserva; con lista vacía aparece "No se encontró nada con licencia libre".
- [ ] **Step 2: Ejecutar**, fallan.
- [ ] **Step 3: Implementar** interfaz sencilla y accesible (enfocable con teclado, textos en español).
- [ ] **Step 4: Ejecutar**, pasan.
- [ ] **Step 5: Commit** `feat: cliente de búsqueda`.

### Task 9: Vista previa, atribución y favoritos

**Files:**
- Create: `client/src/components/Preview.tsx`, `client/src/components/CopyAttribution.tsx`, `server/src/favorites.ts`, rutas `GET/POST/DELETE /api/favorites` en `index.ts`, `client/src/components/Favorites.tsx`
- Test: `client/src/components/Preview.test.tsx`, `client/src/components/CopyAttribution.test.tsx`, `server/src/favorites.test.ts`

**Interfaces:**
- Produces: `createFavorites(file: string): { list(): Promise<Asset[]>; add(a: Asset): Promise<void>; remove(id: string): Promise<void> }`.

- [ ] **Step 1: Tests**: `Preview` muestra `<model-viewer>` para `model3d` con `previewUrl`, `<audio controls>` para `audio`, `<img>` para `sprite`, y solo miniatura si no hay `previewUrl`; `CopyAttribution` pone `attributionText` en el portapapeles y avisa "Copiado"; favoritos: añadir dos veces el mismo `id` no duplica, `remove` lo quita, el archivo corrupto se trata como lista vacía.
- [ ] **Step 2: Ejecutar**, fallan.
- [ ] **Step 3: Implementar**. Botones "Ir a la fuente" (`sourceUrl`) y "Descargar" (solo si `downloadUrl`).
- [ ] **Step 4: Ejecutar**, pasan.
- [ ] **Step 5: Commit** `feat: vista previa, copiar atribución y favoritos`.

### Task 10: Verificación contra las APIs reales y guía de claves

**Files:**
- Create: `README.md` (guía paso a paso para sacar cada clave gratuita y arrancar), `server/scripts/smoke.ts`
- Modify: fixtures y adaptadores según lo que devuelvan las APIs reales

**Interfaces:**
- Consumes: `allAdapters`.
- Produces: `npm run smoke -w server` que lanza una búsqueda real ("tree", "music", "pixel") a cada adaptador configurado e imprime número de resultados y primera licencia.

- [ ] **Step 1: Escribir** `smoke.ts` y el README (qué clave va en qué variable de `.env`, enlaces de registro, cómo arrancar servidor y cliente).
- [ ] **Step 2: Ejecutar** en el ordenador del usuario con sus claves: `npm run smoke -w server`. Esperado: cada fuente configurada devuelve ≥1 resultado con licencia `cc0`/`cc-by` (u `ofl`/`apache-2.0` en fuentes).
- [ ] **Step 3: Corregir** adaptadores y fixtures donde la API real difiera de lo supuesto; repetir el smoke hasta que todas pasen. Reejecutar `npm test`.
- [ ] **Step 4: Commit** `docs: guía de claves y verificación contra APIs reales`.

---

## Autorrevisión

- Cobertura del diseño: formato común (T1), caché y fallos por fuente (T2), servidor local (T3), fuentes iniciales (T4-T7), lista curada (T7), cliente y pestañas (T8), vista previa, atribución y favoritos (T9), verificación de APIs (T10). La clave de que las APIs deben comprobarse queda en T10.
- Decisión que sale del plan: las fuentes de Google Fonts no usan licencias CC, así que `License` se amplía con `ofl` y `apache-2.0` solo para fuentes (T7). Esto matiza "solo CC0 y CC-BY" del diseño y se avisa al usuario.
- Consistencia de nombres: `Asset`, `Adapter`, `SearchResponse`, `SourceStatus`, `runSearch`, `createCache`, `normalizeLicense`, `buildAttribution` se usan igual en todas las tareas.
