import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FIRST_APPROVED_HOTSPOTS,firstApprovedHotspots,firstApprovedDestination} from '../tools/pokearena/torre2-approved-map-first-scenes.js';
import {openingClickGuidePlan,OPENING_CLICK_GUIDES} from '../tools/pokearena/torre2-opening-click-guides.js';
import {FOREST_BUG_CATCHERS,forestBugCatcher} from '../tools/pokearena/torre2-opening-trainer-rosters.js';
import {openingNpcPlan} from '../tools/pokearena/torre2-opening-npc-overlays.js';
import {approvedMap,APPROVED_MAPS_ATLAS,USER_OPENING_MAPS} from '../tools/pokearena/torre2-approved-maps-atlas.js';
import {planApprovedMapOverlays} from '../tools/pokearena/torre2-approved-map-renderer.js';

test('T91: user-approved door positions align with glass doors, not sidewalk/roofs',()=>{
 const pixel=(id,action)=>{const h=FIRST_APPROVED_HOTSPOTS[id].find(x=>x.id===action);assert.ok(h,id+':'+action);return{x:h.cx*1536,y:h.cy*864,w:h.w*1536,h:h.h*864}};
 const pallet=pixel('pallet-town','center'),pc=pixel('viridian-city','center'),mart=pixel('viridian-city','mart');
 assert.ok(Math.abs(pallet.x-764)<12&&Math.abs(pallet.y-614)<16,JSON.stringify(pallet));
 assert.ok(Math.abs(pc.x-757)<12&&Math.abs(pc.y-666)<15,JSON.stringify(pc));
 assert.ok(Math.abs(mart.x-1135)<12&&Math.abs(mart.y-624)<15,JSON.stringify(mart));
 for(const anchor of [pallet,pc,mart])assert.ok(anchor.w<140&&anchor.h<100,JSON.stringify(anchor));
});
test('T91: all 6 playable maps have non-overlapping original hotspots',()=>{
 for(const id of Object.keys(OPENING_CLICK_GUIDES)){
  const map=approvedMap(id),hotspots=firstApprovedHotspots(map);
  const r=planApprovedMapOverlays({...map,hotspots},{x:0,y:0,width:640,height:360},[]);
  assert.equal(r.ok,true,id+':'+r.reason);
 }
 assert.equal(APPROVED_MAPS_ATLAS.maps.length,60);
 assert.equal(USER_OPENING_MAPS.length,4);
});
test('T91: only actual connected/unlocked exits have arrows; PC and Mart remain clickable',()=>{
 const viridian=openingClickGuidePlan('viridian-city',FIRST_APPROVED_HOTSPOTS['viridian-city'],(_a,b)=>b!=='gym-giovanni');
 assert.deepEqual(viridian.map(x=>x.id),['route1','forest','center','mart']);
 assert.equal(viridian.find(x=>x.id==='center').caption,'PC');
 assert.equal(viridian.find(x=>x.id==='mart').caption,'LOJA');
 const pallet=openingClickGuidePlan('pallet-town',FIRST_APPROVED_HOTSPOTS['pallet-town'],()=>true);
 assert.deepEqual(pallet.map(x=>x.id),['route1','center']);
 const pewter=openingClickGuidePlan('pewter-city',FIRST_APPROVED_HOTSPOTS['pewter-city'],(_a,b)=>b!=='route-3');
 assert.ok(!pewter.some(x=>x.id==='route3'));
 assert.equal(firstApprovedDestination('viridian-city','center'),null);
 assert.equal(firstApprovedDestination('viridian-city','mart'),null);
 assert.deepEqual(openingClickGuidePlan('cerulean-city',FIRST_APPROVED_HOTSPOTS['cerulean-city'],()=>true),[]);
});
test('T91: five Forest Bug Catchers use legitimate bug-type Pokémon, never rivals/Rocket',()=>{
 const bugs=openingNpcPlan('viridian-forest',{cleanPlate:true,stage:0});
 assert.equal(bugs.length,5);
 assert.deepEqual(bugs.map(x=>x.index),[0,1,2,3,4]);
 assert.deepEqual(FOREST_BUG_CATCHERS.map(x=>x.species),['caterpie','weedle','metapod','kakuna','caterpie']);
 for(let i=0;i<5;i++){
  assert.equal(forestBugCatcher(0,i)?.id,bugs[i].id);
  assert.match(forestBugCatcher(0,i)?.name,/Caça-Insetos/);
 }
 assert.equal(forestBugCatcher(0,5),null);
 assert.equal(forestBugCatcher(1,0),null);
 const core=readFileSync('tools/pokearena/torre2-campaign-core.js','utf8');
 assert.match(core,/const bugCatcher=!leader\?forestBugCatcher\(s\.stage,s\.trainer\):null/);
 assert.match(core,/const role=leader\?'leader':bugCatcher\?'trainer':node\.type/);
 assert.match(core,/const baseSpecies=bugCatcher\?bugCatcher\.species/);
 assert.match(core,/const species=leader\|\|bugCatcher\?baseSpecies:/);
 assert.doesNotMatch(readFileSync('tools/pokearena/torre2-opening-click-guides.js','utf8'),/saveCampaign\(/);
});
test('T91: overlays are drawn under original clickable zones; packages both modules',()=>{
 const renderer=readFileSync('tools/pokearena/torre2-approved-map-renderer.js','utf8');
 const build=readFileSync('tools/pokearena/build-preview.mjs','utf8');
 assert.match(renderer,/renderOpeningClickGuides\(scene,entry,hotspots,rect,isUnlocked\)/);
 assert.match(renderer,/\.setDepth\(45\)\.setInteractive/);
 const guides=readFileSync('tools/pokearena/torre2-opening-click-guides.js','utf8');
 assert.match(guides,/\.setDepth\(33\)/);
 assert.match(build,/torre2-opening-click-guides\.js/);
 assert.match(build,/torre2-opening-trainer-rosters\.js/);
});
