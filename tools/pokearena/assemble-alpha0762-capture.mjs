#!/usr/bin/env node
/* Pokémon Torre 2 — assemble the Alpha 0.76.2 port input.
 * Usage: node tools/pokearena/assemble-alpha0762-capture.mjs <audited-0713-archive-dir>
 *   <archive>/source = raw audited 0.71.3 capture, <archive>/site = audited 0.71.3 build
 *   (tools/pokearena/restore-audited-alpha0713.sh source|site restore them).
 * 1. Copies the audited 0.71.3 assets (PMD, VFX, packs, UI) and rights reports.
 * 2. Downloads the 114 public 0.76.2 ES modules with ordinary GETs and requires
 *    every SHA-256 to match data/alpha0762-source-modules.json (fail closed).
 * 3. Uses the live 0.76.2 index.html with the 0.71.3 pack index (#paq),
 *    because /assets/* of the base client answers HTTP 403. No bypass.
 * Downloaded JavaScript is only written to disk, never executed here.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {getPublicClientResource} from './public-client-http.mjs';

const archive=path.resolve(process.argv[2]||'');
// Optional 2nd argument: another pin (e.g. data/alpha0773-source-modules.json).
const pinFile=process.argv[3]||'data/alpha0762-source-modules.json';
const pin=JSON.parse(await fs.readFile(pinFile,'utf8'));
const dest=path.resolve('site-capture/pokearena-client');
const ORIGIN='https://www.pokearena2d.com';
const sha=b=>createHash('sha256').update(b).digest('hex');
const fail=m=>{throw Error('ALPHA_ASSEMBLY '+pin.alpha+': '+m)};

for(const d of ['source/src-5ccc174cb8','site/arena2d/assets/pmd/manifest.json'])
 try{await fs.access(path.join(archive,d))}catch{fail('audited 0.71.3 archive incomplete: '+d)}
await fs.rm(dest,{recursive:true,force:true});
await fs.cp(path.join(archive,'source'),dest,{recursive:true});
await fs.rm(path.join(dest,'src-5ccc174cb8'),{recursive:true,force:true});

// Native PMD loose sprites of the 278 audited forms (same bytes as published).
const nativeManifest=JSON.parse(await fs.readFile(path.join(dest,'assets/pmd/manifest.json'),'utf8'));
let copied=0;
for(const dex of Object.keys(nativeManifest)){
 const from=path.join(archive,'site/arena2d/assets/pmd',dex);
 try{await fs.cp(from,path.join(dest,'assets/pmd',dex),{recursive:true});copied++}
 catch(e){if(e.code!=='ENOENT')throw e}
}
if(copied!==Object.keys(nativeManifest).length)fail('missing audited native PMD folders');
const siteRoot=path.join(archive,'site/arena2d');
for(const f of ['priority-licensed-pmd-report.json','priority-artist-upgrade-report.json','rights-audit-0713.json',
 'CONTRIBUTOR-CREDITS-0713.md','READ_ME_NONCOMMERCIAL_SOURCE_ART.txt','lazy-pack-integration-report.json',
 'public-missing-packs-report.json','public-manifest-recovery-report.json','prior-http-denials.json'])
 try{await fs.copyFile(path.join(siteRoot,f),path.join(dest,f))}catch(e){if(e.code!=='ENOENT')throw e}
await fs.copyFile(path.join(siteRoot,'assets/pmd/torre2-visual-substitutes.json'),
 path.join(dest,'assets/pmd/torre2-visual-substitutes.json'));

// 0.76.2 VFX sheets supplied by the project owner (403 for non-browser
// clients): install them with their recorded SHA-256, never overwrite.
const vfxDir='tools/pokearena/alpha0762-vfx';
const vfx=JSON.parse(await fs.readFile(path.join(vfxDir,'PROVENANCE.json'),'utf8'));
for(const [name,info] of Object.entries(vfx.files)){
 const data=await fs.readFile(path.join(vfxDir,name));
 if(sha(data)!==info.sha256)fail('owner-supplied VFX changed: '+name);
 const target=path.join(dest,'assets/vfx',name);
 try{await fs.access(target);fail('VFX already present, refusing to overwrite: '+name)}catch(e){if(e.code!=='ENOENT')throw e}
 await fs.writeFile(target,data);
}

// 0.76.2 modules, pinned.
const modules=Object.entries(pin.modules);
let bytes=0;
// TORRE2_UPSTREAM_ARCHIVE: our permanent copy (release made by
// torre2-upstream-*-archive.yml, unpacked) instead of the live site.
// Same SHA-256 check either way.
const local=process.env.TORRE2_UPSTREAM_ARCHIVE?path.resolve(process.env.TORRE2_UPSTREAM_ARCHIVE):null;
const getFile=async(rel,max)=>local?{data:await fs.readFile(path.join(local,'source',rel))}:
 getPublicClientResource(`${ORIGIN}/${rel}`,max);
for(const [rel,expected] of modules){
 const {data}=await getFile(pin.src+'/'+rel);
 if(sha(data)!==expected)fail('module changed upstream (re-pin required): '+rel);
 const file=path.join(dest,pin.src,rel);
 await fs.mkdir(path.dirname(file),{recursive:true});
 await fs.writeFile(file,data);bytes+=data.length;
}
// Live index.html (references pin.src) + audited 0.71.3 pack index.
const live=(await getFile('index.html',2*1024*1024)).data.toString('utf8');
if(!live.includes(`src="${pin.src}/main.js"`))fail('live index.html no longer serves '+pin.src);
const PAQ=/(<script type="application\/json" id="paq">)([\s\S]*?)(<\/script>)/;
const audited=await fs.readFile(path.join(archive,'source/index.html'),'utf8');
const paq=audited.match(PAQ)?.[2];
if(!paq||!PAQ.test(live))fail('pack index block not found');
await fs.writeFile(path.join(dest,'index.html'),live.replace(PAQ,(_,a,__,c)=>a+paq+c));

await fs.writeFile(path.join(dest,'version.json'),JSON.stringify({
 officialAlpha:pin.alpha,src:pin.src,assetAlpha:pin.assetBase.alpha,assetSrc:pin.assetBase.src,
 capturedFrom:pin.origin,note:'Modulos publicos '+pin.alpha+' (SHA fixado); assets herdados do release auditado 0.71.3 porque /assets/ responde 403'})+'\n');
const total=(await fs.readdir(dest,{recursive:true})).length;
await fs.writeFile(path.resolve('site-capture/CAPTURE-REPORT.json'),JSON.stringify({
 source:pin.origin,totalFiles:total,sourceVersions:{selected:pin.src,officialAlpha:pin.alpha},
 sourceCatalog:pinFile,completed:new Date().toISOString(),
 assetsInheritedFrom:pin.assetBase,ownerSuppliedVfx:Object.keys(vfx.files),
 blockedAssets:pin.blockedAssets.filter(a=>!vfx.files[a.split('/').pop()])},null,1));
console.log('ALPHA_CAPTURE_ASSEMBLED '+pin.alpha,JSON.stringify({modules:modules.length,bytes,nativePmd:copied,ownerVfx:Object.keys(vfx.files).length,files:total}));
