import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLicense, buildAttribution } from './license.ts';

test('normalizeLicense: CC0 en sus variantes', () => {
  for (const raw of ['CC0 1.0', 'cc0', 'Creative Commons 0', 'publicdomain/zero', 'CC0-1.0']) {
    assert.equal(normalizeLicense(raw), 'cc0', raw);
  }
});

test('normalizeLicense: CC-BY en sus variantes', () => {
  for (const raw of ['CC BY 4.0', 'by', 'CC-BY-3.0', 'cc-by', 'Attribution 4.0']) {
    assert.equal(normalizeLicense(raw), 'cc-by', raw);
  }
});

test('normalizeLicense: rechaza NC, SA, ND, vacío y desconocido', () => {
  for (const raw of ['CC BY-NC 4.0', 'by-sa', 'by-nd', 'by-nc-sa', '', null, undefined, 'all rights reserved']) {
    assert.equal(normalizeLicense(raw), null, String(raw));
  }
});

test('buildAttribution incluye título, autor, licencia y origen', () => {
  const t = buildAttribution({
    title: 'Árbol', author: 'Ana', license: 'cc-by', sourceName: 'Poly Pizza', sourceUrl: 'https://poly.pizza/m/1',
  });
  for (const part of ['Árbol', 'Ana', 'CC BY', 'Poly Pizza', 'https://poly.pizza/m/1']) {
    assert.ok(t.includes(part), part);
  }
});

test('buildAttribution con CC0 sigue dando texto con autor y fuente', () => {
  const t = buildAttribution({ title: 'X', author: 'Bo', license: 'cc0', sourceName: 'Kenney', sourceUrl: 'https://k.nl' });
  assert.ok(t.includes('Bo') && t.includes('Kenney') && t.includes('CC0'));
});
