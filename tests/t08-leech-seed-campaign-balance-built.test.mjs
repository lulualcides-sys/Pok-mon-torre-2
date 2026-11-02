/* Leech Seed: keep the native P2 VFX and original Arena kit untouched.
 * In the campaign-only loadout, heal cannot exceed HP actually drained.
 * Verifies native 3/s x 6s x1.5 vs campaign <=2/s x5s x1.
 * Compiled Phaser modules; fixtures are not a full manual campaign.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const {TEST_LIBRARY,availableMoves,resolveLoadout,balanceCampaignLeechSeed,
 KANTO_CAMPAIGN_LEECH_SEED}=await import(pathToFileURL(
 path.join(root,modules,'torre2/move-pool.js')).href);
const original=TEST_LIBRARY.find(m=>m.id==='leech-seed');
assert.ok(original?.drenaje?.dps,'Native P2 Leech Seed is missing');
const originalSnapshot=JSON.stringify(original);
assert.deepEqual({
 dps:original.drenaje.dps,dur:original.drenaje.dur,
 cura:original.drenaje.cura
},{dps:3,dur:6,cura:1.5},'Unexpected native baseline: audit before adjusting');
assert.deepEqual(KANTO_CAMPAIGN_LEECH_SEED,{dps:2,dur:5,cura:1});
const preview=balanceCampaignLeechSeed(original);
assert.deepEqual(preview.drenaje,{...original.drenaje,...KANTO_CAMPAIGN_LEECH_SEED});
assert.notEqual(preview,original,'Campaign-only copy must be new');
assert.notEqual(preview.drenaje,original.drenaje,'No shared status configuration');
for(const key of ['id','nombre','forma','rafaga','abanico','dano','coste','cd','revienta'])
 assert.deepEqual(preview[key],original[key],key+' native attack metadata changed');
assert.equal(JSON.stringify(original),originalSnapshot,'Modified native library in memory');
assert.equal(balanceCampaignLeechSeed(preview).drenaje.cura,1,'Patch not idempotent');
const other=TEST_LIBRARY.find(m=>m.id==='absorb');
assert.equal(balanceCampaignLeechSeed(other),other,'Other healing moves must stay unchanged');
const make=(id,level)=>({id,progression:{species:id,level},tmMoves:[]});
let checked=0;
for(const id of ['bulbasaur','ivysaur','venusaur']){
 for(const level of [5,8,13,20,30,50]){
  const member=make(id,level),kit=resolveLoadout(member);
  const active=['lmb','rmb','q','e'].map(slot=>kit[slot]).filter(Boolean);
  for(const move of active){
   if((move.torre2IntroSource||move.nombre)?.toLowerCase().replace(/[^a-z0-9]+/g,'-')!=='leech-seed')
    continue;
   assert.deepEqual(move.drenaje,{...original.drenaje,...KANTO_CAMPAIGN_LEECH_SEED},
    id+' Lv'+level+' has unbalanced Leech Seed');
   checked++;
  }
  // Move selection and original full power remain separate; never mutate
  // the editor's availableMoves or the captured native VFX.
  for(const move of availableMoves(member).filter(m=>m.id==='leech-seed'))
   assert.deepEqual(move.drenaje,original.drenaje,
    id+' Lv'+level+' leaked campaign scaling into editor/native catalogue');
 }
}
assert.ok(checked>=2,'No Lv5/Lv8 campaign Leech Seed was actually checked');
const beforeHealing=3*6*1.5,afterHealing=2*5*1;
assert.equal(beforeHealing,27);
assert.equal(afterHealing,10);
assert.ok(afterHealing<beforeHealing/2,'Campaign healing reduction too small');
console.log('PASS_T08_CAMPAIGN_LEECH_SEED_BALANCE',JSON.stringify({
 originalHealing:beforeHealing,campaignHealing:afterHealing,
 reductionPct:Math.round((1-afterHealing/beforeHealing)*100),
 originalVfxPreserved:true,checkedBattleSlots:checked
}));
