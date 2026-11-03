import {REQUIRED_OPENING_SCENES,OPTIONAL_OPENING_SCENES,REQUIRED_OPENING_CONNECTIONS,missingApprovedOpeningScenes,missingApprovedOpeningConnections,approvedOpeningMapId,openingTravelAllowed} from '../tools/pokearena/torre2-approved-opening.js';
import {readFileSync} from 'node:fs';
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
 assert.equal(hasFirstApprovedHotspots('ss-anne'),true);
 assert.notEqual(firstApprovedHotspots(approvedMap('ss-anne')),approvedMap('ss-anne').hotspots);
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

test('T45 actual interactive zones route a click to every Vermilion door and Surge challenge',()=>{
 for(const [id,expected] of [
  ['vermilion-city',['center','mart','gym','ship','route6','route11']],
  ['gym-surge',['challenge','exit']]
 ]){
  const {scene,zones}=fakeScene(),events=[];
  const screen=renderApprovedMap(scene,id,{
   resolveHotspots:firstApprovedHotspots,artNavigation:true,
   isUnlocked:()=>true,
   onHotspot:(source,spot)=>events.push(source+':'+spot)
  });
  assert.equal(screen.ok,true,id);
  assert.equal(screen.zones.length,expected.length,id);
  for(const spot of expected){
   const z=zones.find(x=>x.data?.value===id+':'+spot);
   assert.ok(z,id+' missing '+spot);
   let propagationStopped=false;
   z.pointerdown(null,0,0,{stopPropagation(){propagationStopped=true;}});
   assert.equal(propagationStopped,true,id+':'+spot);
  }
  assert.deepEqual(events,expected.map(x=>id+':'+x));
  assert.equal(zones.filter(x=>x.data?.key==='torre2-approved-route').length,0);
 }
});

test('T46 S.S. Anne exits through the original Vermilion City artwork without an HM requirement',()=>{
 const id='ss-anne',entry=approvedMap(id);
 const spots=firstApprovedHotspots(entry);
 assert.deepEqual(spots.map(s=>s.id),['exit']);
 assert.equal(firstApprovedDestination(id,'exit'),'vermilion-city');
 assert.equal(firstApprovedDestination(id,'captain'),null);
 assert.ok(approvedMapNeighbours(id).includes('vermilion-city'));
 assert.equal(entry.image,'assets/ui/kanto-approved-maps/kanto/ss-anne.webp');
 // Actual approved 1280x720 image has VERMILION CITY bottom-center.
 assert.deepEqual(spots.map(s=>[s.cx,s.cy,s.w,s.h]),[[.48,.91,.22,.12]]);
 const plan=planApprovedMapOverlays({...entry,hotspots:spots},rect,[]);
 assert.equal(plan.ok,true);
 assert.equal(plan.hotspots.length,1);
 assert.equal(plan.navTargets.length,0);
 const {scene,zones}=fakeScene(),events=[];
 const view=renderApprovedMap(scene,id,{
  resolveHotspots:firstApprovedHotspots,artNavigation:true,
  isUnlocked:()=>true,onHotspot:(map,spot)=>events.push([map,spot])
 });
 assert.equal(view.ok,true);
 const exit=zones.find(z=>z.data?.value==='ss-anne:exit');
 assert.ok(exit,'Missing clickable ship exit');
 exit.pointerdown(null,0,0,{stopPropagation(){}});
 assert.deepEqual(events,[['ss-anne','exit']]);
 assert.equal(zones.some(z=>z.data?.value==='ss-anne:captain'),false);
});

