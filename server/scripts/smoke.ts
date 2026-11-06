// Prueba real contra las APIs: npm run smoke
import type { AssetType } from '../../shared/types.ts';
import { allAdapters } from '../src/adapters/index.ts';

try { process.loadEnvFile('.env'); } catch { /* sin .env */ }

const QUERIES: Record<AssetType, string> = { model3d: 'tree', sprite: 'pixel', audio: 'rain', font: 'roboto', code: 'shader' };
let failed = 0;

for (const adapter of allAdapters) {
  if (adapter.name === 'Lista curada') continue; // es local, no usa red
  if (adapter.requiresKey && !process.env[adapter.requiresKey]) {
    console.log(`- ${adapter.name}: SIN CLAVE (${adapter.requiresKey}), se omite`);
    continue;
  }
  for (const type of adapter.types) {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 10_000);
      const found = await adapter.search(QUERIES[type], type, ctl.signal);
      clearTimeout(timer);
      const first = found[0];
      console.log(`${found.length > 0 ? 'OK ' : '?? '} ${adapter.name} [${type}] "${QUERIES[type]}": ${found.length} resultados` +
        (first ? ` · 1.º: "${first.title}" (${first.license}) ${first.sourceUrl}` : ' (revisa el adaptador o la consulta)'));
      if (found.length === 0) failed++;
    } catch (e) {
      failed++;
      console.log(`ERR ${adapter.name} [${type}]: ${(e as Error).message}`);
    }
  }
}
console.log(failed === 0 ? '\nTodo bien.' : `\n${failed} problema(s): corrige los adaptadores y sus fixtures.`);
process.exitCode = failed === 0 ? 0 : 1;
