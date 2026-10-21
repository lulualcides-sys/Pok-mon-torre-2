import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
const stage=path.resolve('_site/arena2d');
const version=fs.readdirSync(stage).find(x=>/^src-[a-f0-9]{10}$/.test(x));
assert.ok(version,'Captured Phaser original client not staged');
// The menu's HTML query string alone cannot bust cached JS imports. Every
// patch must create a new hashed source folder, and the HTML must use it.
assert.notEqual(version,'src-8d89349697',
 'Do not reuse cached upstream module directory between game revisions');
const entryHTML=fs.readFileSync(path.join(stage,'index.html'),'utf8');
const buildMeta=JSON.parse(fs.readFileSync(path.join(stage,'version.json'),'utf8'));
assert.ok(entryHTML.includes('src="'+version+'/main.js"'),
 'Live game must import hashed, updated Phaser JavaScript');
assert.equal(buildMeta.modules,version,
 'version.json must expose the exact currently published module path');
assert.ok(entryHTML.includes('name="pokemon-torre-build" content="'+version+'"'),
 'HTML must expose module version, so users can verify updates');

const {createCampaign,currentOpponent,resolveBattle,attemptCapture,readCampaign,
 TRAINERS_PER_GYM,GYMS,STARTERS,KANTO_DEX,SAVE_KEY,saveCampaign,
 startBattle,recordSeen,recordCaught,storePokemon,withdrawPokemon,swapPokemon,
 wildAvailability,startWildEncounter,startWildBattle,resolveWildBattle,
 purchaseItem,usePotion,teachTM}=await import(pathToFileURL(path.join(stage,version,'torre2/campaign-core.js')));
const items=new Map();
globalThis.localStorage={getItem:k=>items.get(k)??null,setItem:(k,v)=>items.set(k,String(v)),removeItem:k=>items.delete(k)};
const {availableMoves,equipMove,selectedMoves,resolveLoadout,
 TEST_LIBRARY,SIGNATURE_MOVES,canonicalMoveKey,
 isPendingApprovalMove,filterMoveLibrary}=await import(
 pathToFileURL(path.join(stage,version,'torre2/move-pool.js')));
assert.equal(KANTO_DEX.length,151);
assert.equal(GYMS.length,8);
assert.deepEqual(STARTERS,['bulbasaur','charmander','squirtle']);
let state=createCampaign('charmander');
assert.equal(state.trainer,0);
assert.equal(state.money,1400);
assert.equal(state.inventory.pokeball,5);
const {routeNode,KANTO_ROUTES,MART_ITEMS}=await import(
 pathToFileURL(path.join(stage,version,'torre2/route-data.js')));
assert.equal(KANTO_ROUTES.length,8,'Eight FireRed-like region maps');
assert.equal(routeNode(0,3,13).type,'rival');
assert.equal(routeNode(0,5,13).type,'rocket');
assert.equal(routeNode(0,13,13).type,'leader');
assert.equal(MART_ITEMS.some(x=>x.kind==='tm'),true);
const marketState=createCampaign('squirtle');
const boughtBall=purchaseItem(marketState,'pokeball');
assert.equal(boughtBall.ok,true);
assert.equal(marketState.inventory.pokeball,6);
assert.equal(marketState.money,1200);
marketState.money=3000;marketState.stage=1;
assert.equal(purchaseItem(marketState,'tm-water-pulse').ok,true);
assert.equal(marketState.inventory.tms.includes('tm-water-pulse'),true);
assert.equal(teachTM(marketState,'tm-water-pulse').ok,true);
assert.equal(marketState.team[0].tmMoves.includes('Water Pulse'),true);
assert.equal(availableMoves(marketState.team[0]).some(m=>m.nombre==='Water Pulse'),true);
marketState.team[0].hp=50;
assert.equal(usePotion(marketState,'potion').ok,true);
assert.equal(marketState.team[0].hp,75);
assert.equal(usePotion(marketState,'potion').ok,true);
assert.equal(marketState.team[0].hp,100);
assert.equal(usePotion(marketState,'potion').ok,false,'Potion cannot be wasted on full HP');
const area=wildAvailability(0);
assert.equal(area.area.includes('Viridian'),true);
assert.ok(area.wild.includes('caterpie'),'Regional table keeps genuine FireRed species');
if(area.available.length){
 const grass=createCampaign('charmander');
 const found=startWildEncounter(grass,()=>0);
 assert.equal(found.ok,true);
 assert.equal(grass.wildEncountersStage,1);
 const fight=startWildBattle(grass);
 assert.equal(fight.torre2.kind,'wild');
 assert.equal(fight.p2,found.encounter.id);
 assert.equal(resolveWildBattle(grass,true).won,true);
 assert.equal(grass.trainer,0,'Wild encounters do not move gym trainer cursor');
 assert.equal(grass.pendingCapture.wild,true);
 assert.equal(attemptCapture(grass,()=>0).ok,true);
 assert.equal(grass.inventory.pokeball,4);
}
assert.equal(TRAINERS_PER_GYM(0),13);
assert.equal(currentOpponent(state).id,'onix');

