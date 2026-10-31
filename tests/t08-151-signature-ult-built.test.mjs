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
 moveUnlockLevel,campaignLearnset,equipMove,isCampaignUltimateOnlyMove}, {chooseKantoSignatureUlt,verifiedLevelUpNames},
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
assert.ok(TEST_LIBRARY.length>=227,'Native source lost one of 227 baseline effects');
assert.equal(new Set(TEST_LIBRARY.map(m=>m.id)).size,TEST_LIBRARY.length,'Duplicate native move IDs');
// Native source placeholders may be pending, but their explicitly approved
// Torre 2 renderer replacements must remain usable for thematic Lv8 ULTs.
for(const id of ['bug-bite','bite','swift']){
 const move=TEST_LIBRARY.find(m=>m.id===id);
 assert.ok(move?.forma&&move.approved===true&&!move.pendiente,
  id+' inherited a stale native pending flag despite its approved VFX');
}
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
 if(!signature){
  exceptions.push(id);
  // Diagnostic only: preserve the 149/150 gate; identify the real missing
  // approved VFX and its source lock instead of lowering the assertion.
  const verified=verifiedLevelUpNames(id,context);
  const installed=TEST_LIBRARY.filter(m=>verified.has(String(m.nombre||'').toLowerCase()
   .replace(/[^a-z0-9]+/g,'-'))).map(m=>({
    id:m.id,name:m.nombre,damage:m.dano,source:m.source,forma:m.forma,
    pending:!!m.pendiente,unavailable:!!m.torre2Unavailable,
    tm:!!m.torre2RequiresTM,hm:!!m.torre2RequiresHM
  }));
  console.error('T08_MISSING_SIGNATURE',JSON.stringify({id,installed}));
 }
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
  // Flare Blitz is an approved native multi-contact finisher: its 5 base
  // damage is per contact, not the complete attack. Never weaken the E-only
  // role or alter the original animation just to satisfy a single-hit check.
  const nativeMultiContact=['ponyta','rapidash'].includes(id)&&
   kit.e?.id==='flare-blitz'&&isCampaignUltimateOnlyMove(kit.e);
  if(level===50&&id!=='ditto'&&kit.e?.dano<7&&!nativeMultiContact)
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
 ['aerodactyl','fly',49],['slowpoke','rain-dance',49]
];
for(const [id,move,at] of restored){
 assert.ok(!availableMoves(make(id,at-1)).some(m=>m.id===move),
  id+' '+move+' unlocked too early');
 assert.ok(availableMoves(make(id,at)).some(m=>m.id===move),
  id+' missing verified '+move+' at Lv'+at);
 assert.equal(moveUnlockLevel(make(id,50),move),at,
  id+' Pokedex/real unlock diverged for '+move);
}
// T16 weather-role policy overrides the later-gen Lv50 Zapdos Rain Dance
// unlock ONLY inside the custom Torre 2 campaign (not in source learnsets).
// Thunder retains normal Electric progression and rain accuracy separately.
const zapdos=make('zapdos',50);
assert.equal(availableMoves(zapdos).some(m=>m.id==='rain-dance'),false,
 'Zapdos must not get a Water-only climate setup move');
assert.equal(campaignLearnset('zapdos').some(m=>m.id==='rain-dance'),false,
 'Pokédex must not advertise off-theme Rain Dance to Electric');
assert.ok(availableMoves(zapdos).some(m=>m.id==='thunder'),
 'Removing Rain Dance must not remove actual Electric offense');
for(const [id,move] of [['psyduck','surf'],['tentacruel','surf'],
 ['squirtle','surf'],['blastoise','surf'],['lapras','surf'],
 ['vaporeon','surf'],['dragonite','surf'],
 ['sandshrew','protect'],['sandslash','protect']])
 assert.ok(!availableMoves(make(id,50)).some(m=>m.id===move),
  'Surf HM not unlocked or TM-only FRLG Protect auto-granted for '+id);
// Surf's existing renderer is APPROVED. Its campaign HM acquisition is still
// locked independently; a legacy TM claim must remain untouched, not auto-equipped.
// Do not erase saved claims or modify any installed effects.
const surfSave={...make('squirtle',50),tmMoves:['surf']};
const surfSaveBefore=JSON.stringify(surfSave);
assert.ok(!availableMoves(surfSave).some(m=>m.id==='surf'));
assert.equal(JSON.stringify(surfSave),surfSaveBefore);
// The Pokédex reads campaignLearnset, not just the battle menu. An approved
// renderer alone must not advertise an unimplemented HM acquisition route.
for(const id of ['squirtle','blastoise','lapras','vaporeon','dragonite']){
 const rows=campaignLearnset(id);
 assert.ok(!rows.some(row=>row.id==='surf'),
  id+' Pokédex incorrectly advertises Surf HM before campaign authorization');
 assert.equal(moveUnlockLevel(make(id,50),'surf'),null,
  id+' unlock index disagrees with locked Surf HM');
}
const approvedSurfVfx=TEST_LIBRARY.find(m=>m.id==='surf');
assert.ok(approvedSurfVfx?.forma,
 'Approved Surf renderer must remain installed, independently of campaign HM');
