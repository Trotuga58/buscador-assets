// Empaqueta el servidor (y sus datos) en un solo archivo para la app de escritorio.
import { build } from 'esbuild';

await build({
  entryPoints: ['server/src/app.ts'],
  outfile: 'dist-electron/server.mjs',
  bundle: true, platform: 'node', format: 'esm', target: 'node20', logLevel: 'info',
});
