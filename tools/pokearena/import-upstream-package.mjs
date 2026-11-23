#!/usr/bin/env node
/* Pokémon Torre 2 — importa um pacote do cliente Poké Arena 2D ENTREGUE pelos donos
 * (ZIP/tar anexado a um release, ou pasta), sem acessar o site nem o Cloudflare.
 *
 * Uso: node tools/pokearena/import-upstream-package.mjs <pastaExtraida> <pastaSaida>
 *
 * Aceita qualquer layout que contenha src-XXXXXXXXXX/main.js (na raiz ou em subpastas,
 * ex.: source/, site/, arena2d/). Valida, sem executar nada:
 *  - config.js com VERSION oficial;
 *  - TODOS os imports relativos (estáticos e dinâmicos literais) de todos os módulos
 *    existem no pacote (pacote incompleto = falha);
 *  - caminhos seguros (sem .., sem links simbólicos).
 * Saída no mesmo formato do discover/archive: <saida>/source/src-XXXX/..., assets/,
 * index.html (se houver), pin alphaNNN-source-modules.json e MANIFEST.txt.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {moduleSpecifiers} from './discover-upstream-capture.mjs';
import {officialAlpha} from './watch-upstream.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const SRC=/^src-[0-9a-f]{10}$/;

async function walk(root,rel='',out=[]){
 for(const e of await fs.readdir(path.join(root,rel),{withFileTypes:true})){
  const r=rel?rel+'/'+e.name:e.name;
  if(e.isSymbolicLink())throw Error('IMPORT: link simbólico recusado: '+r);
  if(e.isDirectory())await walk(root,r,out);else if(e.isFile())out.push(r);
 }
 return out;
}

/** Acha a pasta que contém src-*\/main.js (raiz do site dentro do pacote). */
export async function findSiteRoot(dir){
 const files=await walk(dir);
 const mains=files.filter(f=>!(files.some(x=>x.startsWith('_export/'))&&!f.startsWith('_export/'))).filter(f=>{const p=f.split('/');return p.length>=2&&p.at(-1)==='main.js'&&SRC.test(p.at(-2));});
 const roots=[...new Set(mains.map(f=>f.split('/').slice(0,-2).join('/')))];
 const srcs=[...new Set(mains.map(f=>f.split('/').at(-2)))];
 if(!mains.length)throw Error('IMPORT: pacote sem src-XXXXXXXXXX/main.js');
 if(srcs.length!==1||roots.length!==1)throw Error('IMPORT: pacote ambíguo, várias versões: '+srcs.join(', '));
 return {root:path.join(dir,roots[0]),src:srcs[0],files};
}

/** Expande partes "torre2-browser-export-v1" (geradas pelo browser-export-console.js) em <dir>/_export/. */
export async function expandBrowserExports(dir){
 const files=(await walk(dir)).filter(f=>f.endsWith('.json'));
 let n=0;const failures=[];
 for(const f of files){
  let j;
  try{j=JSON.parse(await fs.readFile(path.join(dir,f),'utf8'));}catch{continue;}
  if(j?.format!=='torre2-browser-export-v1')continue;
  if(!SRC.test(j.src||''))throw Error('IMPORT: exportação com src inválido em '+f);
  n++;failures.push(...(j.failures||[]));
  for(const [rel,b64] of Object.entries(j.files||{})){
   if(!/^[\w\-./]+$/.test(rel)||rel.split('/').includes('..')||rel.startsWith('/'))throw Error('IMPORT: caminho inseguro na exportação: '+rel);
   const target=path.join(dir,'_export',rel);
   await fs.mkdir(path.dirname(target),{recursive:true});
   await fs.writeFile(target,Buffer.from(b64,'base64'));
  }
 }
 return {parts:n,exportFailures:failures};
}

export async function importPackage(dir,out){
 const exp=await expandBrowserExports(dir);
 const {root,src}=await findSiteRoot(dir);
 const srcDir=path.join(root,src);
 const modFiles=(await walk(srcDir)).filter(f=>f.endsWith('.js'));
 const failures=[];
 const modules={};
 const texts={};
 for(const rel of modFiles){
  const data=await fs.readFile(path.join(srcDir,rel));
  modules[rel]=sha(data);texts[rel]=data.toString('utf8');
 }
 // completude: todo import relativo precisa existir no pacote
 for(const [rel,code] of Object.entries(texts)){
  const d=path.posix.dirname(rel);
  for(const spec of moduleSpecifiers(code)){
   const target=path.posix.normalize(path.posix.join(d,spec));
   if(!(target in modules))failures.push(`import ausente: ${rel} -> ${target}`);
  }
 }
 const alpha=texts['config.js']?officialAlpha(texts['config.js']):null;
 if(!alpha)failures.push('config.js sem VERSION oficial');
 if(!texts['main.js'])failures.push('main.js ausente');
 const assets={};
 let assetRoot=null;
 try{await fs.access(path.join(root,'assets'));assetRoot=path.join(root,'assets');}catch{}
 if(assetRoot)for(const rel of await walk(assetRoot))assets['assets/'+rel]=sha(await fs.readFile(path.join(assetRoot,rel)));
 if(failures.length)return {ok:false,alpha,src,modules:modFiles.length,assets:Object.keys(assets).length,failures};

 await fs.rm(out,{recursive:true,force:true});
 await fs.mkdir(path.join(out,'source'),{recursive:true});
 await fs.cp(srcDir,path.join(out,'source',src),{recursive:true});
 if(assetRoot)await fs.cp(assetRoot,path.join(out,'source','assets'),{recursive:true});
 let indexSha='-';
 try{const idx=await fs.readFile(path.join(root,'index.html'));indexSha=sha(idx);
  await fs.writeFile(path.join(out,'source','index.html'),idx);}catch{}
 const pinName=`alpha${alpha.replace(/\./g,'')}-source-modules.json`;
 const pin={alpha,src,origin:'pacote entregue (sem acesso ao site)',readAt:new Date().toISOString().slice(0,10),
  authorization:{date:'2026-11-20',note:'Os donos do Poké Arena 2D liberaram o uso para o dono do Torre 2 (informado por ele em 20/11/2026). Uso no projeto pessoal, gratuito, sem vendas.'},
  method:'import-upstream-package.mjs: pacote entregue; imports conferidos; lido como bytes, não executado',
  modules,assets,failures:[]};
 await fs.writeFile(path.join(out,pinName),JSON.stringify(pin,null,1)+'\n');
 await fs.writeFile(path.join(out,'MANIFEST.txt'),['alpha='+alpha,'src='+src,'origin=pacote-entregue',
  'importedAt='+new Date().toISOString(),'modules='+modFiles.length,'assets='+Object.keys(assets).length,
  'indexHtmlSha256='+indexSha,''].join('\n'));
 return {ok:true,alpha,src,modules:modFiles.length,assets:Object.keys(assets).length,failures:[],pin:pinName,
  browserExportParts:exp.parts,assetGaps:exp.exportFailures.length};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [dir,out]=process.argv.slice(2);
 if(!dir||!out){console.error('uso: import-upstream-package.mjs <pastaExtraida> <pastaSaida>');process.exit(2);}
 importPackage(path.resolve(dir),path.resolve(out)).then(r=>{
  console.log('UPSTREAM_IMPORT',JSON.stringify(r));
  if(!r.ok){for(const f of r.failures.slice(0,40))console.error(' - '+f);process.exitCode=1;}
 }).catch(e=>{console.error(e.message||e);process.exitCode=1;});
}
