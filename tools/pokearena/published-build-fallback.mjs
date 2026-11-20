#!/usr/bin/env node
/* Pokémon Torre 2 — legacy CI tests without the Poké Arena 2D site
 * (owner list 2026-11-20, item 30).
 * Around 210 old workflows start with `capture-client.mjs` (download the live
 * site) and `build-preview.mjs`. The site now answers 403 to CI, so every one
 * of them failed before testing anything. When that happens, capture-client
 * calls this script instead of retrying the site (no bypass): it rebuilds the
 * EXACT game we publish from our own authorized copy:
 *  1. the audited 0.77.3 build kept as a permanent public release of this
 *     repository (pinned SHA-256 + MANIFEST run/commit/digest, fail closed);
 *  2. the current Torre 2 overlay (publish-alpha0762.mjs), same as Pages.
 * It writes site-capture/TORRE2-PUBLISHED-BUILD.json; build-preview.mjs then
 * keeps that site instead of rebuilding from a capture.
 * TORRE2_PUBLISHED_TARBALL=<file> uses a local copy of the same release file.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

export const PUBLISHED_RELEASE=Object.freeze({
 tag:'torre2-audited-site-alpha0773',
 asset:'torre2-audited-site-alpha0773.tar.gz',
 sha256:'c1001bde4cba39c228f73464e330c050aa8ae6feffd3c80e022c1b395396fe09',
 manifest:Object.freeze(['run=44740488716','commit=a604fa1427b3e2e6f0d5b5f9c485ca5f0e29ac67',
  'torre2-alpha0773-port=sha256:5c2cc6ffe849cb4392e70a50cb38a522cd1342b0bbba674fc75bf793f7e18fa7'])
});
export const MARKER='site-capture/TORRE2-PUBLISHED-BUILD.json';
const fail=m=>{throw Error('PUBLISHED_BUILD_FALLBACK: '+m)};
const sha=b=>createHash('sha256').update(b).digest('hex');

async function tarball(){
 const local=process.env.TORRE2_PUBLISHED_TARBALL;
 if(local)return fs.readFile(local);
 const repo=process.env.GITHUB_REPOSITORY||'lulualcides-sys/Pok-mon-torre-2';
 if(!/^[\w.-]+\/[\w.-]+$/.test(repo))fail('bad repository');
 const url=`https://github.com/${repo}/releases/download/${PUBLISHED_RELEASE.tag}/${PUBLISHED_RELEASE.asset}`;
 for(let attempt=1;attempt<=3;attempt++){
  try{const r=await fetch(url,{redirect:'follow'});
   if(r.ok)return Buffer.from(await r.arrayBuffer());
   if(r.status===404)fail('release not found: '+url);
  }catch(e){if(attempt===3)throw e}
  await new Promise(done=>setTimeout(done,attempt*5000));
 }
 fail('download failed: '+url);
}
export async function restorePublishedBuild({site='_site'}={}){
 const data=await tarball();
 if(sha(data)!==PUBLISHED_RELEASE.sha256)fail('release hash mismatch');
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'torre2-published-'));
 try{
  await fs.writeFile(path.join(tmp,'site.tar.gz'),data);
  const untar=spawnSync('tar',['-xzf','site.tar.gz'],{cwd:tmp,stdio:'inherit'});
  if(untar.status!==0)fail('cannot extract release');
  const manifest=(await fs.readFile(path.join(tmp,'MANIFEST.txt'),'utf8')).split('\n');
  for(const line of PUBLISHED_RELEASE.manifest)if(!manifest.includes(line))fail('MANIFEST pin missing: '+line);
  await fs.rm(site,{recursive:true,force:true});
  await fs.cp(path.join(tmp,'site'),site,{recursive:true});
 }finally{await fs.rm(tmp,{recursive:true,force:true})}
 const version=JSON.parse(await fs.readFile(path.join(site,'arena2d/version.json'),'utf8'));
 if(version.src!=='src-712ba03dbb')fail('unexpected base '+version.src);
 // Same overlay as GitHub Pages.
 const overlay=spawnSync(process.execPath,['tools/pokearena/publish-alpha0762.mjs'],{stdio:'inherit',
  env:{...process.env,TORRE2_SITE_ROOT:site,GITHUB_SHA:process.env.GITHUB_SHA||'legacy-ci'}});
 if(overlay.status!==0)fail('Torre 2 overlay failed');
 const built=JSON.parse(await fs.readFile(path.join(site,'arena2d/version.json'),'utf8'));
 await fs.mkdir(path.dirname(MARKER),{recursive:true});
 const info={release:PUBLISHED_RELEASE.tag,sha256:PUBLISHED_RELEASE.sha256,base:built.src,modules:built.modules,
  site,reason:'live Poké Arena 2D site unavailable (HTTP 403); used our authorized archived build'};
 await fs.writeFile(MARKER,JSON.stringify(info,null,2));
 console.log('TORRE2_PUBLISHED_BUILD_RESTORED',JSON.stringify(info));
 return info;
}
// build-preview.mjs: keep a site restored by this script (same modules).
export async function publishedBuildPresent(site='_site'){
 try{
  const m=JSON.parse(await fs.readFile(MARKER,'utf8'));
  const v=JSON.parse(await fs.readFile(path.join(site,'arena2d/version.json'),'utf8'));
  return m.modules===v.modules&&typeof v.modules==='string'?m:null;
 }catch{return null}
}
if(import.meta.url===`file://${process.argv[1]}`)await restorePublishedBuild();
