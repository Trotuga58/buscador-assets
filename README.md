# Buscador de assets libres

Busca en un solo sitio modelos 3D, sprites/2D y música y sonidos, y enseña solo lo que es **CC0** (dominio público):
se usa sin atribuir ni cumplir condiciones, también en proyectos comerciales.

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

## Comprobar que todo funciona

```bash
npm test         # tests con datos de ejemplo
npm run smoke    # búsqueda real contra cada API configurada
```

Los datos de ejemplo de los adaptadores se escribieron de memoria sobre cómo responden las APIs. Si `npm run smoke`
muestra errores o cero resultados, hay que ajustar ese adaptador y su archivo de ejemplo en `server/src/adapters/__fixtures__/`.

## Sobre las licencias

- Solo se muestra CC0. CC BY, OFL, Apache, NC y SA se descartan en el servidor.
- Por eso no hay pestaña de fuentes tipográficas (las libres son OFL/Apache, no CC0). El adaptador de Google Fonts sigue en el código, apagado.
- Aun así, cada descarga lleva un `LICENCIA.txt` con el origen, por si quieres guardarlo.
- La lista curada (`server/data/curated.json`) se escribió de memoria: comprueba la licencia en la página del pack antes de usarlo.
- Esto es una ayuda, no asesoría legal.


## Conectar con Claude (Claude Desktop o Claude Code)

El `.exe` también funciona como conector: Claude puede buscar assets y **descargarlos** a tu ordenador (por ejemplo para importarlos en Blender con su propio conector).

1. Abre la app → **Ajustes** → "Conectar con Claude" → **Copiar configuración**.
2. Claude Desktop: Ajustes → Desarrollador → Editar configuración, pega el bloque en `claude_desktop_config.json` y reinicia Claude.
   Claude Code: `claude mcp add buscador-assets -- "C:\ruta\Buscador-de-assets.exe" --mcp`
3. Pídele a Claude, por ejemplo: "busca una espada low poly y ponla en mi escena de Blender".

Herramientas: `search_assets` (busca; devuelve id, licencia y si se puede descargar) y `download_asset` (baja el archivo a *Documentos → Buscador de assets → descargas*, con un `LICENCIA.txt` al lado, y dice cómo importarlo en Blender).
Solo se pueden descargar los resultados con descarga directa (modelos de Poly Pizza, fuentes, etc.); los packs de pixel art y de Kenney solo tienen enlace a la página del autor.

En desarrollo: `npm run mcp` arranca el mismo conector sin Electron.
