#!/usr/bin/env node
/**
 * Executa apenas testes UNITÁRIOS existentes do domínio solicitado.
 * Não compila o cliente, não altera dados nem substitui CI ou Playwright.
 * Uso: node tools/dev/testes-focados.mjs <area> | --list
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const suites = Object.freeze({
  campanha: [
    'tests/progression.test.js',
    'tests/level-balance.test.js',
    'tests/party-xp-share.test.js',
    'tests/kanto-intro-moves.test.js',
    'tests/trainer-items.test.js',
    'tests/rematch-policy.test.js',
  ],
  combate: [
    'tests/combat.test.js',
    'tests/combat-boundary.test.js',
    'tests/gen3-types.test.js',
    'tests/gen3-status.test.js',
    'tests/trainer-strategy.test.js',
    'tests/weather.test.js',
  ],
  golpes: [
    'tests/move-reuse-policy.test.js',
    'tests/steel-moves.test.js',
    'tests/petal-dance.test.js',
    'tests/surge3.test.js',
    'tests/batch24.test.js',
    'tests/kanto-intro-moves.test.js',
  ],
  arena: [
    'tests/arena-free-moves.test.js',
    'tests/arena-native-speed.test.js',
    'tests/joystick.test.js',
    'tests/training-input.test.js',
  ],
  interface: [
    'tests/pokedex-upstream-layout.test.js',
    'tests/joystick.test.js',
    'tests/training-input.test.js',
  ],
  captura: [
    'tests/ball-body.test.js',
    'tests/capture-pre-misty.test.js',
    'tests/combat-boundary.test.js',
  ],
});
const args = process.argv.slice(2);
if (args.length !== 1 || args[0] === '--help' || args[0] === '-h' || args[0] === '--list') {
  console.log('Uso: node tools/dev/testes-focados.mjs <area>\n');
  for (const [name, tests] of Object.entries(suites)) {
    console.log('  ' + name.padEnd(12) + tests.length + ' testes unitários');
  }
  console.log('\nAtenção: não substitui npm test, build, testes de navegador ou CI antes de publicar.');
  if (args.length !== 1 || (args[0] !== '--help' && args[0] !== '-h' && args[0] !== '--list')) process.exitCode = 2;
} else {
  const area = args[0];
  const files = suites[area];
  if (!files) {
    console.error('Área desconhecida: ' + area + '. Use --list.');
    process.exitCode = 2;
  } else {
    const missing = files.filter(file => !existsSync(resolve(repoRoot, file)));
    if (missing.length) {
      console.error('Testes esperados ausentes. Atualize o mapa de testes antes de executar:\n' + missing.join('\n'));
      process.exitCode = 2;
    } else {
      console.log('Executando ' + files.length + ' arquivos de testes unitários para ' + area + '...');
      const proc = spawnSync(process.execPath, ['--test', ...files], {
        cwd: repoRoot,
        stdio: 'inherit',
        env: process.env,
        shell: false,
      });
      if (proc.error) console.error('Falha ao iniciar os testes:', proc.error.message);
      process.exitCode = proc.status ?? 1;
    }
  }
}
