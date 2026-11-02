import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
// Source imports are rewritten only by build-preview.mjs; inspect the real GYMS
// constant without importing unbuilt aliases like './rematch-policy.js'.
const coreSource=fs.readFileSync(new URL('../tools/pokearena/torre2-campaign-core.js',import.meta.url),'utf8');
const gymsLiteral=coreSource.match(/export const GYMS=Object\.freeze\((\[[\s\S]*?\])\);/);
assert.ok(gymsLiteral,'canonical GYMS source must be readable');
const GYMS=JSON.parse(JSON.stringify(vm.runInNewContext('('+gymsLiteral[1]+')',Object.create(null),{timeout:1000})));
assert.match(coreSource,/export const TRAINERS_PER_GYM=stage=>stage<8\?13\+stage\*2/);
import {GYM_ACE_VERSION,gymAcePlan,gymAcePlacement,gymAceVisibleBottomPadding,gymAceVisibleBounds,gymAceSpriteFit,drawGymAce} from '../tools/pokearena/torre2-gym-ace.js';

const expected=['onix','starmie','raichu','vileplume','weezing','alakazam','arcanine','rhyhorn'];
const dex=['0095','0121','0026','0045','0110','0065','0059','0111'];
const manifest=Object.fromEntries(dex.map(id=>[id,{anims:{Idle:{
 file:id+'/Idle-Anim.png',fw:48,fh:52,durations:[6,7,6,7]
}}}]));
test('T35 aces always reflect current GYMS boss, without replacing Giovanni with Nidoking',()=>{
 assert.equal(GYM_ACE_VERSION,'t35-native-idle-v1');
 assert.deepEqual(GYMS.map(x=>x.boss),expected);
 for(let stage=0;stage<8;stage++){
  const plan=gymAcePlan(GYMS,stage,manifest);
  assert.equal(plan.species,GYMS[stage].boss);
  assert.equal(plan.dex,dex[stage]);
  assert.ok(GYMS[stage].leaderTeam.includes(plan.species));
  assert.equal(plan.assetReady,true);
  assert.match(plan.file,/^assets\/pmd\/\d{4}\/Idle-Anim\.png$/);
  assert.equal(13+stage*2,[13,15,17,19,21,23,25,27][stage],'no additional battles');
 }
 assert.equal(gymAcePlan(GYMS,8,manifest),null);
});
test('T35 rejects missing or malformed authentic Idle assets instead of using icons',()=>{
 assert.equal(gymAcePlan(GYMS,0,{}).assetReady,false);
 for(const bad of ['../../fake.png','0095/portrait.png','0095/../evil-Anim.png']){
  const m={'0095':{anims:{Idle:{file:bad,fw:32,fh:32,durations:[5]}}}};
  assert.equal(gymAcePlan(GYMS,0,m).assetReady,false,bad);
 }
 assert.throws(()=>gymAcePlan([{...GYMS[0],leaderTeam:['geodude']}],0,manifest));
});
test('T35 gym layout keeps leader, ace and touch buttons spatially separate',()=>{
 for(let stage=0;stage<8;stage++){
  const p=gymAcePlacement(gymAcePlan(GYMS,stage,manifest));
  assert.ok(p.aceX-p.leaderX>=p.maxWidth/2+18,'leader and ace must not overlap');
  assert.ok(p.aceX+p.maxWidth/2<=373,'ace must remain inside gym backdrop');
  assert.ok(p.leaderX-14>=267,'leader must remain inside gym backdrop');
  assert.ok(p.maxHeight<=72,'ace cannot tower over the gym interior');
  assert.ok(p.baseline<215,'must not overlap battle CTA y231');
 }
});
test('T35 transparent PMD padding is removed so visible feet touch the shadow',()=>{
 const w=4,h=5,bytes=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<3;y++)for(let x=0;x<w;x++)bytes[(y*w+x)*4+3]=255;
 const ctx={drawImage(){},getImageData(){return{data:bytes}}};
 const documentRef={createElement:()=>({getContext:()=>ctx})};
 const frame={cutX:0,cutY:0,cutWidth:w,cutHeight:h,source:{image:{}}};
 assert.equal(gymAceVisibleBottomPadding({get:()=>frame},documentRef),2);
 assert.equal(gymAceVisibleBottomPadding({get:()=>frame},null),0,'no DOM fallback');
 assert.equal(gymAceVisibleBottomPadding({get:()=>({...frame,cutWidth:999})},documentRef),0,'bounded scan');
 assert.equal(gymAceVisibleBottomPadding({get:()=>frame},{createElement:()=>({getContext:()=>{throw Error('tainted')}})}),0);
});
test('T35 native idle sheet renders one sprite, one shadow and no gameplay writes',()=>{
 const objects=[],animations=[];
 const obj=()=>({active:true,setOrigin(){return this},setScale(n){this.scale=n;return this},
  setDepth(n){this.depth=n;return this},setData(k,v){this[k]=v;return this},
  once(){return this},play(k){this.animation=k;return this}});
 let fileReady=null,queued=null;const handlers=new Map();
 const scene={
  scene:{isActive:()=>true},
  add:{ellipse(){const x=obj();objects.push(x);return x},sprite(){const x=obj();objects.push(x);return x}},
  textures:{exists:()=>false,get:()=>({frameTotal:8,setFilter(){}})},
  load:{once(k,fn){assert.equal(k,'filecomplete-spritesheet-torre2-gym-ace-0121');fileReady=fn;handlers.set(k,fn)},
   on(k,fn){handlers.set(k,fn)},off(k,fn){if(handlers.get(k)===fn)handlers.delete(k)},
   spritesheet(...args){queued=args},
   isLoading:()=>false,start(){}},
  anims:{exists:()=>false,create(x){animations.push(x)},generateFrameNumbers:(_key,r)=>[r.start,r.end]},
  tweens:{add(){},killTweensOf(){}}
 };
 const state={stage:1,trainer:4,money:1400,team:[{id:'bulbasaur'}]};
 const before=JSON.stringify(state),plan=gymAcePlan(GYMS,1,manifest);
 const leader=obj();
 const report=drawGymAce(scene,plan,()=>leader);
 assert.equal(report.ready,false);
 assert.equal(queued[0],'torre2-gym-ace-0121');
 assert.equal(queued[1],'assets/pmd/0121/Idle-Anim.png');
 scene.textures.exists=()=>true;
 fileReady();
 assert.equal(handlers.size,0,'no lingering loader callbacks');
 assert.equal(report.ready,true);
 assert.equal(report.sprite['torre2-gym-ace'],'starmie');
 assert.equal(leader['torre2-gym-leader'],'Misty');
 assert.equal(animations.length,1);
 assert.equal(JSON.stringify(state),before);
});
test('T35 delayed asset load cannot draw on a destroyed gym view',()=>{
 const plan=gymAcePlan(GYMS,0,manifest),token={active:true};
 let fileReady=null,created=0;const handlers=new Map();
 const obj=()=>({setDepth(){return this},setData(){return this}});
 const scene={scene:{isActive:()=>true},add:{ellipse(){return obj()},sprite(){created++;return obj()}},
  textures:{exists:()=>false},load:{once(k,fn){fileReady=fn;handlers.set(k,fn)},on(k,fn){handlers.set(k,fn)},
   off(k,fn){if(handlers.get(k)===fn)handlers.delete(k)},
   spritesheet(){},isLoading:()=>false,start(){}}};
 drawGymAce(scene,plan,()=>obj(),{token});
 token.active=false;scene.textures.exists=()=>true;fileReady();
 assert.equal(created,0,'never draw the ace on city/route/PC after navigation');
});

