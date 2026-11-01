import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// Campaign core's imports are renamed only in the Phaser build; extract
// its exported immutable data definitions without invoking missing build-only imports.
const rawCore=readFileSync(new URL('../tools/pokearena/torre2-campaign-core.js',import.meta.url),'utf8');
const begin=rawCore.indexOf('export const GYMS=Object.freeze([');
const marker='export const STAGES=Object.freeze([...GYMS,...ELITE]);';
const end=rawCore.indexOf(marker,begin);
assert.ok(begin>=0&&end>begin,'real Kanto GYMS/ELITE stage definitions must exist');
const policy=rawCore.slice(begin,end+marker.length);
const {GYMS,STAGES}=await import('data:text/javascript,'+encodeURIComponent(policy));
const count=rawCore.match(/export const TRAINERS_PER_GYM=stage=>([^;]+);/);
assert.ok(count,'actual trainer-count policy present');
const TRAINERS_PER_GYM=stage=>stage<8?13+stage*2:stage===8?17:0;
assert.equal(count[1], 'stage<8?13+stage*2:stage===8?17:0'.replace(/^stage=>/,''));
import {
 ATLAS_UI_VERSION,ATLAS_GYM_THEMES,ATLAS_LEAGUE_BIOMES,
 atlasGymModel,atlasBadgeModel,atlasShopModel,atlasPanel,atlasGymBackdrop,
 atlasBadgeBackdrop,atlasMartBackdrop,atlasSummaryBackdrop
} from '../tools/pokearena/torre2-atlas-screen-style.js';

test('Atlas: eight current Kanto leaders use real team aces and do not rewrite progress',()=>{
 const original={stage:0,trainer:3,badges:['Rocha'],money:1400,team:[],inventory:{pokeball:5}};
 const frozen=JSON.stringify(original);
 for(let stage=0;stage<8;stage++){
  const state={...original,stage,trainer:Math.max(0,TRAINERS_PER_GYM(stage)-1)};
  const before=JSON.stringify(state);
  const m=atlasGymModel(state,STAGES,TRAINERS_PER_GYM(stage));
  assert.equal(m.leader,GYMS[stage].leader);
  assert.equal(m.boss,GYMS[stage].boss);
  assert.ok(m.team.includes(m.boss));
  assert.equal(m.badge,GYMS[stage].badge);
  assert.equal(m.remaining,1);
  assert.equal(m.ready,false);
  assert.equal(m.isLeague,false);
  assert.equal(m.theme,ATLAS_GYM_THEMES[stage]);
  assert.equal(JSON.stringify(state),before);
 }
 assert.equal(JSON.stringify(original),frozen);
 assert.match(ATLAS_UI_VERSION,/premium/);
});
test('Atlas: blocked gym, leader unlocked, champion and five distinct league rooms',()=>{
 const base={stage:1,trainer:0,champion:false};
 const blocked=atlasGymModel(base,STAGES,TRAINERS_PER_GYM(base.stage));
 assert.equal(blocked.ready,false);
 assert.equal(blocked.remaining,15);
 const ready=atlasGymModel({...base,trainer:15},STAGES,15);
 assert.equal(ready.ready,true);
 assert.equal(ready.remaining,0);
 assert.equal(atlasGymModel({...base,trainer:15,champion:true},STAGES,15).ready,false);
 assert.equal(new Set(ATLAS_LEAGUE_BIOMES.map(t=>t.theme)).size,5);
 for(let stage=8;stage<=12;stage++){
  const m=atlasGymModel({stage,trainer:0},STAGES,TRAINERS_PER_GYM(stage));
  assert.ok(m.isLeague);
  assert.equal(m.badge,null);
  assert.equal(m.theme,ATLAS_LEAGUE_BIOMES[stage-8].theme);
  assert.equal(m.leader,STAGES[stage].leader);
 }
 assert.equal(atlasGymModel({stage:13},STAGES,0),null);
});
test('Atlas: eight badges reflect actual save only',()=>{
 const b=atlasBadgeModel({badges:['Rocha','Cascata']},GYMS);
 assert.equal(b.length,8);
 assert.deepEqual(b.filter(x=>x.earned).map(x=>x.badge),['Rocha','Cascata']);
 assert.equal(b[0].boss,'onix');
 assert.equal(b[7].boss,'rhyhorn');
});
test('Atlas: Mart display never creates items or changes wallet',()=>{
 const s={money:350,inventory:{pokeball:4}};
 const a=JSON.stringify(s),items=[
  {id:'pokeball',name:'Poké Ball',price:200},
  {id:'greatball',name:'Great Ball',price:600},
  {id:'tm-test',name:'Locked',price:500,available:false}
 ];
 const m=atlasShopModel(s,items,0);
 assert.equal(m.rows.length,2);
 assert.equal(m.rows[0].canAfford,true);
 assert.equal(m.rows[1].canAfford,false);
 assert.equal(m.money,350);
 assert.equal(JSON.stringify(s),a);
});
test('Atlas: native Graphics draws rooms, shop, badges and summary without input or timer',()=>{
 const drawn=[];
 const gfx={fillStyle(color,alpha){assert.ok(Number.isInteger(color));return this},
 fillRect(x,y,w,h){assert.ok([x,y,w,h].every(Number.isFinite));assert.ok(w>0&&h>0);drawn.push([x,y,w,h]);return this;}};
 const scene={add:{graphics(){return{...gfx,setDepth(n){assert.equal(n,1);return this}}}}};
 for(const stage of [0,1,8,9,10,11,12]){
  const model=atlasGymModel({stage,trainer:0},STAGES,TRAINERS_PER_GYM(stage));
  atlasGymBackdrop(scene,model);
 }
 atlasBadgeBackdrop(scene,2);
 atlasMartBackdrop(scene,0);
 atlasSummaryBackdrop(scene);
 atlasPanel(gfx,15,15,200,120);
 assert.ok(drawn.length>1200);
});

test('Atlas: League identities have distinct ROOM geometry, not palette-only recolors',()=>{
 const signatures=new Set();
 for(let stage=8;stage<=12;stage++){
  const shapes=[];
  const g={fillStyle(){return this},fillRect(x,y,w,h){shapes.push([x,y,w,h].join(','));return this}};
  const scene={add:{graphics(){return{...g,setDepth(){return this}}}}};
  const model=atlasGymModel({stage,trainer:0},STAGES,TRAINERS_PER_GYM(stage));
  atlasGymBackdrop(scene,model);
  const fingerprint=shapes.join('|');
  assert.ok(!signatures.has(fingerprint),'League rooms cannot be the same layout');
  signatures.add(fingerprint);
 }
 assert.equal(signatures.size,5);
});