const tester=state.team.find(p=>p.id==='mewtwo');
assert.ok(tester,'level-50 Mewtwo should be on the Kanto team at game start');
assert.equal(tester.progression.level,50);
const allMoves=availableMoves(tester);
assert.ok(allMoves.length>=100,'test Mewtwo should unlock all captured Poké Arena client moves');
// Protect the user's approved Poké Arena + Pokémon Arena 2D base.
// Even alias names (PT/EN) cannot introduce a second copy of a move.
// Different moves sharing native renderers are NOT duplicates.
const uniqueNameKeys=new Set(TEST_LIBRARY.map(m=>canonicalMoveKey(m.nombre)));
assert.equal(uniqueNameKeys.size,TEST_LIBRARY.length,
 'Duplicate Pokémon moves in selectable library (including translated aliases)');
const nativeNames=new Set(TEST_LIBRARY
 .filter(m=>m.source==='arena2d-original').map(m=>canonicalMoveKey(m.nombre)));
const repeatedOriginals=SIGNATURE_MOVES
 .filter(m=>nativeNames.has(canonicalMoveKey(m.nombre)));
assert.deepEqual(repeatedOriginals,[],
 'A client-original move is already approved: never recreate a separate custom move');
assert.equal(canonicalMoveKey('Bola Sombria'),canonicalMoveKey('Shadow Ball'));
assert.equal(canonicalMoveKey('Pistola de Água'),canonicalMoveKey('Water Gun'));
assert.equal(canonicalMoveKey('Bomba de Sementes'),canonicalMoveKey('Seed Bomb'));
// NEW is an approval queue. Native moves and approved custom art never enter it.
const pending=filterMoveLibrary(allMoves,'NEW');
const pendingIds=pending.map(m=>m.id);
for(const id of ['rock-tomb','horn-attack','double-kick','fury-attack','metal-claw','bind',
 'metronome','absorb','x-scissor'])
 assert.ok(pendingIds.includes(id),'Unapproved custom VFX must appear in NEW: '+id);
for(const id of ['bite','crunch','peck','bug-bite','gust','poison-sting',
 'leech-life','bonemerang','flamethrower'])
 assert.ok(!pendingIds.includes(id),'Native and approved moves must never enter NEW: '+id);
assert.ok(pending.every(isPendingApprovalMove));
assert.ok(pending.every(m=>m.source==='new-phaser-fx'));
assert.equal(filterMoveLibrary(allMoves,'NEW','ROCK').length,1,
 'Search inside NEW must find pending Rock Tomb only');
assert.ok(filterMoveLibrary(allMoves,'ROCK').some(m=>m.id==='rock-tomb'),
 'Element ROCK must remain unaffected by virtual NEW tab');
assert.equal(filterMoveLibrary(allMoves,'ALL').length,allMoves.length,
 'ALL must retain the complete selectable move library');

const officialMoveStats={
 'gust':{poder:40,precisao:100,pp:35,categoria:'SPECIAL',tipo:'FLYING',dano:8},
 'poison-sting':{poder:15,precisao:100,pp:35,categoria:'PHYSICAL',tipo:'POISON',dano:3},
 'bite':{poder:60,precisao:100,pp:25,categoria:'PHYSICAL',tipo:'DARK',dano:12},
  'peck':{poder:35,precisao:100,pp:35,categoria:'PHYSICAL',tipo:'FLYING',dano:7},
  'bug-bite':{poder:60,precisao:100,pp:20,categoria:'PHYSICAL',tipo:'BUG',dano:12},
  'rock-tomb':{poder:60,precisao:95,pp:15,categoria:'PHYSICAL',tipo:'ROCK',dano:12},
  'horn-attack':{poder:65,precisao:100,pp:25,categoria:'PHYSICAL',tipo:'NORMAL',dano:13},
  'double-kick':{poder:30,precisao:100,pp:30,categoria:'PHYSICAL',tipo:'FIGHTING',dano:6},
  'fury-attack':{poder:15,precisao:85,pp:20,categoria:'PHYSICAL',tipo:'NORMAL',dano:3},
  'metal-claw':{poder:50,precisao:95,pp:35,categoria:'PHYSICAL',tipo:'STEEL',dano:10},
  'bind':{poder:15,precisao:85,pp:20,categoria:'PHYSICAL',tipo:'NORMAL',dano:3},
 'mud-slap':{poder:20,precisao:100,pp:10,categoria:'SPECIAL',dano:4},
 'seed-bomb':{poder:80,precisao:100,pp:15,categoria:'PHYSICAL',dano:16},
 'super-fang':{poder:null,precisao:90,pp:10,categoria:'PHYSICAL',dano:0}
};
for(const [id,stats] of Object.entries(officialMoveStats)){
 const move=allMoves.find(m=>m.id===id);
 assert.ok(move,'Official statistics require real move '+id);
 for(const [k,v] of Object.entries(stats))
  assert.equal(move[k],v,'Official '+k+' should match Pokémon Database for '+id);
}

