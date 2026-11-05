/* Johto species sprite sync, BUILD TIME ONLY.
 * CC BY-NC 4.0 SpriteCollab sprites are noncommercial and credited.
 * App runtime never downloads from the repo: published PNGs are local.
 * Preserve native P2 art already available: NEVER overwrite existing PMD.
 */
import fs from "node:fs/promises";
import path from "node:path";
import {JOHTO_100_ROWS} from "./torre2-johto-100-data.js";
export const JOHTO_SPRITECOLLAB_COMMIT="bbed4cdf28546e18df6f821d78853d54e1e64b56";
const ROOT="https://raw.githubusercontent.com/PMDCollab/SpriteCollab/"+JOHTO_SPRITECOLLAB_COMMIT+"/";
const ACTIONS=["Idle","Walk","Attack","Shoot","Charge","Hurt","Faint",
 "Hop","Swing","Double","Rotate","Pose","Strike"];
const nDex=id=>String(id).padStart(4,"0");
const tag=(source,name)=>source.match(new RegExp("<"+name+">([\\s\\S]*?)<\\/"+name+">"))?.[1]?.trim()||"";
function animations(xml,dex){
 const anims={};const blocks=[...xml.matchAll(/<Anim>([\s\S]*?)<\/Anim>/g)];
 const descriptions=new Map();
 for(const match of blocks){
  const block=match[1],name=tag(block,"Name");
  if(name)descriptions.set(name,{
    name,copy:tag(block,"CopyOf"),
    fw:Number(tag(block,"FrameWidth")),
    fh:Number(tag(block,"FrameHeight")),
    durations:[...block.matchAll(/<Duration>(\d+)<\/Duration>/g)].map(m=>+m[1]),
    hitFrame:tag(block,"HitFrame")?Number(tag(block,"HitFrame")):-1,
    returnFrame:tag(block,"ReturnFrame")?Number(tag(block,"ReturnFrame")):-1
  });
 }
 for(const name of ACTIONS){
  let src=descriptions.get(name);
  if(!src)continue;
  let real=name,depth=0;
  while(src?.copy&&depth++<8){real=src.copy;src=descriptions.get(real)}
  if(!src||src.fw<1||src.fh<1||!src.durations.length)continue;
  anims[name]={
    file:dex+"/"+real+"-Anim.png",
    fw:src.fw,fh:src.fh,durations:src.durations,
    hitFrame:src.hitFrame,returnFrame:src.returnFrame
  };
 }
 return anims;
}
async function load(url,mandatory=true){
 let error=null;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await fetch(url,{headers:{"User-Agent":"pokemon-torre-2-johto-sprite-build"}});
   if(response.ok)return Buffer.from(await response.arrayBuffer());
   if(response.status===404){if(mandatory)throw Error("Sprite not found: "+url);return null}
   error=Error("HTTP "+response.status+" "+url);
  }catch(e){error=e}
  await new Promise(done=>setTimeout(done,150*(attempt+1)));
 }
 if(!mandatory)return null;
 throw error;
}
async function pool(items,limit,task){
 let cursor=0;
 await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{
  while(cursor<items.length){
   const n=cursor++;await task(items[n],n);
  }
 }));
}
export async function installJohtoSpriteCollabAssets(site,{
 concurrency=16
}={}){
 const root=path.join(site,"assets/pmd"),manifestFile=path.join(root,"manifest.json");
 const manifest=JSON.parse(await fs.readFile(manifestFile,"utf8"));
 // This is additive. Existing original Poké Arena PMD assets are immutable.
 const missing=JOHTO_100_ROWS.filter(p=>!manifest[nDex(p[0])]);
 const jobs=[];
 let totalBytes=0,totalPNG=0;
 await pool(missing,Math.min(concurrency,12),async row=>{
  const dex=nDex(row[0]);
  const xml=(await load(ROOT+"sprite/"+dex+"/AnimData.xml")).toString("utf8");
  const anims=animations(xml,dex);
  if(!anims.Idle)throw Error("SpriteCollab lacks Idle sheet for #"+dex);
  const distinct=[...new Set(Object.values(anims).map(a=>a.file))];
  // Do not queue optional animations with absent source files.
  const info={shadowSize:Number(tag(xml,"ShadowSize"))||1,anims,feet:0,head:-16,width:24};
  manifest[dex]=info;
  for(const file of distinct)jobs.push({
    url:ROOT+"sprite/"+file,
    file:path.join(root,file),required:file.endsWith("/Idle-Anim.png"),
    dex
  });
  jobs.push({
   url:ROOT+"portrait/"+dex+"/Normal.png",
   file:path.join(root,dex,"portrait.png"),required:true,dex
  });
 });
 await pool(jobs,concurrency,async job=>{
  try{
   await fs.access(job.file);return; // original P2 file always wins
  }catch{}
  const bytes=await load(job.url,job.required);
  if(!bytes){
   // Missing secondary animations should never leave an invalid manifest
   // entry; mark the failed file for a corrective pass.
   for(const info of Object.values(manifest[job.dex].anims))
    if(job.file.endsWith(info.file))info.file=null;
   return;
  }
  await fs.mkdir(path.dirname(job.file),{recursive:true});
  await fs.writeFile(job.file,bytes);
  totalBytes+=bytes.length;totalPNG++;
 });
 for(const row of missing){
  const dex=nDex(row[0]),m=manifest[dex];
  for(const [name,anim] of Object.entries(m.anims))
   if(!anim.file)delete m.anims[name];
  if(!m.anims.Idle)throw Error("Missing usable Idle animation for Johto "+dex);
 }
 for(const row of JOHTO_100_ROWS)
  if(!manifest[nDex(row[0])]?.anims?.Idle)
   throw Error("Johto asset coverage incomplete for "+nDex(row[0]));
 await fs.writeFile(manifestFile,JSON.stringify(manifest));
 await fs.writeFile(path.join(root,"JOHTO-SPRITECOLLAB-CREDITS.txt"),
  "Johto #0152-0251 fan-game sprite art: PMDCollab SpriteCollab.\n"+
  "Source: https://github.com/PMDCollab/SpriteCollab\n"+
  "Commit: "+JOHTO_SPRITECOLLAB_COMMIT+"\n"+
  "License: CC BY-NC 4.0, non-commercial use and creator credit required.\n"+
  "Creator credits: https://github.com/PMDCollab/SpriteCollab/blob/master/spritebot_credits.txt\n"+
  "Native Poké Arena 2D sprites were not overwritten.\n");
 return {species:JOHTO_100_ROWS.length,downloadedSpecies:missing.length,
   newPng:totalPNG,newBytes:totalBytes};
}
