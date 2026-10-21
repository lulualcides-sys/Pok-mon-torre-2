/* Pokémon Torre 2 — per-Pokémon move list and battle loadout.
 * The test Mewtwo (level 50) can choose every available move in the captured
 * Poké Arena client, plus all four brand-new signature VFX in this project.
 */
import {ROSTER,buscar,etapaDe} from '../datos.js';

const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const SLOTS=['lmb','rmb','q','e'];
export const SIGNATURE_MOVES=Object.freeze([
 {id:'bonemerang',approved:true,nombre:'Bonemerang',forma:'torre2_bonemerang',tipo:'GROUND',dano:10.5,alcance:245,coste:24,cd:5.7,anim:'Shoot',lanzar:.16,description:'Bone boomerang / two synchronized hits'},
 {id:'bone-club',approved:true,nombre:'Bone Club',forma:'torre2_boneclub',tipo:'GROUND',dano:12,alcance:64,coste:20,cd:4.7,anim:'Swing',lanzar:.13,description:'Physical contact, pixel bone club'},
 {id:'tri-attack',approved:true,nombre:'Tri Attack',forma:'torre2_triattack',tipo:'NORMAL',dano:13,alcance:240,coste:30,cd:6.2,anim:'Charge',lanzar:.2,description:'Fire / ice / electric three-point projectile'},
 {id:'pay-day',approved:true,nombre:'Pay Day',forma:'torre2_payday',tipo:'NORMAL',dano:10,alcance:235,coste:23,cd:5.4,anim:'Shoot',lanzar:.15,description:'Nine scattered coins, each with independent impact'},
 {id:'swift',approved:true,nombre:'Swift',forma:'torre2_swift',tipo:'NORMAL',dano:10,alcance:250,coste:21,cd:5.2,anim:'Shoot',lanzar:.15,description:'Seven fan-scattered stars, staggered Pay Day-style impacts, individual contact and misses'},
 {id:'shadow-ball',approved:true,nombre:'Shadow Ball',forma:'torre2_shadowball',tipo:'GHOST',dano:14,alcance:245,coste:31,cd:6.5,anim:'Charge',lanzar:.18,description:'Dark ghost orb and expanding impact ring'},
 {id:'lovely-kiss',approved:true,nombre:'Lovely Kiss',forma:'torre2_lovelykiss',tipo:'NORMAL',dano:0,alcance:225,coste:25,cd:9.8,anim:'Shoot',lanzar:.13,description:'Larger aimed kiss: must physically hit; 75% sleep accuracy after contact, no damage'},
 {id:'ice-beam',approved:true,nombre:'Ice Beam',forma:'chorro',paleta:'hieloTorre2',haz:true,desdeBoca:true,ancho:17,largo:260,carga:.16,dur:.76,velTrozos:440,pulsos:4,giro:3.5,giroCarga:3.5,empuje:12,empujePulso:3,tipo:'ICE',dano:13,alcance:260,coste:28,cd:6.8,anim:'Charge',lanzar:.15,description:'Authentic Poké Arena Hyper Beam/Aura Storm Chorro, cold recolor and subtle ice crystals'},
 {id:'rock-blast',approved:true,nombre:'Rock Blast',forma:'torre2_rockblast',tipo:'ROCK',dano:12,alcance:250,coste:27,cd:6.8,anim:'Throw',lanzar:.15,description:'Six or seven different polygonal stones, sequential independent contact or miss'},
 {id:'confuse-ray',approved:true,nombre:'Confuse Ray',forma:'torre2_confuseray',tipo:'GHOST',dano:0,alcance:230,coste:24,cd:9.1,anim:'Charge',lanzar:.16,description:'First original three swirling spectral lights, yellow palette, 85% status on hit'},
 {id:'sing',approved:true,nombre:'Sing',forma:'torre2_sing',tipo:'NORMAL',dano:0,alcance:220,coste:24,cd:8,anim:'Charge',lanzar:.14,description:'Jigglypuff song: staggered pixel notes, 55% sleep only after contact'},
 {id:'crabhammer',approved:true,nombre:'Crabhammer',forma:'torre2_crabhammer',tipo:'WATER',dano:15,alcance:80,coste:26,cd:6.5,anim:'Swing',lanzar:.12,description:'Kingler pixel-claw hammer, contact only, blue impact splash'},
 {id:'smog',approved:true,nombre:'Smog',forma:'torre2_smog',tipo:'POISON',dano:7,alcance:190,coste:23,cd:6.7,anim:'Shoot',lanzar:.13,description:'17 staggered drifting toxic bubbles with independent collision and small impact damage; 40% poison on first confirmed bubble'},
 {id:'hyper-fang',approved:true,nombre:'Hyper Fang',forma:'torre2_hyperfang',tipo:'NORMAL',dano:20,alcance:87,coste:24,cd:6.3,anim:'Swing',lanzar:.11,description:'Raticate pixel fangs: single real bite, 90% accuracy and 10% flinch'},
 {id:'guillotine',approved:true,nombre:'Guillotine',forma:'torre2_guillotine',tipo:'NORMAL',dano:19,alcance:85,coste:45,cd:15,anim:'Swing',lanzar:.18,description:'Pinsir steel pincers, 30% physical-contact OHKO chance, level-gated'},
 {id:'petal-dance',approved:true,nombre:'Petal Dance',forma:'torre2_petaldance',tipo:'GRASS',dano:13,alcance:220,coste:33,cd:10,anim:'Charge',lanzar:.19,description:'Vileplume pixel rose petal spiral, up to three actual contacts and self-confusion'},
 {id:'metronome',nombre:'Metronome',forma:'torre2_metronome',tipo:'NORMAL',dano:0,alcance:0,coste:24,cd:12,anim:'Charge',lanzar:.15,description:'Finger-wag pixel art; calls one genuinely random installed move, never itself'},
 {id:'absorb',nombre:'Absorb',forma:'torre2_absorb',tipo:'GRASS',dano:7,alcance:225,coste:15,cd:5.3,anim:'Shoot',lanzar:.14,description:'Aimed green sprout strikes once and returns half inflicted damage as health'},
 {id:'x-scissor',nombre:'X-Scissor',forma:'torre2_xscissor',tipo:'BUG',dano:19,alcance:78,coste:20,cd:5,anim:'Swing',lanzar:.12,description:'Two crossing pixel blades, one physical aimed melee strike'},
 {id:'soft-boiled',approved:true,nombre:'Soft-Boiled',forma:'torre2_softboiled',tipo:'NORMAL',dano:0,alcance:0,coste:30,cd:11,anim:'Charge',lanzar:.15,description:'Rising glowing egg, dissolving shell and animated healing aura; 30% max HP'}
]);
function collect(def){
 // Use every actual move slot and carry inherited base/evolution properties
 // forward. In the original client, some evolution kits override only damage
 // or name; the previous reader lost moves from ESP, Megas and mid-evolutions.
 const slots=['lmb','rmb','esp','q','e'];
 const merge=(a,b)=>Object.fromEntries(
  [...new Set([...Object.keys(a||{}),...Object.keys(b||{})])]
   .map(key=>[key,{...(a?.[key]||{}),...(b?.[key]||{})}]));
 const moves=[];
 const read=(kit,origin)=>{
  for(const slot of slots){
   const h=kit?.[slot];
   if(!h?.nombre||!h.forma)continue;
   moves.push({...h,cd:typeof h.cd==='number'?h.cd:5,
    learnedFrom:origin,originalSlot:slot});
  }
 };
 let accumulated=def.kit||{};
 read(accumulated,def.nombre||def.id);
 for(const evo of def.evoluciones||[]){
  accumulated=merge(accumulated,evo.kit||{});
  read(accumulated,evo.nombre||evo.dex||'evolution');
  if(evo.mega?.kit)read(merge(accumulated,evo.mega.kit),
   evo.mega.nombre||'Mega');
 }
 return moves;
}
const rawLibrary=[...ROSTER.flatMap(collect),...SIGNATURE_MOVES];
const ids=new Map(),signatureEntries=new Set(SIGNATURE_MOVES);
for(const h of rawLibrary){
 const id=h.id||norm(h.nombre);
 if(!ids.has(id))ids.set(id,{...h,id,source:signatureEntries.has(h)?'new-phaser-fx':'arena2d-original'});
}
export const TEST_LIBRARY=[...ids.values()].sort((a,b)=>a.nombre.localeCompare(b.nombre));
export function availableMoves(member){
 if(member.id==='mewtwo')return TEST_LIBRARY;
 const {def}=buscar(member.id);
 const names=new Set([...collect(def).map(x=>norm(x.nombre)),...(member.tmMoves||[]).map(norm)]);
 if(['cubone','marowak'].includes(member.id)){names.add('bonemerang');names.add('bone-club')}
 if(['meowth','persian'].includes(member.id))names.add('pay-day');
 if(['porygon'].includes(member.id))names.add('tri-attack');
 if(['jynx'].includes(member.id))names.add('lovely-kiss');
 if(['jigglypuff','wigglytuff'].includes(member.id))names.add('sing');
 if(['krabby','kingler'].includes(member.id))names.add('crabhammer');
 if(['koffing','weezing'].includes(member.id))names.add('smog');
 if(['rattata','raticate'].includes(member.id))names.add('hyper-fang');
 if(member.id==='pinsir')names.add('guillotine');
 if(['clefairy','clefable','mew','chansey'].includes(member.id))names.add('metronome');
 if(['oddish','gloom','vileplume','bellsprout','weepinbell','victreebel','paras','parasect','tangela','omanyte','omastar'].includes(member.id))names.add('absorb');
 if(['scyther','pinsir','parasect','beedrill'].includes(member.id))names.add('x-scissor');
 if(['oddish','gloom','vileplume','bellsprout','weepinbell','victreebel'].includes(member.id))
  names.add('petal-dance');
 // New exclusive VFX are only assigned to compatible Kanto species.
 if(['blastoise','wartortle','lapras','dewgong','cloyster','starmie','slowbro','golduck','vaporeon','articuno'].includes(member.id))names.add('ice-beam');
 if(['onix','geodude','graveler','golem','rhyhorn','rhydon','omastar','kabutops','aerodactyl'].includes(member.id))names.add('rock-blast');
 if(['gastly','haunter','gengar','zubat','golbat','vulpix','ninetales','starmie'].includes(member.id))names.add('confuse-ray');
 if(member.id==='chansey')names.add('soft-boiled');
 return TEST_LIBRARY.filter(x=>names.has(x.id)||names.has(norm(x.nombre)));
}
export function defaultLoadout(member){
 const pool=availableMoves(member);
 if(member.id==='mewtwo')
  return ['bonemerang','bone-club','tri-attack','pay-day'];
 const {def}=buscar(member.id);
 const slots=['lmb','rmb','q','e'];
 const ids=slots.map(s=>norm(def.kit[s]?.nombre));
 return ids.map((name,i)=>pool.find(p=>p.id===name)?.id||pool[i]?.id).filter(Boolean).slice(0,4);
}
export function selectedMoves(member){
 const pool=availableMoves(member),valid=new Set(pool.map(x=>x.id));
 const chosen=(member.moves?.length===4&&member.moves.every(id=>valid.has(id)))?member.moves:defaultLoadout(member);
 return chosen.filter(id=>valid.has(id)).slice(0,4);
}
export function equipMove(member,slot,moveId){
 if(!Number.isInteger(slot)||slot<0||slot>=4)return false;
 const pool=availableMoves(member);
 if(!pool.some(m=>m.id===moveId))return false;
 const selected=selectedMoves(member);
 // Do not put the same move into multiple buttons.
 if(selected.some((id,i)=>id===moveId&&i!==slot))return false;
 while(selected.length<4)selected.push(pool[selected.length]?.id);
 selected[slot]=moveId;member.moves=selected;
 return true;
}
export function resolveLoadout(member){
 const pool=availableMoves(member);
 const dict=new Map(pool.map(h=>[h.id,h]));
 const out={};
 selectedMoves(member).forEach((id,i)=>{
  const move=dict.get(id);
  if(move)out[SLOTS[i]]={...move};
 });
 return out;
}
export function pokemonStats(member){
 const {def,etapa}=buscar(member.id);
 const stage=etapaDe(def,etapa);
 const level=member.progression.level;
 const hp=Math.round((stage.hp??def.hp??70)*(1+level/95));
 return {name:stage.nombre||def.nombre,types:stage.tipos||def.tipos,
  role:stage.rol||def.rol,level,hp,attack:Math.round((stage.atk??def.atk??1)*100),
  defense:Math.round((stage.def??def.def??1)*100),speed:Math.round(stage.vel??def.vel??100),
  xp:member.progression.experience,stage:etapa};
}
