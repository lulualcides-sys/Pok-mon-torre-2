/* Pokémon Torre 2 — per-Pokémon move list and battle loadout.
 * The test Mewtwo (level 50) can choose every available move in the captured
 * Poké Arena client, plus all four brand-new signature VFX in this project.
 */
import {BATCH24_MOVES} from './batch24/catalog.js';
import {ROSTER,buscar,etapaDe} from '../datos.js';
import {EARLY_KANTO_LEARNSETS,earlyKantoSlotPlan} from './early-kanto-species.js';

const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const SLOTS=['lmb','rmb','q','e'];
/* One Pokémon move, one catalog entry — whether the original captured client
 * or the original game calls it by Portuguese, English or an alias.
 * Never make a second VFX of an existing Poké Arena 2D move. The native
 * entry takes priority; custom entries only fill truly missing moves.
 * Do NOT alter any approved original animation, metadata or menu.
 */
const MOVE_ALIASES=Object.freeze({
 'absorver':'absorb','tapa-de-lama':'mud-slap',
 'bomba-de-sementes':'seed-bomb','bomba-semente':'seed-bomb',
 'super-presa':'super-fang','hiper-presa':'hyper-fang',
 'bola-sombria':'shadow-ball','lanca-chamas':'flamethrower',
 'pistola-dagua':'water-gun','pistola-de-agua':'water-gun',
 'chicote-de-vinha':'vine-whip','folha-navalha':'razor-leaf',
 'bolhas':'bubble','metronomo':'metronome',
 'raio-confuso':'confuse-ray','raio-de-gelo':'ice-beam',
 'semente-sanguessuga':'leech-seed','po-sonifero':'sleep-powder'
});
export const canonicalMoveKey=name=>MOVE_ALIASES[norm(name)]||norm(name);
export const SIGNATURE_MOVES=Object.freeze([
 ...BATCH24_MOVES,
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
 {id:'metronome',approved:true,nombre:'Metronome',forma:'torre2_metronome',tipo:'NORMAL',dano:0,alcance:0,coste:24,cd:12,anim:'Charge',lanzar:.15,description:'Finger-wag pixel art; calls one genuinely random installed move, never itself'},
 {id:'absorb',approved:true,nombre:'Absorb',forma:'torre2_absorb',tipo:'GRASS',dano:7,alcance:225,coste:15,cd:5.3,anim:'Shoot',lanzar:.14,description:'Aimed green sprout strikes once and returns half inflicted damage as health'},
 {id:'x-scissor',approved:true,nombre:'X-Scissor',forma:'torre2_xscissor',tipo:'BUG',dano:19,alcance:78,coste:20,cd:5,anim:'Swing',lanzar:.12,description:'Two crossing pixel blades, one physical aimed melee strike'},

 {id:'mud-slap',approved:true,nombre:'Mud-Slap',forma:'torre2_mudslap',tipo:'GROUND',poder:20,precisao:100,pp:10,categoria:'SPECIAL',fazContato:false,dano:4,alcance:205,coste:17,cd:4.6,anim:'Throw',lanzar:.13,description:'Compact brown mud projectile, small pixel splatter on physical contact; ground attack'},
 {id:'seed-bomb',approved:true,nombre:'Seed Bomb',forma:'torre2_seedbomb',tipo:'GRASS',poder:80,precisao:100,pp:15,categoria:'PHYSICAL',fazContato:false,dano:16,alcance:225,coste:24,cd:5.8,anim:'Throw',lanzar:.16,description:'Single big inked green seed, shell fractures into six shards only on contact'},
 {id:'super-fang',approved:true,nombre:'Super Fang',forma:'torre2_superfang',tipo:'NORMAL',poder:null,precisao:90,pp:10,categoria:'PHYSICAL',fazContato:true,dano:0,alcance:82,coste:28,cd:7.8,anim:'Swing',lanzar:.13,description:'Physical twin-incisor bite; halves the foe current HP upon true contact'},
 {id:'gust',approved:true,nombre:'Gust',forma:'torre2_gust',tipo:'FLYING',poder:40,precisao:100,pp:35,categoria:'SPECIAL',fazContato:false,dano:8,alcance:235,coste:16,cd:4.2,anim:'Shoot',lanzar:.13,description:'12-frame curling hand-pixeled gust, one real hit; Fly/Bounce double power'},
 {id:'poison-sting',approved:true,nombre:'Poison Sting',forma:'torre2_poisonsting',tipo:'POISON',poder:15,precisao:100,pp:35,categoria:'PHYSICAL',fazContato:false,dano:3,alcance:235,coste:12,cd:3.5,anim:'Shoot',lanzar:.12,description:'Needle-shaped barb, physical contact 30 percent poison on true hit'},
 {id:'flash-cannon',approved:true,nombre:'Flash Cannon',forma:'torre2_flashcannon',tipo:'STEEL',poder:80,precisao:100,pp:10,categoria:'SPECIAL',fazContato:false,dano:16,alcance:265,coste:29,cd:6.3,anim:'Charge',lanzar:.25,description:'Uses the former Steel Beam sustained metal ray art, now a Flash Cannon with NO self recoil, 10% Sp. Def drop'},
 {id:'steel-beam',approved:true,nombre:'Steel Beam',forma:'torre2_steelbeam',tipo:'STEEL',poder:140,precisao:95,pp:5,categoria:'SPECIAL',fazContato:false,dano:28,alcance:320,coste:48,cd:13,anim:'Charge',lanzar:.38,paleta:'metalTorre2',haz:true,desdeBoca:true,ancho:24,anchoVisual:42,largo:320,carga:.38,dur:.82,velTrozos:700,pulsos:5,giro:2.4,giroCarga:2.4,empuje:18,empujePulso:3,description:'Original Poké Arena 2D Aura Storm / Chorro beam tinted brilliant silver, with native hit timing and 50% maximum HP user recoil'},
 {id:'mirror-shot',approved:true,nombre:'Mirror Shot',forma:'torre2_mirrorshot',tipo:'STEEL',poder:65,precisao:85,pp:10,categoria:'SPECIAL',fazContato:false,dano:13,alcance:250,coste:25,cd:5.7,anim:'Shoot',lanzar:.12,description:'Polished-body reflecting light flash, not metal plates; 30% chance to lower Accuracy after physical hit'},
 {id:'metal-claw',approved:true,nombre:'Metal Claw',forma:'torre2_metalclaw',tipo:'STEEL',poder:50,precisao:95,pp:35,categoria:'PHYSICAL',fazContato:true,dano:10,alcance:76,coste:19,cd:5.3,anim:'Swing',lanzar:.13,description:'Silvery pixel claw, melee collision, 10% Attack buff'},
 {id:'bind',approved:true,nombre:'Bind',forma:'torre2_bind',tipo:'NORMAL',poder:15,precisao:85,pp:20,categoria:'PHYSICAL',fazContato:true,dano:3,alcance:76,coste:22,cd:6.6,anim:'Swing',lanzar:.13,description:'Physical wrap contact then three restrained damage pulses'},
 {id:'rock-tomb',approved:true,nombre:'Rock Tomb',forma:'torre2_rocktomb',tipo:'ROCK',poder:60,precisao:95,pp:15,categoria:'PHYSICAL',fazContato:false,dano:12,alcance:235,coste:24,cd:6.4,anim:'Throw',lanzar:.16,description:'Nine staggered pixel stones with gentle target follow, independent hit/miss; slow after contact'},
 {id:'horn-attack',approved:true,nombre:'Horn Attack',forma:'torre2_hornattack',tipo:'NORMAL',poder:65,precisao:100,pp:25,categoria:'PHYSICAL',fazContato:true,dano:13,alcance:76,coste:18,cd:4.8,anim:'Swing',lanzar:.11,description:'Small black-outlined horn physically attached during lunge, impact, retreat'},
 {id:'double-kick',approved:true,nombre:'Double Kick',forma:'torre2_doublekick',tipo:'FIGHTING',poder:30,precisao:100,pp:30,categoria:'PHYSICAL',fazContato:true,dano:6,alcance:76,coste:21,cd:5.3,anim:'Kick',lanzar:.12,description:'Two physical kicks, two separately timed hit checks and fighter retreat'},
 {id:'fury-attack',approved:true,nombre:'Fury Attack',forma:'torre2_furyattack',tipo:'NORMAL',poder:15,precisao:85,pp:20,categoria:'PHYSICAL',fazContato:true,dano:3,alcance:76,coste:22,cd:6.0,anim:'Jab',lanzar:.12,description:'Two to five real physical spear/beak hits depending on accuracy and contact'},
 {id:'peck',approved:true,nombre:'Peck',forma:'torre2_peck',tipo:'FLYING',poder:35,precisao:100,pp:35,categoria:'PHYSICAL',fazContato:true,dano:7,alcance:76,coste:14,cd:3.8,anim:'Swing',lanzar:.11,description:'Small pixel beak, manual aim, contact and retreat'},
 {id:'bug-bite',approved:true,nombre:'Bug Bite',forma:'torre2_bugbite',tipo:'BUG',poder:60,precisao:100,pp:20,categoria:'PHYSICAL',fazContato:true,dano:12,alcance:74,coste:19,cd:4.7,anim:'Swing',lanzar:.11,description:'Small green chitin jaws, contact and retreat'},
 {id:'bite',approved:true,nombre:'Bite',forma:'torre2_bite',tipo:'DARK',poder:60,precisao:100,pp:25,categoria:'PHYSICAL',fazContato:true,dano:12,alcance:76,coste:21,cd:5.0,anim:'Swing',lanzar:.12,description:'One 8-pose original pixel-art bite, real aimed contact, 30% flinch'},
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
   if(slot==='esp'&&earlyKantoSlotPlan(def.id))continue; // Native DODGE is fixed, never another equipped attack.
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
const ids=new Map(),seenNames=new Set(),signatureEntries=new Set(SIGNATURE_MOVES);
const signatureByName=new Map(SIGNATURE_MOVES.map(m=>[canonicalMoveKey(m.nombre),m]));
for(const h of rawLibrary){
 const id=h.id||norm(h.nombre),sameMove=canonicalMoveKey(h.nombre);
 if(!sameMove||ids.has(id)||seenNames.has(sameMove))continue;
 // ROSTER/native entries are collected before custom ones on purpose:
 // if a move already exists in Pokémon Arena 2D, never override/recreate it.
 // Crunch is already present in the approved client. Swap ONLY the visual
  // for the Torre 2 selected loadout; preserve native name/stats/PP/accuracy.
  // The original client's Crunch is untouched and no duplicate is added.
  const nativeCrunch=sameMove==='crunch'&&!signatureEntries.has(h);
  // An integrated species can equip user-approved Torre 2 effects. The
  // canonical signature remains approved, never relabeled as a native copy.
  const signature=signatureByName.get(sameMove);
  const inheritedSignature=!signatureEntries.has(h)&&
   signature&&signature.forma===h.forma;
  ids.set(id,{...h,...(inheritedSignature?signature:{}),id,
   ...(nativeCrunch?{forma:'torre2_crunch',approved:true}:{}),
   source:nativeCrunch?'torre2-visual-override':
    signatureEntries.has(h)||inheritedSignature?'new-phaser-fx':'arena2d-original'});
 seenNames.add(sameMove);
}
export const TEST_LIBRARY=[...ids.values()].sort((a,b)=>a.nombre.localeCompare(b.nombre));
// NEW is a review queue, not a type or a replacement for existing attacks.
// Original Poké Arena 2D attacks are implicitly approved and NEVER enter NEW.
export const isPendingApprovalMove=move=>Boolean(
 move&&move.source==='new-phaser-fx'&&move.approved!==true);
export function filterMoveLibrary(moves,type='ALL',search=''){
 const selected=type||'ALL',query=String(search||'').trim().toLowerCase();
 return moves.filter(move=>
  (selected==='ALL'||selected==='NEW'?selected==='ALL'||isPendingApprovalMove(move):
   move.tipo===selected)&&
  (!query||move.nombre.toLowerCase().includes(query)));
}
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
 if(['rattata','raticate'].includes(member.id))names.add('super-fang');
 if(['sandshrew','sandslash','diglett','dugtrio','geodude','graveler','golem','onix','cubone','marowak','rhyhorn','rhydon','nidoking','nidoqueen'].includes(member.id))names.add('mud-slap');
 if(['bulbasaur','ivysaur','venusaur','oddish','gloom','vileplume','bellsprout','weepinbell','victreebel','exeggcute','exeggutor','tangela','paras','parasect'].includes(member.id))names.add('seed-bomb');
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
 if(['pidgey','pidgeotto','pidgeot','spearow','fearow','butterfree','zubat','golbat','crobat'].includes(member.id))names.add('gust');
 if(['weedle','kakuna','beedrill','nidoran-f','nidorina','nidoqueen','nidoran-m','nidorino','nidoking','ekans','arbok','spinarak','ariados'].includes(member.id))names.add('poison-sting');
 if(['rattata','raticate','ekans','arbok','zubat','golbat','crobat','growlithe','arcanine','eevee','vulpix','ninetales'].includes(member.id))names.add('bite');
  if(['raticate','arbok','golbat','crobat','arcanine','ninetales','gyarados','aerodactyl'].includes(member.id))names.add('crunch');
 if(['spearow','fearow','beedrill','nidoran-m','nidorino','nidoking','doduo','dodrio','farfetchd'].includes(member.id))names.add('peck');
 if(['caterpie','weedle','metapod','kakuna','butterfree','beedrill','paras','parasect','venonat','venomoth'].includes(member.id))names.add('bug-bite');
 if(['charmander','charmeleon','charizard'].includes(member.id))names.add('metal-claw');
 if(['onix','ekans','arbok','tangela'].includes(member.id))names.add('bind');
 if(['geodude','graveler','golem','onix','rhyhorn','rhydon','sandshrew','sandslash'].includes(member.id))names.add('rock-tomb');
 if(['nidoran-m','nidorino','nidoking','nidoran-f','nidorina','nidoqueen','rhyhorn','rhydon'].includes(member.id))names.add('horn-attack');
 if(['nidoran-m','nidorino','nidoking','nidoran-f','nidorina','nidoqueen'].includes(member.id))names.add('double-kick');
 if(['spearow','fearow','doduo','dodrio','nidoran-m','nidorino','beedrill'].includes(member.id))names.add('fury-attack');
 if(member.id==='chansey')names.add('soft-boiled');
 const early=EARLY_KANTO_LEARNSETS[member.id];
 if(early)for(const id of Object.keys(early))names.add(id);
 const moves=TEST_LIBRARY.filter(x=>names.has(x.id)||names.has(norm(x.nombre)));
 if(!early)return moves;
 const level=member.progression?.level??5;
 const tms=new Set((member.tmMoves||[]).map(canonicalMoveKey));
 return moves.filter(m=>tms.has(canonicalMoveKey(m.nombre))||
   (early[m.id]!==undefined&&level>=early[m.id]));
}
// New Kanto species keep the exact Arena 2D four attack slots even when
// an ability is still locked. ESP is the original fifth control and NEVER
// belongs in the editor: it remains the non-damaging defensive dodge.
export function defaultLoadout(member){
 const available=availableMoves(member),byId=new Map(available.map(m=>[m.id,m]));
 if(member.id==='mewtwo')return ['bonemerang','bone-club','tri-attack','pay-day'];
 const plan=earlyKantoSlotPlan(member.id);
 if(plan)return plan.map(name=>{
  const id=canonicalMoveKey(name);
  return byId.has(id)?id:null;
 });
 const {def}=buscar(member.id),slots=['lmb','rmb','q','e'];
 const ids=slots.map(slot=>canonicalMoveKey(def.kit[slot]?.nombre));
 return ids.map((id,i)=>available.find(m=>m.id===id)?.id||available[i]?.id).filter(Boolean).slice(0,4);
}
export function selectedMoves(member){
 const available=availableMoves(member),valid=new Set(available.map(x=>x.id));
 const plan=earlyKantoSlotPlan(member.id);
 if(plan){
  const defaults=defaultLoadout(member);
  if(member.moves?.length!==4)return defaults;
  // Keep each slot in place. Future moves unlock automatically as the
  // level rises and the team member evolves; old saves need no migration.
  return defaults.map((id,i)=>member.moves[i]&&valid.has(member.moves[i])?
   member.moves[i]:id);
 }
 const chosen=member.moves?.length===4&&member.moves.every(id=>valid.has(id))?
  member.moves:defaultLoadout(member);
 return chosen.filter(id=>valid.has(id)).slice(0,4);
}
export function equipMove(member,slot,moveId){
 if(!Number.isInteger(slot)||slot<0||slot>=4)return false;
 const pool=availableMoves(member);
 if(!pool.some(m=>m.id===moveId))return false;
 const early=earlyKantoSlotPlan(member.id);
 // New first-route Pokémon always have a weak basic and a dedicated
 // meter-gated ultimate, respecting the original client control roles.
 if(early&&slot===0&&moveId!==canonicalMoveKey(early[0]))return false;
 if(early&&slot===3&&moveId!==canonicalMoveKey(early[3]))return false;
 const chosen=selectedMoves(member);
 if(chosen.some((id,i)=>id===moveId&&i!==slot))return false;
 if(early){chosen[slot]=moveId;member.moves=chosen;return true;}
 while(chosen.length<4)chosen.push(pool[chosen.length]?.id);
 chosen[slot]=moveId;member.moves=chosen;
 return true;
}
export function resolveLoadout(member){
 const pool=availableMoves(member),dict=new Map(pool.map(h=>[h.id,h]));
 const out={};
 selectedMoves(member).forEach((id,i)=>{
  const attack=dict.get(id);
  if(attack)out[SLOTS[i]]={...attack,pendiente:false};
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
