#!/usr/bin/env node
/**
 * Seleciona um contexto pequeno por domínio. Comprime apenas para navegação.
 * Use --full para investigar ou modificar implementações reais.
 * Apenas leitura. Não empacota o repositório inteiro por acidente.
 */
import {existsSync, mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const bin=resolve(root,'tools/dev/toolkit/node_modules/.bin/repomix');
const profiles=Object.freeze({
  campanha:[
    'AGENTS.md','docs/GUIA-RAPIDO-REPOSITORIO.md',
    'docs/CONTRATO_CAMPANHA.md',
    'tools/pokearena/torre2-campaign-core.js',
    'tools/pokearena/torre2-campaign-scene.js',
    'tools/pokearena/torre2-route-data.js',
    'tests/campaign-awards-built.test.mjs'
  ],
  golpes:[
    'AGENTS.md','docs/agentes/POLITICA-GOLPES-INTEGRAL.md',
    'docs/FICHA-REAPROVEITAMENTO-4-FONTES.md',
    'data/move-reuse-policy.json',
    'tools/pokearena/torre2-signature-fx.js',
    'tests/move-reuse-policy.test.js'
  ],
  captura:[
    'AGENTS.md','docs/POKEBALL-PATCH-2026-10-23.md',
    'tools/pokearena/torre2-capture-mechanics.js',
    'tools/pokearena/torre2-ball-choreography.js',
    'tools/pokearena/torre2-party-battle.js',
    'tests/ball-body.test.js'
  ],
  combate:[
    'AGENTS.md','tools/pokearena/torre2-gen3-types.js',
    'tools/pokearena/torre2-gen3-status.js',
    'tools/pokearena/torre2-trainer-strategy.js',
    'tests/gen3-types.test.js','tests/gen3-status.test.js'
  ],
  clima:[
    'AGENTS.md','tools/pokearena/torre2-weather.js',
    'tools/pokearena/torre2-laboratory.js',
    'tests/weather.test.js',
    'tests/weather-laboratory-browser.cjs'
  ],
  arena:[
    'AGENTS.md','tools/pokearena/torre2-arena-tempo.js',
    'tools/pokearena/torre2-evolution-kits.js',
    'tests/arena-native-speed.test.js',
    'tests/arena-free-moves.test.js'
  ],
  interface:[
    'AGENTS.md','docs/CAMPANHA-UI-REVISAO.md',
    'tools/pokearena/torre2-campaign-map-unified.js',
    'tools/pokearena/torre2-kanto-world-map.js',
    'tests/pokedex-upstream-layout.test.js'
  ]
});
const args=process.argv.slice(2);
const full=args.length===2 && args[1]==='--full';
if((args.length!==1 && !full) || args[0]==='--help' || args[0]==='--list'){
  console.log('Uso: node tools/dev/contexto-ia.mjs <campanha|golpes|captura|combate|clima|arena|interface> [--full]');
  console.log('Padrão: índice estrutural; --full: código real para diagnóstico.');
  for(const [key,files] of Object.entries(profiles))console.log('  '+key.padEnd(12)+' '+files.length+' arquivos selecionados');
  if(args.length!==1 || !['--help','--list'].includes(args[0]))process.exitCode=2;
}else if(!profiles[args[0]]){
  console.error('Área inválida. Use --list.');
  process.exitCode=2;
}else{
  const area=args[0];
  const missing=profiles[area].filter(path=>!existsSync(resolve(root,path)));
  if(missing.length){
    console.error('Arquivos ausentes; revisar o índice: '+missing.join(', '));
    process.exitCode=2;
  }else if(!existsSync(bin)){
    console.error('Repomix não instalado neste checkout. Rode: npm install --prefix tools/dev/toolkit --no-audit --no-fund');
    process.exitCode=2;
  }else{
    const outDir=resolve(root,'reports/contexto');
    mkdirSync(outDir,{recursive:true});
    const relativeOutput='reports/contexto/'+area+(full?'.full':'')+'.xml';
    console.log('Contexto: '+area+' ('+profiles[area].length+' arquivos; modo '+(full?'completo':'índice')+'; segurança/limite ativos)');
    const p=spawnSync(bin,['--config',full?'repomix.full.config.json':'repomix.config.json','--include',profiles[area].join(','),'--output',relativeOutput,'--token-count-tree','200'],{
      cwd:root,stdio:'inherit',shell:false
    });
    if(p.error)console.error(p.error.message);
    process.exitCode=p.status??1;
    if(process.exitCode===0)console.log('Gerado: '+relativeOutput+' (artefato local não enviado automaticamente à IA)');
  }
}
