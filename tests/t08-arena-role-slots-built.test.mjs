/* Native Arena 2D role contract across every Kanto species and level.
 * LMB = weak damaging basic, RMB/Q = normal moves, E = charged ULT.
 * No approved VFX, original Arena/VS modes, or stored move choices changed.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const load=p=>import(pathToFileURL(path.join(root,modules,p)).href);
const [{KANTO_151},{availableMoves,selectedMoves,defaultLoadout,resolveLoadout,
 equipMove,TEST_LIBRARY,canonicalMoveKey,isCampaignUltimateOnlyMove,
 campaignMoveSlotReason}]=await Promise.all([
 load('torre2/all-kanto-species.js'),load('torre2/move-pool.js')]);
const make=(id,level)=>({id,progression:{species:id,level},tmMoves:[]});
assert.equal(KANTO_151.length,151);
assert.ok(TEST_LIBRARY.length>=227,'The user-approved baseline library cannot shrink');
const bad=[],examples={},checkpoints=[5,8,11,13,16,20,30,40,50];
let checked=0,blockedStrong=0,legalE=0;
for(const {id} of KANTO_151){
 if(id==='mewtwo')continue;
 for(const level of checkpoints){
  const member=make(id,level),kit=resolveLoadout(member),
   chosen=selectedMoves(member),pool=availableMoves(member);
  for(const [slot,key] of ['lmb','rmb','q','e'].entries()){
   const move=kit[key];
   if(!move&&key==='e'&&level<8)continue;
   if(!move){bad.push([id,level,key,'missing']);continue;}
   const reason=campaignMoveSlotReason(member,slot,move);
   if(reason)bad.push([id,level,key,move.id,reason]);
   if(slot!==3&&move.ulti)bad.push([id,level,key,'non-ULT marked as ULT']);
   if(slot===0&&Number(move.dano)>9)
    bad.push([id,level,key,'basic damage',move.id,move.dano]);
   if((slot===1||slot===2)&&isCampaignUltimateOnlyMove(move))
    bad.push([id,level,key,'strong move in HAB',move.id]);
  }
  const distinct=['lmb','rmb','q','e'].map(k=>kit[k]?.id).filter(Boolean);
  if(new Set(distinct).size!==distinct.length)
   bad.push([id,level,'duplicate',distinct]);
  if(level>=13){
   const powerful=pool.find(m=>!m.torre2IntroPractice&&
    isCampaignUltimateOnlyMove(m)&&m.forma);
   if(powerful){
    assert.ok(campaignMoveSlotReason(member,1,powerful),
     id+' could use '+powerful.id+' in HAB2');
    assert.ok(campaignMoveSlotReason(member,2,powerful),
     id+' could use '+powerful.id+' in HAB3');
    const source=JSON.stringify(member);
    assert.equal(equipMove(member,1,powerful.id),false,
     id+' let ULT into HAB2');
    assert.equal(equipMove(member,2,powerful.id),false,
     id+' let ULT into HAB3');
    assert.equal(JSON.stringify(member),source,'Rejected equip mutated saved member');
    blockedStrong+=2;
    if(!campaignMoveSlotReason(member,3,powerful))legalE++;
   }
  }
  if(['ivysaur','nidoran-f','nidoran-m','squirtle'].includes(id)&&
    [11,13,16].includes(level))
   examples[id+'-'+level]={slots:['lmb','rmb','q','e'].map(k=>kit[k]?.nombre),
    library:pool.map(m=>m.id),chosen};
  checked++;
 }
}
assert.deepEqual(bad.slice(0,15),[],'Unsafe Kanto roles: '+JSON.stringify(bad.slice(0,20)));
assert.ok(blockedStrong>100,'No strong learned moves were challenged');
for(const [species,signature] of [['porygon','tri-attack'],
 ['dugtrio','tri-attack']]){
 const member=make(species,70),kit=resolveLoadout(member);
 assert.equal(kit.e?.id,signature,
  species+' must default to its learned approved characteristic ULT on E');
 assert.ok(!['lmb','rmb','q'].some(key=>kit[key]?.id===signature),
  species+' must not expose a charged characteristic ULT as a normal HAB');
}
// Gengar has TWO valid, approved thematic finishers. The existing runtime
// selects Sludge Bomb by default, while Shadow Ball remains an E option.
// Never rewrite an approved saved/default loadout to satisfy a test fixture.
const gengar=make('gengar',70),gengarKit=resolveLoadout(gengar);
const shadow=availableMoves(gengar).find(m=>m.id==='shadow-ball');
assert.ok(shadow?.forma,'Gengar lost approved Shadow Ball VFX');
assert.equal(campaignMoveSlotReason(gengar,3,shadow),null,
 'Gengar must be allowed to equip Shadow Ball on E');
assert.ok(campaignMoveSlotReason(gengar,1,shadow),
 'Shadow Ball must not enter a normal HAB');
assert.ok(campaignMoveSlotReason(gengar,2,shadow),
 'Shadow Ball must not enter a normal HAB');
assert.equal(gengarKit.e?.id,'sludge-bomb',
 'Preserve the currently approved Gengar default Sludge Bomb ULT');
const protect=TEST_LIBRARY.find(m=>m.id==='protect');
assert.ok(protect?.forma,'The approved Protect renderer must remain installed');
assert.equal(isCampaignUltimateOnlyMove(protect),false,
 'Zero-damage FRLG Protect must not be misclassified as charged E-only');
const ivy=make('ivysaur',16);
const ivyPool=availableMoves(ivy);
const ivyUlt=ivyPool.find(m=>m.torre2IntroSlot==='e');
assert.ok(ivyUlt,'Ivysaur E finisher not offered');
assert.equal(campaignMoveSlotReason(ivy,3,ivyUlt),null);
assert.ok(campaignMoveSlotReason(ivy,1,ivyUlt),'ULT must not be in HAB');
assert.equal(equipMove(ivy,3,ivyUlt.id),true,'Ivysaur cannot select available E ULT');
assert.equal(selectedMoves(ivy)[3],ivyUlt.id);
const female=make('nidoran-f',13);
const fPool=availableMoves(female);
const fUlt=fPool.find(m=>m.torre2IntroSlot==='e');
assert.ok(fUlt,'Nidoran♀ has no meter-gated E');
assert.equal(equipMove(female,3,fUlt.id),true,'Nidoran♀ E cannot be equipped');
// User role policy: no native E metadata, high damage or stale save may
// turn any Punch or Flamethrower into a campaign charged ULT.
const normalAbility=m=>/punch$|^(flamethrower|thunderbolt|gust)$/i.test(
 String(m?.torre2IntroSource||m?.nombre||'').replace(/^ULT · /,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,''));
const nativeNormal=TEST_LIBRARY.filter(normalAbility);
assert.ok(nativeNormal.some(m=>/fire.punch/i.test(m.nombre)),
 'Fire Punch renderer is missing');
assert.ok(nativeNormal.some(m=>/ice.punch/i.test(m.nombre)),
 'Ice Punch renderer is missing');
assert.ok(nativeNormal.some(m=>/flamethrower/i.test(m.nombre)),
 'Flamethrower renderer is missing');
assert.ok(nativeNormal.some(m=>/thunderbolt/i.test(m.nombre)),
 'Thunderbolt renderer is missing');
assert.ok(nativeNormal.some(m=>/^gust$/i.test(m.nombre)),
 'Gust renderer is missing');
for(const move of nativeNormal){
 assert.equal(isCampaignUltimateOnlyMove({...move,ulti:true}),false,
  move.nombre+' must remain HAB2/3 despite native E/ulti metadata');
 const m=make('charizard',50);
 assert.ok(campaignMoveSlotReason(m,3,move),
  move.nombre+' is forbidden as ULT E');
 assert.equal(campaignMoveSlotReason(m,1,move),null,
  move.nombre+' must be permitted in HAB2');
 assert.equal(campaignMoveSlotReason(m,2,move),null,
  move.nombre+' must be permitted in HAB3');
 if(['gust','thunderbolt'].includes(canonicalMoveKey(move.nombre)))
  assert.ok(campaignMoveSlotReason(m,0,move),
   move.nombre+' must not be selectable as basic ATK');
}
for(const {id} of KANTO_151){
 if(id==='mewtwo')continue;
 for(const level of [8,13,26,40,50]){
  const member=make(id,level),kit=resolveLoadout(member);
  assert.ok(!normalAbility(kit.e),
   id+' Nv'+level+' illegally generated normal Punch/Flamethrower ULT');
  if(level<13)continue;
  for(const move of availableMoves(member).filter(m=>
   !m.torre2IntroPractice&&normalAbility(m))){
   assert.ok(campaignMoveSlotReason(member,3,move),
    id+' illegally permits '+move.nombre+' in ULT');
   assert.equal(campaignMoveSlotReason(member,1,move),null,
    id+' cannot equip '+move.nombre+' as HAB2');
   assert.equal(campaignMoveSlotReason(member,2,move),null,
    id+' cannot equip '+move.nombre+' as HAB3');
  }
 }
}
// Thunder is reserved for the E ULT, even if imported native metadata
// describes it as a non-ULT or a low-damage attack.
const thunder=TEST_LIBRARY.find(m=>canonicalMoveKey(m.nombre)==='thunder');
assert.ok(thunder?.forma,'Installed Thunder renderer must exist');
assert.equal(isCampaignUltimateOnlyMove({...thunder,ulti:false,dano:2,poder:0}),true,
 'Thunder remains E-only regardless of imported metadata');
const electric=make('zapdos',50);
assert.ok(campaignMoveSlotReason(electric,0,thunder));
assert.ok(campaignMoveSlotReason(electric,1,thunder));
assert.ok(campaignMoveSlotReason(electric,2,thunder));
assert.equal(campaignMoveSlotReason(electric,3,thunder),null);
const lightning=availableMoves(electric).find(m=>canonicalMoveKey(m.nombre)==='thunder');
if(lightning){
 assert.equal(equipMove(electric,1,lightning.id),false,
  'No Thunder may be manually assigned to HAB2');
 assert.equal(equipMove(electric,2,lightning.id),false,
  'No Thunder may be manually assigned to HAB3');
}
// Read-only cleanup: old saves with E=Flamethrower are NOT erased, but the
// live battle refuses that E, choosing another legal ULT where available.
const oldFlame=make('charizard',50);
const learnedFlame=availableMoves(oldFlame).find(normalAbility);
assert.ok(learnedFlame,'Charizard did not learn its regular flamethrower/punch');
oldFlame.moves=[...defaultLoadout(oldFlame)];
oldFlame.moves[3]='flamethrower';
oldFlame.movePlanSpecies='charizard';
const oldFlameSnapshot=JSON.stringify(oldFlame);
assert.notEqual(selectedMoves(oldFlame)[3],'flamethrower',
 'Old E Flamethrower must not be used in the live campaign');
assert.equal(JSON.stringify(oldFlame),oldFlameSnapshot,
 'Loading a legacy E should not rewrite player save choices');
const legacy=make('ivysaur',30);
legacy.moves=['solar-beam','seed-bomb','vine-whip','sleep-powder'];
legacy.movePlanSpecies='ivysaur';
const before=JSON.stringify(legacy);
const cleaned=selectedMoves(legacy);
assert.equal(JSON.stringify(legacy),before,'Reading old slot selections altered save');
const kit=resolveLoadout(legacy);
assert.ok(['lmb','rmb','q'].every(k=>!isCampaignUltimateOnlyMove(kit[k])));
assert.equal(new Set(cleaned.filter(Boolean)).size,cleaned.filter(Boolean).length);
console.log('PASS_T08_ARENA_ROLE_CONTRACT',JSON.stringify({
 species:150,checkpoints,checked,blockedStrong,legalE,
 library:TEST_LIBRARY.length,examples
}));
