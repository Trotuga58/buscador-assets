import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';

type Handler = (msg: any) => Promise<object | null>;

/** Protocolo MCP por entrada/salida estándar: un mensaje JSON por línea. Termina cuando se cierra la entrada. */
export async function serveStdio(handle: Handler, input: Readable = process.stdin, output: Writable = process.stdout): Promise<void> {
  const send = (m: object) => { output.write(JSON.stringify(m) + '\n'); };
  const pending: Promise<void>[] = [];
  const rl = createInterface({ input, crlfDelay: Infinity });
  rl.on('line', (line) => {
    if (!line.trim()) return;
    let msg: any;
    try { msg = JSON.parse(line); } catch { send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON no válido' } }); return; }
    pending.push((async () => {
      try {
        const r = await handle(msg);
        if (r) send(r);
      } catch {
        if (msg?.id !== undefined) send({ jsonrpc: '2.0', id: msg.id, error: { code: -32603, message: 'Error interno' } });
      }
    })());
  });
  await new Promise<void>((resolve) => rl.once('close', resolve));
  await Promise.all(pending);
}
