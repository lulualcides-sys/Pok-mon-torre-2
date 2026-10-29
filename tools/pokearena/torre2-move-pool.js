/* Pokémon Torre 2 — per-Pokémon move list and battle loadout.
 * The test Mewtwo (level 50) can choose every available move in the captured
 * Poké Arena client, plus all four brand-new signature VFX in this project.
 */
import {BATCH24_MOVES} from './batch24/catalog.js';
import {SURGE3_MOVES} from './surge3/catalog.js';
import {FINALE_13_MOVES,POISON_PUNCH_MOVES} from './torre2-finale13-catalog.js';
import {ROSTER,buscar,etapaDe} from '../datos.js';
import {EARLY_KANTO_LEARNSETS,earlyKantoSlotPlan,nativeKantoEvolutionPlan,isKantoEvolvedForm} from './early-kanto-species.js';
import {kanto151SlotPlan} from './all-kanto-species.js';
import {resolveKantoIntro,KANTO_INTRO} from './kanto-intro-moves.js';
import {GEN7_LETSGO_LEVEL_UP,gen7LetsGoUnlockLevel} from './gen7-letsgo-learnsets.js';
import {GEN5_KANTO_LEVEL_UP,gen5KantoUnlockLevel} from './gen5-existing-levels.js';
import {GEN4_HGSS_KANTO_LEVEL_UP,GEN5_B2W2_KANTO_LEVEL_UP,gen45KantoUnlockLevel}
 from './gen45-kanto-learnsets.js';
import {KANTO_STAB_TM_MASTERY_LEVELS,kantoStabTmMasteryLevel}
 from './stab-tm-mastery.js';
import {FRLG_LEVEL_UP,KANTO_LEVEL_EVOLUTIONS,frlgKnownMoves,frlgUnlockLevel,frlgEvolutionLevel,frlgMachineCompatible}
 from './frlg-learnsets.js';