for(const id of ['bonemerang','bone-club','tri-attack','pay-day','swift','shadow-ball','lovely-kiss',
 'ice-beam','rock-blast','confuse-ray','soft-boiled','sing','crabhammer','smog',
 'hyper-fang','guillotine','petal-dance','metronome','absorb','x-scissor',
 'mud-slap','seed-bomb','super-fang','gust','poison-sting','bite','crunch','peck','leech-life','bug-bite','rock-tomb','horn-attack','double-kick','fury-attack','metal-claw','bind'])
 assert.ok(allMoves.find(x=>x.id===id),'missing signature move '+id);
assert.deepEqual(selectedMoves(tester),['bonemerang','bone-club','tri-attack','pay-day']);
assert.deepEqual(Object.values(resolveLoadout(tester)).map(h=>h.forma),
 ['torre2_bonemerang','torre2_boneclub','torre2_triattack','torre2_payday']);
for(const id of ['mud-slap','seed-bomb','super-fang']){
 assert.equal(equipMove(tester,0,id),true,'new adapted Kanto move can be equipped '+id);
 assert.equal(resolveLoadout(tester).lmb.id,id,'new adapted move usable in battle '+id);
}
for(const id of ['gust','poison-sting','bite','crunch']){
 assert.ok(allMoves.find(m=>m.id===id),'new early-route move not registered '+id);
 assert.equal(equipMove(tester,0,id),true,'early-route move can be equipped '+id);
 assert.equal(resolveLoadout(tester).lmb.id,id,'new early-route move usable '+id);
}
const nativeCrunch=allMoves.find(m=>m.id==='crunch');
assert.ok(nativeCrunch,'Original Pokémon Arena Crunch must be available');
assert.equal(nativeCrunch.forma,'torre2_crunch','Crunch renderer updated in Kanto loadout');
assert.equal(nativeCrunch.source,'torre2-visual-override','Native Crunch stats kept');
assert.equal(SIGNATURE_MOVES.some(m=>m.id==='crunch'),false,'Never duplicate native Crunch');
const leech=allMoves.find(m=>m.id==='leech-life');
assert.ok(leech,'Native Leech Life remains in original catalog');
assert.equal(leech.source,'arena2d-original',
 'Native Leech Life must keep its existing renderer, category and stats');
assert.equal(leech.forma,'golpe',
 'Leech Life renderer must remain the original Arena 2D hit effect');
assert.ok(!SIGNATURE_MOVES.some(m=>m.id==='leech-life'),'No duplicate native move');
for(const [id,forma] of [['peck','torre2_peck'],['bug-bite','torre2_bugbite']]){
 const move=allMoves.find(m=>m.id===id);
 assert.equal(move.forma,forma);
 assert.equal(move.approved,true,'User approved Peck and Bug Bite; freeze graphics and effects');
 assert.equal(equipMove(tester,0,id),true);
 assert.equal(resolveLoadout(tester).lmb.forma,forma);
}
for(const [id,forma] of [
 ['rock-tomb','torre2_rocktomb'],['horn-attack','torre2_hornattack'],
 ['double-kick','torre2_doublekick'],['fury-attack','torre2_furyattack'],
 ['metal-claw','torre2_metalclaw'],['bind','torre2_bind']
]){
 const move=allMoves.find(m=>m.id===id);
 assert.ok(move,'Pre-Brock missing attack now installed: '+id);
 assert.equal(move.forma,forma);
 assert.equal(move.source,'new-phaser-fx','Never overwrite an original move');
 assert.equal(move.approved,undefined,'Await explicit visual approval');
 assert.equal(equipMove(tester,0,id),true);
 assert.equal(resolveLoadout(tester).lmb.forma,forma);
}
assert.equal(equipMove(tester,0,'crunch'),true);
assert.equal(resolveLoadout(tester).lmb.forma,'torre2_crunch');
assert.equal(allMoves.filter(x=>x.nombre==='Tackle').length,1,
 'Tackle already exists in original Pokémon Arena 2D and must not be duplicated');
