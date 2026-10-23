/* Pokémon Torre 2: canonical Arena/VS CPU/TRAINING evolved-form movesets.
 * Reassigns ONLY Kanto evolution kit slots with installed, approved Phaser
 * attacks. It never modifies the VFX or Kanto campaign level/TM resolver.
 */
import {KANTO_151_IDS} from './all-kanto-species.js';
import {nativeAttacks} from './early-kanto-species.js';
import {KANTO_LEVEL_EVOLUTIONS,frlgUnlockLevel,frlgMachineCompatible} from './frlg-learnsets.js';
const allowed=new Set(KANTO_151_IDS);
const SLOTS=['lmb','rmb','q','e'];
const idOf=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const scoreMove=m=>Number.isFinite(m?.dano)?m.dano:0;
const DODGE=Object.freeze({nombre:'Dodge',forma:'dash',tipo:'NORMAL',dano:0,
 dist:95,dur:.20,cd:4.2,anim:'Walk'});
// Recognizable evolved-species moves built from the already-approved kit art.
// All entries below require a real installed FX: unresolved names are skipped.
const EVOLUTION_SIGNATURES=Object.freeze({
 dugtrio:'Tri Attack',persian:'Pay Day',pidgeot:'Aerial Ace',
 raticate:'Hyper Fang',butterfree:'Confusion',beedrill:'Fury Attack',
 nidoking:'Earthquake',nidoqueen:'Earthquake',golduck:'Water Pulse',
 starmie:'Psychic',gyarados:'Surf',gengar:'Shadow Ball',
 alakazam:'Psychic',machamp:'Cross Chop',primeape:'Cross Chop',
 arcanine:'Flame Wheel',marowak:'Bonemerang',kingler:'Crabhammer',
 vileplume:'Petal Dance',victreebel:'Petal Dance',magneton:'Discharge',
 electrode:'Discharge',rapidash:'Flame Wheel',weezing:'Sludge Bomb',
 muk:'Poison Punch',dragonite:'Dragon Pulse',blastoise:'Surf',
 charizard:'Flamethrower',venusaur:'Razor Leaf',
 jolteon:'Thunderbolt',flareon:'Fire Blast',vaporeon:'Surf',
 raichu:'Thunderbolt',golem:'Earthquake',sandslash:'Dig',
 rhydon:'Rock Blast',parasect:'X-Scissor',clefable:'Metronome',
 venomoth:'Psybeam',fearow:'Drill Peck',poliwrath:'Cross Chop',
 dragonair:'Dragon Breath',pidgeotto:'Gust',ninetales:'Fire Blast',
 tentacruel:'Surf',hypno:'Psychic',electrode:'Discharge',
 nidoqueen:'Earthquake',kabutops:'X-Scissor',omastar:'Ancient Power'
});
// These are exactly the names / existing renderers already exposed by the
// approved Torre 2 signature catalog, not newly generated animations.
const existingSignatures=Object.freeze([
 ['Tri Attack','torre2_triattack','NORMAL',13,240,'Charge',30,6.2],
 ['Bonemerang','torre2_bonemerang','GROUND',10.5,245,'Shoot',24,5.7],
 ['Pay Day','torre2_payday','NORMAL',10,235,'Shoot',23,5.4],
 ['Crabhammer','torre2_crabhammer','WATER',15,80,'Swing',26,6.5],
 ['Shadow Ball','torre2_shadowball','GHOST',14,245,'Charge',31,6.5],
 ['Petal Dance','torre2_petaldance','GRASS',13,220,'Charge',33,10],
 ['X-Scissor','torre2_xscissor','BUG',19,78,'Swing',20,5],
 ['Metronome','torre2_metronome','NORMAL',0,0,'Charge',24,12],
 ['Hyper Fang','torre2_hyperfang','NORMAL',20,87,'Swing',24,6.3]
].map(([nombre,forma,tipo,dano,alcance,anim,coste,cd])=>
 Object.freeze({id:idOf(nombre),nombre,forma,tipo,dano,alcance,anim,coste,cd,approved:true})));
