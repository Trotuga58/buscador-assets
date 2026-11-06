import { useState } from 'react';
import { copyAttribution } from '../logic.ts';

export function CopyAttribution({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle');
  const click = async () => setState((await copyAttribution(text, navigator.clipboard)) ? 'ok' : 'fail');
  return (
    <button type="button" onClick={click}>
      {state === 'ok' ? 'Copiado' : state === 'fail' ? 'No se pudo copiar' : 'Copiar atribución'}
    </button>
  );
}