const confusion=allMoves.find(x=>x.nombre==='Confusion');
assert.ok(confusion);
assert.equal(equipMove(tester,0,confusion.id),true);
assert.equal(resolveLoadout(tester).lmb.nombre,'Confusion');
assert.equal(equipMove(tester,0,'nonexistent-attack'),false);
assert.equal(equipMove(tester,1,'tri-attack'),false,'prevent duplicate moves in slots');
saveCampaign(state);
assert.equal(readCampaign().team.find(x=>x.id==='mewtwo').moves[0],confusion.id,
 'selected moves must persist in saved campaign');
assert.equal(allMoves.some(x=>x.id==='surf'),false,'unapproved Surf must be hidden from the Kanto move catalog');
assert.equal(equipMove(tester,0,'surf'),false,'unapproved Surf may not be equipped');
assert.equal(equipMove(tester,0,'swift'),true,'new Swift must equip');
assert.equal(resolveLoadout(tester).lmb.forma,'torre2_swift');
assert.equal(equipMove(tester,0,'shadow-ball'),true,'new Shadow Ball must equip');
assert.equal(resolveLoadout(tester).lmb.forma,'torre2_shadowball');
assert.equal(equipMove(tester,0,'lovely-kiss'),true,'new Lovely Kiss must equip');
assert.equal(resolveLoadout(tester).lmb.forma,'torre2_lovelykiss');
assert.equal(equipMove(tester,0,'bonemerang'),true);
for(const id of ['ice-beam','rock-blast','confuse-ray','soft-boiled']){
 assert.equal(equipMove(tester,0,id),true,'new move equippable '+id);
 assert.equal(resolveLoadout(tester).lmb.id,id,'new Phaser move active '+id);
}
const realBeam=allMoves.find(m=>m.id==='ice-beam');
assert.equal(realBeam.forma,'chorro','Ice Beam must reuse real Hyper Beam/Aura Storm engine');
assert.equal(realBeam.paleta,'hieloTorre2');
assert.equal(realBeam.haz,true);
assert.equal(realBeam.giro,3.5);
assert.equal(realBeam.source,'new-phaser-fx','Only native renderer is reused, not falsely relabeled');
for(const id of [
 'bonemerang','bone-club','tri-attack','pay-day','shadow-ball',
 'rock-blast','soft-boiled','confuse-ray'
])
 assert.equal(allMoves.find(m=>m.id===id)?.approved,true,'Previously approved signature move '+id);
for(const id of ['swift','lovely-kiss'])
 assert.equal(allMoves.find(m=>m.id===id)?.approved,true,
  'The user has explicitly approved '+id);
assert.equal(realBeam.approved,true,'Ice Beam V6 approved: native Chorro, frozen palette and crystals are locked');
// Petal Dance, Hyper Fang and Guillotine are explicitly approved. New trio awaits visual review.
for(const [id,forma] of [['hyper-fang','torre2_hyperfang'],
 ['guillotine','torre2_guillotine'],['petal-dance','torre2_petaldance']]){
 const h=allMoves.find(x=>x.id===id);
 assert.ok(h,'New Kanto move registered '+id);
 assert.equal(h.forma,forma,'Correct art renderer '+id);
 assert.equal(h.approved,true,
  'All three prior Kanto moves received visual approval: '+id);
 assert.equal(h.source,'new-phaser-fx');
 assert.equal(equipMove(tester,0,id),true,'Mewtwo test loadout includes '+id);
 assert.equal(resolveLoadout(tester).lmb.forma,forma);
}
for(const [id,forma] of [['metronome','torre2_metronome'],['absorb','torre2_absorb'],['x-scissor','torre2_xscissor']]){
 const h=allMoves.find(m=>m.id===id);
 assert.ok(h,'New ability must be in Kanto/Mewtwo move library: '+id);
 assert.equal(h.forma,forma);
 assert.equal(h.approved,undefined,'New trio must await explicit visual approval');
 assert.equal(equipMove(tester,0,id),true,'New trio selectable in Mewtwo test menu');
}
const newVfx=fs.readFileSync(path.join(stage,version,'torre2/next-specific-fx.js'),'utf8');
for(const name of ['metronome','absorb','xscissor'])assert.ok(
 newVfx.includes('export function '+name+'('),'New VFX renderer exists: '+name);