const surfVfxBefore=JSON.stringify(approvedSurfVfx);
// Read-only campaign gates must not rewrite approved renderer metadata.
for(const id of ['squirtle','lapras','vaporeon']){
 availableMoves(make(id,50));
 campaignLearnset(id);
}
assert.equal(JSON.stringify(approvedSurfVfx),surfVfxBefore,
 'Checking Surf HM availability mutated its approved VFX');
assert.ok(!resolveLoadout(make('charmander',5)).lmb?.torre2IntroFallbackFX,
 'Deferred Scratch must not impersonate a Tackle renderer');
const saved={...make('squirtle',50),
 moves:['water-gun','bite','bubble-beam','hydro-pump'],movePlanSpecies:'squirtle'};
const before=JSON.stringify(saved);
// Old save format is preserved, but a formerly ordinary HAB3 Bubble Beam
// (strong enough for ULT) now resolves to another legally learned HAB move.
const safeLoadout=selectedMoves(saved);
assert.deepEqual(safeLoadout.slice(0,2),saved.moves.slice(0,2));
assert.ok(!safeLoadout.slice(0,3).includes('bubble-beam'),
 'Strong Bubble Beam must not fire without a charged E meter');
assert.ok(availableMoves(saved).some(m=>m.id===safeLoadout[2]),
 'Legacy HAB fallback must be legally available');
assert.equal(JSON.stringify(saved),before,'Reading a save changed manual ULT');
assert.equal(resolveLoadout(saved).e?.id,'hydro-pump');
// Regression caught by the production Pages gate after #271: Gloom Lv21
// must not impersonate its still-locked canonical Solar Beam in the E slot.
const gloom21=make('gloom',21);
assert.ok(!availableMoves(gloom21).some(m=>m.id==='solar-beam'));
console.log('T08_GLOOM_DIAGNOSTIC',JSON.stringify({available:availableMoves(gloom21).map(m=>m.id),e:resolveLoadout(gloom21).e}));
assert.notEqual(resolveLoadout(gloom21).e?.torre2IntroSource,'solar-beam',
 'Gloom borrowed its future evolved E attack at Lv21');
// The original Kanto ATK is always a weak basic, even after the new ULT
// ranking frees Wing Attack from the E slot.
const pidgey19=make('pidgey',19);
assert.ok(availableMoves(pidgey19).some(m=>m.id==='wing-attack'));
console.log('T08_ATK_DIAGNOSTIC',JSON.stringify({
 pidgey:availableMoves(pidgey19).filter(m=>['wing-attack','tackle','quick-attack'].includes(m.id))
  .map(m=>({id:m.id,dano:m.dano,poder:m.poder,torre2IntroSlot:m.torre2IntroSlot,forma:m.forma})),
 bulbasaur:availableMoves(make('bulbasaur',10)).filter(m=>['vine-whip','tackle'].includes(m.id))
  .map(m=>({id:m.id,dano:m.dano,poder:m.poder,torre2IntroSlot:m.torre2IntroSlot}))
}));
const pidgeyBefore=JSON.stringify(pidgey19);
assert.equal(equipMove(pidgey19,0,'wing-attack'),false,
 'Wing Attack is too strong for basic ATK');
assert.equal(JSON.stringify(pidgey19),pidgeyBefore,
 'A refused ATK equip changed the save');
fs.mkdirSync('test-evidence',{recursive:true});
fs.writeFileSync('test-evidence/t08-151-signatures-227-report.json',JSON.stringify({
 source:'compiled-fixtures-not-played-campaign',installedMoves:TEST_LIBRARY.length,
 allKantoSpecies:151,regularCampaignSpecies:150,
 exceptions,restoredLearnsets:restored,
 sourceTables:['FRLG','HGSS','B2W2','LetsGo'],species:speciesRows
},null,2)+'\n');
console.log('PASS_T08_151_SIGNATURE_ULT_227',JSON.stringify({
 species:151,campaignSpecies:150,installed:TEST_LIBRARY.length,verifiedSignatureUlts:previewSignatures,
 exceptions,levelsChecked:checkedLevels,missingOrDuplicateSlots:badSlots.length,
 weakLevel50Ultimate:unbalanced.length,restoredGen45LetsGoLevelUps:restored.length,
 examples:samples,source:'compiled-fixtures; not physical Android'
}));
