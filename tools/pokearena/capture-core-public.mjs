#!/usr/bin/env node
// Independent official JS audit. Image/PMD availability must not block
// identifying an upstream release. This is NOT a playable-client capture.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getPublicClientResource} from './public-client-http.mjs';

const ORIGIN='https://www.pokearena2d.com/';
const OUT='site-capture/upstream-core.json';
const SOURCE_DIR='site-capture/official-js';
const OPTIONAL=['notas.js','habilidades.js','pokedex.js'];
const REQUIRED=['main.js','config.js','datos.js'];
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

export function officialDirectory(html) {
  const name=html.match(/\bsrc\s*=\s*["'](src-[0-9a-f]{10})\/main\.js["']/i)?.[1];
  return name||null;
}
export function readOfficialAlpha(js) {
  return js.match(/\b(?:const|let|var)\s+VERSION\s*=\s*["'](0\.\d+(?:\.\d+)?)["']/)?.[1]||null;
}
export function isNativeData(js) {
  return /\b(?:const|let|var)\s+TODOS\s*=/.test(js) &&
    /\bexport\s*\{[^}]*\bTODOS\b/.test(js);
}
export async function inspectCore(get=getPublicClientResource) {
  const result={source:ORIGIN,mode:'official-code-only',complete:false,
    playableVerified:false,checkedAt:new Date().toISOString(),alpha:null,
    sourceDir:null,files:[],failed:[],note:'Official JavaScript only. Does not validate sprites, VFX, build, gameplay, copyright licensing or deployment.'};
  const captured=new Map();
  try {
    const homepage=await get(ORIGIN,3*1024*1024);
    const html=homepage.data.toString('utf8');
    const dir=officialDirectory(html);
    if(!dir)throw Error('Official main.js directory missing in homepage');
    result.sourceDir=dir;
    // Downloads are limited to files in the source directory declared by the homepage.
    for(const name of [...REQUIRED,...OPTIONAL]) {
      const relative=dir+'/'+name;
      try {
        const {data,contentType}=await get(ORIGIN+relative,10*1024*1024);
        if(data.length<20)throw Error('Empty or truncated JavaScript');
        const source=data.toString('utf8');
        if(/^\s*<!doctype html/i.test(source))throw Error('HTML rather than source');
        captured.set(name,data);
        result.files.push({path:relative,bytes:data.length,sha256:sha256(data),contentType,required:REQUIRED.includes(name)});
      }catch(error) {
        result.failed.push({path:relative,required:REQUIRED.includes(name),error:String(error?.message||error)});
      }
    }
    const config=captured.get('config.js')?.toString('utf8')||'';
    const alpha=readOfficialAlpha(config);
    if(!alpha)result.failed.push({path:dir+'/config.js',required:true,error:'Official VERSION not verified'});
    result.alpha=alpha;
    const main=captured.get('main.js')?.toString('utf8')||'';
    if(!/\.\/datos\.js/.test(main))result.failed.push({path:dir+'/main.js',required:true,error:'Main module no longer imports datos.js'});
    const native=captured.get('datos.js')?.toString('utf8')||'';
    if(!isNativeData(native))result.failed.push({path:dir+'/datos.js',required:true,error:'Native TODOS export not verified'});
    result.complete=!result.failed.some(x=>x.required)&&REQUIRED.every(x=>captured.has(x));
    if(!result.complete)result.error='Official code audit incomplete; no release integration authorized';
  }catch(error) {result.error=String(error?.message||error);}
  return {result,captured};
}
export async function writeCoreAudit({result,captured},out=OUT,sourceDir=SOURCE_DIR) {
  await fs.mkdir(path.dirname(out),{recursive:true});
  // Save the report even when the source fails, so alerts contain evidence.
  await fs.writeFile(out,JSON.stringify(result,null,2)+'\n');
  if(!result.complete)return;
  await fs.mkdir(sourceDir,{recursive:true});
  for(const [name,bytes] of captured)await fs.writeFile(path.join(sourceDir,name),bytes);
}
async function main(){
 const audit=await inspectCore();
 await writeCoreAudit(audit);
 console.log(JSON.stringify(audit.result,null,2));
 if(!audit.result.complete)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)
 main().catch(error=>{console.error(error);process.exitCode=1;});
