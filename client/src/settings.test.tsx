import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { getSettings, saveSettings } from './api.ts';
import { SettingsPanel } from './components/SettingsPanel.tsx';
import { KEY_HELP } from './logic.ts';

test('KEY_HELP cubre las cuatro claves con su enlace', () => {
  assert.deepEqual(KEY_HELP.map((k) => k.name).sort(), ['FREESOUND_API_KEY', 'GOOGLE_FONTS_API_KEY', 'POLYPIZZA_API_KEY', 'SKETCHFAB_API_KEY']);
  assert.ok(KEY_HELP.every((k) => k.url.startsWith('https://') && k.label));
});

test('getSettings / saveSettings: rutas, método y cuerpo', async () => {
  const calls: Array<[string, string | undefined, string | undefined, string | undefined]> = [];
  const f = (async (u: string, init?: RequestInit) => {
    calls.push([u, init?.method, init?.body as string, (init?.headers as Record<string, string> | undefined)?.['content-type']]);
    return new Response('{"FREESOUND_API_KEY":true}');
  }) as unknown as typeof fetch;
  assert.deepEqual(await getSettings(f), { FREESOUND_API_KEY: true });
  await saveSettings({ FREESOUND_API_KEY: 'abc' }, f);
  assert.deepEqual(calls[1], ['/api/settings', 'PUT', '{"FREESOUND_API_KEY":"abc"}', 'application/json']);
});

test('SettingsPanel: un campo de contraseña por clave, estado y enlace; nunca muestra valores', () => {
  const html = renderToStaticMarkup(<SettingsPanel status={{ FREESOUND_API_KEY: true }} onSave={async () => {}} />);
  assert.equal((html.match(/type="password"/g) ?? []).length, 4);
  assert.ok(html.includes('Freesound') && html.includes('configurada') && html.includes('sin configurar'));
  assert.ok(html.includes('https://freesound.org/apiv2/apply'));
  assert.ok(html.includes('Guardar claves'));
});
