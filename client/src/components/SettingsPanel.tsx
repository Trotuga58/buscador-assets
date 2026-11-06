import { useState } from 'react';
import { KEY_HELP } from '../logic.ts';
import { ConnectClaude } from './ConnectClaude.tsx';

interface Props { status: Record<string, boolean>; onSave: (keys: Record<string, string>) => Promise<void>; connectCommand?: string | null }

export function SettingsPanel({ status, onSave, connectCommand = null }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: { preventDefault(): void }) {
    e.preventDefault();
    const filled = Object.fromEntries(Object.entries(values).filter(([, v]) => v.trim()));
    if (Object.keys(filled).length === 0) { setMsg('No has escrito ninguna clave nueva.'); return; }
    try { await onSave(filled); setValues({}); setMsg('Claves guardadas.'); } catch { setMsg('No se pudieron guardar las claves.'); }
  }

  return (
    <>
    <section aria-label="Ajustes">
      <h2>Claves de las fuentes</h2>
      <p>Son gratuitas. Las que dejes vacías no se cambian. Sin clave, esa fuente se omite.</p>
      <form onSubmit={submit}>
        {KEY_HELP.map((k) => (
          <p key={k.name}>
            <label htmlFor={k.name}>{k.label}</label>{' '}
            <span>{status[k.name] ? 'configurada' : 'sin configurar'}</span>{' '}
            <a href={k.url} target="_blank" rel="noreferrer">Conseguir clave</a>
            <br />
            <input id={k.name} type="password" autoComplete="off" placeholder={status[k.name] ? '•••••• (escribe para cambiarla)' : 'Pega aquí la clave'}
              value={values[k.name] ?? ''} onChange={(e) => setValues({ ...values, [k.name]: e.target.value })} />
          </p>
        ))}
        <button type="submit">Guardar claves</button>
      </form>
      {msg && <p role="status">{msg}</p>}
    </section>
    <ConnectClaude command={connectCommand} />
    </>
  );
}