test('T35 unrelated global loader completion cannot hide the gym ace',()=>{
 const plan=gymAcePlan(GYMS,1,manifest),events=new Map();
 let loaded=false,sprites=0;
 const obj=()=>({setDepth(){return this},setData(){return this},setOrigin(){return this},
  setScale(){return this},once(){return this},play(){return this}});
 const scene={scene:{isActive:()=>true},
  add:{ellipse(){return obj()},sprite(){sprites++;return obj()}},
  textures:{exists:()=>loaded,get:()=>({frameTotal:1,setFilter(){}})},
  load:{once(k,fn){events.set(k,fn)},on(k,fn){events.set(k,fn)},
   off(k,fn){if(events.get(k)===fn)events.delete(k)},
   spritesheet(){},isLoading:()=>true,start(){}},
  anims:{exists:()=>true},tweens:{add(){}}
 };
 const report=drawGymAce(scene,plan,()=>obj());
 assert.equal(events.has('complete'),false,'never subscribe to unrelated global completion');
 assert.equal(report.ready,false);
 events.get('loaderror')({key:'unrelated-sheet'});
 assert.equal(report.reason,null,'unrelated asset errors must not affect ace');
 assert.equal(sprites,0);
 loaded=true;
 events.get('filecomplete-spritesheet-'+plan.textureKey)();
 assert.equal(report.ready,true);
 assert.equal(sprites,1);
 assert.equal(events.size,0,'file-specific listeners must be released');
});
test('T35 a failed PMD sheet leaves an explicit reason and no false sprite',()=>{
 const plan=gymAcePlan(GYMS,0,manifest),events=new Map();
 const obj=()=>({setDepth(){return this},setData(){return this}});
 const scene={scene:{isActive:()=>true},add:{ellipse(){return obj()},sprite(){throw Error('unexpected sprite')}},
  textures:{exists:()=>false},load:{once(k,fn){events.set(k,fn)},on(k,fn){events.set(k,fn)},
   off(k,fn){if(events.get(k)===fn)events.delete(k)},spritesheet(){},isLoading:()=>false,start(){}}};
 const report=drawGymAce(scene,plan,()=>obj());
 events.get('loaderror')({key:plan.textureKey});
 assert.equal(report.ready,false);
 assert.match(report.reason,/failed to load/);
 assert.equal(events.size,0);
});

