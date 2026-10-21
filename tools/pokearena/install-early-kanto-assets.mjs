/* Pokémon Torre 2 — noncommercial SpriteCollab PMD asset mirror for early Kanto.
 * Uses credited CC BY-NC community art, never copies Poké Arena sprites.
 * Download files only at build time, serve same-origin static PNGs in Phaser.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
const BASE='https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/';
export const EARLY_KANTO_DEX=Object.freeze([
 '0010','0011','0012','0013','0014','0015','0016','0017','0018',
 '0019','0020','0021','0022','0025','0026','0029','0030','0031',
 '0032','0033','0034','0056','0057','0074','0075','0076'
]);
const REQUIRED=['Idle','Walk','Attack'];
const OPTIONAL=['Shoot','Swing','Hurt','Charge','Hop'];
const delay=ms=>new Promise(done=>setTimeout(done,ms));
async function download(relative,{required=true}={}){
 let error;
 const candidates=[relative,relative.replace(/^(sprite\/\d{4})\//,'$1/0000/0001/'),
 relative.replace(/^(portrait\/\d{4})\//,'$1/0000/0001/')];
 for(const filename of [...new Set(candidates)]){
  for(let attempt=0;attempt<2;attempt++){
   try{
    const response=await fetch(BASE+filename,{signal:AbortSignal.timeout(18000)});
    if(response.status===404)break;
    if(!response.ok)throw Error('HTTP '+response.status);
    const buf=Buffer.from(await response.arrayBuffer());
    if(!buf.length)throw Error('Empty '+filename);
    return buf;
   }catch(e){error=e;if(attempt===0)await delay(250);}
  }
 }
 if(required)throw Error('SpriteCollab asset unavailable '+relative+': '+String(error?.message||'404'));
 return null;
}
function readTag(segment,name){
 const m=segment.match(new RegExp('<'+name+'>\\s*([^<]+?)\\s*<\\/'+name+'>'));
 return m?.[1]?.trim()||'';
}
function parseAnimationManifest(xml,dex){
 const anims={};
 for(const found of xml.matchAll(/<Anim>\s*([\s\S]*?)<\/Anim>/g)){
  const block=found[1],name=readTag(block,'Name');
  if(![...REQUIRED,...OPTIONAL].includes(name)||readTag(block,'CopyOf'))continue;
  const fw=Number(readTag(block,'FrameWidth')),fh=Number(readTag(block,'FrameHeight'));
  const durations=[...block.matchAll(/<Duration>(\d+)<\/Duration>/g)].map(x=>Number(x[1]));
  if(!fw||!fh||!durations.length)continue;
  anims[name]={file:dex+'/'+name+'-Anim.png',fw,fh,durations,
   hitFrame:Number(readTag(block,'HitFrame')||-1),returnFrame:Number(readTag(block,'ReturnFrame')||-1)};
 }
 if(!anims.Idle||!anims.Walk)throw Error('Incomplete SpriteCollab Idle/Walk metadata '+dex);
 return {shadowSize:Number(readTag(xml,'ShadowSize')||1),anims};
}
async function eachLimited(values,max,fn){
 const results=new Array(values.length);
 let cursor=0;
 const worker=async()=>{while(cursor<values.length){const i=cursor++;results[i]=await fn(values[i]);}};
 await Promise.all(Array.from({length:Math.min(max,values.length)},worker));
 return results;
}
export async function installEarlyKantoSprites(destination){
 const base=path.join(destination,'assets','pmd');
 const manifestPath=path.join(base,'manifest.json');
 const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
 let installed=0,existing=0,portraits=0;
 // Run independent species concurrently, but no more than four active groups.
 await eachLimited(EARLY_KANTO_DEX,4,async dex=>{
  if(manifest[dex]){existing++;return;}
  const xml=(await download('sprite/'+dex+'/AnimData.xml')).toString('utf8');
  const entry=parseAnimationManifest(xml,dex);
  const folder=path.join(base,dex);
  await fs.mkdir(folder,{recursive:true});
  // Missing optional clips aren't advertised. Required clips never silently
  // disappear, avoiding a blank Pokémon or delayed runtime 404.
  await eachLimited(Object.entries(entry.anims),3,async([name,info])=>{
   const data=await download('sprite/'+dex+'/'+name+'-Anim.png',
    {required:REQUIRED.includes(name)});
   if(!data){delete entry.anims[name];return;}
   if(!data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
    throw Error('Invalid PNG sprite '+dex+'/'+name);
   await fs.writeFile(path.join(folder,name+'-Anim.png'),data);
  });
  const portrait=await download('portrait/'+dex+'/Normal.png',{required:false});
  if(portrait){
   if(!portrait.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
    throw Error('Invalid portrait '+dex);
   await fs.writeFile(path.join(folder,'portrait.png'),portrait);
   portraits++;
  }else{
   // Use a verified fallback only for portrait requests; the battle sprite
   // remains guaranteed and no original cached asset is overwritten.
   console.warn('Missing optional community portrait',dex);
  }
  manifest[dex]=entry;installed++;
 });
 await fs.writeFile(manifestPath,JSON.stringify(manifest));
 console.log('Early Kanto PMD assets:',JSON.stringify({
  newSpecies:installed,alreadyNative:existing,portraits,newManifestCount:Object.keys(manifest).length
 }));
 return {installed,existing,portraits};
}
