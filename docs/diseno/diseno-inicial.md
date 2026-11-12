# Buscador de assets libres: diseño

> Documento de diseño inicial (2026-11-06), conservado como registro de las decisiones.
> Después el alcance cambió: la app muestra solo CC0 y pasó a ser una app de escritorio con Electron y un conector MCP.

## 1. Intención y porqué
Una web para uso personal del usuario donde escribe lo que necesita para sus proyectos (su app de estudio, sus vídeos animados, juegos) y obtiene en un solo sitio resultados de varias fuentes públicas: modelos 3D, sprites 2D y UI, música y efectos de sonido, fuentes, y efectos visuales, shaders y código. Evita tener que abrir diez webs distintas y comprobar la licencia de cada una.

Más adelante podría publicarse para más gente; el diseño no debe impedirlo, pero no se construye para eso ahora.

## 2. Metas, no metas y anti-metas
Metas
- Una sola búsqueda, resultados unificados, con vista previa (visor 3D, reproductor, miniatura).
- Cada resultado muestra su licencia y el texto de atribución listo para copiar.
- Solo se muestran CC0 y CC-BY por defecto, aptas para uso comercial.
- Cada resultado lleva al enlace de descarga o a la página original.

No metas
- No aloja ni redistribuye archivos: solo enlaza a la fuente.
- No es una tienda ni tiene cuentas de usuario.
- No se publica en esta fase.

Anti-metas (fracasaría aunque funcione técnicamente)
- Que muestre como libre algo que no lo es, o que pierda la atribución obligatoria.
- Que las claves de las APIs acaben en el navegador o en el repositorio.
- Que dependa de tantas fuentes frágiles que se rompa cada semana.

## 3. Alcance de contenido (decidido por el usuario)
Modelos 3D, sprites/2D y UI, música y sonidos/efectos, y efectos visuales, shaders, fuentes y código. Licencias: solo CC0 y CC-BY (decidido por el usuario).

## 4. Enfoques considerados
- A. Solo web, sin servidor. Simple, pero muchas APIs bloquean llamadas desde el navegador (CORS) y las claves quedan a la vista. Rehacer para publicar.
- B. Web + pequeño servidor local en Node. ELEGIDO por el usuario. Guarda claves en `.env`, unifica resultados, cachea, y sirve igual al publicar.
- C. App de escritorio (Electron). Misma base que B con más complejidad y sin ventaja para uso personal.

## 5. Arquitectura
- Cliente: React + TypeScript (Vite), como la app de estudio. Cuadrícula de resultados, filtros por tipo y licencia, vista previa, botón "copiar atribución".
- Servidor: Node + TypeScript (Express o Fastify, a elección del programador). Un endpoint `GET /api/search?q=...&type=...` que consulta en paralelo las fuentes del tipo pedido y devuelve un formato común.
- Formato común de resultado: `id`, `type` (model3d, sprite, audio, font, code), `title`, `author`, `license` (cc0 | cc-by), `licenseUrl`, `thumbnailUrl`, `previewUrl` (modelo glTF, audio o imagen), `sourceName`, `sourceUrl`, `downloadUrl` (si la fuente lo permite sin iniciar sesión), `attributionText`.
- Cada fuente es un módulo ("adaptador") con la misma interfaz, para añadir o quitar fuentes sin tocar el resto. Si una falla, las demás siguen y la interfaz lo indica.
- Caché en disco con caducidad (por ejemplo 24 h) para no gastar límites de las APIs.
- Lista curada: un archivo JSON propio con packs de fuentes sin API (Kenney, OpenGameArt y similares), buscable por texto y etiquetas. Solo entran packs con licencia CC0/CC-BY comprobada.
- Claves: archivo `.env` fuera del control de versiones, con un `.env.example`.

## 6. Fuentes iniciales (a verificar al implementar)
Estado de cada API anotado de memoria; el programador debe comprobar condiciones, filtros de licencia y límites actuales antes de depender de ellas.
- Sketchfab (3D): API de búsqueda con filtro de licencia; la descarga puede exigir cuenta. Si es así, el resultado enlaza a la página.
- Poly Pizza (3D): API con clave gratuita; modelos CC0 y CC-BY.
- Freesound (sonidos y música): API con clave gratuita, filtro de licencia y previews.
- Openverse (imágenes y audio): API abierta con filtro de licencia.
- Google Fonts (fuentes): API con clave gratuita; licencias libres propias de las fuentes (OFL, Apache). Se etiquetan como "libre" con su licencia real.
- Lista curada: Kenney, OpenGameArt, packs de efectos visuales, shaders y librerías de código con licencia libre.

## 7. Restricciones
- El entorno donde Claude escribe el código no puede instalar paquetes ni llamar a las APIs reales. El usuario instala y prueba en su ordenador.
- Las claves gratuitas (Freesound, Poly Pizza, Google Fonts y, si hace falta, Sketchfab) las consigue el usuario; Claude da la guía paso a paso.
- Cada fuente puede cambiar o cerrar su API: el diseño por adaptadores limita ese daño.

## 8. Decisiones mías (a revisar)
- Lenguaje de la interfaz: español.
- Todo en TypeScript, cliente y servidor, para compartir tipos.
- Visor 3D con `<model-viewer>` (glTF/GLB) por su sencillez; los formatos sin vista previa muestran miniatura.
- Una vista con pestañas por tipo y una pestaña "Todo".
- Favoritos guardados localmente en un archivo JSON del servidor (sin cuentas), por si el usuario quiere guardar su selección.
- Servidor solo escucha en `localhost`, sin autenticación, porque es de uso personal. Para publicar habría que añadirla.

## 9. Plan por fases
1. Servidor con el formato común, un adaptador (Openverse, que no necesita clave) y caché. Cliente mínimo con búsqueda y cuadrícula.
2. Modelos 3D: Poly Pizza y Sketchfab, con visor.
3. Audio: Freesound y Openverse audio, con reproductor.
4. Fuentes y lista curada (sprites, UI, efectos, shaders, código).
5. Pulido: filtros, copiar atribución, favoritos, errores por fuente.

## 10. Riesgos
- Licencias mal etiquetadas en las fuentes: la atribución mostrada es ayuda, no asesoría legal. Conviene comprobar la página original en usos comerciales importantes.
- Límites de uso de las APIs gratuitas; mitigados con caché.
- Publicar más adelante implica revisar términos de uso de cada API (algunas limitan uso público) y añadir autenticación y límites.

## 11. Pendiente
- Nombre de la app.
- Si el usuario quiere añadir fuentes concretas que ya usa.
