import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bin = resolve(root, 'tools/dev/memoria-contexto.mjs');
const run = (...args) => spawnSync(process.execPath, [bin, ...args], {
  cwd: root, encoding: 'utf8', timeout: 5000
});

test('índice da memória está disponível sem dependências externas', () => {
  const r = run('--list');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /campanha.*golpes.*captura/);
});

test('contexto de golpes exige política integral e não confunde com jogo', () => {
  const r = run('golpes');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /POLITICA-GOLPES-INTEGRAL\.md/);
  assert.match(r.stdout, /Pokémon Torre 2/);
  assert.ok(r.stdout.length <= 5500);
  assert.doesNotMatch(r.stdout, /chave de API|token secreto/i);
});

test('domínios produzem somente o contexto relevante', () => {
  const r = run('captura');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /torre2-capture-mechanics\.js/);
  assert.doesNotMatch(r.stdout, /torre2-weather\.js/);
  assert.ok(r.stdout.length <= 5500);
});

test('áreas e argumentos inesperados são rejeitados', () => {
  for (const args of [['../../../.git'], ['campanha', '--full'], []]) {
    const r = run(...args);
    assert.equal(r.status, 2);
    assert.equal(r.stdout, '');
  }
});
