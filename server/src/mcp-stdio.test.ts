import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { serveStdio } from './mcp-stdio.ts';

test('una línea JSON por mensaje; ignora lo que no responde; JSON roto → -32700', async () => {
  const input = new PassThrough(); const output = new PassThrough();
  let out = ''; output.on('data', (d) => { out += d; });
  const done = serveStdio(async (m: any) => (m.method === 'x' ? null : { jsonrpc: '2.0', id: m.id, result: { eco: m.method } }), input, output);
  input.write('{"jsonrpc":"2.0","id":1,"method":"a"}\n');
  input.write('{"jsonrpc":"2.0","method":"x"}\n');
  input.write('esto no es json\n');
  input.write('\n');
  input.end('{"jsonrpc":"2.0","id":2,"method":"b"}');
  await done;
  const lines = out.trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(lines.length, 3);
  const byId = (id: number | null) => lines.find((l) => l.id === id);
  assert.deepEqual(byId(1), { jsonrpc: '2.0', id: 1, result: { eco: 'a' } });
  assert.equal(byId(null).error.code, -32700);
  assert.equal(byId(2).result.eco, 'b');
});

test('si el manejador revienta, responde un error y sigue vivo', async () => {
  const input = new PassThrough(); const output = new PassThrough();
  let out = ''; output.on('data', (d) => { out += d; });
  const done = serveStdio(async () => { throw new Error('boom'); }, input, output);
  input.end('{"jsonrpc":"2.0","id":5,"method":"a"}\n');
  await done;
  const r = JSON.parse(out.trim());
  assert.equal(r.id, 5); assert.equal(r.error.code, -32603);
});