const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const SLOTS=['lmb','rmb','q','e'];
// Campaign balance: real FRLG moves keep their original metadata, but
// all level-up attacks above 50 become obtainable BY level 50 in the Torre
// campaign. TMs remain teach-only, evolution boundaries stay intact.
export const KANTO_CAMPAIGN_MOVE_CAP=50;
const campaignLevel=at=>Math.min(KANTO_CAMPAIGN_MOVE_CAP,at);
// T07 user-approved level-only adaptation of TM38: a strong fire attack
// learned late in OUR campaign rather than free at the start. Every species
// is actually Fire-type Kanto and legally learns TM38 in FireRed/LeafGreen.
// Other non-Fire species retain the existing real TM teaching system.
// No renderer, original client kit, attack power, CD or save data is changed.
export const KANTO_FIRE_BLAST_LEVEL=50;
export const KANTO_FIRE_BLAST_SPECIES=Object.freeze([
 'charmander','charmeleon','charizard','vulpix','ninetales',
 'growlithe','arcanine','ponyta','rapidash','magmar','flareon','moltres'
]);
const fireBlastAtLevel=id=>
 KANTO_FIRE_BLAST_SPECIES.includes(id)&&frlgMachineCompatible(id,'fire-blast')?
 KANTO_FIRE_BLAST_LEVEL:null;
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
 ...SURGE3_MOVES,
 ...FINALE_13_MOVES,
 ...POISON_PUNCH_MOVES,
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
// Gen VII tables can select ONLY installed native/approved renderer entries.
// This index is deduplicated; it cannot introduce new VFX or move metadata.
const gen7MoveKey=name=>canonicalMoveKey(name).replace(/[^a-z0-9]/g,'');
const GEN7_INSTALLED=new Map(TEST_LIBRARY.filter(m=>m.forma&&
 (m.source!=='new-phaser-fx'||m.approved===true))
 .map(m=>[gen7MoveKey(m.nombre),m]));
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
// Characteristic attack defaults use the ALREADY APPROVED VFX, like Persian's
// Pay Day. This is campaign-only equipment preference, not a new animation.
// ATK and ULT keep their original roles; HAB 2/3 remain editable afterwards.
export const CHARACTERISTIC_KANTO_ROLES=Object.freeze({
 meowth:[[2,'pay-day']],persian:[[2,'pay-day']],
 cubone:[[1,'bone-club'],[2,'bonemerang']],
 marowak:[[1,'bone-club'],[2,'bonemerang']],
 porygon:[[2,'tri-attack']],dugtrio:[[2,'tri-attack']],
 jigglypuff:[[1,'sing']],wigglytuff:[[1,'sing']],
 krabby:[[2,'crabhammer']],kingler:[[2,'crabhammer']],
 koffing:[[2,'smog']],weezing:[[2,'smog']],
 raticate:[[2,'hyper-fang']],pinsir:[[2,'guillotine']],
 oddish:[[1,'absorb'],[2,'petal-dance']],gloom:[[1,'absorb'],[2,'petal-dance']],
 vileplume:[[1,'absorb'],[2,'petal-dance']],tangela:[[1,'absorb']],
 clefairy:[[2,'metronome']],clefable:[[2,'metronome']],
 jynx:[[1,'lovely-kiss']],chansey:[[2,'soft-boiled']],
 scyther:[[2,'x-scissor']],beedrill:[[2,'x-scissor']],
 parasect:[[2,'x-scissor']],
 sandshrew:[[2,'swift']],sandslash:[[2,'swift']],
 gastly:[[2,'confuse-ray'],[2,'shadow-ball']],
 haunter:[[2,'confuse-ray'],[2,'shadow-ball']],
 gengar:[[2,'confuse-ray'],[2,'shadow-ball']],
 vulpix:[[2,'confuse-ray']],ninetales:[[2,'confuse-ray']],
 magnemite:[[2,'sonic-boom']],magneton:[[2,'sonic-boom']],
 geodude:[[2,'rock-blast']],graveler:[[2,'rock-blast']],
 golem:[[2,'rock-blast']],onix:[[2,'rock-blast']],
 lapras:[[2,'ice-beam']],
 machop:[[2,'cross-chop']],machoke:[[2,'cross-chop']],
 machamp:[[2,'cross-chop']],primeape:[[2,'cross-chop']],
 growlithe:[[2,'flame-wheel']],arcanine:[[2,'flame-wheel']],
 grimer:[[2,'poison-punch']],muk:[[2,'poison-punch']],
 // Signature moves from Gen V are preferred ONLY if the original base
 // already provides an approved renderer; no fake fire projectile is added.
 ponyta:[[1,'flame-charge'],[2,'flare-blitz']],
 rapidash:[[1,'flame-charge'],[2,'flare-blitz']]
});
// X-Scissor postdates FireRed: explicit Torre 2 custom campaign learn levels,
// never falsely described as official FRLG. TM-only moves stay TM-locked.
const CHARACTERISTIC_BONUS_LEVELS=Object.freeze({
 scyther:{'x-scissor':28},beedrill:{'x-scissor':30},
 parasect:{'x-scissor':30},pinsir:{'x-scissor':28}
});
// Shared by the battle, move editor and Pokédex: these use ONLY native or
// previously approved Phaser VFX. Training abilities have their own IDs so
// an Ember *practice* never counts as FireRed's authentic Lv14 Ember.
// Weak starter options stay selectable as a low-power fallback after Lv13.
// No new Pokémon/effects, TMs, or save format are introduced.
function campaignIntroOptions(member){
 if(!member?.id||member.id==='mewtwo')return [];
 const id=member.id;
 const m={id,progression:{species:id,level:8}};
 const preview=resolveKantoIntro(m,{},{
  library:TEST_LIBRARY,canonical:canonicalMoveKey,
  earlyLevels:EARLY_KANTO_LEARNSETS[id]||{},
  levelUp:FRLG_LEVEL_UP[id]||{},unlockLevel:frlgUnlockLevel
 });
 return SLOTS.flatMap((slot,index)=>{
  const base=preview[slot];
  if(!base?.forma)return [];
  const source=canonicalMoveKey(base.torre2IntroSource||base.nombre);
  // Genuine installed move names stay visible. Early power caps are internal
  // campaign balance metadata, not additional named attacks in the menu.
  const name=String(base.nombre).replace(/ · Treino$/,'').replace(/^ULT · /,'');
  return [{
   ...base,
   id:'torre2-intro-'+slot+'-'+source,
   nombre:name,
   torre2IntroPractice:true,
   torre2IntroSlot:slot,
   torre2IntroUnlockLevel:index===3?8:5,
   pendiente:false,
   ...(index===3?{ulti:true}:{ulti:false})
  }];
 });
}
export function availableMoves(member){
 if(member.id==='mewtwo')return TEST_LIBRARY;
 const {def}=buscar(member.id);
 const names=new Set([...collect(def).map(x=>norm(x.nombre)),...(member.tmMoves||[]).map(norm)]);
 // A Pokémon that has JUST EVOLVED receives its own four real attacks.
 // They can already exist in its new evolution kit even if a lower-level
 // move filter was written for the PREVIOUS form. Include the 4 real names
 // explicitly, not made-up moves or effects from other Pokémon.
 if(isKantoEvolvedForm(member.id)||kanto151SlotPlan(member.id)){
  for(const name of earlyKantoSlotPlan(member.id)||kanto151SlotPlan(member.id)||[])
   names.add(canonicalMoveKey(name));
 }
 // FireRed/LeafGreen level-up data for EVERY Kanto species (151).
 // Only real installed renderers can enter the list; TMs require teaching.
 for(const name of frlgKnownMoves(member.id))names.add(canonicalMoveKey(name));
 // Gen VII Let's Go adds legitimate species level-up options ONLY when
 // an already approved/native Phaser renderer is present in this build.
 for(const gen7Name of Object.keys(GEN7_LETSGO_LEVEL_UP[member.id]||{})){
  const installed=GEN7_INSTALLED.get(gen7Name);
  if(installed)names.add(canonicalMoveKey(installed.nombre));
 }
 for(const gen5Name of Object.keys(GEN5_KANTO_LEVEL_UP[member.id]||{})){
  const installed=GEN7_INSTALLED.get(gen7MoveKey(gen5Name));
  if(installed)names.add(canonicalMoveKey(installed.nombre));
 }
 // HGSS and B2W2 verified legal level-up moves for every Kanto species.
 // Search its ancestors only; never borrow a different family or VFX.
 for(const generation of [GEN4_HGSS_KANTO_LEVEL_UP,GEN5_B2W2_KANTO_LEVEL_UP]){
  let ancestor=member.id,steps=0;
  while(generation[ancestor]&&steps++<5){
   for(const name of Object.keys(generation[ancestor])){
    const installed=GEN7_INSTALLED.get(gen7MoveKey(name));
    if(installed)names.add(canonicalMoveKey(installed.nombre));
   }
   ancestor=KANTO_LEVEL_EVOLUTIONS[ancestor]?.[0];
   if(!ancestor)break;
  }
 }
 // Only a legally TM38-compatible Fire species gets this user-requested
 // late campaign level unlock, and only using the installed native attack.
 if(fireBlastAtLevel(member.id)!==null&&GEN7_INSTALLED.has('fireblast'))
  names.add('fire-blast');
 // High-tier same-type attacks already present in the approved/native
 // 227-move library are learned late in THIS campaign when FRLG confirms
 // species TM compatibility. Do not auto-grant off-type TM coverage.
 for(const name of Object.keys(KANTO_STAB_TM_MASTERY_LEVELS)){
  const installed=GEN7_INSTALLED.get(gen7MoveKey(name));
  if(installed&&kantoStabTmMasteryLevel(member.id,name,installed.tipo)!==null)
   names.add(canonicalMoveKey(installed.nombre));
 }
 if(['pikachu','raichu','voltorb','electrode','magnemite','magneton'].includes(member.id))names.add('thunder-wave');
 if(['voltorb','electrode','magnemite','magneton'].includes(member.id))names.add('sonic-boom');
 if(['voltorb','electrode'].includes(member.id))names.add('screech');
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

 // Newly created, pending-visual-review moves are available to appropriate
 // Kanto species in their move editor, never injected over approved VFX.
 const kantoFinish={
  'psychic':['abra','kadabra','alakazam','drowzee','hypno','staryu','starmie','slowpoke','slowbro','jynx','mew','mewtwo','exeggcute','exeggutor','mr-mime'],
  'sleep-powder':['butterfree','oddish','gloom','vileplume','bellsprout','weepinbell','victreebel','paras','parasect','tangela'],
  'surf':['squirtle','wartortle','blastoise','lapras','vaporeon','gyarados','staryu','starmie','golduck','slowbro','dragonite','poliwrath','seel','dewgong'],
  'ice-punch':['hitmonchan','jynx','electabuzz','magmar','alakazam','mew'],
  // Poison Punch: custom purple punch, not an official FRLG TM.
  'poison-punch':['grimer','muk','koffing','weezing','ekans','arbok',
   'nidorino','nidoking','nidorina','nidoqueen','beedrill','mew'],
  'thunder-punch':['hitmonchan','electabuzz','magmar','alakazam','mew'],
  'fire-punch':['hitmonchan','magmar','electabuzz','alakazam','mew'],
  'cross-chop':['machop','machoke','machamp','mankey','primeape'],
  'aerial-ace':['pidgeotto','pidgeot','fearow','scyther','farfetchd','dodrio','aerodactyl','charizard'],
  'flame-wheel':['growlithe','arcanine','vulpix','ninetales','ponyta','rapidash'],
  'light-screen':['abra','kadabra','alakazam','mr-mime','clefairy','clefable','starmie','magnemite','magneton'],
  'rain-dance':['squirtle','wartortle','blastoise','lapras','vaporeon','gyarados','starmie','slowbro','poliwag','poliwhirl','poliwrath'],
  'sand-attack':['pidgey','pidgeotto','pidgeot','sandshrew','sandslash','cubone','marowak','diglett','dugtrio','eevee']
 };
 for(const [name,species] of Object.entries(kantoFinish))
  if(species.includes(member.id))names.add(name);
 // Protect is a TM: species must actually be taught the move before use.
 // Existing tmMoves already enters names above; never auto-grant it.
 const early=EARLY_KANTO_LEARNSETS[member.id];
 if(early)for(const id of Object.keys(early))names.add(id);
 const moves=TEST_LIBRARY.filter(x=>names.has(x.id)||names.has(norm(x.nombre)));
 const level=member.progression?.level??5;
 const {def:memberDef,etapa}=buscar(member.id);
 const activeKit=etapa?memberDef.evoluciones[etapa-1]?.kit:memberDef.kit;
 // Never unlock Caterpie/Metapod Confusion or Weedle/Kakuna Fury Attack
 // just because the LEVEL was reached: the real final evolution is needed.
 const evoLocked=new Set(Object.values(activeKit||{})
  .filter(move=>move?.torre2UnlockEvolution)
  .map(move=>canonicalMoveKey(move.nombre)));
 const evolved=isKantoEvolvedForm(member.id);
 const evolutionSkills=new Set(
  evolved?(earlyKantoSlotPlan(member.id)||[]).map(canonicalMoveKey):[]);
 const specialSurgeUnlocks=new Set([
  ...(['pikachu','raichu','voltorb','electrode','magnemite','magneton'].includes(member.id)&&level>=14?['thunder-wave']:[]),
  ...(['voltorb','electrode','magnemite','magneton'].includes(member.id)&&level>=15?['sonic-boom']:[]),
  ...(['voltorb','electrode'].includes(member.id)&&level>=18?['screech']:[])
 ]);

 // Canonical FireRed levels take precedence over guessed strength-based
 // access. Kanto-specific approved original bonuses are the only exception.
 const ordinaryBonus={
  'poison-punch':24,'ice-punch':26,'thunder-punch':26,'fire-punch':26,
  'flame-wheel':18,'surf':30,'psychic':30,'cross-chop':35,
  'aerial-ace':25,'light-screen':25,'rain-dance':25,
  'sand-attack':9,'sleep-powder':10,'protect':99
 };
 const plan=earlyKantoSlotPlan(member.id)||
  nativeKantoEvolutionPlan(member.id)||kanto151SlotPlan(member.id);
 const activeStage=frlgEvolutionLevel(member.id);
 const tms=new Set((member.tmMoves||[]).map(canonicalMoveKey));
 // Saved TM entries are claims, not proof of eligibility. Old or imported
 // saves may carry invalid tmMoves; preserve the save data but never equip
 // a move the species cannot learn in FireRed/LeafGreen.
 const taughtCompatible=key=>tms.has(key)&&frlgMachineCompatible(member.id,key);
 // NPC/native evolved-form special attacks from the original Poké Arena 2D
 // retain their existing VFX and can be earned via the actual evolution
 // level; never give a pre-evolution Pokémon its successor's attacks.
 const legacySlotLevel=(key)=>{
  const index=(plan||[]).findIndex(m=>canonicalMoveKey(m)===key);
  if(index<0)return null;
  return [activeStage,Math.max(activeStage,10),Math.max(activeStage,20),
   Math.max(activeStage,32)][index];
 };

 const filtered=moves.filter(m=>{
  const key=canonicalMoveKey(m.nombre);
  // Some original Poké Arena Raichu evolutions still carry an older
  // evolution-only lock. Explicitly unlock these three NEW status moves on
  // their own species/level, without lifting locks on any approved attacks.
  if(specialSurgeUnlocks.has(key))return true;
  const bonus=CHARACTERISTIC_BONUS_LEVELS[member.id]?.[key];
  if(Number.isInteger(bonus)&&level>=bonus)return true;
  // Only these 13 new Kanto moves bypass the historical early-Kanto
  // learnset filter when explicitly assigned to their real species above.
  // All PRE-EXISTING moves retain their original evolution/level locks.
  const newMoveRequiredLevel={
   'sand-attack':9,'sleep-powder':10,'aerial-ace':25,
   'psychic':30,'cross-chop':35,'light-screen':25,'rain-dance':25
  };
  // Protect is both TM17 and a native FRLG level-up move for nine
  // Kanto species. Never suppress legal natural learning because of TM17.
  if(key==='protect'){
   const natural=frlgUnlockLevel(member.id,key);
   return (natural!==null&&level>=campaignLevel(natural)&&
    !evoLocked.has(key))||taughtCompatible(key);
  }
  // Fire Blast is neither a Lv5 starter move nor a free compatible TM:
  // the existing native Fire Blast must wait until our campaign Lv50.
  // For Ponyta/Rapidash/Magmar this also respects the official late learn
  // while deliberately using the campaign's existing Lv50 ceiling.
  if(key==='fire-blast'&&fireBlastAtLevel(member.id)!==null)
   return level>=KANTO_FIRE_BLAST_LEVEL&&!evoLocked.has(key)&&
    !isPendingApprovalMove(m)&&Boolean(m.forma);
  // Strict FireRed unlock for all official level-up moves (inherits prior
  // evolution learnsets). An unlearned TM is NEVER auto-granted.
  const official=frlgUnlockLevel(member.id,key);
  // The first gyms and their real evolutionary forms already have vetted
  // per-species levels. Respect those authorial thresholds over the newly
  // imported Gen3 table (which lacks our user-approved bonus moves).
  if(early&&early[key]!==undefined)
   return level>=campaignLevel(early[key])&&!evoLocked.has(key);
  if(early&&newMoveRequiredLevel[key]!==undefined&&level<newMoveRequiredLevel[key])
   return false;
  if(early&&kantoFinish[key]?.includes(member.id)&&level>=(newMoveRequiredLevel[key]??ordinaryBonus[key]??10))
   return true;
  if(taughtCompatible(key))return true;
  // Level-only mastery for an INSTALLED same-type TM attack (never Lv5).
  const mastery=official===null?kantoStabTmMasteryLevel(member.id,key,m.tipo):null;
  if(mastery!==null&&level>=mastery&&!evoLocked.has(key)&&
     !isPendingApprovalMove(m)&&Boolean(m.forma))return true;
  // FRLG retains priority for level-up/TM; later generations only fill
  // legal moves absent from Gen III. No auto-learned Gen VII TM, event,
  // tutor, pending VFX or evolution-only attack before its evolved form.
  if(official===null&&!frlgMachineCompatible(member.id,key)&&
     !evoLocked.has(key)&&!isPendingApprovalMove(m)){
   const gen5=gen5KantoUnlockLevel(member.id,key);
   const gen7=gen7LetsGoUnlockLevel(member.id,key);
   const gen45=gen45KantoUnlockLevel(member.id,key);
   // Existing Gen5 signatures and Gen7 unlocks keep priority; HGSS/B2W2
   // only fill absent options, not overwrite previously approved levels.
   // Prefer the earliest verified legal level-up across supplementary generations.
  // FRLG, evolution and power floors remain enforced independently.
  // Preserve the explicitly approved Ponyta/Rapidash Gen V signature levels.
  // Otherwise use the earliest verified legal level from Gen IV/V/VII.
  const levels=[gen7,gen45].filter(Number.isInteger);
  const recent=gen5??(levels.length?Math.min(...levels):null);
   if(recent!==null){
    const power=Number(m.poder)||0;
    const laterPowerFloor=gen5===null&&gen7===null?
     (power>=120?45:power>=100?38:power>=80?28:power>=60?20:13):13;
    if(level>=campaignLevel(Math.max(13,activeStage,recent,laterPowerFloor)))
     return true;
   }
  }
  if(!early){
   if(official!==null&&level>=campaignLevel(official))return true;
   if(kantoFinish[key]?.includes(member.id)&&level>=(ordinaryBonus[key]??25))
    return true;
   // Only existing fixed Arena/Kanto roles may allow custom effects not
   // present in FRLG. They stay level-gated; never borrow another species'.
   if(official===null&&!frlgMachineCompatible(member.id,key)){
    const tier=legacySlotLevel(key);
    if(tier!==null&&level>=campaignLevel(tier))return true;
   }
   return false;
  }
  // The curated first two gym/early-route learnsets were already approved.
  // Keep their known special evolution locks and custom slot thresholds.
  if(official!==null&&!evoLocked.has(key)&&
     level>=Math.max(campaignLevel(official),newMoveRequiredLevel[key]??1))return true;
  // Allow skills of the ACTUAL evolved form immediately after evolution,
  // even at Lv 7 (Metapod), 10 (Butterfree), 18 (Pidgeotto) etc.
  // Other moves remain level-gated, and previous forms cannot borrow the
  // abilities of an evolution they have not reached.
  if(evoLocked.has(key))return false;
  return evolutionSkills.has(key)||
   (early[m.id]!==undefined&&level>=campaignLevel(early[m.id]));
 });
 // A native Raichu entry can resolve through the Pichu line instead of
 // our additive Kanto line. Pull genuinely unlocked Surge moves from the
 // unique canonical library, never from an evolution-only native kit.
 for(const id of specialSurgeUnlocks){
  if(filtered.some(move=>move.id===id))continue;
  const move=TEST_LIBRARY.find(candidate=>candidate.id===id);
  if(move)filtered.push(move);
 }
 // Training controls are genuine, selectable campaign moves with weak caps;
 // the underlying official ability still unlocks at its correct later level.
 for(const move of campaignIntroOptions(member))
  if(level>=move.torre2IntroUnlockLevel)filtered.push(move);
 return filtered;
}
// New Kanto species keep the exact Arena 2D four attack slots even when
// an ability is still locked. ESP is the original fifth control and NEVER
// belongs in the editor: it remains the non-damaging defensive dodge.
/** Learn level shown in Pokédex. Null means TM-only or not in the
 * original species learnset. A separate user-approved campaign skill has
 * an explicit, species-limited level instead of copying another Pokémon.
 */