assert.ok(newVfx.includes("from './move-pool.js'"),
 'Metronome picks a real installed move, not arbitrary dummy damage');
const cargaBuilt=fs.readFileSync(path.join(stage,version,'escenas/carga.js'),'utf8');
assert.ok(!cargaBuilt.includes('assets/ui/balls20.png'),
 'Do not request missing balls20.png from live site: native client has no consumer');
const dexBuilt=fs.readFileSync(path.join(stage,version,'escenas/pokedex.js'),'utf8');
assert.ok(dexBuilt.includes('preload(){const m=this.registry.get("manifiesto")'),
 'Pokédex loads all 26 original base portraits before drawing the grid');
assert.ok(dexBuilt.includes('cargarPMD(this,this._torre2DexForms,["Idle"])'),
 'Pokédex must use existing PMD portrait/Idle assets rather than placeholder');
assert.ok(dexBuilt.includes('this.load.once("complete",()=>{if(!this.scene.isActive())return;crearAnimsPMD(this,forms,["Idle"]);this.irEtapa(i)}'),
 'Pokedex evolution tabs must lazily load each selected original PMD animation');
const early=fs.readFileSync(path.join(stage,version,'torre2/early-route-fx.js'),'utf8');
for(const name of ['gust','poisonsting','bite','crunch','peck','bugbite'])
 assert.ok(early.includes('export function '+name+'('),
  'Missing new hand-pixeled early-route renderer '+name);
assert.ok(early.includes('clashAt(e,fx,l,tip,15')&&early.includes('clashAt(e,fx,l,tip,6'),
 'Gust and Poison Sting participate in physical Clash and dissipate on contact');
for(const shape of ['const WIND_CURL=[','const NEEDLE=[','const JAW_UP=['])
 assert.ok(early.includes(shape),'Distinct pixel matrix is missing: '+shape);
assert.ok(early.includes('const rotations=[0,PI/2]') &&
 early.includes('paintChomp(jaw,cx,cy,rotations[turn]') &&
 early.includes('const struck=landed||strike('),
 'Crunch has horizontal + vertical pixel bites, with only one actual damaging hit');
for(const id of ['gust','poison-sting'])
 assert.equal(allMoves.find(x=>x.id===id)?.approved,true,
 'These early-route moves are explicitly approved and frozen: '+id);
for(const id of ['bite','crunch'])
 assert.equal(allMoves.find(x=>x.id===id)?.approved,true,
 'User explicitly approved Bite and Crunch; preserve their pixel art and mechanics');
assert.ok(early.includes('export function contactDash(')&&early.includes('dash.step(age)'),
 'Bite and Crunch advance the actual fighter before returning');
assert.ok(!early.includes('export function leechlife(')&&
 !early.includes('torre2_leechlife:'),
 'No replacement renderer for the previously existing Leech Life');
const prebrockFx=fs.readFileSync(path.join(stage,version,'torre2/prebrock-damage-fx.js'),'utf8');
for(const fn of ['rocktomb','hornattack','doublekick','furyattack','metalclaw','bind'])
 assert.ok(prebrockFx.includes('export function '+fn+'('),'Unbundled pre-Brock VFX: '+fn);
assert.ok(prebrockFx.includes("from './clash-fx.js'"),
 'Rock Tomb collision must use shared native projectile Clash adapter');
const sharedClash=fs.readFileSync(path.join(stage,version,'torre2/clash-fx.js'),'utf8');
assert.ok(sharedClash.includes('export function clashAt('),'Shared clash adapter bundled');
assert.ok(sharedClash.includes('export function clashBurst('),'Pixel dissipate after projectile Clash');
assert.ok(sharedClash.includes('frame>=10'),'Ten hand-drawn frames must end cleanly');
assert.ok(sharedClash.includes('item.dueno!==attacker.rival'),'Never clash with own projectiles');
assert.ok(sharedClash.includes('scene.programar(0,()=>scene.efectos.push(fx))'),
 'Defer Clash graphics so original Phaser battle loop does not discard them');
const adapted=fs.readFileSync(path.join(stage,version,'torre2/adapted-moves-fx.js'),'utf8');
assert.ok(adapted.includes("import {clashAt} from './clash-fx.js';"),
 'New approved Mud-Slap and Seed Bomb register collision with shared adapter');
assert.ok(adapted.includes('fx.clashBody=body;')&&adapted.includes('fx.clashBody=collisionBody;'),
 'Both new projectile moves expose physical hitboxes for Clash');

for(const fn of ['mudslap','seedbomb','superfang'])assert.ok(
 adapted.includes('export function '+fn+'('),'Missing hand-animated new renderer '+fn);
