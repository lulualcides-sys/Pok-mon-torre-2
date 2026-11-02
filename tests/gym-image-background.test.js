import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EventEmitter} from 'node:events';
import {
 GYM_IMAGE_VERSION,GYM_IMAGE_MANIFEST_KEY,GYM_IMAGE_SPECS,GYM_IMAGE_VIEW,
 approvedGymImage,gymImageOverlayLayout,rosterForGymImage,
 acePlacementForGymImage,drawGymImageBackground,requestGymImageBackground
} from '../tools/pokearena/torre2-gym-image-background.js';
import {gymWideLayout} from '../tools/pokearena/torre2-gym-wide-layout.js';
import {drawGymIntermediates,gymNpcVisualKinds} from '../tools/pokearena/torre2-gym-intermediates.js';

const manifest={version:1,scenes:GYM_IMAGE_SPECS.map(s=>({
 ...s,width:1280,height:720,sha256:'a'.repeat(64)
}))};
const makeScene=()=>{
 const sprites=[],calls=[],textures=new Map();
 const scene={textures:{exists:k=>textures.has(k),get:k=>textures.get(k)},
  add:{image(x,y,key){const obj={x,y,key,origin:[],display:[],depth:null,data:{},
   setOrigin(...args){this.origin=args;return this},
   setDisplaySize(...args){this.display=args;return this},
   setDepth(v){this.depth=v;return this},
   setData(k,v){this.data[k]=v;return this}};
   sprites.push(obj);return obj}},
  scene:{isActive(){return true}},load:new EventEmitter()};
 scene.load.image=(...args)=>calls.push(args);
 scene.load.start=()=>calls.push(['start']);
 scene.load.isLoading=()=>false;
 return {scene,sprites,textures,calls};
};

test('T38 manifest enumerates EXACTLY 8 stages and fails closed for unknown assets',()=>{
 assert.equal(GYM_IMAGE_VERSION,'t38-approved-scene-v1');
 assert.equal(GYM_IMAGE_MANIFEST_KEY,'torre2-approved-gym-scenes-v1');
 assert.deepEqual(GYM_IMAGE_SPECS.map(x=>x.slug),
  ['brock','misty','surge','erika','koga','sabrina','blaine','giovanni']);
 assert.ok(GYM_IMAGE_SPECS.every((s,i)=>s.stage===i&&
  s.path==='assets/ui/gym-interiors/'+s.slug+'-interior.png'));
 assert.equal(approvedGymImage(null,0),null);
 assert.equal(approvedGymImage({version:1,scenes:[]},0),null);
 assert.equal(approvedGymImage(manifest,8),null);
 assert.equal(approvedGymImage({version:1,scenes:[{
  ...manifest.scenes[0],path:'../attacker.png'}]},0),null);
 assert.equal(approvedGymImage({version:1,scenes:[{
  ...manifest.scenes[0],width:1536}]},0),null);
 assert.equal(approvedGymImage({version:1,scenes:[{
  ...manifest.scenes[0],sha256:'FAKE'}]},0),null);
 assert.ok(approvedGymImage(manifest,0));
});

test('T38 all eight scenes have stable no-zoom foreground geometry',()=>{
 for(let stage=0;stage<8;stage++){
  const l=gymImageOverlayLayout(stage);
  assert.equal(l.cameraZoom,1);
  assert.equal(l.slots.length,stage===0?3:4);
  assert.ok(l.slots.every(p=>p.x<230||p.x>410));
  assert.ok(l.slots.every(p=>p.y>145&&p.y<l.floorBottom));
  assert.equal(l.leader.x,290);
  assert.equal(l.ace.x,342);
  assert.ok(l.uiTop>=274);
  assert.ok(l.slots.every(p=>p.x>=66&&p.x<=574));
  if(stage<2)assert.deepEqual(l.slots,gymWideLayout(stage).slots);
  const p=acePlacementForGymImage(stage,stage===0?'onix':'raichu');
  assert.equal(p.baseline,126);
  assert.equal(p.aceX-p.leaderX,52);
 }
 assert.equal(gymImageOverlayLayout(9),null);
});

test('T38 image-mode roster moves ONLY display coordinates, not encounter identity or save',()=>{
 for(let stage=0;stage<8;stage++){
  const source={stage,trainer:10,inGym:true,
   gymIndices:stage===0?[9,10,11]:[10,11,13,14],
   slots:Array.from({length:stage===0?3:4},(_,i)=>({
    index:i*3+3,kind:'trainer',status:i===0?'current':'locked',
    originalName:'Trainer#'+i,x:10,y:10
   }))};
  const before=JSON.stringify(source);
  const v=rosterForGymImage(source,stage);
  assert.deepEqual(v.slots.map(s=>s.index),source.slots.map(s=>s.index));
  assert.deepEqual(v.slots.map(s=>s.originalName),source.slots.map(s=>s.originalName));
  assert.deepEqual(v.gymIndices,source.gymIndices);
  assert.equal(v.imageOverlay,true);
  assert.deepEqual(JSON.stringify(source),before);
  assert.ok(v.slots.every(s=>s.x!==10&&s.y!==10));
 }
 assert.equal(rosterForGymImage(null,0),null);
});

