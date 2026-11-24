/* Shiny PMD sprites for the campaign, BUILD TIME ONLY (owner 2026-11-24:
 * "quero os sprites deles todos"). Source: the original shiny sheets of
 * PMDCollab SpriteCollab (sprite/NNNN/0000/0001 and portrait/NNNN/0000/0001),
 * the same pinned commit and CC BY-NC 4.0 licence as the Johto sprites.
 * Additive: each species gets its own folder assets/pmd/NNNN-shinyt2 and a
 * manifest entry "NNNN-shinyt2". Native P2 sprites, skins and the normal
 * folders are never read for writing nor overwritten. A species without an
 * original shiny sheet simply keeps its normal sprite (no recolouring).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {JOHTO_SPRITECOLLAB_COMMIT} from './install-johto-sprites.mjs';
export const SHINY_FOLDER='shinyt2';
export const SHINY_DEX_RANGE=Object.freeze([1,251]);
const ROOT='https://raw.githubusercontent.com/PMDCollab/SpriteCollab/'+JOHTO_SPRITECOLLAB_COMMIT+'/';
const nDex=n=>String(n).padStart(4,'0');
const tag=(s,n)=>s.match(new RegExp('<'+n+'>([\\s\\S]*?)<\\/'+n+'>'))?.[1]?.trim()||'';
// AnimData.xml → manifest anims (file paths inside the shiny folder).
export function shinyAnimations(xml,dex,wanted){
 const desc=new Map();
 for(const m of xml.matchAll(/<Anim>([\s\S]*?)<\/Anim>/g)){
  const b=m[1],name=tag(b,'Name');if(!name)continue;
  desc.set(name,{copy:tag(b,'CopyOf'),fw:+tag(b,'FrameWidth'),fh:+tag(b,'FrameHeight'),
   durations:[...b.matchAll(/<Duration>(\d+)<\/Duration>/g)].map(x=>+x[1]),
   hitFrame:tag(b,'HitFrame')?+tag(b,'HitFrame'):-1,returnFrame:tag(b,'ReturnFrame')?+tag(b,'ReturnFrame'):-1});
 }
 const anims={};
 for(const name of wanted){
  let src=desc.get(name),real=name,depth=0;
  while(src?.copy&&depth++<8){real=src.copy;src=desc.get(real)}
  if(!src||!(src.fw>0)||!(src.fh>0)||!src.durations.length)continue;
  anims[name]={file:dex+'-'+SHINY_FOLDER+'/'+real+'-Anim.png',source:real+'-Anim.png',fw:src.fw,fh:src.fh,
   durations:src.durations,hitFrame:src.hitFrame,returnFrame:src.returnFrame};
 }
 return anims;
}
async function load(url,fetcher){
 let last=null;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const r=await fetcher(url,{headers:{'User-Agent':'pokemon-torre-2-shiny-sprite-build'}});
   if(r.ok)return Buffer.from(await r.arrayBuffer());
   if(r.status===404)return null;
   last=Error('HTTP '+r.status+' '+url);
  }catch(e){last=e}
  await new Promise(d=>setTimeout(d,200*(attempt+1)));
 }
 throw last;
}
async function pool(items,limit,task){
 let i=0;
 await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(i<items.length){const n=i++;await task(items[n],n)}}));
}
export async function installShinySpriteCollabAssets(site,{concurrency=16,fetcher=fetch,range=SHINY_DEX_RANGE}={}){
 const root=path.join(site,'assets/pmd'),manifestFile=path.join(root,'manifest.json');
 const manifest=JSON.parse(await fs.readFile(manifestFile,'utf8'));
 const species=[];
 for(let n=range[0];n<=range[1];n++){const dex=nDex(n);if(manifest[dex]?.anims?.Idle&&!manifest[dex+'-'+SHINY_FOLDER])species.push(dex)}
 const jobs=[],added=[],missing=[];
 await pool(species,12,async dex=>{
  const xmlBuf=await load(ROOT+'sprite/'+dex+'/0000/0001/AnimData.xml',fetcher);
  if(!xmlBuf){missing.push(dex);return}
  // Same animation set the native/normal entry uses: battle code expects it.
  const wanted=Object.keys(manifest[dex].anims);
  const anims=shinyAnimations(xmlBuf.toString('utf8'),dex,wanted);
  if(!anims.Idle){missing.push(dex);return}
  const base=manifest[dex];
  const {capa:_capa,...plain}=base;const entry={...plain,anims:{}};
  for(const [name,a] of Object.entries(anims)){const {source,...rest}=a;entry.anims[name]=rest}
  const files=new Map(Object.values(anims).map(a=>[a.file,a.source]));
  for(const [file,source] of files)jobs.push({dex,file,url:ROOT+'sprite/'+dex+'/0000/0001/'+source,idle:file.endsWith('/Idle-Anim.png')});
  jobs.push({dex,file:dex+'-'+SHINY_FOLDER+'/portrait.png',url:ROOT+'portrait/'+dex+'/0000/0001/Normal.png',portrait:true});
  added.push([dex,entry]);
 });
 const failed=new Set();let bytes=0,png=0;
 await pool(jobs,concurrency,async job=>{
  const out=path.join(root,job.file);
  try{await fs.access(out);return}catch{}
  const buf=await load(job.url,fetcher);
  if(!buf){if(job.idle)failed.add(job.dex);else if(!job.portrait)job.missing=true;return}
  await fs.mkdir(path.dirname(out),{recursive:true});await fs.writeFile(out,buf);bytes+=buf.length;png++;
 });
 let count=0;
 for(const [dex,entry] of added){
  if(failed.has(dex)){missing.push(dex);continue}
  for(const [name,a] of Object.entries(entry.anims))if(jobs.some(j=>j.dex===dex&&j.file===a.file&&j.missing))delete entry.anims[name];
  manifest[dex+'-'+SHINY_FOLDER]=entry;count++;
 }
 await fs.writeFile(manifestFile,JSON.stringify(manifest));
 await fs.writeFile(path.join(root,'SHINY-PROVENANCE.json'),JSON.stringify({
  source:'https://github.com/PMDCollab/SpriteCollab',commit:JOHTO_SPRITECOLLAB_COMMIT,license:'CC BY-NC 4.0',
  credits:'PMDCollab SpriteCollab contributors (credits.txt in each species folder of the source repository)',
  paths:'sprite/NNNN/0000/0001 and portrait/NNNN/0000/0001 (original shiny sheets)',folder:'NNNN-'+SHINY_FOLDER,
  species:count,missing:missing.sort()},null,1));
 return {species:count,missing:missing.sort(),png,bytes};
}
