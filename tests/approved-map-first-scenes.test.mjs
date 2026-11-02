import test from 'node:test';
import assert from 'node:assert/strict';
import {approvedMap,approvedMapNeighbours} from '../tools/pokearena/torre2-approved-maps-atlas.js';
import {planApprovedMapOverlays,renderApprovedMap} from '../tools/pokearena/torre2-approved-map-renderer.js';
import {firstApprovedHotspots,firstApprovedDestination,hasFirstApprovedHotspots,firstApprovedGymActors} from '../tools/pokearena/torre2-approved-map-first-scenes.js';

const firstMaps=['pewter-city','gym-brock','cerulean-city','gym-misty'];
const rect={x:0,y:0,width:640,height:360};
test('T41 first four approved scenes have bounded and non-overlapping native hotspots',()=>{
 for(const id of firstMaps){
  const entry=approvedMap(id);
  assert.ok(entry,id);
  assert.equal(hasFirstApprovedHotspots(id),true);
  const hotspots=firstApprovedHotspots(entry);
  assert.ok(hotspots.length>=2,id);
  assert.equal(new Set(hotspots.map(h=>h.id)).size,hotspots.length,id);
  const plan=planApprovedMapOverlays({...entry,hotspots},rect,[]);
  assert.equal(plan.ok,true,id+': '+JSON.stringify(plan));
  assert.equal(plan.footerY,null,id);
  assert.equal(plan.navTargets.length,0,id);
  assert.equal(plan.hotspots.length,hotspots.length,id);
 }
});

test('T41 clickable doors and route signs lead only to existing adjacent approved scenes',()=>{
 for(const id of firstMaps){
  for(const h of firstApprovedHotspots(approvedMap(id))){
   const to=firstApprovedDestination(id,h.id);
   if(!to)continue;
   assert.ok(approvedMap(to),id+':'+h.id);
   assert.ok(approvedMapNeighbours(id).includes(to),id+'->'+to);
  }
 }
 assert.equal(firstApprovedDestination('pewter-city','route3'),'route-3');
 assert.equal(firstApprovedDestination('gym-brock','exit'),'pewter-city');
 assert.equal(firstApprovedDestination('gym-misty','exit'),'cerulean-city');
 assert.equal(firstApprovedDestination('cerulean-city','route24'),'route-24');
});

test('T41 catalog is read only; original sixty approved art entries remain unchanged',()=>{
 for(const id of firstMaps){
  assert.equal(approvedMap(id).hotspots.length,0);
  assert.notEqual(firstApprovedHotspots(approvedMap(id)),approvedMap(id).hotspots);
 }
 assert.equal(hasFirstApprovedHotspots('ss-anne'),false);
 assert.equal(firstApprovedHotspots(approvedMap('ss-anne')),approvedMap('ss-anne').hotspots);
});

function fakeScene(){
 const zones=[];
 const box=()=>({setOrigin(){return this},setDepth(){return this},setDisplaySize(){return this},
  setInteractive(){return this},setData(k,v){this.data={key:k,value:v};return this},
  on(evt,cb){this[evt]=cb;return this}});
 const scene={
  textures:{exists:()=>true,get:()=>({getSourceImage:()=>({width:1280,height:720})})},
  add:{image:()=>box(),rectangle:()=>box(),text:()=>box(),
   zone:(...args)=>{let z=box();z.args=args;zones.push(z);return z},
   graphics:()=>({setDepth(){return this},lineStyle(){return this},strokeRect(){return this}})}
 };
 return {scene,zones};
}

test('T41 image hotspots can call native handlers without fake save-state writes',()=>{
 const {scene,zones}=fakeScene(),called=[];
 const view=renderApprovedMap(scene,'pewter-city',{
  isUnlocked:()=>true,
  resolveHotspots:firstApprovedHotspots,
  artNavigation:true,
  onHotspot:(id,h)=>called.push(id+':'+h)
 });
 assert.equal(view.ok,true);
 assert.equal(view.zones.length,5);
 assert.equal(zones.filter(z=>z.data?.key==='torre2-approved-route').length,0);
 const pc=zones.find(z=>z.data?.value==='pewter-city:center');
 assert.ok(pc);
 pc.pointerdown(null,0,0,{stopPropagation(){}});
 assert.deepEqual(called,['pewter-city:center']);
});

test('T41 preflight rejects an unreviewed hotspot before drawing any pixels',()=>{
 const entry={...approvedMap('gym-brock'),hotspots:[
  {id:'bad',cx:1,cy:.3,w:.2,h:.1,validated:'visual'}]};
 const layout=planApprovedMapOverlays(entry,rect,[]);
 assert.equal(layout.ok,false);
 assert.equal(layout.reason,'hotspot-out-of-bounds');
});

