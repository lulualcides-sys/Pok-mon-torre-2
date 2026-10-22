/* Install an existing, real 16x16 overworld spritesheet at build time.
 * Source: Shade, "16x16 Puny World Tileset", CC0 1.0.
 * https://opengameart.org/content/16x16-puny-world-tileset
 * We do NOT redistribute or use original FireRed art (not licensed here).
 * Do NOT generate sprite art or fake a full background screenshot.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

export const OVERWORLD_SOURCE=
 'https://opengameart.org/sites/default/files/punyworld-overworld-tileset_0.png';
export const OVERWORLD_SHA256=
 '14d285bde8dee96cb0113947c8cce4922b86bf1d033b19123112145c7cef3a38';
const PNG=Buffer.from([137,80,78,71,13,10,26,10]);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function installCC0WorldTiles(destination){
 const output=path.join(destination,'assets','ui','kanto-cc0-world.png');
 await fs.mkdir(path.dirname(output),{recursive:true});
 if(await fs.stat(output).then(x=>x.isFile()).catch(()=>false)){
  const existing=await fs.readFile(output);
  if(createHash('sha256').update(existing).digest('hex')===OVERWORLD_SHA256)
   return {installed:true,cached:true,bytes:existing.length};
 }
 let last;
 // Source is downloaded only by the GitHub Actions build; the finished
 // game serves it locally, including when the browser is offline.
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await fetch(OVERWORLD_SOURCE,{
    headers:{'User-Agent':'PokemonTorre2-CC0-sprite-installer/1.0'},
    signal:AbortSignal.timeout(20000)});
   if(!response.ok)throw Error('HTTP '+response.status);
   const bytes=Buffer.from(await response.arrayBuffer());
   const digest=createHash('sha256').update(bytes).digest('hex');
   if(!bytes.subarray(0,8).equals(PNG)||bytes.length<20000)
    throw Error('Invalid or incomplete PNG');
   if(digest!==OVERWORLD_SHA256)
    throw Error('Unexpected PNG SHA256 '+digest+' (stop rather than use unverified art)');
   await fs.writeFile(output,bytes);
   return {installed:true,cached:false,bytes:bytes.length};
  }catch(e){last=e;await wait(250*(attempt+1))}
 }
 throw new Error('Required CC0 overworld sheet unavailable: '+String(last));
}