for(const matrix of ['const MUD_PELLET=[','const MUD_SPLASH=[','const BOMB=[','const BOMB_CRACK=[','const JAW_TOP=[','const INCISOR=[']){
 assert.ok(adapted.includes(matrix),'Missing hand-drawn pixel art sprite '+matrix);
}
assert.ok(adapted.includes("puro:true"),'Super Fang uses exact fixed half-HP damage');
assert.ok(adapted.includes("Math.floor(r.hp*.5)"),'Super Fang hits for 50% current HP');
// Visual-only adjustments: collision, move stats and already-approved Super Fang
// must not change just because we improved Mud-Slap and Seed Bomb pixels.
assert.ok(adapted.includes('const MUD_MICRO_SPLASH=['),
 'Mud-Slap must have three separate micro-splash pixel matrices');
assert.ok(adapted.includes('stamp(proj,MUD_SPLASH,impact.x,impact.y,MUD_PALETTE,1.8,1-t)'),
 'Mud-Slap original impact is opened by 12.5%, not its projectile');
assert.ok(adapted.includes('for(let i=0;i<3;i++){\n     const side=i-1;'),
 'Mud-Slap adds exactly 3 small lateral splash flecks');
assert.ok(adapted.includes('stamp(body,BOMB,tip.x,'),
 'Seed Bomb stays intact during flight');
assert.ok(!adapted.includes('frame===2?BOMB_CRACK:BOMB'),
 'Seed Bomb crack may not appear during flight');
assert.ok(adapted.includes('stamp(body,BOMB_CRACK,impact.x'),
 'Seed Bomb shows its crack only at physical impact');
assert.ok(adapted.includes('const SEED_CORE=['),
 'Seed Bomb briefly reveals the pale-green center');
assert.ok(adapted.includes('const SEED_SHELL_CHIP=['),
 'Seed Bomb includes 3 additional micro shell chips');
assert.ok(adapted.includes('for(let i=0;i<6;i++){')&&adapted.includes('for(let i=0;i<3;i++){\n     const travel='),
 'Seed Bomb has 6 original and 3 added shards — without additional hit checks');
// FNV-1a guard of the art, timing and damage code of approved Super Fang.
// Future work on the two previous spells cannot silently edit these bytes.
const approvedFang=adapted.split('const JAW_COL=')[1]?.split('export const TORRE2_ADAPTED_FORMS')[0];
assert.ok(approvedFang,'Missing approved Super Fang source');
let fangGuard=2166136261;
for(const char of 'const JAW_COL='+approvedFang){
 fangGuard^=char.charCodeAt(0);
 fangGuard=Math.imul(fangGuard,16777619);
}
assert.equal(fangGuard>>>0,0x098cb000,
 'Super Fang is approved and frozen: pixel matrices and behaviour must not change');
assert.ok(!adapted.includes('CanvasRenderingContext2D'),'New 3 attacks use WebGL pixel matrices only');
assert.ok(newVfx.includes('dealt*.5'),'Absorb heals half of actual dealt damage');
assert.ok(!newVfx.includes('CanvasRenderingContext2D'),'New custom moves use Phaser Graphics only');
for(const sprite of ['const HAND_PALM=[','const FINGER_FRAMES=[','const ABSORB_HEAD=[',
 'const ABSORB_MOTE=[','const SCISSOR_CUT=[']){
 assert.ok(newVfx.includes(sprite),'Hand-authored sprite matrix required '+sprite);
}
assert.ok(newVfx.includes('const WAG=[0,1,2,3,3,2,1,0,0,1,2,3]'),
 'Metronome requires 12 named animation poses instead of a CSS-like moving slab');

assert.ok(newVfx.includes('stencil(palm,HAND_PALM,cx,cy+5,HAND_PAL,1.5)'),
 'Metronome palm must be half of old scale 3');
assert.ok(newVfx.includes('stencil(palm,FINGER_FRAMES[WAG[frame]],cx,cy-10,HAND_PAL,1.5)'),
 'Metronome finger must also be half size');
assert.ok(newVfx.includes('PAL,1.5,1,a*.4)'),
 'Absorb head must be half the former scale 3');
assert.ok(newVfx.includes('SCISSOR_CROSS=SCISSOR_CUT.map'),
 'X-Scissor uses two opposing pixel-matrix scythe streaks');
assert.ok(newVfx.includes('if(!resolved&&frame>=6)'),
 'X-Scissor only resolves one hit when the two blades visually meet');
assert.ok(newVfx.includes('stencil(blades,SCISSOR_CUT'),
 'X-Scissor renders two distinct crossing scythe-slash pixel sprites, not vector strokes');