test('T38 a raster background is one Phaser image under ALL native game controls',()=>{
 const {scene,textures,sprites}=makeScene();
 assert.equal(drawGymImageBackground(scene,0,manifest),null);
 assert.equal(sprites.length,0,'no approved art=>old interior works unchanged');
 const spec=approvedGymImage(manifest,1);
 const source={width:spec.width,height:spec.height};
 textures.set(spec.key,{source:[source],setFilter(){}});
 const report=drawGymImageBackground(scene,1,manifest);
 assert.equal(report.mode,'image');
 assert.equal(report.slug,'misty');
 assert.equal(report.cameraZoom,1);
 assert.equal(report.decorativeOnly,true);
 assert.equal(report.image.data['torre2-gym-image-background'],'misty');
 assert.deepEqual(report.image.origin,[0,0]);
 assert.deepEqual(report.image.display,[640,360]);
 assert.equal(report.image.depth,GYM_IMAGE_VIEW.depth);
 assert.ok(report.image.depth<3,'native button frames sit ABOVE image');
 assert.equal(sprites.length,1,'one FULL scene image, not vector polygons');
 source.width=100;
 assert.equal(drawGymImageBackground(scene,1,manifest),null,
  'invalid dimensions cannot stretch an image');
 assert.equal(sprites.length,1);
});

test('T38 load only current approved gym; destroyed view cannot draw a late sprite',()=>{
 const {scene,calls,textures}=makeScene();
 const token=new EventEmitter();token.active=true;
 let renders=0;
 assert.equal(requestGymImageBackground(scene,3,{version:1,scenes:[]},{token}),false);
 assert.equal(calls.length,0);
 assert.equal(requestGymImageBackground(scene,0,manifest,{token,onReady:()=>renders++}),true);
 assert.equal(requestGymImageBackground(scene,0,manifest,{token,onReady:()=>renders++}),true);
 assert.deepEqual(calls,[['torre2-gym-scene-brock',
  'assets/ui/gym-interiors/brock-interior.png'],['start']]);
 token.active=false;token.emit('destroy');
 scene.load.emit('filecomplete-image-torre2-gym-scene-brock');
 assert.equal(renders,0);
 assert.equal(scene.__torre2GymImagePending.size,0);
 const other=new EventEmitter();other.active=true;
 assert.equal(requestGymImageBackground(scene,1,manifest,{token:other,onReady:()=>renders++}),true);
 textures.set('torre2-gym-scene-misty',{});
 scene.load.emit('filecomplete-image-torre2-gym-scene-misty');
 assert.equal(renders,1);
 assert.equal(scene.__torre2GymImagePending.size,0);
});

test('T38 preserves separate gameplay modules / Pokédex UI / original fight counters',()=>{
 const scene=fs.readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 const ace=fs.readFileSync('tools/pokearena/torre2-gym-ace.js','utf8');
 const build=fs.readFileSync('tools/pokearena/build-preview.mjs','utf8');
 const installer=fs.readFileSync('tools/pokearena/install-gym-backgrounds.mjs','utf8');
 assert.match(scene,/drawGymImageBackground\(this,state\.stage,gymManifest\)/);
 assert.match(scene,/rosterForGymImage\(roster,state\.stage\)/);
 assert.match(scene,/requestGymImageBackground\(this,state\.stage,gymManifest/);
 assert.match(scene,/drawGymIntermediates\(this,imageRoster/);
 assert.match(ace,/placement\|\|gymAcePlacement\(plan\)/);
 assert.match(build,/installGymBackgrounds\(dest\)/);
 assert.match(installer,/const GYMS=Object\.freeze/);
 assert.doesNotMatch(installer,/https?:\/\//);
 const imageModule=fs.readFileSync('tools/pokearena/torre2-gym-image-background.js','utf8');
 assert.doesNotMatch(imageModule,/saveCampaign|resolveBattle|startBattle|Math\.random|localStorage/);
});

test('T38 all eight gyms reuse available FRLG classes and fallback only when absent',()=>{
 assert.equal(gymNpcVisualKinds(0).length,3);
 for(let i=1;i<8;i++)
  assert.equal(gymNpcVisualKinds(i).length,4);
 const stages=['hiker','swimmer','sailor','lass','biker','psychic','scientist','rocket'];
 for(let i=0;i<8;i++)assert.equal(gymNpcVisualKinds(i)[0],stages[i]);
 const output={used:[],calls:[]};
 const obj=()=>({setDepth(){return this},setOrigin(){return this},
  setData(k,v){output.used.push([k,v]);return this},
  setInteractive(){return this},on(){return this}});
 const scene={add:{ellipse:obj,text:obj,zone:obj}};
 const data={stage:5,inGym:true,slots:[{index:13,slot:0,x:160,y:164,
  kind:'trainer',title:'TREINADOR 1',status:'current'}]};
 const out=drawGymIntermediates(scene,data,(_scene,kind)=>{
  output.calls.push(kind);
  return kind==='psychic'?null:obj();
 },()=>{});
 assert.deepEqual(output.calls,['psychic','ace']);
 assert.deepEqual(output.used.filter(x=>x[0]==='torre2-gym-original-sprite'),
  [['torre2-gym-original-sprite','ace']]);
 assert.equal(out.interactiveCount,1);
});
