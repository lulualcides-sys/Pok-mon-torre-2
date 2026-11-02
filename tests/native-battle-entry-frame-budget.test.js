import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {choreographyDelta,ballArc,clamp01,animateBallActor} from '../tools/pokearena/torre2-ball-choreography.js';
import {EventEmitter} from 'node:events';

test('first-entry frame catch-up honors elapsed real time while preserving original 60 FPS timing',()=>{
 for(const dt of [1,8.333,16.667,33.333,50,64]){
  assert.equal(choreographyDelta(dt,180),choreographyDelta(dt),
   'normal frame speeds must render with exactly the previous animation step');
 }
 assert.equal(choreographyDelta(100),64,'native recall remains capped');
 assert.equal(choreographyDelta(100,180),100,'initial release can recover a 100ms frame');
 assert.equal(choreographyDelta(500,180),180,'background/tab hitch stays bounded');
 assert.equal(choreographyDelta(500),64,'capture, recall and manual swap remain unchanged');
 assert.equal(choreographyDelta(0),16.667);
 assert.equal(choreographyDelta(-10,180),1);
 assert.equal(choreographyDelta(NaN,180),16.667);
 assert.equal(choreographyDelta(300,Infinity),64);
});
test('Pokeball launch curve and graphical endpoints stay identical',()=>{
 assert.deepEqual(ballArc({x:0,y:0},{x:100,y:20},0),{x:0,y:0});
 assert.deepEqual(ballArc({x:0,y:0},{x:100,y:20},1),{x:100,y:20});
 assert.equal(ballArc({x:0,y:0},{x:100,y:20},.5,52).y,-42);
 assert.equal(clamp01(3),1);
});
test('only first Kanto sendout opts into catch-up; recall and swap retain native frame limit',()=>{
 const content=readFileSync('tools/pokearena/torre2-party-battle.js','utf8');
 const marker='maxFrameMs:180,wallClockCatchup:true';
 assert.equal(content.split(marker).length-1,1,'one and only one opted-in battle entry');
 const intro=content.indexOf('if(party.changes===0){');
 const token=content.indexOf(marker);
 const hud=content.indexOf('const graphics=scene.add.graphics().setDepth(2480)',intro);
 assert.ok(intro>=0&&token>intro&&hud>token,
  'new budget must be inside first-entry choreography, not recalls or battle effects');
 const source=readFileSync('tools/pokearena/torre2-ball-choreography.js','utf8');
 assert.match(source,/maxFrameMs=64/,'original animation cap remains the default');
 assert.match(source,/wallClockCatchup=false/,'native recall and capture never use wall clock');
 assert.match(source,/elapsedDelta=Math\.max\(Number\(delta\)\|\|16\.667,Math\.max\(0,now-lastWall\)\)/,
  'first sendout compares game delta and measured monotonic time');
});

function mockBallScene(){
 const objects=[],game=new EventEmitter(),events=new EventEmitter();
 const scene={game:{events:game},events,
  scene:{isActive:()=>true},
  cameras:{main:{worldView:{x:0,y:0,width:640,height:360}}},
  add:{graphics:()=>{
   const stats={rects:0,clears:0,visible:true,alpha:1,destroyed:false};
   const g={stats,setDepth(){return this},setVisible(v){stats.visible=v;return this},
    setAlpha(v){stats.alpha=v;return this},clear(){stats.clears++;return this},
    fillStyle(){return this},fillRect(){stats.rects++;return this},
    lineStyle(){return this},strokeCircle(){return this},
    lineBetween(){return this},destroy(){stats.destroyed=true}};
   objects.push(g);return g;
  }}
 };
 const sprite={x:215,y:182,scaleX:1,scaleY:1,alpha:1,visible:true,active:true,
  setScale(x,y){this.scaleX=x;this.scaleY=y??x;return this},
  setPosition(x,y){this.x=x;this.y=y;return this},
  setAlpha(v){this.alpha=v;return this},
  setVisible(v){this.visible=v;return this}};
 const actor={spr:sprite,manif:{head:-16,feet:5,width:18},
  actualizarGraficos(){}};
 return {scene,actor,game,events,objects};
}
test('approved red-beam pixel geometry is built only once during release, recall stays dynamic',()=>{
 const {scene,actor,game,objects}=mockBallScene();
 let complete=0;
 animateBallActor(scene,actor,{drawBall:g=>{g.fillRect(0,0,1,1)},
  side:0,onComplete:()=>complete++});
 assert.equal(objects.length,2,'static beam plus original animated effects layer');
 const [beam,fx]=objects;
 const initialRects=beam.stats.rects;
 assert.ok(initialRects>40,'cached beam uses original pixel rectangles');
 assert.equal(beam.stats.visible,false,'beam hidden before ball opens');
 for(let i=0;i<55;i++)game.emit('poststep',i*16.667,16.667);
 assert.equal(complete,1);
 assert.equal(beam.stats.rects,initialRects,'no redraw of static release beam');
 assert.equal(beam.stats.destroyed,true);
 assert.equal(fx.stats.destroyed,true);
 assert.ok(fx.stats.clears>25);
 assert.equal(game.listenerCount('poststep'),0);

 const second=mockBallScene();
 let recalled=0;
 animateBallActor(second.scene,second.actor,{mode:'recall',side:1,
  drawBall:g=>g.fillRect(0,0,1,1),onComplete:()=>recalled++});
 assert.equal(second.objects.length,1,'moving recall beam must remain on native Graphics');
 for(let i=0;i<40;i++)second.game.emit('poststep',i*16.667,16.667);
 assert.equal(recalled,1);
 assert.ok(second.objects[0].stats.rects>100,'moving beam is still redrawn');
 assert.equal(second.game.listenerCount('poststep'),0);
});
