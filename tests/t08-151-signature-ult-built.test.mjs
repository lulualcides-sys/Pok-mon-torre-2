/* T07/T08: real versioned Phaser library, 151 Kanto × 227 installed VFX.
 * 150 campaign species, 8 progression checkpoints each. Ditto has no
 * installed Transform renderer; it is the sole documented ULT exception.
 * Fixtures are NOT a played campaign or Android hardware verification.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const base=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(base,'version.json'),'utf8'));
const load=p=>import(pathToFileURL(path.join(base,modules,p)).href);
const [{KANTO_151},{TEST_LIBRARY,availableMoves,selectedMoves,resolveLoadout,
 moveUnlockLevel}, {chooseKantoSignatureUlt,verifiedLevelUpNames},
 {FRLG_LEVEL_UP,KANTO_LEVEL_EVOLUTIONS},
 {GEN4_HGSS_KANTO_LEVEL_UP,GEN5_B2W2_KANTO_LEVEL_UP},
 {GEN7_LETSGO_LEVEL_UP},{GEN5_KANTO_LEVEL_UP},{EARLY_KANTO_LEARNSETS}]
 =await Promise.all([load('torre2/all-kanto-species.js'),
 load('torre2/move-pool.js'),load('torre2/kanto-ultimate-policy.js'),
 load('torre2/frlg-learnsets.js'),load('torre2/gen45-kanto-learnsets.js'),
 load('torre2/gen7-letsgo-learnsets.js'),load('torre2/gen5-existing-levels.js'),
 load('torre2/early-kanto-species.js')]);
const make=(id,level)=>({id,progression:{species:id,level},tmMoves:[]});
assert.equal(KANTO_151.length,151);
assert.equal(TEST_LIBRARY.length,227);
assert.equal(new Set(TEST_LIBRARY.map(m=>m.id)).size,227);
const exceptions=[],unbalanced=[],badSlots=[],speciesRows=[];
let previewSignatures=0,checkedLevels=0;
const samples={};
for(const {id,tipos} of KANTO_151){
 if(id==='mewtwo')continue;
 const context={levelUp:FRLG_LEVEL_UP[id]||{},earlyLevels:EARLY_KANTO_LEARNSETS[id]||{},
  verifiedTables:[FRLG_LEVEL_UP,GEN4_HGSS_KANTO_LEVEL_UP,GEN5_B2W2_KANTO_LEVEL_UP,
   GEN7_LETSGO_LEVEL_UP,EARLY_KANTO_LEARNSETS,GEN5_KANTO_LEVEL_UP],
  verifiedParents:KANTO_LEVEL_EVOLUTIONS,speciesTypes:tipos};
 const signature=chooseKantoSignatureUlt(id,TEST_LIBRARY,context);
 if(!signature)exceptions.push(id);
 else{
  previewSignatures++;
  assert.ok(verifiedLevelUpNames(id,context).has(signature.id),
   id+' ULT is not in its verified species/ancestor level-up list');
  assert.ok(signature.forma,'No approved attack renderer for '+id);
  assert.ok(signature.source!=='new-phaser-fx'||signature.approved===true,
   id+' has a pending VFX');
 }
 for(const level of [5,7,8,13,20,30,40,50]){
  const member=make(id,level),kit=resolveLoadout(member);
  const active=['lmb','rmb','q','e'].map(k=>kit[k]).filter(Boolean);
  if(level>=8){
   if(active.length!==4||new Set(active.map(m=>m.id)).size!==4)
    badSlots.push({species:id,level,active:active.map(m=>m.id)});
  }else assert.equal(kit.e,undefined,id+' Lv'+level+' ULT must be locked');
  if(active.some(m=>!m.forma))badSlots.push({species:id,level,unrendered:true});
  if(level===8){
   const e=kit.e;
   assert.ok(e?.ulti&&e.torre2IntroPractice&&e.torre2IntroSlot==='e',
    id+' missing energy-gated Lv8 ULT');
   assert.ok(e.dano>=0&&e.dano<=12&&e.cd>=8,id+' ULT not capped');
   if(signature){
    assert.equal(e.torre2IntroSource,signature.id,id+' has wrong species ULT');
    assert.ok(e.dano>=7,id+' ULT was just a weak basic hit');
    assert.ok(e.nombre.startsWith('ULT · '));
   }
   assert.equal(availableMoves(member).find(m=>m.torre2IntroSlot==='e')?.id,
    e.id,id+' battle and move summary disagree at Lv8');
  }
  if(level===50&&id!=='ditto'&&kit.e?.dano<7)
   unbalanced.push({species:id,name:kit.e.nombre,damage:kit.e.dano});
  checkedLevels++;
 }
 speciesRows.push({species:id,signatureULT:signature?.id||null,
  equippedULT8:resolveLoadout(make(id,8)).e?.nombre,
  equippedULT50:resolveLoadout(make(id,50)).e?.nombre,
  level50LegalMoves:availableMoves(make(id,50)).filter(m=>!m.torre2IntroPractice).length});
 if(['squirtle','bulbasaur','charmander','mankey','caterpie','magikarp','ditto','gengar'].includes(id)){
  samples[id]={signature:signature?.nombre||null,
   level8:resolveLoadout(make(id,8)).e?.nombre||null,
   level50:resolveLoadout(make(id,50)).e?.nombre||null};
 }
}
assert.equal(previewSignatures,149);
assert.deepEqual(exceptions,['ditto']);
assert.deepEqual(badSlots,[],'Repeated/missing battle buttons');
assert.deepEqual(unbalanced,[],'Weak default Lv50 ULT despite legal moves');
// Early preview never teaches the FULL late-game attack at Lv8.
for(const [id,move] of [
 ['bulbasaur','solar-beam'],['squirtle','hydro-pump'],
 ['charmander','flamethrower'],['pikachu','thunderbolt']
]){
 assert.ok(!availableMoves(make(id,8)).some(m=>m.id===move),
  id+' got full '+move+' before its real level');
 assert.ok(availableMoves(make(id,50)).some(m=>m.id===move),
  id+' cannot later learn full '+move);
}
// These moves are learned by leveling up in later VERIFIED generations,
// although their move IDs are also compatible with FRLG TMs.
const restored=[
 ['charizard','dragon-claw',36],['slowpoke','rest',30],
 ['slowbro','rest',37],['seel','dive',41],['dewgong','dive',41],
 ['exeggcute','bullet-seed',17],['exeggutor','bullet-seed',36],
 ['aerodactyl','fly',49],['slowpoke','rain-dance',49],
 ['zapdos','rain-dance',50]
];
for(const [id,move,at] of restored){
 assert.ok(!availableMoves(make(id,at-1)).some(m=>m.id===move),
  id+' '+move+' unlocked too early');
 assert.ok(availableMoves(make(id,at)).some(m=>m.id===move),
  id+' missing verified '+move+' at Lv'+at);
 assert.equal(moveUnlockLevel(make(id,50),move),at,
  id+' Pokedex/real unlock diverged for '+move);
}
for(const [id,move] of [['psyduck','surf'],['tentacruel','surf'],
 ['sandshrew','protect'],['sandslash','protect']])
 assert.ok(!availableMoves(make(id,50)).some(m=>m.id===move),
  'Rejected Surf or TM-only FRLG Protect auto-granted for '+id);
const saved={...make('squirtle',50),
 moves:['water-gun','bite','bubble-beam','hydro-pump'],movePlanSpecies:'squirtle'};
const before=JSON.stringify(saved);
assert.deepEqual(selectedMoves(saved),saved.moves);
assert.equal(JSON.stringify(saved),before,'Reading a save changed manual ULT');
assert.equal(resolveLoadout(saved).e?.id,'hydro-pump');
// Regression caught by the production Pages gate after #271: Gloom Lv21
// must not impersonate its still-locked canonical Solar Beam in the E slot.
const gloom21=make('gloom',21);
assert.ok(!availableMoves(gloom21).some(m=>m.id==='solar-beam'));
assert.notEqual(resolveLoadout(gloom21).e?.torre2IntroSource,'solar-beam',
 'Gloom borrowed its future evolved E attack at Lv21');
// The original Kanto ATK is always a weak basic, even after the new ULT
// ranking frees Wing Attack from the E slot.
const pidgey19=make('pidgey',19);
assert.ok(availableMoves(pidgey19).some(m=>m.id==='wing-attack'));
const pidgeyBefore=JSON.stringify(pidgey19);
assert.equal(equipMove(pidgey19,0,'wing-attack'),false,
 'Wing Attack is too strong for basic ATK');
assert.equal(JSON.stringify(pidgey19),pidgeyBefore,
 'A refused ATK equip changed the save');
fs.mkdirSync('test-evidence',{recursive:true});
fs.writeFileSync('test-evidence/t08-151-signatures-227-report.json',JSON.stringify({
 source:'compiled-fixtures-not-played-campaign',installedMoves:227,
 allKantoSpecies:151,regularCampaignSpecies:150,
 exceptions,restoredLearnsets:restored,
 sourceTables:['FRLG','HGSS','B2W2','LetsGo'],species:speciesRows
},null,2)+'\n');
console.log('PASS_T08_151_SIGNATURE_ULT_227',JSON.stringify({
 species:151,campaignSpecies:150,installed:227,verifiedSignatureUlts:previewSignatures,
 exceptions,levelsChecked:checkedLevels,missingOrDuplicateSlots:badSlots.length,
 weakLevel50Ultimate:unbalanced.length,restoredGen45LetsGoLevelUps:restored.length,
 examples:samples,source:'compiled-fixtures; not physical Android'
}));
