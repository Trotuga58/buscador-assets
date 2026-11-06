# Buscador de assets libres

Busca en un solo sitio modelos 3D, sprites/2D, música y sonidos, fuentes y packs, y enseña solo lo que es CC0 o CC-BY
(las fuentes tipográficas, OFL o Apache 2.0). Cada resultado trae el texto de atribución listo para copiar.

## Arrancar

```bash
npm install
cp .env.example .env     # y pega tus claves (abajo)
npm run dev:server       # http://127.0.0.1:3001
npm run dev:client       # en otra terminal; abre la dirección que imprime Vite
```

Sin claves funciona Openverse (2D y audio) y la lista curada. Las demás fuentes aparecen como "sin configurar" hasta que añadas su clave.

## Claves gratuitas (los enlaces pueden haber cambiado)

| Variable en `.env` | Fuente | Dónde se saca |
|---|---|---|
| `FREESOUND_API_KEY` | Freesound | https://freesound.org/apiv2/apply |
| `POLYPIZZA_API_KEY` | Poly Pizza | https://poly.pizza (ajustes de cuenta, sección API) |
| `SKETCHFAB_API_KEY` | Sketchfab | https://sketchfab.com/settings/password (token de API) |
| `GOOGLE_FONTS_API_KEY` | Google Fonts | https://developers.google.com/fonts/docs/developer_api |

## Comprobar que todo funciona

```bash
npm test         # tests con datos de ejemplo
npm run smoke    # búsqueda real contra cada API configurada
```

Los datos de ejemplo de los adaptadores se escribieron de memoria sobre cómo responden las APIs. Si `npm run smoke`
muestra errores o cero resultados, hay que ajustar ese adaptador y su archivo de ejemplo en `server/src/adapters/__fixtures__/`.

## Sobre las licencias

- Solo se muestran CC0 y CC-BY (y OFL/Apache en fuentes). Lo demás se descarta en el servidor.
- CC-BY exige poner la atribución: usa el botón "Copiar atribución".
- Google Fonts no indica la licencia de cada fuente por API: las marcamos como OFL (Roboto, como Apache 2.0). Mira la página de la fuente.
- La lista curada (`server/data/curated.json`) se escribió de memoria: comprueba la licencia en la página del pack antes de usarlo.
- Esto es una ayuda, no asesoría legal.