test('T43 Brock has 10 route + 3 gym trainers; Misty 11 route + 4 gym, with original checkpoint IDs',()=>{
 const expected=[
  ['gym-brock',0,13,[10,11,12]],
  ['gym-misty',1,15,[11,12,13,14]]
 ];
 for(const [id,stage,total,indices] of expected){
  const layout=firstApprovedGymActors(id,total);
  assert.equal(layout.stage,stage);
  assert.equal(layout.trainers.length,indices.length);
  assert.deepEqual(layout.trainers.map(t=>t.index),indices);
  for(const actor of [layout.leader,layout.ace,...layout.trainers]){
   assert.ok(actor.cx>0&&actor.cx<1&&actor.cy>0&&actor.cy<1);
  }
  // Gym trainers must not steal the clickable door/challenge hitbox.
  const h=firstApprovedHotspots(approvedMap(id));
  for(const npc of layout.trainers){
   for(const hotspot of h){
    const overlap=Math.abs(npc.cx-hotspot.cx)<(hotspot.w+.045)/2&&
     Math.abs(npc.cy-hotspot.cy)<(hotspot.h+.08)/2;
    assert.equal(overlap,false,id+': '+hotspot.id);
   }
  }
 }
 assert.equal(firstApprovedGymActors('ss-anne',13),null);
 assert.throws(()=>firstApprovedGymActors('gym-brock',2),RangeError);
 assert.throws(()=>firstApprovedGymActors('gym-misty',13),RangeError);
 assert.throws(()=>firstApprovedGymActors('gym-brock',15),RangeError);
});

test('T43 pixel art placement: city Mart door and gym actors stay on stone platforms',()=>{
 const cerulean=firstApprovedHotspots(approvedMap('cerulean-city'));
 const shop=cerulean.find(h=>h.id==='mart');
 // Approved 1280x720 city illustration: shop door roughly at (0.495, 0.36).
 assert.ok(Math.abs(shop.cx-.495)<.005);
 assert.ok(Math.abs(shop.cy-.36)<.01);
 const [brock,misty]=[firstApprovedGymActors('gym-brock',13),
                      firstApprovedGymActors('gym-misty',15)];
 for(const gym of [brock,misty]){
  // Leaders and aces occupy the upper central stone platform, not its stairs.
  for(const p of [gym.leader,gym.ace]){
   assert.ok(p.cx>=.44&&p.cx<=.61);
   assert.ok(p.cy>=.18&&p.cy<=.27);
  }
  // The ace stands beside (not over) the leader.
  assert.ok(gym.ace.cx-gym.leader.cx>=.08);
 }
 // Misty's four trainers are centered on the four dry raised platforms.
 const islands=[[.27,.465],[.73,.465],[.27,.695],[.73,.695]];
 misty.trainers.forEach((npc,i)=>{
  assert.ok(Math.abs(npc.cx-islands[i][0])<.01);
  assert.ok(Math.abs(npc.cy-islands[i][1])<.01);
 });
 // Brock's third subchief stands on the lower central path, not on a boulder.
 assert.ok(Math.abs(brock.trainers[2].cx-.5)<.01);
 assert.ok(Math.abs(brock.trainers[2].cy-.72)<.01);
});

test('T45 Vermilion map and Surge gym preserve full art and correct adjacent routes',()=>{
 const city=approvedMap('vermilion-city'),gym=approvedMap('gym-surge');
 assert.ok(city&&gym);
 for(const id of ['vermilion-city','gym-surge']){
  const entry=approvedMap(id),hotspots=firstApprovedHotspots(entry);
  assert.equal(hasFirstApprovedHotspots(id),true);
  const preflight=planApprovedMapOverlays({...entry,hotspots},rect,[]);
  assert.equal(preflight.ok,true,id+': '+JSON.stringify(preflight));
  assert.equal(preflight.hotspots.length,id==='vermilion-city'?6:2);
  assert.equal(preflight.navTargets.length,0);
 }
 for(const [key,target] of Object.entries({
  gym:'gym-surge',ship:'ss-anne',route6:'route-6',route11:'route-11'
 })){
  assert.equal(firstApprovedDestination('vermilion-city',key),target);
  assert.ok(approvedMapNeighbours('vermilion-city').includes(target),
   key+' route must exist in geographic atlas');
 }
 assert.equal(firstApprovedDestination('gym-surge','exit'),'vermilion-city');
});
test('T45 Surge has four clickable ORIGINAL artwork trainers, no added sprite clones',()=>{
 const gym=firstApprovedGymActors('gym-surge',17);
 assert.equal(gym.stage,2);
 assert.equal(gym.artworkOnly,true);
 assert.deepEqual(gym.trainers.map(t=>t.index),[13,14,15,16]);
 assert.deepEqual(gym.trainers.map(t=>t.kind),['youngster','rocker','lass','youngster']);
 for(const t of gym.trainers){
  assert.ok(t.cx>.10&&t.cx<.90&&t.cy>.30&&t.cy<.75);
 }
 assert.throws(()=>firstApprovedGymActors('gym-surge',15),RangeError);
 assert.equal(firstApprovedGymActors('gym-brock',13).artworkOnly,false);
});