for(const forbidden of ['.fillCircle(','.fillEllipse(','.strokePath(','.lineTo(','.arc(']){
 assert.ok(!newVfx.includes(forbidden),
  'New effects must use only authored pixel stencils, not Canvas-like vectors: '+forbidden);
}

assert.equal(equipMove(tester,0,'bonemerang'),true);
const kantoFile=fs.readFileSync(path.join(stage,version,'torre2/kanto-signatures-fx.js'),'utf8');
assert.ok(kantoFile.includes('const FANG_UP=['),'Hyper Fang fangs defined as pixel cells');
assert.ok(kantoFile.includes('const PINCER=['),'Guillotine pincers defined as pixel cells');
assert.ok(kantoFile.includes('const PETAL=['),'Petal Dance petals defined as pixel cells');
assert.ok(kantoFile.includes('const RAT_INCISOR=['),'Rat incisors encoded as pixel art');
assert.ok(kantoFile.includes('x-6,toothY')&&kantoFile.includes('x+11,toothY'),
 'Both large rodent incisors are drawn');
assert.ok(kantoFile.includes('const GUILLOTINE_JAW_TOP=[')&&
 kantoFile.includes('const GUILLOTINE_JAW_BOTTOM='),
 'Opposing Guillotine blades must have readable silhouettes');
assert.ok(kantoFile.includes('spread=Math.round(19*(1-phase))'),
 'Guillotine starts open and closes its two pincers');
assert.ok(kantoFile.includes('const scale=2,rows=PETAL'),
 'Petals are one-third smaller');
assert.ok(kantoFile.includes('PETAL_PALETTES[Math.abs(shade)%'),
 'Petal Dance has multiple pink palettes');
assert.ok(kantoFile.includes('const orbitPhase=elapsed*')&&
 kantoFile.includes('const vortexRadius=8+12*Math.sin(progress*PI)**2')&&
 kantoFile.includes('petal(blooms,x,y,orbitPhase'),
 'Petal Dance must travel as individually tumbling Aura Storm-style petals');

assert.ok(!kantoFile.includes('CanvasRenderingContext2D') &&
 !kantoFile.includes('.fillPoints(') && !kantoFile.includes('.arc('),
 'No smooth polygon, Canvas 2D or vector VFX in new moves');
const smogMove=allMoves.find(x=>x.id==='smog');
assert.equal(smogMove?.approved,true,'Smog approved with extra pixel bubbles');
for(const id of ['sing','crabhammer'])
 assert.equal(allMoves.find(x=>x.id===id)?.approved,true,
  'Sing and Crabhammer explicitly approved by user; preserve current visuals');
const menuCampaign=fs.readFileSync(path.join(stage,version,'torre2/campanha.js'),'utf8');
assert.ok(menuCampaign.includes('marco(g,x-w/2'),'Campaign uses original Poké Arena menu border');
assert.ok(menuCampaign.includes('textoMenu(this,x,y'),'Campaign buttons use exact initial menu font');
assert.ok(!menuCampaign.includes('0xdf803c'),'Remove orange generic battle button');
const speciesFile=fs.readFileSync(path.join(stage,version,'torre2/species-fx.js'),'utf8');
const pixelPincer=speciesFile.slice(speciesFile.indexOf('function crabPixels('),
 speciesFile.indexOf('export function crabhammer('));
assert.ok(pixelPincer.includes('draw(g,')&&!pixelPincer.includes('.fillPoints('),
 'Crabhammer claw is actual hand-crafted squared pixel art, not polygons');
assert.ok(speciesFile.includes('SMOG_FAN.length'),'Smog must animate independent bubbles');
assert.ok(speciesFile.includes('SMOG_FAN=Object.freeze(['),'Smog must retain fixed staggered spread');
assert.ok(speciesFile.includes('if(hit(l,h,extra,.23,5))'),
 'Each Smog bubble applies its own balanced damage on impact');
assert.ok(!speciesFile.includes('let age=0,previous={x:x0,y:y0},landed=false'),
 'No single global hit gate may suppress other Smog bubbles');
assert.ok(speciesFile.includes('offsets=[0,-9,12,-5,7,-13,15,-1,10]'),
 'Sing keeps nine separate staggered pixel music notes');

