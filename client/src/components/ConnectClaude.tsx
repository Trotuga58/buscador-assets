import { useState } from 'react';
import { connectConfig, copyAttribution } from '../logic.ts';

export function ConnectClaude({ command }: { command: string | null }) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle');
  const config = connectConfig(command);
  const exe = command ?? 'C:\\RUTA\\Buscador-de-assets.exe';
  return (
    <section aria-label="Conectar con Claude" className="connect">
      <h2>Conectar con Claude</h2>
      <p>Así Claude puede buscar y descargar assets por ti (por ejemplo para importarlos en Blender, que necesita su propio conector).</p>
      <ol>
        <li>Pulsa <strong>Copiar configuración</strong>.</li>
        <li>En Claude Desktop abre Ajustes → Desarrollador → Editar configuración (<code>claude_desktop_config.json</code>) y pégala. Si ya tiene <code>mcpServers</code>, añade solo la entrada <code>buscador-assets</code>.</li>
        <li>Reinicia Claude. No hace falta tener esta app abierta: el conector arranca solo cuando Claude lo necesita.</li>
      </ol>
      <pre>{config}</pre>
      <button type="button" className="btn" onClick={async () => setState((await copyAttribution(config, navigator.clipboard)) ? 'ok' : 'fail')}>
        {state === 'ok' ? 'Copiado' : state === 'fail' ? 'No se pudo copiar' : 'Copiar configuración'}
      </button>
      <p className="legend">En Claude Code: <code>claude mcp add buscador-assets -- &quot;{exe}&quot; --mcp</code></p>
      <p className="legend">Los archivos descargados se guardan en Documentos → Buscador de assets → descargas, con un LICENCIA.txt al lado.</p>
    </section>
  );
}
