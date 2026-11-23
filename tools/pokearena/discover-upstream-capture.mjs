#!/usr/bin/env node
/* Pokémon Torre 2 — descobre e baixa uma versão NOVA do cliente Poké Arena 2D
 * (captura autorizada pelos donos do site, registrada em docs/CREDITOS-E-LICENCAS.md).
 *
 * Uso:  node tools/pokearena/discover-upstream-capture.mjs <pastaSaida> [--sem-assets]
 *
 * - Lê index.html → src-XXXX/main.js → segue imports estáticos/dinâmicos (BFS).
 * - Alpha vem SOMENTE do VERSION do config.js oficial (nunca do hash src-*).
 * - Baixa assets referenciados por literais "assets/..." e pelo manifesto PMD.
 * - GET público comum (public-client-http.mjs): sem cookies, login ou nova
 *   tentativa após 403. Se o site bloquear, o script PARA e diz isso.
 * - O JavaScript baixado é só gravado em disco, nunca executado.
 * Saída: <pasta>/source/src-XXXX/..., <pasta>/source/index.html,
 *        <pasta>/alpha<NNN>-source-modules.json (pin com SHA-256),
 *        <pasta>/MANIFEST.txt e <pasta>/FALHAS.txt (se houver).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getPublicClientResource} from './public-client-http.mjs';
import {officialSourceDir,officialAlpha} from './watch-upstream.mjs';

export const ORIGIN='https://www.pokearena2d.com';
const sha=b=>createHash('sha256').update(b).digest('hex');
const ASSET_EXT=/\.(png|webp|jpg|jpeg|gif|json|ogg|mp3|wav|bin|txt|ttf|woff2?)$/i;
const SAFE=/^[\w\-./]+$/;

/** Especificadores de módulo relativos em um arquivo ES. */
export function moduleSpecifiers(code){
 const out=new Set();
 const res=[
  /\bfrom\s*["'](\.{1,2}\/[^"'\n]+?\.js)["']/g,
  /\bimport\s*["'](\.{1,2}\/[^"'\n]+?\.js)["']/g,
  /\bimport\s*\(\s*["'](\.{1,2}\/[^"'\n]+?\.js)["']\s*\)/g,
 ];
 for(const re of res)for(const m of code.matchAll(re))out.add(m[1]);
 return [...out];
}

/** Imports dinâmicos com template (ex.: `./idiomas/${l}.js`): devolve prefixo + candidatos. */
export function templateImports(code){
 const out=[];
 for(const m of code.matchAll(/\bimport\s*\(\s*`(\.{1,2}\/[\w\-./]*)\$\{[^}]+\}(\.js)`\s*\)/g))
  out.push({prefix:m[1],suffix:m[2]});
 return out;
}

