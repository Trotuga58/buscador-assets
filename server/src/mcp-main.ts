// Conector de Claude en modo desarrollo: `npm run mcp` (en la app de escritorio se usa `Buscador-de-assets.exe --mcp`).
import { join } from 'node:path';
import { startMcp } from './app.ts';

try { process.loadEnvFile('.env'); } catch { /* sin .env: se usan las claves de Ajustes */ }
await startMcp({ dataDir: 'server/.cache', downloadsDir: join('server', '.cache', 'descargas') });
