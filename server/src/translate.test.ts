import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toEnglish } from './translate.ts';

test('traduce palabras de juegos del español al inglés, con o sin tildes y mayúsculas', () => {
  assert.equal(toEnglish('Árbol'), 'tree');
  assert.equal(toEnglish('arbol'), 'tree');
  assert.equal(toEnglish('espada épica'), 'sword epic');
  assert.equal(toEnglish('música tranquila'), 'music calm');
});

test('lo que no conoce se deja igual y el inglés no se toca', () => {
  assert.equal(toEnglish('pixel tree'), 'pixel tree');
  assert.equal(toEnglish('zorbulon'), 'zorbulon');
  assert.equal(toEnglish('  espada   y   escudo '), 'sword y shield');
});