const abilityBody=fs.readFileSync(path.join(stage,version,'habilidades.js'),'utf8');
assert.ok(abilityBody.includes('HAZ.hieloTorre2='),'Exact original beam renderer with new palette');
assert.ok(abilityBody.includes('h.paleta==="hieloTorre2"'),'Ice particles apply only to Ice Beam');
assert.equal(equipMove(tester,0,'ice-beam'),true);
assert.equal(resolveLoadout(tester).lmb.forma,'chorro');
assert.equal(resolveLoadout(tester).lmb.paleta,'hieloTorre2');
assert.equal(equipMove(tester,0,'bonemerang'),true);
const original=allMoves.filter(m=>['Flamethrower','Rock Slide','Water Pulse','Thunderbolt'].includes(m.nombre));
assert.ok(original.length>=2,'captured Poké Arena move catalog retained');
assert.ok(original.every(m=>m.source==='arena2d-original'),'original Arena VFX always take priority');
assert.equal(state.dexCaught.includes('charmander'),true);
assert.equal(recordSeen(state,'onix'),true);
assert.equal(recordSeen(state,'onix'),false);
assert.equal(recordSeen(state,'pichu'),false,'Kanto Pokedex excludes Pichu');
assert.equal(startBattle(state).nivel,'facil');
assert.equal(state.dexSeen.includes('onix'),true);
state.stage=5;state.trainer=TRAINERS_PER_GYM(5);
assert.equal(startBattle(state).nivel,'dificil','later gym bosses gain advanced native AI');
state.stage=8;state.trainer=0;
assert.equal(startBattle(state).nivel,'maestro','Elite Four uses the original master AI');
state.stage=0;state.trainer=0;saveCampaign(state);
assert.equal(recordCaught(state,'onix'),true);
assert.equal(recordCaught(state,'onix'),false);


const initialSpecies=state.team[0].id;
for(let i=0;i<13;i++){
 assert.equal(currentOpponent(state).leader,false);
 const result=resolveBattle(state,true,()=>0);
 assert.equal(result.won,true);
 assert.equal(state.stage,0);
 assert.ok(state.team[0].progression.experience>0);
 if(state.pendingCapture){state.inventory.pokeball=Math.max(1,state.inventory.pokeball);const r=attemptCapture(state,()=>0);assert.ok(r.ok)}
}
assert.equal(state.trainer,13);
assert.equal(currentOpponent(state).leader,true);
const beforeBadge=state.badges.length;
resolveBattle(state,true,()=>0);
assert.equal(state.stage,1);
assert.equal(state.badges.length,beforeBadge+1);
if(state.pendingCapture){state.inventory.pokeball=Math.max(1,state.inventory.pokeball);assert.equal(attemptCapture(state,()=>0).ok,true)}
assert.equal(readCampaign().stage,1);
assert.equal(state.team.length,6);
assert.ok(state.box.length>0);
const beforeParty=state.team.map(x=>x.uid),beforeBox=state.box.map(x=>x.uid);
assert.equal(storePokemon(state,0),true);
assert.equal(state.team.length,5);
assert.equal(state.box.at(-1).uid,beforeParty[0]);
assert.equal(withdrawPokemon(state,state.box.length-1),true);
assert.equal(state.team.at(-1).uid,beforeParty[0]);
assert.equal(state.box.length,beforeBox.length);
const bench=state.box[0].uid,slot=state.team[0].uid;
assert.equal(swapPokemon(state,0,0),true);
assert.equal(state.team[0].uid,bench);
assert.equal(state.box[0].uid,slot);
assert.equal(swapPokemon(state,0,0),true);
assert.equal(state.team[0].uid,slot);
assert.equal(storePokemon(state,-1),false);
assert.equal(withdrawPokemon(state,999),false);
assert.equal(readCampaign().team[0].uid,slot);
const legacy=JSON.parse(items.get(SAVE_KEY));
delete legacy.box;delete legacy.dexSeen;delete legacy.dexCaught;
items.set(SAVE_KEY,JSON.stringify(legacy));
const migrated=readCampaign();
assert.ok(Array.isArray(migrated.box)&&Array.isArray(migrated.dexCaught));
assert.ok(migrated.team.length>0&&migrated.team.length<=6);
saveCampaign(state);

assert.ok(state.team[0].progression.level>=5);
assert.ok(state.team[0].id!==initialSpecies || state.team[0].progression.level<16);
const save=items.get(SAVE_KEY);assert.ok(save.includes('"version":1'));
const before=state.trainer;
resolveBattle(state,false);
assert.equal(state.trainer,before,'a lost battle does not advance trainer progression');
assert.equal(readCampaign().losses,state.losses,'defeat statistics must persist after refresh');
assert.equal(readCampaign().trainer,before,'loss must not advance the saved trainer');
assert.equal(readCampaign().pendingCapture,null,'loss must clear any stale capture opportunity');
console.log('PASS offline Kanto campaign: 151 names, 8 gyms, 13 trainers, badges, captures, saves and no in-combat evolution.');
