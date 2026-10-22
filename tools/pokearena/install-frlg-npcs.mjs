/* FireRed overworld NPC sprite source: pret/pokefirered graphics/object_events.
 * Install at build time. Do NOT redraw the pixel art, rescale with blur, or
 * modify approved Arena 2D Pokémon sprites/moves.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

export const FRLG_NPC_NAMES=Object.freeze([
 'red_normal','green_normal','blue','youngster','lass','bug_catcher','hiker',
 'camper','picnicker','rocket_m','rocket_f','sailor','fisher','scientist',
 'channeler','biker','gentleman','swimmer_m_land','black_belt','cooltrainer_m',
 'cooltrainer_f','brock','misty','lt_surge','erika','koga','sabrina','blaine',
 'giovanni','prof_oak','nurse','clerk','man','woman_1','old_man_1',
 'mr_fuji','bill','lance','lorelei','agatha','bruno'
]);
const RAW='https://raw.githubusercontent.com/pret/pokefirered/master/graphics/object_events/pics/people/';
const API='https://api.github.com/repos/pret/pokefirered/contents/graphics/object_events/pics/people/';
const png=Buffer.from([137,80,78,71,13,10,26,10]);
async function source(name){
 let error;
 for(const url of [RAW+name+'.png',API+name+'.png']){
  try{
   const r=await fetch(url,{headers:{'Accept':'application/vnd.github+json',
    'User-Agent':'Pokémon-Torre-2-FireRed-NPC-installer'},
    signal:AbortSignal.timeout(14000)});
   if(!r.ok)throw Error('HTTP '+r.status);
   let data;
   if(url.startsWith(API)){
    const x=await r.json();data=Buffer.from((x.content||'').replace(/\s/g,''),'base64');
   }else data=Buffer.from(await r.arrayBuffer());
   if(data.length<200||data.length>90000||!data.subarray(0,8).equals(png))
    throw Error('Invalid original overworld PNG');
   return data;
  }catch(e){error=e}
 }
 throw Error(name+' : '+String(error));
}
export async function installFRLGNPCs(dest){
 const folder=path.join(dest,'assets','ui','frlg','npc');
 await fs.mkdir(folder,{recursive:true});
 const result={source:'pret/pokefirered; Game Freak / Nintendo character sprites',
  available:[],missing:[]};
 for(let i=0;i<FRLG_NPC_NAMES.length;i+=7){
  await Promise.all(FRLG_NPC_NAMES.slice(i,i+7).map(async name=>{
   try{
    const data=await source(name);
    await fs.writeFile(path.join(folder,name+'.png'),data);
    result.available.push(name);
   }catch(e){result.missing.push(name)}
  }));
 }
 const crucial=['red_normal','youngster','bug_catcher','rocket_m','brock'];
 if(crucial.some(x=>!result.available.includes(x)))
  throw Error('Missing essential original FireRed NPC graphics: '+
   crucial.filter(x=>!result.available.includes(x)));
 await fs.writeFile(path.join(folder,'manifest.json'),JSON.stringify(result,null,2));
 console.log('FireRed original overworld NPC sprites:',result.available.length,
  'missing',result.missing.length);
 return result;
}