// A read-only per-species index of ALL installed campaign moves and
// their first truly available level, built using the battle resolver.
// TM-only skills are listed, but not granted by experience points.
const KANTO_LEARNSET_CACHE=new Map();
export function campaignLearnset(species){
 const id=String(species||'').toLowerCase();
 if(KANTO_LEARNSET_CACHE.has(id))return KANTO_LEARNSET_CACHE.get(id);
 const member={id,progression:{species:id,level:1},tmMoves:[]};
 const list=new Map();
 for(let level=1;level<=100;level++){
  member.progression.level=level;
  for(const move of availableMoves(member))
   if(!list.has(move.id))list.set(move.id,Object.freeze({
    id:move.id,name:move.nombre,type:move.tipo,level,method:'LEVEL',
    practice:move.torre2IntroPractice===true,
    slot:move.torre2IntroSlot||null}));
 }
 for(const move of TEST_LIBRARY)
  if(!list.has(move.id)&&frlgMachineCompatible(id,move.id))
   list.set(move.id,Object.freeze({
    id:move.id,name:move.nombre,type:move.tipo,level:null,method:'TM'}));
 const result=Object.freeze([...list.values()].sort((a,b)=>
  (a.level??999)-(b.level??999)||a.name.localeCompare(b.name)));
 KANTO_LEARNSET_CACHE.set(id,result);
 return result;
}

