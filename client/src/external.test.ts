import { test } from 'node:test';
import assert from 'node:assert/strict';
import { externalLinks } from './logic.ts';

test('enlaces externos con la búsqueda codificada, según el tipo', () => {
  const links = externalLinks('torre mágica', 'sprite');
  assert.ok(links.length >= 2);
  assert.ok(links.every((l) => l.url.startsWith('https://') && l.label));
  assert.ok(links.some((l) => l.label.includes('OpenGameArt') && l.url.includes(encodeURIComponent('torre mágica'))));
});

test('modelos 3D y audio tienen sus propios enlaces; "todo" y "fuentes" no inventan', () => {
  assert.ok(externalLinks('x', 'model3d').some((l) => l.label.includes('OpenGameArt')));
  assert.ok(externalLinks('x', 'audio').some((l) => l.label.includes('OpenGameArt')));
  assert.deepEqual(externalLinks('x', 'font'), []);
  assert.ok(externalLinks('x', 'all').length >= 2);
});

test('consulta vacía → sin enlaces', () => {
  assert.deepEqual(externalLinks('   ', 'sprite'), []);
});