export function upgradeKantoEvolutionBattleKits(roster){
 const lookup=nativeAttacks(roster);
 for(const h of existingSignatures)
  lookup.set(h.nombre.toLowerCase(),h);
 const changed=[];
 for(const def of roster){
  if(!allowed.has(def.id)||!Array.isArray(def.evoluciones))continue;
  const byStage=new Map([[def.id,def],
   ...def.evoluciones.map(x=>[String(x.nombre||'').toLowerCase(),x])]);
  for(const evo of def.evoluciones){
   const id=String(evo.nombre||'').toLowerCase();
   if(!allowed.has(id))continue;
   const parentId=KANTO_LEVEL_EVOLUTIONS[id]?.[0]||def.id;
   const parent=byStage.get(parentId)||def;
   const parentKit={...(def.kit||{}),...(parent.kit||{})};
   const current={...parentKit,...(evo.kit||{})};
   const kinds=(evo.tipos||def.tipos||[]);
   const options=new Map();
   const accept=m=>{
    if(!m?.nombre||!m?.forma||['dash','evolucionar','megaevolucionar','renacer'].includes(m.forma))return;
    const k=idOf(m.nombre);
    if(!options.has(k))options.set(k,m);
   };
   for(const h of lookup.values())if(frlgUnlockLevel(id,h.nombre)!==null||
     frlgMachineCompatible(id,idOf(h.nombre)))accept(h);
   // Existing installed stage skills (including legacy P2 specialties)
   // remain eligible even if they postdate the FireRed learnset.
   for(const h of [...Object.values(parentKit),...Object.values(current)])accept(h);
   const signature=EVOLUTION_SIGNATURES[id];
   if(signature&&lookup.has(signature.toLowerCase()))accept(lookup.get(signature.toLowerCase()));
   const values=[...options.values()];
   const merit=h=>scoreMove(h)*1.25+
    (kinds.includes(h?.tipo)?7:0)+(frlgUnlockLevel(id,h?.nombre)!==null?3:0);
   values.sort((a,b)=>merit(b)-merit(a)||a.nombre.localeCompare(b.nombre));
   const old=SLOTS.map(s=>current[s]||null);
   const next=[...old];
   const parentNames=new Set(SLOTS.map(s=>idOf(parentKit[s]?.nombre)).filter(Boolean));
   const unique=(slot,h)=>h&&!next.some((x,j)=>j!==slot&&idOf(x?.nombre)===idOf(h.nombre));
   // A special evolved move is preferably HAB3; keep ATK weak and
   // preserve the conventional high-energy ULT for E.
   const featured=signature&&lookup.get(signature.toLowerCase());
   if(featured&&unique(2,featured))next[2]=featured;
   const choose=(slot,newToFamily)=>{
    const incumbent=next[slot],candidate=values.find(h=>
     unique(slot,h)&&idOf(h.nombre)!==idOf(next[0]?.nombre)&&
     (slot!==3||scoreMove(h)>0)&&
     (!newToFamily||!parentNames.has(idOf(h.nombre)))&&
     (!incumbent||merit(h)>=merit(incumbent)*.80));
    if(candidate&&(incumbent==null||merit(candidate)>merit(incumbent)||
       newToFamily&&idOf(incumbent.nombre)===idOf(parentKit[SLOTS[slot]]?.nombre)))
      next[slot]=candidate;
   };
   // Strongest unlocked ULT, then more distinctive HAB3/HAB2.
   choose(3,false);
   if(!featured)choose(2,true);
   choose(1,true);
   // If the initial role plan still clones every slot, prioritize an
   // actually new compatible non-status move over a second weak copy.
   if(SLOTS.every((slot,i)=>idOf(next[i]?.nombre)===idOf(parentKit[slot]?.nombre))){
    for(const h of values){
     if(parentNames.has(idOf(h.nombre))||!unique(2,h)||scoreMove(h)<=0)continue;
     next[2]=h;break;
    }
   }
   // Preserve the untouched upstream snapshot for the native-art auditor.
   // The approved custom renderer is only a role change, never native art.
   evo.torre2OriginalKit=structuredClone(evo.kit||{});
   evo.kit={...(evo.kit||{})};
   for(let i=0;i<4;i++){
    const attack=next[i];
    if(!attack?.nombre||!attack?.forma)continue;
    const h={...attack,pendiente:false};
    delete h.torre2UnlockLevel;
    delete h.torre2UnlockEvolution;
    delete h.torre2RequiresTM;
    evo.kit[SLOTS[i]]={...h,...(i===3?{ulti:true}:{})};
   }
   evo.kit.esp={...(current.esp?.forma?current.esp:DODGE)};
   changed.push({
    id,parent:parentId,
    different:SLOTS.filter((slot,i)=>
     idOf(evo.kit[slot]?.nombre)!==idOf(parentKit[slot]?.nombre)).length,
    roles:SLOTS.map(s=>evo.kit[s]?.nombre||null)
   });
  }
 }
 return changed;
}
