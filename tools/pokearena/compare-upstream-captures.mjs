#!/usr/bin/env node
/* Pokémon Torre 2 — compara duas capturas do cliente Poké Arena 2D (ex.: 0.77.3 × 0.78).
 * Uso: node tools/pokearena/compare-upstream-captures.mjs <capturaAntiga> <capturaNova> [saida.md]
 * Cada captura é uma pasta com source/src-XXXX/ (formato do discover/archive).
 * Leitura ESTÁTICA (texto): o JavaScript de terceiros nunca é executado.
 * Saída: módulos novos/removidos/alterados, espécies nativas novas/alteradas e
 * conflitos com espécies que o Torre 2 já adicionou (Dex 1–251), que pela regra
 * de 06/11 passam a usar o kit nativo e exigem aprovação do dono antes da porta.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const sha=b=>createHash('sha256').update(b).digest('hex');

async function srcDir(root){
 const base=path.join(root,'source');
 const dirs=(await fs.readdir(base)).filter(d=>/^src-[0-9a-f]{10}$/.test(d));
 if(dirs.length!==1)throw Error('esperado 1 src-* em '+base+', achei '+dirs.length);
 return path.join(base,dirs[0]);
}
async function walk(dir,rel=''){
 const out={};
 for(const e of await fs.readdir(path.join(dir,rel),{withFileTypes:true})){
  const r=rel?rel+'/'+e.name:e.name;
  if(e.isDirectory())Object.assign(out,await walk(dir,r));
  else if(r.endsWith('.js'))out[r]=sha(await fs.readFile(path.join(dir,r)));
 }
 return out;
}

/** Fatia o literal `const TODOS=[...]` em objetos de topo, sem executar nada. */
export function speciesBlocks(code){
 const start=code.indexOf('const TODOS=[');
 if(start<0)return [];
 let i=start+'const TODOS='.length,depth=0,quote=null,objStart=-1;
 const blocks=[];
 for(;i<code.length;i++){
  const c=code[i];
  if(quote){if(c==='\\')i++;else if(c===quote)quote=null;continue;}
  if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
  if(c==='['||c==='{'){if(depth===1&&c==='{')objStart=i;depth++;}
  else if(c===']'||c==='}'){depth--;if(depth===1&&c==='}'&&objStart>=0){blocks.push(code.slice(objStart,i+1));objStart=-1;}if(depth===0)break;}
 }
 return blocks.map(text=>({
  id:text.match(/^\{id:"([^"]+)"/)?.[1]??null,
  nombres:[...new Set([...text.matchAll(/\bnombre:"([A-Z0-9 .'\-♀♂]+)",(?:dex|tipos|hp)/g)].map(m=>m[1]))],
  dex:[...new Set([...text.matchAll(/\bdex:"(\d{4})"/g)].map(m=>Number(m[1])))],
  sha:sha(text)
 }));
}

export async function compare(oldRoot,newRoot){
 const [a,b]=[await srcDir(oldRoot),await srcDir(newRoot)];
 const [ma,mb]=[await walk(a),await walk(b)];
 const added=Object.keys(mb).filter(k=>!(k in ma)).sort();
 const removed=Object.keys(ma).filter(k=>!(k in mb)).sort();
 const changed=Object.keys(mb).filter(k=>k in ma&&ma[k]!==mb[k]).sort();
 const read=async d=>{try{return await fs.readFile(path.join(d,'datos.js'),'utf8')}catch{return ''}};
 const [sa,sb]=[speciesBlocks(await read(a)),speciesBlocks(await read(b))];
 const byA=new Map(sa.map(s=>[s.id,s]));
 const newSpecies=sb.filter(s=>!byA.has(s.id));
 const changedSpecies=sb.filter(s=>byA.has(s.id)&&byA.get(s.id).sha!==s.sha);
 const removedSpecies=sa.filter(s=>!sb.some(x=>x.id===s.id));
 const oldDex=new Set(sa.flatMap(s=>s.dex));
 const conflicts=sb.flatMap(s=>s.dex.filter(d=>!oldDex.has(d)&&d>=1&&d<=251).map(d=>({id:s.id,dex:d})));
 return {old:path.basename(a),new:path.basename(b),added,removed,changed,
  unchanged:Object.keys(mb).length-added.length-changed.length,
  newSpecies,changedSpecies,removedSpecies,conflicts};
}

export function report(r,labels={}){
 const L=(xs,f=x=>'`'+x+'`')=>xs.length?xs.map(x=>'- '+f(x)).join('\n'):'- nenhum';
 const sp=s=>`**${s.id}** (Dex ${s.dex.join(', ')}${s.nombres.length?'; '+s.nombres.join(' → '):''})`;
 return [
  `# Comparação ${labels.old||r.old} × ${labels.new||r.new}`,'',
  '_Gerado por `tools/pokearena/compare-upstream-captures.mjs` (leitura estática, nada executado)._','',
  '| Módulos | Quantidade |','| --- | --- |',
  `| Novos | ${r.added.length} |`,`| Removidos | ${r.removed.length} |`,
  `| Alterados | ${r.changed.length} |`,`| Iguais | ${r.unchanged} |`,'',
  '## Conflitos com espécies do Torre 2 (exigem aprovação do dono)','',
  'Dex 1–251 que viraram nativos: pela regra de 06/11 o kit nativo prevalece na Arena, Pokédex e Training; os injetores do Torre 2 precisam pular essas espécies.','',
  L(r.conflicts,c=>`**${c.id}** — Dex ${c.dex}`),'',
  '## Espécies nativas novas','',L(r.newSpecies,sp),'',
  '## Espécies nativas com kit/dados alterados','',L(r.changedSpecies,sp),'',
  '## Espécies nativas removidas','',L(r.removedSpecies,sp),'',
  '## Módulos novos','',L(r.added),'',
  '## Módulos removidos','',L(r.removed),'',
  '## Módulos alterados','',L(r.changed),''
 ].join('\n');
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [a,b,out]=process.argv.slice(2);
 if(!a||!b){console.error('uso: compare-upstream-captures.mjs <antiga> <nova> [saida.md]');process.exit(2);}
 compare(path.resolve(a),path.resolve(b)).then(async r=>{
  const md=report(r);
  if(out)await fs.writeFile(out,md);else console.log(md);
  console.log('UPSTREAM_COMPARE',JSON.stringify({added:r.added.length,removed:r.removed.length,changed:r.changed.length,newSpecies:r.newSpecies.map(s=>s.id),conflicts:r.conflicts}));
 }).catch(e=>{console.error(e.message||e);process.exitCode=1;});
}