/** Literais de assets ("assets/...", "/assets/...", "../assets/..."). */
export function assetLiterals(code){
 const out=new Set();
 for(const m of code.matchAll(/["'`](?:\.{0,2}\/)*(assets\/[\w\-./]+)["'`]/g)){
  const p=m[1].replace(/\/+$/,'');
  if(ASSET_EXT.test(p)&&SAFE.test(p)&&!p.split('/').includes('..'))out.add(p);
 }
 return [...out];
}

/** Palavras curtas citadas no código, usadas para completar imports com template. */
export function wordLiterals(code){
 const out=new Set();
 for(const m of code.matchAll(/["']([a-z][a-z0-9_]{1,30})["']/g))out.add(m[1]);
 // chaves de objeto sem aspas, ex.: {en:"English",it:"Italiano"}
 for(const m of code.matchAll(/[{,]\s*([a-z][a-z0-9_]{1,30})\s*:/g))out.add(m[1]);
 return out;
}

/** Strings de arquivos dentro de um JSON (manifesto PMD), relativas à pasta do manifesto. */
export function manifestFiles(json,base){
 const out=new Set();
 const walk=v=>{
  if(typeof v==='string'){
   if(ASSET_EXT.test(v)&&SAFE.test(v)&&!v.split('/').includes('..'))
    out.add(v.startsWith('assets/')?v:path.posix.join(base,v));
  }else if(Array.isArray(v))v.forEach(walk);
  else if(v&&typeof v==='object')Object.values(v).forEach(walk);
 };
 walk(json);
 return [...out];
}

export async function discover({out,withAssets=true,get=getPublicClientResource,log=console.log}){
 const index=(await get(ORIGIN+'/',2*1024*1024)).data;
 const html=index.toString('utf8');
 const src=officialSourceDir(html);
 if(!src)throw Error('DISCOVER: index.html sem src-*/main.js');
 const failures=[];
 const modules={};
 const texts={};
 const queue=['main.js','config.js'];
 const seen=new Set(queue);
 const optional=new Set();
 const fetchModule=async rel=>{
  try{
   const {data}=await get(`${ORIGIN}/${src}/${rel}`);
   modules[rel]=sha(data);texts[rel]=data;
   const file=path.join(out,'source',src,rel);
   await fs.mkdir(path.dirname(file),{recursive:true});
   await fs.writeFile(file,data);
   return data.toString('utf8');
  }catch(e){
   if(/HTTP 403/.test(e.message)&&rel==='main.js')throw Error('DISCOVER: site bloqueou (HTTP 403) — rode de uma rede liberada pelos donos');
   if(!optional.has(rel))failures.push(rel+' :: '+e.message);
   return null;
  }
 };
 await fs.rm(out,{recursive:true,force:true});
 const templates=[];const words=new Set();
 while(queue.length){
  const rel=queue.shift();
  const code=await fetchModule(rel);
  if(code==null)continue;
  const dir=path.posix.dirname(rel);
  for(const spec of moduleSpecifiers(code)){
   const next=path.posix.normalize(path.posix.join(dir,spec));
   if(next.startsWith('..')||!SAFE.test(next))continue;
   if(!seen.has(next)){seen.add(next);queue.push(next);}
  }
  for(const t of templateImports(code))templates.push({...t,dir});
  for(const w of wordLiterals(code))words.add(w);
  // ao esvaziar a fila, completa imports com template a partir das palavras citadas
  if(!queue.length&&templates.length){
   for(const t of templates.splice(0)){
    for(const w of words){
     const next=path.posix.normalize(path.posix.join(t.dir,t.prefix+w+t.suffix));
     if(next.startsWith('..')||!SAFE.test(next)||seen.has(next))continue;
     seen.add(next);optional.add(next);queue.push(next);
    }
   }
  }
 }
 const alpha=texts['config.js']?officialAlpha(texts['config.js'].toString('utf8')):null;
 if(!alpha)failures.push('config.js :: VERSION oficial não encontrado');

 const assets={};
 if(withAssets){
  const wanted=new Set();
  for(const buf of Object.values(texts))for(const a of assetLiterals(buf.toString('utf8')))wanted.add(a);
  wanted.add('assets/pmd/manifest.json');
  const done=new Set();
  const fetchAsset=async(p,isOptional)=>{
   if(done.has(p))return null;done.add(p);
   try{
    const {data}=await get(`${ORIGIN}/${p}`,15*1024*1024);
    assets[p]=sha(data);
    const file=path.join(out,'source',p);
    await fs.mkdir(path.dirname(file),{recursive:true});
    await fs.writeFile(file,data);
    return data;
   }catch(e){if(!isOptional)failures.push(p+' :: '+e.message);return null;}
  };
  for(const p of wanted){
   const data=await fetchAsset(p,false);
   if(data&&p.endsWith('manifest.json')){
    try{
     const files=manifestFiles(JSON.parse(data.toString('utf8')),path.posix.dirname(p));
     log('PMD manifest: '+files.length+' arquivos');
     for(const f of files)await fetchAsset(f,false);
    }catch(e){failures.push(p+' :: manifesto ilegível: '+e.message);}
   }
  }
 }
 const tag=alpha?alpha.replace(/\./g,''):'desconhecida';
 const pinName=`alpha${tag}-source-modules.json`;
 const pin={
  alpha,src,origin:ORIGIN+'/',readAt:new Date().toISOString().slice(0,10),
  authorization:{date:'2026-11-20',note:'Os donos do Poké Arena 2D liberaram a captura para o dono do Torre 2 (informado por ele em 20/11/2026 e reconfirmado em 23/11/2026). Uso no projeto pessoal, gratuito, sem vendas.'},
  method:'discover-upstream-capture.mjs: GET público a partir de main.js (imports estáticos, dinâmicos e com template), assets citados e manifesto PMD; lido como bytes, não executado',
  modules,assets,failures
 };
 await fs.mkdir(out,{recursive:true});
 await fs.writeFile(path.join(out,pinName),JSON.stringify(pin,null,1)+'\n');
 await fs.writeFile(path.join(out,'source','index.html'),index);
 await fs.writeFile(path.join(out,'MANIFEST.txt'),[
  'alpha='+alpha,'src='+src,'origin='+ORIGIN+'/','capturedAt='+new Date().toISOString(),
  'modules='+Object.keys(modules).length,'assets='+Object.keys(assets).length,
  'failures='+failures.length,'indexHtmlSha256='+sha(index),''].join('\n'));
 if(failures.length)await fs.writeFile(path.join(out,'FALHAS.txt'),failures.join('\n')+'\n');
 return {alpha,src,modules:Object.keys(modules).length,assets:Object.keys(assets).length,failures:failures.length,pin:pinName};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const args=process.argv.slice(2);
 const out=args.find(a=>!a.startsWith('--'));
 if(!out){console.error('uso: node tools/pokearena/discover-upstream-capture.mjs <pastaSaida> [--sem-assets]');process.exit(2);}
 discover({out:path.resolve(out),withAssets:!args.includes('--sem-assets')})
  .then(r=>{console.log('UPSTREAM_DISCOVER',JSON.stringify(r));if(r.failures)console.log('Veja FALHAS.txt');})
  .catch(e=>{console.error(e.message||e);process.exitCode=1;});
}
