/* Magby #240 -> Magmar #126 -> Magmortar #467 in offline Arena.
 * Add only when Magmar is a Torre2-created Kanto fighter; never rewrite
 * the original Poké Arena 2D client or its native move renderers.
 */
import {nativeAttacks} from './early-kanto-species.js';
const key=v=>String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-');
const slots=Object.freeze(['lmb','rmb','q','e']);
export function attachMagmortarEvolution(roster){
 const magmar=roster.find(p=>p.id==='magmar');
 if(!magmar||magmar.torre2ArenaAdded!==true)return false;
 if((magmar.evoluciones||[]).some(e=>Number(e.dex)===467))return true;
 // Native P2 indexes attack names with spaces ("Fire Punch"); this roster
 // planner uses kebab-case ("fire-punch"). Normalize both exactly once,
 // retaining the first/original P2 provider and its approved renderer.
 const library=new Map([...nativeAttacks(roster)].map(([name,move])=>[key(name),move]));
 const used=new Set();
 const preferences=[
  ['fire-punch','flame-wheel','ember'],
  ['flamethrower','fire-spin','fire-blast'],
  ['lava-plume','fire-blast','flame-wheel'],
  ['overheat','fire-blast','flamethrower']
 ];
 const kit={esp:{nombre:'Dodge',forma:'dash',tipo:'NORMAL',
  dano:0,dist:95,dur:.20,cd:4.2,anim:'Walk'}};
 for(const [index,choices] of preferences.entries()){
  const move=choices.map(name=>library.get(name)).find(m=>{
   const name=key(m?.nombre);
   return m?.nombre&&m?.forma&&!m.pendiente&&!used.has(name);
  });
  if(!move)throw Error('Magmortar requires 4 distinct installed FIRE abilities');
  used.add(key(move.nombre));
  kit[slots[index]]={...move,pendiente:false,
   ...(index===3?{ulti:true}:{ulti:false})};
 }
 const next={dex:'0467',nombre:'MAGMORTAR',tipos:['FIRE'],
  hp:180,vel:139,atk:1.35,def:1.13,regen:4,escala:1.03,
  kit,torre2ArenaAdded:true,torre2LaterGeneration:true};
 magmar.evoluciones??=[];
 magmar.evoluciones.push(next);
 magmar.expEvolucion??=[40];
 return true;
}
