import { startServer } from './app.ts';

try { process.loadEnvFile('.env'); } catch { /* sin .env: las claves se pueden poner en Ajustes */ }
const { port } = await startServer({ port: 3001, dataDir: 'server/.cache' });
console.log(`Servidor en http://127.0.0.1:${port}`);
