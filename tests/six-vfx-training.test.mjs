import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
globalThis.Phaser={
 Scene:class {constructor(id){this.sceneKey=id}},
 Textures:{FilterMode:{NEAREST:0}}
};
const {
 VfxSixLab,SIX_VFX_TRAINING,SIX_VFX_ATLAS,SIX_VFX_ATLAS_FILE,SIX_VFX_ATLAS_FRAMES
}=await import('../tools/pokearena/torre2-six-vfx-lab-scene.js');

test('96 authentic transparent PNG sprite frames for six distinct attacks',()=>{
 const manifest=JSON.parse(readFileSync('reference-assets/vfx-six/manifest.json','utf8'));
 const raw=readFileSync('reference-assets/vfx-six/atlas.png');
 assert.equal(raw.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(raw.readUInt32BE(16),224);
 assert.equal(raw.readUInt32BE(20),1344);
 assert.equal(createHash('sha256').update(raw).digest('hex'),manifest.sha256);
 assert.equal(manifest.width/manifest.frameWidth,4);
 assert.equal(manifest.height/manifest.frameHeight,24);
 assert.equal(SIX_VFX_ATLAS_FRAMES,96);
 assert.equal(SIX_VFX_TRAINING.length,6);
 assert.deepEqual(SIX_VFX_TRAINING.map(x=>x.start),[0,16,32,48,64,80]);
 assert.deepEqual(SIX_VFX_TRAINING.map(x=>x.id),manifest.moves.map(x=>x.id));
 assert.equal(manifest.nativeP2Overrides,false);
 assert.equal(manifest.gameplayKitMutations,false);
 assert.equal(manifest.approval,'visual-review-pending');
});

test('Phaser scene uses only new PNG spritesheet, without touching original battle kits',()=>{
 const scene=new VfxSixLab();const loaded=[];
 scene.load={spritesheet:(...args)=>loaded.push(args)};
 scene.preload();
 assert.equal(scene.sceneKey,'vfx-six-lab');
 assert.deepEqual(loaded,[[SIX_VFX_ATLAS,SIX_VFX_ATLAS_FILE,
  {frameWidth:56,frameHeight:56,margin:0,spacing:0}]]);
 const src=readFileSync('tools/pokearena/torre2-six-vfx-lab-scene.js','utf8');
 assert.match(src,/extends Phaser\.Scene/);
 assert.match(src,/this\.add\.sprite/);
 assert.match(src,/this\.time\.delayedCall/);
 assert.ok(!src.includes('this.load.spritesheet("retrato-'));
 assert.ok(!src.includes('localStorage'));
 assert.ok(!/scene\.datos\.torre2Loadout\s*=/.test(src));
 assert.ok(!src.includes('r.recibir('),'Training preview does not fake damage');
});

function stubItem(){
 const self={
  active:true,listeners:{},texts:[],frames:[],
  setStrokeStyle(){return this},setInteractive(){return this},
  setOrigin(){return this},setScale(){return this},setVisible(){return this},
  setDepth(){return this},setFillStyle(){return this},setColor(){return this},
  setText(v){this.texts.push(v);return this},
  setPosition(){return this},setFrame(v){this.frames.push(v);return this},
  on(k,fn){this.listeners[k]=fn;return this},
  destroy(){this.active=false}
 };return self;
}

test('Each of six attacks animates exactly 16 unique cels, independently switchable',()=>{
 const scene=new VfxSixLab(), queue=[], sprites=[];
 scene.textures={exists:key=>key===SIX_VFX_ATLAS,
   get:()=>({frameTotal:97,setFilter:()=>{}})};
 scene.add={
  rectangle:()=>stubItem(),ellipse:()=>stubItem(),
  text:()=>stubItem(),
  sprite:()=>{const obj=stubItem();sprites.push(obj);return obj}
 };
 scene.events={once:()=>{}};
 scene.scene={start:()=>{}};
 scene.time={delayedCall:(ms,callback)=>{
  assert.ok(ms>=30&&ms<130);
  const t={cancelled:false,remove(){this.cancelled=true}};
  queue.push({t,callback});return t;
 }};
 scene.create();
 assert.equal(scene.selected,'gunk-shot');
 assert.equal(sprites.length,1);
 const image=sprites[0];
 const flush=()=>{
  let safety=0;
  while(queue.length){
   const {t,callback}=queue.shift();
   if(!t.cancelled)callback();
   if(++safety>40)throw Error('Frame animation never ends');
  }
 };
 flush();
 assert.equal(scene.casting,false);
 assert.deepEqual(image.frames,Array.from({length:16},(_,i)=>i));
 for(const move of SIX_VFX_TRAINING.slice(1)){
  image.frames=[];
  assert.equal(scene.cast(move.id),true);
  flush();
  assert.equal(scene.casting,false);
  assert.deepEqual(image.frames,Array.from({length:16},(_,i)=>move.start+i),move.id);
 }
 assert.equal(scene.cast('air-slash'),false,'Never replace approved Air Slash');
});

test('Builder registers a title-scene entry and stamps new PNG in versioned Pages build',()=>{
 const build=readFileSync('tools/pokearena/build-preview.mjs','utf8');
 assert.match(build,/torre2-six-vfx-lab-scene\.js/);
 assert.match(build,/six-vfx-lab-scene\.js/);
 assert.match(build,/VfxSixLab/);
 assert.match(build,/NOVOS GOLPES 2D/);
 assert.match(build,/reference-assets\/vfx-six\/atlas\.png/);
 assert.match(build,/vfxFingerprint\.update\(await fs\.readFile\('reference-assets\/vfx-six\/atlas\.png'\)\)/);
 for(const word of ['JohtoLab','Campanha','Combate','Batalla'])
  assert.ok(build.includes(word),'Native scene intact: '+word);
});