test('T47 approved cities open by default only after verified textures, preserve route actions',()=>{
 const source=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 assert.match(source,/const desiredMap=resume\?\.id\|\|APPROVED_STAGE_MAPS\[state\.stage\]/);
 assert.match(source,/hasFirstApprovedHotspots\(desiredMap\)/);
 assert.match(source,/this\.textures\.exists\(mapTextureKey\(desiredMap\)\)/);
 assert.match(source,/!battleReport&&APPROVED_MAP_ASSETS_READY/);
 assert.match(source,/if\(!resumed\)this\.renderCampaign\(state/);
 const renderer=readFileSync('tools/pokearena/torre2-approved-map-renderer.js','utf8');
 assert.match(renderer,/entry\.type==='cidade'\?'ROTAS':'VOLTAR'/);
});

test('T48 Celadon click zones follow approved city doors and stay inside frame',()=>{
 const city=approvedMap('celadon-city'),spots=firstApprovedHotspots(city);
 assert.ok(city&&hasFirstApprovedHotspots(city.id));
 assert.deepEqual(spots.map(h=>h.id),['center','mart','gym','game','route16','route7']);
 const plan=planApprovedMapOverlays({...city,hotspots:spots},rect,[]);
 assert.equal(plan.ok,true,JSON.stringify(plan));
 assert.equal(plan.hotspots.length,6);
 assert.equal(plan.navTargets.length,0);
 for(const [id,to] of Object.entries({
  gym:'gym-erika',game:'rocket-hideout',
  route16:'routes-16-18',route7:'routes-7-8'
 })){
  assert.equal(firstApprovedDestination(city.id,id),to);
  assert.ok(approvedMapNeighbours(city.id).includes(to),id);
 }
 const {scene,zones}=fakeScene(),hits=[];
 const view=renderApprovedMap(scene,city.id,{
  resolveHotspots:firstApprovedHotspots,artNavigation:true,
  isUnlocked:()=>true,onHotspot:(src,id)=>hits.push(src+':'+id)
 });
 assert.equal(view.ok,true);
 for(const id of spots.map(h=>h.id)){
  const zone=zones.find(z=>z.data?.value==='celadon-city:'+id);
  assert.ok(zone,id);
  zone.pointerdown(null,0,0,{stopPropagation(){}});
 }
 assert.deepEqual(hits,spots.map(h=>'celadon-city:'+h.id));
});

test('T48 Erika four existing gym trainer indices, no new story rewards',()=>{
 const gym=approvedMap('gym-erika'),spots=firstApprovedHotspots(gym);
 const plan=planApprovedMapOverlays({...gym,hotspots:spots},rect,[]);
 assert.equal(plan.ok,true,JSON.stringify(plan));
 assert.deepEqual(spots.map(h=>h.id),['challenge','exit']);
 assert.equal(firstApprovedDestination('gym-erika','exit'),'celadon-city');
 const actors=firstApprovedGymActors('gym-erika',19);
 assert.equal(actors.stage,3);
 assert.equal(actors.artworkOnly,false);
 assert.equal(actors.leader.kind,'erika');
 assert.equal(actors.ace.dex,'0045');
 assert.deepEqual(actors.trainers.map(t=>t.index),[15,16,17,18]);
 for(const t of actors.trainers){
  assert.ok(t.cx>.10&&t.cx<.90&&t.cy>.28&&t.cy<.78);
  for(const h of spots){
   assert.ok(Math.abs(t.cx-h.cx)>=(h.w+.06)/2||
             Math.abs(t.cy-h.cy)>=(h.h+.12)/2,'Trainer blocked '+h.id);
  }
 }
 assert.throws(()=>firstApprovedGymActors('gym-erika',17),RangeError);
});

test('T49 Fuchsia approved city has seven precise taps and registered geographic neighbors',()=>{
 const city=approvedMap('fuchsia-city'),hotspots=firstApprovedHotspots(city);
 assert.equal(hasFirstApprovedHotspots(city.id),true);
 assert.deepEqual(hotspots.map(h=>h.id),[
  'center','mart','gym','safari','route18','route15','route19'
 ]);
 const preflight=planApprovedMapOverlays({...city,hotspots},rect,[]);
 assert.equal(preflight.ok,true,JSON.stringify(preflight));
 assert.equal(preflight.hotspots.length,7);
 assert.equal(preflight.navTargets.length,0);
 for(const [id,target] of Object.entries({
  gym:'gym-koga',safari:'safari-zone',
  route18:'routes-16-18',route15:'routes-12-15',
  route19:'routes-19-20'
 })){
  assert.equal(firstApprovedDestination(city.id,id),target);
  assert.ok(approvedMapNeighbours(city.id).includes(target),city.id+':'+id);
 }
 // Route 19 is not accessible during the gym's stage 4: it unlocks later.
 assert.ok(approvedMap('routes-19-20').index>31);
 const {scene,zones}=fakeScene(),events=[];
 const result=renderApprovedMap(scene,city.id,{
  resolveHotspots:firstApprovedHotspots,artNavigation:true,
  isUnlocked:()=>true,
  onHotspot:(src,id)=>events.push(src+':'+id)
 });
 assert.equal(result.ok,true);
 for(const spot of hotspots){
  const hit=zones.find(z=>z.data?.value==='fuchsia-city:'+spot.id);
  assert.ok(hit,spot.id+' missing clickable zone');
  let stopped=false;
  hit.pointerdown(null,0,0,{stopPropagation(){stopped=true;}});
  assert.equal(stopped,true);
 }
 assert.deepEqual(events,hotspots.map(h=>city.id+':'+h.id));
});

test('T49 Koga places four native trainer checks on dry platforms and retains leader challenge',()=>{
 const gym=approvedMap('gym-koga');
 const hotspots=firstApprovedHotspots(gym);
 assert.equal(hasFirstApprovedHotspots(gym.id),true);
 assert.deepEqual(hotspots.map(h=>h.id),['challenge','exit']);
 const plan=planApprovedMapOverlays({...gym,hotspots},rect,[]);
 assert.equal(plan.ok,true,JSON.stringify(plan));
 assert.equal(plan.navTargets.length,0);
 assert.equal(firstApprovedDestination(gym.id,'exit'),'fuchsia-city');
 const actors=firstApprovedGymActors(gym.id,21);
 assert.equal(actors.stage,4);
 assert.equal(actors.artworkOnly,false);
 assert.equal(actors.leader.kind,'koga');
 assert.equal(actors.ace.dex,'0110');
 assert.deepEqual(actors.trainers.map(t=>t.index),[17,18,19,20]);
 const platforms=[[.265,.400],[.737,.400],[.267,.763],[.736,.763]];
 actors.trainers.forEach((npc,i)=>{
  assert.ok(Math.abs(npc.cx-platforms[i][0])<.005);
  assert.ok(Math.abs(npc.cy-platforms[i][1])<.005);
  for(const h of hotspots)
   assert.ok(Math.abs(npc.cx-h.cx)>=(h.w+.060)/2||
             Math.abs(npc.cy-h.cy)>=(h.h+.11)/2,
             'Trainer overlapping '+h.id);
 });
 assert.throws(()=>firstApprovedGymActors(gym.id,19),RangeError);
 const {scene,zones}=fakeScene(),hits=[];
 const result=renderApprovedMap(scene,gym.id,{
  resolveHotspots:firstApprovedHotspots,artNavigation:true,
  isUnlocked:()=>true,onHotspot:(src,id)=>hits.push(id)
 });
 assert.equal(result.ok,true);
 for(const id of ['challenge','exit']){
  let z=zones.find(x=>x.data?.value==='gym-koga:'+id);
  assert.ok(z,id);
  z.pointerdown(null,0,0,{stopPropagation(){}});
 }
 assert.deepEqual(hits,['challenge','exit']);
});

test('T49 Safari Zone retains original art, touches the real Fuchsia exit, no invented HM',()=>{
 const entry=approvedMap('safari-zone'),hotspots=firstApprovedHotspots(entry);
 assert.equal(hasFirstApprovedHotspots(entry.id),true);
 assert.deepEqual(hotspots.map(h=>h.id),['exit']);
 assert.equal(firstApprovedDestination(entry.id,'exit'),'fuchsia-city');
 assert.equal(firstApprovedDestination(entry.id,'hm03'),null);
 assert.equal(firstApprovedDestination(entry.id,'gold-teeth'),null);
 assert.ok(approvedMapNeighbours(entry.id).includes('fuchsia-city'));
 const plan=planApprovedMapOverlays({...entry,hotspots},rect,[]);
 assert.equal(plan.ok,true,JSON.stringify(plan));
 assert.equal(plan.hotspots.length,1);
 const {scene,zones}=fakeScene(),calls=[];
 const result=renderApprovedMap(scene,entry.id,{
  resolveHotspots:firstApprovedHotspots,artNavigation:true,isUnlocked:()=>true,
  onHotspot:(src,id)=>calls.push(src+':'+id)
 });
 assert.equal(result.ok,true);
 const exit=zones.find(x=>x.data?.value==='safari-zone:exit');
 assert.ok(exit);
 exit.pointerdown(null,0,0,{stopPropagation(){}});
 assert.deepEqual(calls,['safari-zone:exit']);
});


test('T50 image-backed Kanto must begin at Pallet; Route 22 is optional',()=>{
 assert.deepEqual(REQUIRED_OPENING_SCENES,[
  'pallet-town','route-1','viridian-city','route-2',
  'viridian-forest','pewter-city']);
 assert.deepEqual(OPTIONAL_OPENING_SCENES,['route-22']);
 const available=new Set(['route-2','pewter-city']);
 const findMap=id=>available.has(id)?{id}:null;
 const reviewed=id=>available.has(id);
 assert.deepEqual(missingApprovedOpeningScenes(findMap,reviewed),[
  'pallet-town','route-1','viridian-city','viridian-forest']);
 assert.equal(approvedOpeningMapId(findMap,reviewed),null);
 available.add('pallet-town');available.add('route-1');
 available.add('viridian-city');available.add('viridian-forest');
 assert.equal(approvedOpeningMapId(findMap,()=>false),null);
 // Merely having six images no longer suffices. Route exits must exist.
 assert.equal(approvedOpeningMapId(findMap,reviewed),null);
 const routes=new Map(REQUIRED_OPENING_SCENES.map(id=>[id,[]]));
 const spots=new Map(REQUIRED_OPENING_SCENES.map(id=>[id,[]]));
 const destinations=new Map();
 for(const [from,to] of REQUIRED_OPENING_CONNECTIONS){
  routes.get(from).push(to);routes.get(to).push(from);
  for(const [src,dst] of [[from,to],[to,from]]){
   const key='exit-'+dst;
   spots.get(src).push({id:key});
   destinations.set(src+':'+key,dst);
  }
 }
 const hotspotResolver=entry=>spots.get(entry.id)||[];
 const destination=(src,key)=>destinations.get(src+':'+key)||null;
 const neighbors=id=>routes.get(id)||[];
 assert.equal(missingApprovedOpeningConnections(findMap,hotspotResolver,destination,neighbors).length,0);
 assert.equal(approvedOpeningMapId(findMap,reviewed,hotspotResolver,destination,neighbors),'pallet-town');
 assert.equal(openingTravelAllowed('pallet-town','route-1',findMap,neighbors),true);
 assert.equal(openingTravelAllowed('pallet-town','pewter-city',findMap,neighbors),false);
 assert.equal(openingTravelAllowed('viridian-city','route-22',findMap,neighbors),false);
 assert.equal(openingTravelAllowed('viridian-city','route-2',findMap,neighbors),true);
 const removed=destinations.get('route-2:exit-viridian-forest');
 destinations.delete('route-2:exit-viridian-forest');
 assert.deepEqual(missingApprovedOpeningConnections(findMap,hotspotResolver,destination,neighbors),
  ['route-2<->viridian-forest']);
 assert.equal(approvedOpeningMapId(findMap,reviewed,hotspotResolver,destination,neighbors),null);
 destinations.set('route-2:exit-viridian-forest',removed);
 assert.throws(()=>approvedOpeningMapId(null,reviewed),TypeError);
});

test('T50 no stage-0 Pewter shortcut, no premature texture load or map button',()=>{
 const source=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 assert.ok(source.includes("APPROVED_STAGE_MAPS=[approvedOpeningMapId(approvedMap,hasFirstApprovedHotspots,"));
 assert.ok(source.includes("firstApprovedHotspots,firstApprovedDestination,approvedMapNeighbours),'cerulean-city'"));
 assert.ok(source.includes('if(openingMap)preloadApprovedMap(this,openingMap)'));
 assert.ok(source.includes('if(state?.stage===0&&!APPROVED_STAGE_MAPS[0])return false'));
 assert.ok(source.includes('APPROVED_MAP_ASSETS_READY&&APPROVED_STAGE_MAPS[state.stage]?'));
 assert.ok(!source.includes("APPROVED_STAGE_MAPS=['pewter-city'"));
 assert.ok(!source.includes("APPROVED_STAGE_MAPS[state?.stage]||'pewter-city'"));
});

test('T52 approved Route 2 preserves its original north/south sign positions',()=>{
 const entry=approvedMap('route-2'),spots=firstApprovedHotspots(entry);
 assert.ok(entry);
 assert.equal(hasFirstApprovedHotspots('route-2'),true);
 assert.deepEqual(spots.map(x=>x.id),['pewter','forest']);
 assert.deepEqual(spots.map(x=>[x.cx,x.cy,x.w,x.h]),[
  [.546,.069,.145,.122],[.480,.932,.175,.118]
 ]);
 const plan=planApprovedMapOverlays({...entry,hotspots:spots},rect,[]);
 assert.equal(plan.ok,true,JSON.stringify(plan));
 assert.equal(plan.hotspots.length,2);
 assert.equal(plan.navTargets.length,0);
 assert.equal(firstApprovedDestination('route-2','pewter'),'pewter-city');
 assert.ok(approvedMapNeighbours('route-2').includes('pewter-city'));
 // No fake Viridian Forest or Diglett's Cave map is created.
 assert.equal(approvedMap('viridian-forest'),null);
 assert.equal(firstApprovedDestination('route-2','forest'),null);
 assert.equal(firstApprovedDestination('route-2','diglett-cave'),null);
 const {scene,zones}=fakeScene(),calls=[];
 const view=renderApprovedMap(scene,'route-2',{
  resolveHotspots:firstApprovedHotspots,artNavigation:true,
  isUnlocked:()=>true,onHotspot:(map,id)=>calls.push(map+':'+id)
 });
 assert.equal(view.ok,true);
 for(const hotspot of spots){
  const hit=zones.find(z=>z.data?.value==='route-2:'+hotspot.id);
  assert.ok(hit,'missing native click target '+hotspot.id);
  let propagationStopped=false;
  hit.pointerdown(null,0,0,{stopPropagation(){propagationStopped=true}});
  assert.equal(propagationStopped,true);
 }
 assert.deepEqual(calls,['route-2:pewter','route-2:forest']);
 assert.equal(zones.some(z=>String(z.data?.value||'').includes('diglett')),false);
});

test('T53 stage-zero browser code cannot substitute catalog indices for route adjacency',()=>{
 const source=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 assert.ok(source.includes('firstApprovedHotspots,firstApprovedDestination,approvedMapNeighbours)'));
 assert.ok(source.includes('if(s===0)return !!APPROVED_STAGE_MAPS[0]&&'));
 assert.ok(source.includes('openingTravelAllowed(_src,target,approvedMap,approvedMapNeighbours)'));
});