test('T35 Idle bob preserves the alpha-corrected ground anchor',()=>{
 const plan=gymAcePlan(GYMS,0,manifest),p=gymAcePlacement(plan);
 const rgba=new Uint8ClampedArray(4*5*4);
 for(let y=0;y<3;y++)for(let x=0;x<4;x++)rgba[(y*4+x)*4+3]=255;
 const oldDocument=globalThis.document;
 globalThis.document={createElement:()=>({getContext:()=>({
  drawImage(){},getImageData(){return{data:rgba}}
 })})};
 let spriteY,tween;
 const obj=()=>({active:true,setOrigin(){return this},setScale(){return this},
  setDepth(){return this},setData(){return this},once(){return this}});
 const texture={frameTotal:1,setFilter(){},get:()=>({cutX:0,cutY:0,
  cutWidth:4,cutHeight:5,source:{image:{}}})};
 const scene={scene:{isActive:()=>true},
  add:{ellipse(){return obj()},sprite(_x,y){spriteY=y;return obj()}},
  textures:{exists:()=>true,get:()=>texture},
  tweens:{add(value){tween=value},killTweensOf(){}}
 };
 try{
  const report=drawGymAce(scene,plan,()=>obj());
  assert.equal(report.ready,true);
  const scale=Math.min(2.75,p.maxWidth/4,p.maxHeight/3);
  assert.ok(Math.abs(spriteY-(p.baseline-3+2*scale))<1e-8);
  assert.ok(tween,'Idle tween must be present');
  assert.equal(tween.y,spriteY-2,'bob must not snap back to uncorrected baseline');
  assert.equal(tween.yoyo,true);
 }finally{
  if(oldDocument===undefined)delete globalThis.document;
  else globalThis.document=oldDocument;
 }
});

