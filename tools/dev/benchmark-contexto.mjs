#!/usr/bin/env node
/**
 * Compara tamanho do contexto reduzido (assinaturas) vs integral (código real).
 * O resultado NÃO mede créditos do ChatGPT; somente tokens dos relatórios.
 * Nunca envia conteúdo a terceiros.
 */
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const program=resolve(root,'tools/dev/contexto-ia.mjs');
const profiles=process.argv.slice(2);
const chosen=profiles.length?profiles:['clima','captura'];
const stats=[];
function measure(area,full){
  const arg=[program,area,...(full?['--full']:[])];
  const run=spawnSync(process.execPath,arg,{cwd:root,encoding:'utf8',maxBuffer:12*1024*1024,env:{...process.env,NO_COLOR:'1'}});
  if(run.error || run.status!==0){
    throw Error(area+(full?' full':' compact')+': '+(run.error?.message||run.stderr||run.stdout?.slice(-2000)||'exit '+run.status));
  }
  const match=run.stdout.match(/Total Tokens:\s*([\d,]+)/);
  if(!match)throw Error('Contagem de tokens não encontrada no Repomix para '+area+(full?' full':' compact'));
  const report='reports/contexto/'+area+(full?'.full':'')+'.xml';
  if(!existsSync(resolve(root,report)))throw Error('Relatório ausente: '+report);
  return {tokens:Number(match[1].replaceAll(',','')),report};
}
try{
  for(const area of chosen){
    const compact=measure(area,false);
    const full=measure(area,true);
    const reducedPercentage=full.tokens>0?Number(((1-compact.tokens/full.tokens)*100).toFixed(1)):0;
    stats.push({area,compact_tokens:compact.tokens,full_tokens:full.tokens,reduction_in_report_percent:reducedPercentage,compact_report:compact.report,full_report:full.report});
    console.log(area+': índice '+compact.tokens+' tokens; completo '+full.tokens+' tokens; relatório índice '+reducedPercentage+'% menor');
  }
  const dir=resolve(root,'reports/ferramentas');mkdirSync(dir,{recursive:true});
  writeFileSync(resolve(dir,'benchmark-contexto.json'),JSON.stringify({note:'Não mede créditos ChatGPT. O modo compacto descarta corpos das funções; usar modo completo antes de alterar a lógica.',profiles:stats},null,2)+'\n');
  console.log('Relatório: reports/ferramentas/benchmark-contexto.json');
}catch(error){console.error(error.message);process.exitCode=1}
