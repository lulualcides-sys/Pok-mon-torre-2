/* Rayquaza / Mega Rayquaza — isolated Torre 2 Phaser homologation.
 * Enable only the Pokémon already defined by the public native roster.
 * Do not copy source assets, invent move renderers, or touch other disabled species.
 */
const OFF='desactivado:"local",id:"rayquaza",dex:"0384"';
const ON='desactivado:false,id:"rayquaza",dex:"0384"';
const DEX=Object.freeze(['0384','0384-0001']);
const ANIMS=Object.freeze(['Idle','Walk','Attack','Shoot','Hop']);

export function enableRayquazaForHomologation(source){
 if(typeof source!=='string')throw new TypeError('Expected native datos.js source');
 const offCount=source.split(OFF).length-1;
 const onCount=source.split(ON).length-1;
 const auto='{id:"rayquaza",dex:"0384"';
 const autoCount=source.split(auto).length-1;
 const nativeReady=offCount===0&&onCount===0&&autoCount===1&&
  source.includes('ROSTER=TODOS.filter(p=>!p.desactivado||p.desactivado==="local"&&EN_LOCAL)');
 if(!((offCount===1&&onCount===0)||(offCount===0&&onCount===1)||nativeReady))
  throw Error('Rayquaza native roster flag is missing or duplicated; refusing guessed unlock');
 // In official Alpha 0.69.4, Rayquaza has no disabled flag at all and is
 // already selected by the native ROSTER predicate. Do NOT add/alter flags.
 const token=offCount?OFF:onCount?ON:auto;
 const start=source.indexOf(token);
 const end=source.indexOf('},{id:"',start+token.length);
 const entry=source.slice(start,end<0?start+3500:end);
 for(const required of [
  'mega:{dex:"0384-0001"', 'nombre:"MEGA RAYQUAZA"',
  'nombre:"Dragon Claw"', 'nombre:"Twister"', 'nombre:"Hurricane"',
  'nombre:"Dragon Ascent"', 'mov("extremeSpeed")', 'mov("dragonDance")'
 ])if(!entry.includes(required))
  throw Error('Native Rayquaza / Mega kit changed: '+required);
 return offCount?source.replace(OFF,ON):source;
}

// Read-only check of existing manifest entries; actual files must also exist.
export function rayquazaRequiredSpriteFiles(manifest){
 if(!manifest||typeof manifest!=='object'||Array.isArray(manifest))
  throw Error('PMD manifest missing for Rayquaza test');
 const files=[];
 for(const dex of DEX){
  const info=manifest[dex];
  if(!info?.anims)throw Error('Missing Rayquaza PMD animation catalog: '+dex);
  for(const action of ANIMS){
   const file=info.anims[action]?.file;
   if(typeof file!=='string'||!new RegExp('^'+dex+'/[A-Za-z][A-Za-z0-9-]*\\.png$').test(file))
    throw Error('Missing or unsafe '+dex+' '+action+' PMD sprite');
   files.push(file);
  }
 }
 return Object.freeze(files);
}

export const RAYQUAZA_PREVIEW_SPECIES=Object.freeze({
 id:'rayquaza',dex:'0384',megaDex:'0384-0001',
 normal:['Dragon Claw','Twister','Extreme Speed','Dragon Dance','Dragon Ascent'],
 mega:['Dragon Claw','Hurricane','Extreme Speed','Dragon Dance','Dragon Ascent']
});
