import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const base=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const modules=JSON.parse(fs.readFileSync(path.join(base,'version.json'),'utf8')).modules;
const load=name=>import(pathToFileURL(path.join(base,modules,name)).href);
const [{ROSTER,buscar},{LEVEL_EVOLUTIONS},{selectedMoves,resolveLoadout}]=await Promise.all([
 load('datos.js'),load('torre2/progression.js'),load('torre2/move-pool.js')
]);
let collisions=[],tested=0;
for(const def of ROSTER){
 if(!Array.isArray(def.evoluciones))continue;
 const forms=[def.id,...def.evoluciones.map(x=>x.nombre.toLowerCase())];
 for(let formIndex=0;formIndex<forms.length;formIndex++){
  const species=forms[formIndex];
  if(!species||['mewtwo'].includes(species))continue;
  const previous=formIndex>1?forms[formIndex-1]:def.id;
  const rule=LEVEL_EVOLUTIONS[previous]?.find(x=>x.to===species);
  const level=species===def.id?50:rule?.level||50;
  const member={id:species,progression:{species,level}};
  try{
   const kit=resolveLoadout(member),active=['lmb','rmb','q','e'].filter(slot=>kit[slot]?.forma);
   const names=active.map(slot=>kit[slot].nombre);
   if(new Set(names).size!==names.length)
    collisions.push({species,level,active:active.map(slot=>({slot,id:kit[slot].id,name:kit[slot].nombre,intro:kit[slot].torre2IntroPractice}))});
   tested++;
  }catch(error){collisions.push({species,level,error:String(error)})}
 }
}
console.log('T08_DUPLICATE_NAME_DIAGNOSTIC',JSON.stringify({tested,duplicates:collisions.length,collisions:collisions.slice(0,60)}));