export function moveUnlockLevel(member,moveName){
 const key=canonicalMoveKey(moveName),species=member?.id;
 if(!species)return null;
 if(species==='mewtwo')return 1; // unrestricted Lv50 test Pokémon
 // The battle resolver is the source of truth for Kanto, not an approximate
 // second learnset calculation. This prevents the Pokédex from showing a
 // later level (or null) for an attack that the editor already unlocks.
 // campaignLearnset uses availableMoves, not moveUnlockLevel: no recursion.
 if(FRLG_LEVEL_UP[species]){
  if(key.startsWith('torre2-intro-'))
   return key.startsWith('torre2-intro-e-')?8:5;
  const learned=campaignLearnset(species).find(row=>
   row.method==='LEVEL'&&!row.practice&&
   (canonicalMoveKey(row.id)===key||canonicalMoveKey(row.name)===key));
  return learned?.level??null;
 }
 if(key==='fire-blast'&&fireBlastAtLevel(species)!==null)
  return GEN7_INSTALLED.has('fireblast')?KANTO_FIRE_BLAST_LEVEL:null;
 if(key.startsWith('torre2-intro-'))
  return key.startsWith('torre2-intro-e-')?8:5;
 const local=EARLY_KANTO_LEARNSETS[species];
 if(local?.[key]!==undefined)return campaignLevel(local[key]);
 const official=frlgUnlockLevel(species,key);
 if(official!==null)return campaignLevel(official);
 const native=GEN7_INSTALLED.get(gen7MoveKey(key));
 const mastery=native?kantoStabTmMasteryLevel(species,key,native.tipo):null;
 if(mastery!==null)return mastery;
 // Match the Pokédex gate to actual available moves: no invisible or
 // review-pending animation receives a later-generation unlock.
 if(!frlgMachineCompatible(species,key)){
  const installed=GEN7_INSTALLED.get(gen7MoveKey(key));
  const gen5=installed?gen5KantoUnlockLevel(species,key):null;
  const gen7=installed?gen7LetsGoUnlockLevel(species,key):null;
  const gen45=installed?gen45KantoUnlockLevel(species,key):null;
  // The Pokédex must use the same earliest verified supplementary level
  // as the battle move pool (subject to FRLG and evolution thresholds).
  // Preserve the explicitly approved Ponyta/Rapidash Gen V signature levels.
  // Otherwise use the earliest verified legal level from Gen IV/V/VII.
  const levels=[gen7,gen45].filter(Number.isInteger);
  const recent=gen5??(levels.length?Math.min(...levels):null);
  if(recent!==null){
   const power=Number(installed.poder)||0;
   const laterPowerFloor=gen5===null&&gen7===null?
    (power>=120?45:power>=100?38:power>=80?28:power>=60?20:13):13;
   return campaignLevel(Math.max(13,frlgEvolutionLevel(species),recent,laterPowerFloor));
  }
 }
 const bonus=CHARACTERISTIC_BONUS_LEVELS[species]?.[key];
 if(Number.isInteger(bonus))return campaignLevel(bonus);
 const plan=earlyKantoSlotPlan(species)||nativeKantoEvolutionPlan(species)||kanto151SlotPlan(species);
 const index=(plan||[]).findIndex(n=>canonicalMoveKey(n)===key);
 if(index<0)return null;
 const stage=frlgEvolutionLevel(species);
 return campaignLevel([stage,Math.max(10,stage),Math.max(20,stage),Math.max(32,stage)][index]);
}
export function defaultLoadout(member){
 const available=availableMoves(member),byId=new Map(available.map(m=>[m.id,m]));
 if(member.id==='mewtwo')return ['bonemerang','bone-club','tri-attack','pay-day'];
 const level=member.progression?.level??5;
 if(level>=5&&level<KANTO_INTRO.tutorialUntil){
  // The three keys and Lv8 ULT are real editor options. They cannot be
  // accidentally replaced by the full-power attack used by their renderer.
  return SLOTS.map(slot=>available.find(m=>m.torre2IntroSlot===slot)?.id||null);
 }
 const plan=earlyKantoSlotPlan(member.id)||nativeKantoEvolutionPlan(member.id)||kanto151SlotPlan(member.id)||
  // The native client has no per-species role plan for this Gen V family.
  // Keep the approved four-slot kit and permit its EXISTING signatures to
  // be auto-equipped only after their legal level; never change other forms.
  (['ponyta','rapidash'].includes(member.id)?[null,null,null,null]:null);
 if(plan){
  const reserved=plan.map(name=>{
   const id=canonicalMoveKey(name);
   return byId.has(id)?id:null;
  });
  // Auto-equip each matching characteristic move only once it REALLY unlocks.
  // A TM move is never granted solely by being characteristic.
  for(const [slot,id] of CHARACTERISTIC_KANTO_ROLES[member.id]||[]){
   if(byId.has(id)&&!reserved.includes(id))reserved[slot]=id;
  }
  // For native/P2 Pokémon, the locked planned ATK must not leave them
  // defenseless on the day they evolve. Use a genuinely learned weak move
  // in an otherwise empty ATK/HAB slot. ULT remains locked until learned.
  const used=new Set(reserved.filter(Boolean));
  const pool=available.filter(m=>m?.id&&m.torre2IntroSlot!=='e'&&
    Number.isFinite(m.dano)&&m.dano>0)
   .sort((a,b)=>Number(a.dano)-Number(b.dano));
  for(const i of [0,1,2]){
   if(reserved[i])continue;
   const next=pool.find(m=>!used.has(m.id)&&(i!==0||m.dano<=12))||
    (i===0?pool.find(m=>!used.has(m.id)):null);
   if(next){reserved[i]=next.id;used.add(next.id)}
  }
  // A weak meter-gated finisher remains available even for a species that
  // learns no ordinary ULT in its official late FireRed level-up table.
  if(!reserved[3]&&level>=8)reserved[3]=
   available.find(m=>m.torre2IntroSlot==='e')?.id||null;
  return reserved;
 }
 const {def}=buscar(member.id),slots=['lmb','rmb','q','e'];
 const ids=slots.map(slot=>canonicalMoveKey(def.kit[slot]?.nombre));
 return ids.map((id,i)=>available.find(m=>m.id===id)?.id||available[i]?.id).filter(Boolean).slice(0,4);
}
export function selectedMoves(member){
 const available=availableMoves(member),valid=new Set(available.map(x=>x.id));
 const level=member.progression?.level??5;
 // Old saved slots can contain an originally equipped high-power move whose
 // real unlock gate was unavailable at Lv5. Render the SAME safe 3 moves
 // shown in the campaign menu without erasing the player's saved loadout.
 // From Lv9, preserve any legitimately earned HAB moves manually equipped.
 if(member.id!=='mewtwo'&&level>=5&&level<KANTO_INTRO.tutorialUntil){
  const defaults=defaultLoadout(member);
  // After an actual evolution, old saved move IDs belong to the PREVIOUS
  // species. Do not let them override the new stage's three weak attacks.
  // Respect manual selections ONLY if made for this very evolution form.
  if(member.movePlanSpecies!==member.id)return defaults;
  return defaults.map((fallback,i)=>{
   const id=member.moves?.[i],move=available.find(m=>m.id===id);
   if(!move)return fallback;
   if(move.torre2IntroSlot===SLOTS[i])return id;
   if(i<3&&level>KANTO_INTRO.ultAt&&!move.torre2IntroPractice)return id;
   return fallback;
  });
 }
 const plan=earlyKantoSlotPlan(member.id)||nativeKantoEvolutionPlan(member.id)||kanto151SlotPlan(member.id)||
  // The native client has no per-species role plan for this Gen V family.
  // Keep the approved four-slot kit and permit its EXISTING signatures to
  // be auto-equipped only after their legal level; never change other forms.
  (['ponyta','rapidash'].includes(member.id)?[null,null,null,null]:null);
 if(plan){
  const defaults=defaultLoadout(member);
  // Legacy saves and new level-ups get characteristic skills just once.
  // After automatic unlock the player may change HAB 2/HAB 3 freely.
  const fresh=member.moves?.length!==4||member.movePlanSpecies!==member.id;
  const chosen=fresh?[...defaults]:defaults.map((id,i)=>
   member.moves[i]&&valid.has(member.moves[i])?member.moves[i]:id);
  const seen=new Set(member.torre2CharacteristicSeen||[]);
  let upgraded=false;
  for(const [slot,id] of CHARACTERISTIC_KANTO_ROLES[member.id]||[]){
   // The first three buttons are explicitly safe Lv5 training moves.
   // Real characteristic skills take over only in normal progression.
   if((member.progression?.level??5)<KANTO_INTRO.tutorialUntil)continue;
   if(!valid.has(id))continue; // not learned yet or no taught TM
   if(chosen.includes(id)){seen.add(id);continue}
   if(fresh||!seen.has(id)){
    chosen[slot]=id;seen.add(id);upgraded=true;
   }
  }
  if(seen.size)member.torre2CharacteristicSeen=[...seen];
  // Persist even when the unlocked signature came from a fallback for an
  // invalid legacy slot, rather than from the explicit auto-upgrade branch.
  if(!fresh&&(upgraded||chosen.some((id,i)=>id!==member.moves[i]))){
   member.moves=[...chosen];
   member.movePlanSpecies=member.id;
  }
  return chosen;
 }
 const chosen=member.moves?.length===4&&member.moves.every(id=>valid.has(id))?
  member.moves:defaultLoadout(member);
 return chosen.filter(id=>valid.has(id)).slice(0,4);
}
export function equipMove(member,slot,moveId){
 if(!Number.isInteger(slot)||slot<0||slot>=4)return false;
 // Even manual editor equips cannot activate the ULT before Lv8.
 if(slot===3&&member.id!=='mewtwo'&&(member.progression?.level??5)<KANTO_INTRO.ultAt)return false;
 const pool=availableMoves(member);
 const picked=pool.find(m=>m.id===moveId);
 if(!picked)return false;
 const level=member.progression?.level??5;
 // Early editor and combat must agree: full-power unlocked attacks become
 // selectable after Lv8, while the early ULT stays power capped through 12.
 if(member.id!=='mewtwo'&&level<=8&&!picked.torre2IntroPractice)return false;
 if(member.id!=='mewtwo'&&level<KANTO_INTRO.tutorialUntil&&
    slot===3&&!picked.torre2IntroPractice)return false;
 if(picked.torre2IntroSlot&&picked.torre2IntroSlot!==SLOTS[slot])return false;
 const early=earlyKantoSlotPlan(member.id)||nativeKantoEvolutionPlan(member.id)||kanto151SlotPlan(member.id);
 // Kanto-only roles: weak ATK and dedicated energy-gated ultimate.
 // A learned native move can replace the fixed ATK from Lv9 onward.
 // The first eight levels retain the approved weak onboarding controls.
 if(early&&level<=KANTO_INTRO.ultAt&&slot===0&&
    moveId!==canonicalMoveKey(early[0])&&
    picked.torre2IntroSlot!=='lmb')return false;
 // The early ULT is power-capped until Lv12. After that the player may
 // freely choose any legally unlocked technique for the energy-gated E slot.
 if(early&&level<KANTO_INTRO.tutorialUntil&&slot===3&&
    moveId!==canonicalMoveKey(early[3])&&
    picked.torre2IntroSlot!=='e')return false;
 const chosen=selectedMoves(member);
 if(chosen.some((id,i)=>id===moveId&&i!==slot))return false;
 if(early){chosen[slot]=moveId;member.moves=chosen;member.movePlanSpecies=member.id;return true;}
 while(chosen.length<4)chosen.push(pool[chosen.length]?.id);
 chosen[slot]=moveId;member.moves=chosen;
 // Native Kanto starters without a curated role plan still need this
 // marker: otherwise the Lv5-12 safe-loadout migration mistakes a same-
 // species manual selection for a pre-evolution legacy moveset.
 member.movePlanSpecies=member.id;
 return true;
}
export function resolveLoadout(member){
 const pool=availableMoves(member),dict=new Map(pool.map(h=>[h.id,h]));
 const out={};
 selectedMoves(member).forEach((id,i)=>{
  const attack=dict.get(id);
  if(attack)out[SLOTS[i]]={...attack,pendiente:false,
   ...(i===3?{ulti:true}:{})};
 });
 // Native P2 evolution skills are re-slotted ONLY inside the Kanto campaign;
 // the Arena and VS CPU keep their original kits untouched.
 if(nativeKantoEvolutionPlan(member.id)||kanto151SlotPlan(member.id))out.esp={
  nombre:'Dodge',forma:'dash',tipo:'NORMAL',dano:0,
  dist:95,dur:.20,cd:4.2,anim:'Walk',estilo:'rapido'
 };
 return resolveKantoIntro(member,out,{library:TEST_LIBRARY,canonical:canonicalMoveKey,
  earlyLevels:EARLY_KANTO_LEARNSETS[member.id],
  levelUp:FRLG_LEVEL_UP[member.id]||{},unlockLevel:frlgUnlockLevel});
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
