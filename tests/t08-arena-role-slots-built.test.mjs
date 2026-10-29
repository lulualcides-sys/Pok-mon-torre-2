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
assert.equal(TEST_LIBRARY.length,227);
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
