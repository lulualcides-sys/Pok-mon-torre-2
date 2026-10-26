#!/usr/bin/env node
/** Pesquisa estrutural JavaScript, sem opção de reescrever (leitura apenas). */
import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const bin=resolve(root,'tools/dev/toolkit/node_modules/.bin/ast-grep');
const scopes=Object.freeze({
  campanha:['tools/pokearena/torre2-campaign-core.js','tools/pokearena/torre2-campaign-scene.js'],
  golpes:['tools/pokearena/torre2-signature-fx.js','tools/pokearena/torre2-move-pool.js'],
  arena:['tools/pokearena/torre2-arena-tempo.js','tools/pokearena/torre2-evolution-kits.js'],
  clima:['tools/pokearena/torre2-weather.js','tools/pokearena/torre2-laboratory.js'],
  captura:['tools/pokearena/torre2-capture-mechanics.js','tools/pokearena/torre2-ball-choreography.js'],
  interface:['tools/pokearena/torre2-campaign-map-unified.js','tools/pokearena/torre2-kanto-world-map.js'],
  combate:['tools/pokearena/torre2-gen3-types.js','tools/pokearena/torre2-gen3-status.js']
});
const args=process.argv.slice(2);
if(args.length===1 && args[0]==='--list'){
  console.log('Áreas: '+Object.keys(scopes).join(', '));
  console.log("Exemplo: node tools/dev/busca-codigo.mjs campanha 'function $NAME($$$ARGS) { $$$BODY }'");
}else if(!existsSync(bin)){
  console.error('ast-grep ainda não instalado neste checkout. Rode: npm install --prefix tools/dev/toolkit --no-audit --no-fund');
  process.exitCode=2;
}else if(args.length===1 && args[0]==='--version'){
  const result=spawnSync(bin,['--version'],{cwd:root,stdio:'inherit',shell:false});
  process.exitCode=result.status??1;
}else if(args.length!==2 || !scopes[args[0]] || !args[1].trim()){
  console.error('Uso: node tools/dev/busca-codigo.mjs <area> <padrao-AST>. Use --list.');
  process.exitCode=2;
}else{
  const result=spawnSync(bin,['run','--pattern',args[1],'--lang','js',...scopes[args[0]]],{
    cwd:root,stdio:'inherit',shell:false
  });
  if(result.error)console.error(result.error.message);
  process.exitCode=result.status??1;
}
