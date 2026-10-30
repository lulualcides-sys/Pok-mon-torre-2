import test from 'node:test';
import assert from 'node:assert/strict';
import {gotchaSparklePoints,drawGotchaSparkles} from '../tools/pokearena/torre2-ball-choreography.js';
import {ballTextureKey,originalBallSprite,setBallOpened} from '../tools/pokearena/torre2-ball-sprites.js';

test('the original user-approved 16px atlas becomes one cached Phaser texture',()=>{
 const generated=[],rects=[],images=[],data=new Map();
 const graphics=()=>({
  fillStyle(){return this},
  fillRect(...a){rects.push(a);return this},
  generateTexture(key,w,h){generated.push({key,w,h});data.set(key,{setFilter(){}});return this},
  destroy(){}
 });
 const scene={
  make:{graphics},
  textures:{exists:key=>data.has(key),get:key=>data.get(key)},
  add:{image:(x,y,key)=>{
   const o={x,y,key,scene,setTexture(next){this.key=next;return this},setDisplaySize(w,h){this.w=w;this.h=h;return this},
    setDepth(d){this.depth=d;return this},setData(k,v){this.tag=[k,v];return this}};
   images.push(o);return o;
  }}
 };
 const first=originalBallSprite(scene,70.2,90.4,'pokeball',16,2309);
 const second=originalBallSprite(scene,75,91,'pokeball',16,2309);
 assert.deepEqual(generated,[{key:ballTextureKey('pokeball'),w:16,h:16}]);
 assert.ok(rects.length>40,'Sprite cells should be captured in the one-time texture');
 assert.equal(first.key,'torre2-original-ball-pokeball');
 assert.equal(first.w,16);assert.equal(first.h,16);
 assert.equal(first.x,70);assert.equal(first.y,90);
 assert.equal(second.key,first.key);
 assert.deepEqual(first.tag,['torre2-original-ball-sprite','pokeball']);
 setBallOpened(first,'pokeball',true,16);
 assert.equal(first.key,ballTextureKey('pokeball',true),'Opened lid must be a DIFFERENT native texture');
 assert.equal(first.w,24);assert.equal(first.h,24);
 assert.deepEqual(generated.at(-1),{key:ballTextureKey('pokeball',true),w:24,h:24});
 setBallOpened(first,'pokeball',false,16);
 assert.equal(first.key,ballTextureKey('pokeball'));
 assert.equal(first.w,16);assert.equal(first.h,16);
 assert.equal(generated.length,2,'Opened and closed frames are both cached; no repeat redraw');
});
test('success creates up to three brief, bounded stars; never a permanent dot ring',()=>{
 for(const t of [0,.05,.19,.3,.5,.7,.9,1]){
  const points=gotchaSparklePoints(t);
  assert.ok(points.length<=3);
  for(const p of points){
   assert.ok(Number.isInteger(p.x)&&Number.isInteger(p.y));
   assert.ok(Number.isFinite(p.alpha)&&p.alpha>0&&p.alpha<=1);
   assert.ok(Math.abs(p.x)<36&&Math.abs(p.y)<36);
  }
 }
 assert.equal(gotchaSparklePoints(.1).length,3,'Three stars must be visible early in the GOTCHA animation');
 assert.ok(gotchaSparklePoints(.1).some(p=>p.y>0),'One success star must remain below the ball, outside the GOTCHA panel');
 assert.deepEqual(gotchaSparklePoints(1),[]);
});
test('GOTCHA sparkles use crisp small pixel crosses, not rings or big particles',()=>{
 let count=0;
 const g={fillStyle(){return this},fillRect(x,y,w,h){count++;assert.ok(Number.isInteger(x)&&Number.isInteger(y));assert.ok(w<=13&&h<=13,'glint stays inside a 13px pixel-art cross');return this},
  strokeCircle(){throw Error('circle is not pixel glint')},fillCircle(){throw Error('circle is not pixel glint')}};
 drawGotchaSparkles(g,250.6,160.3,.35);
 assert.ok(count>0&&count<=18);
 drawGotchaSparkles(g,250,160,1);
});
test('capture uses cached texture through Phaser Image and no static ten-star circle',async()=>{
 const fs=await import('node:fs/promises');
 const code=await fs.readFile(new URL('../tools/pokearena/torre2-capture-arena.js',import.meta.url),'utf8');
 assert.match(code,/const ballSprite=originalBallSprite\(/);
 assert.match(code,/ballSprite\.setVisible\(true\)\.setPosition\(/);
 assert.match(code,/drawGotchaSparkles\(gfx,end\.x,floorY,sparkle\.t\)/);
 assert.match(code,/showBall\(end\.x,end\.y,0,true\)/,'Pokeball must open during absorption');
 assert.match(code,/showBall\(end\.x,end\.y,0,false\)/,'Pokeball must close before dropping');
 assert.doesNotMatch(code,/for\(let i=0;i<10;i\+\+\)/);
});
