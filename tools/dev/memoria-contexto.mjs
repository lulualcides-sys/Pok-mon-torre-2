#!/usr/bin/env node
/**
 * Handoff mínimo para agentes; não inicia Graphiti, Obsidian nem APIs externas.
 * Uso: node tools/dev/memoria-contexto.mjs --list | <area>
 */
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const topics = Object.freeze(['campanha', 'golpes', 'captura', 'combate', 'clima', 'arena', 'interface']);
const args = process.argv.slice(2);

if (args.length === 1 && (args[0] === '--list' || args[0] === '--help')) {
  console.log('Áreas: ' + topics.join(', '));
  console.log('Uso: node tools/dev/memoria-contexto.mjs <area>');
} else if (args.length !== 1 || !topics.includes(args[0])) {
  console.error('Área inválida. Use --list. Nenhum arquivo foi alterado.');
  process.exitCode = 2;
} else {
  try {
    const area = args[0];
    const read = file => readFileSync(resolve(root, file), 'utf8').trim();
    const base = read('docs/memoria/BASE.md');
    const note = read('docs/memoria/areas/' + area + '.md');
    const git = spawnSync('git', ['rev-parse', '--short=12', 'HEAD'], {
      cwd: root, encoding: 'utf8', timeout: 3000, shell: false
    });
    const sha = git.status === 0 ? git.stdout.trim() : 'indisponível: conferir HEAD manualmente';
    const output = [
      '# Contexto mínimo — Pokémon Torre 2 / ' + area,
      'Git HEAD local: ' + sha + ' (confira PRs e CI do remoto antes de alterar).',
      '',
      base, '', note, '',
      '> Este resumo é um índice, NÃO é evidência de testes, homologação ou publicação.',
      '> Antes de modificar código, abra as fontes normativas integrais e os testes pertinentes.',
      ''
    ].join('\n');
    if (output.length > 5500) {
      throw Error('Resumo excede 5.500 caracteres; reduzir a nota, sem descartar regras obrigatórias.');
    }
    process.stdout.write(output);
  } catch (error) {
    console.error('Falha ao montar contexto: ' + error.message);
    process.exitCode = 1;
  }
}