test('T35 alpha bounds scale Onix from visible pixels, not transparent PMD frame',()=>{
 const plan=gymAcePlan(GYMS,0,manifest),p=gymAcePlacement(plan);
 const w=48,h=52,bytes=new Uint8ClampedArray(w*h*4);
 // Only 14x22 visible pixels centered off-axis in a 48x52 PMD frame.
 for(let y=11;y<=32;y++)for(let x=24;x<=37;x++)
  bytes[(y*w+x)*4+3]=255;
 let reads=0;
 const doc={createElement:()=>({getContext:()=>({
  drawImage(){},getImageData(){reads++;return {data:bytes}}
 })})};
 const texture={get:()=>({cutX:0,cutY:0,cutWidth:w,cutHeight:h,source:{image:{}}})};
 const b=gymAceVisibleBounds(texture,doc);
 assert.deepEqual({...b},{left:24,right:37,top:11,bottom:32,
  width:14,height:22,bottomPadding:19,horizontalOffset:-7});
 assert.equal(gymAceVisibleBounds(texture,doc),b,'single scan per texture');
 assert.equal(reads,1,'avoid repeated alpha readback on mobile');
 const fit=gymAceSpriteFit(plan,p,b);
 assert.equal(fit.boundsMeasured,true);
 assert.ok(fit.scale>2,'Onix must not be shrunk by transparent atlas margins');
 assert.ok(fit.visibleHeight>=44,'Onix should read as the large boss Pokémon');
 assert.ok(fit.visibleHeight<=p.maxHeight);
 assert.ok(fit.visibleWidth<=p.maxWidth);
 assert.equal(fit.x,p.aceX-7*fit.scale,'visual alpha center is centered on the ace anchor');
 assert.equal(fit.y,p.baseline-3+19*fit.scale,'visible feet meet the shadow');
 assert.ok(p.aceX-fit.visibleWidth/2>=p.leaderX+18,
  'visible Onix cannot overlap Brock');
});
test('T35 sprite fitting falls back safely when canvas is missing/tainted',()=>{
 const plan=gymAcePlan(GYMS,1,manifest),p=gymAcePlacement(plan);
 const fit=gymAceSpriteFit(plan,p,null);
 assert.equal(fit.boundsMeasured,false);
 assert.equal(fit.scale,Math.min(2.25,p.maxWidth/plan.frameWidth,
  p.maxHeight/plan.frameHeight));
 assert.equal(fit.x,p.aceX);
 assert.equal(fit.y,p.baseline-3);
 const texture={get:()=>({cutX:0,cutY:0,cutWidth:48,cutHeight:52,source:{image:{}}})};
 assert.equal(gymAceVisibleBounds(texture,null),null);
 assert.equal(gymAceVisibleBounds(texture,{createElement:()=>({
  getContext(){throw Error('tainted canvas')}
 })}),null);
});
test('T35 alpha fitted sprite is placed at centered anchor, bounded height and ground baseline',()=>{
 const plan=gymAcePlan(GYMS,0,manifest),p=gymAcePlacement(plan);
 const w=48,h=52,bytes=new Uint8ClampedArray(w*h*4);
 for(let y=10;y<34;y++)for(let x=23;x<37;x++)bytes[(y*w+x)*4+3]=255;
 const oldDocument=globalThis.document;
 globalThis.document={createElement:()=>({getContext:()=>({
  drawImage(){},getImageData(){return {data:bytes}}
 })})};
 const texture={frameTotal:1,setFilter(){},get:()=>({
  cutX:0,cutY:0,cutWidth:w,cutHeight:h,source:{image:{}}
 })};
 let sx,sy,scale,shadow;
 const obj=()=>({active:true,setOrigin(){return this},
  setScale(n){scale=n;return this},setDepth(){return this},
  setData(){return this},once(){return this}});
 const scene={scene:{isActive:()=>true},add:{
  ellipse(x,y,w,h){shadow={x,y,w,h};return obj()},
  sprite(x,y){sx=x;sy=y;return obj()}
 },textures:{exists:()=>true,get:()=>texture},tweens:{add(){},killTweensOf(){}}};
 try{
  const report=drawGymAce(scene,plan,()=>obj());
  assert.equal(report.ready,true);
  assert.equal(report.fit.boundsMeasured,true);
  assert.equal(scale,report.fit.scale);
  assert.equal(sx,report.fit.x);
  assert.equal(sy,report.fit.y);
  assert.ok(report.fit.visibleHeight<=p.maxHeight);
  assert.ok(report.fit.visibleWidth<=p.maxWidth);
  assert.equal(shadow.x,p.aceX);
  assert.ok(shadow.w>=17&&shadow.w<=65);
  assert.equal(shadow.y,p.baseline);
 }finally{
  if(oldDocument===undefined)delete globalThis.document;
  else globalThis.document=oldDocument;
 }
});
