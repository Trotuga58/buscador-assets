# Buscador de assets libres

Busca en un solo sitio modelos 3D, sprites/2D, música y sonidos, fuentes y packs, y enseña solo lo que es CC0 o CC-BY
(las fuentes tipográficas, OFL o Apache 2.0). Cada resultado trae el texto de atribución listo para copiar.

## Crear el ejecutable de Windows (una sola vez)

1. Instala Node.js (versión LTS) desde https://nodejs.org si no lo tienes.
2. Abre una terminal en esta carpeta y ejecuta:

```bash
npm install
npm run dist
```

3. Saldrá `release/Buscador-de-assets.exe`. Haz doble clic para abrirlo, o cópialo donde quieras (no necesita instalación).
4. Dentro de la app, pulsa **Ajustes** y pega tus claves gratuitas. Se guardan en tu usuario de Windows, no en el `.exe`.

Windows puede avisar de "aplicación desconocida" porque el programa no está firmado: pulsa "Más información" y "Ejecutar de todas formas".
Si quieres probarlo sin crear el `.exe`: `npm run electron`.

## Arrancar sin ejecutable (para desarrollar)

```bash
npm install
cp .env.example .env     # opcional: o pega las claves en Ajustes
npm run dev:server       # http://127.0.0.1:3001
npm run dev:client       # en otra terminal; abre la dirección que imprime Vite
```

Sin claves funciona la lista curada (2D, 3D y audio de juegos) y Openverse (solo audio). Las demás fuentes aparecen como "sin configurar" hasta que añadas su clave.

## Claves gratuitas (los enlaces pueden haber cambiado)

| Variable en `.env` | Fuente | Dónde se saca |
|---|---|---|
| `FREESOUND_API_KEY` | Freesound | https://freesound.org/apiv2/apply |
| `POLYPIZZA_API_KEY` | Poly Pizza | https://poly.pizza (ajustes de cuenta, sección API) |
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
