import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allAdapters } from './index.ts';

test('el 2D solo sale de fuentes pensadas para juegos (Openverse ya no hace 2D)', () => {
  const twoD = allAdapters.filter((a) => a.types.includes('sprite')).map((a) => a.name);
  assert.deepEqual(twoD, ['Lista curada']);
});

test('el 3D sale de Poly Pizza y la lista curada; Sketchfab ya no está por defecto', () => {
  const names = allAdapters.filter((a) => a.types.includes('model3d')).map((a) => a.name);
  assert.deepEqual(names.sort(), ['Lista curada', 'Poly Pizza']);
});

test('no hay fuentes (tipografías): ninguna es CC0, así que no se consulta Google Fonts', () => {
  assert.deepEqual(allAdapters.filter((a) => a.types.includes('font')).map((a) => a.name), []);
});

test('Openverse se queda solo con audio', () => {
  assert.deepEqual(allAdapters.find((a) => a.name === 'Openverse')?.types, ['audio']);
});
