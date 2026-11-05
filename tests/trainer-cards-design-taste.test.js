/* Design Taste polish: real drawing helpers from the trainer-card module.
 * No actual game builds, saves, original Poké Arena kits or combat assets change.
 * The Phaser/Chromium visual gate is still mandatory prior to publication.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('tools/pokearena/torre2-trainer-cards.js','utf8');
const start=source.indexOf('function box(');
const middle=source.indexOf('function control(');
const cardStart=source.indexOf('function trainerCardFrame(');
const cardEnd=source.indexOf('function npc(');
assert.ok(start>0&&middle>start&&cardStart>middle&&cardEnd>cardStart);
const palette={
 navy:0x06172b,panel:0x0c2845,body:0x123755,edge:0x3b77a6,
 ocean:0x1e527a,light:0x8cc9ed,gold:0xf6c851,sun:0xffe6a2,
 cream:0xf7f4df,green:0x50cc84,lock:0x50677c,shadow:0x040d1d
};
const drawing=source.slice(start,middle)+'\n'+source.slice(cardStart,cardEnd);
const {trainerCardFrame}=vm.runInNewContext('({'+
 'run: function(){'+drawing+'return trainerCardFrame;}'+'}).run()',
 {PALETTE:palette,Math});

function render(entry){
 const draws=[],objects=[];
 const graphics=()=>({
  fillStyle(color,alpha){draws.push({operation:'fillStyle',color,alpha});return this},
  fillRect(x,y,w,h){draws.push({operation:'rect',x,y,w,h});return this}
 });
 const scene={add:{graphics}};
 const layer={add(item){objects.push(item)}};
 const edge=trainerCardFrame(scene,layer,18,81,109,190,entry);
 return{edge,draws,objects};
}

test('the five approved 109x190 trainer cards retain their grid coordinates',()=>{
 assert.match(source,/const x=18\+c\*124,y=81,w=109,h=190;/);
 assert.match(source,/for\(let c=0;c<5;c\+\+\)/);
 assert.match(source,/trainerCardFrame\(scene,layer,x,y,w,h,entry\)/);
 assert.match(source,/\.setData\('torre2-trainer-card-index',entry.index\)/);
 assert.match(source,/detailPage\(scene,state,handlers,entry\)/);
 assert.match(source,/const zone=scene.add.zone\(x\+w\/2,y\+96,w,189\)/);
});

test('the active, completed and locked pixel frames remain distinguishable',()=>{
 const active=render({active:true,completed:false,leader:false});
 const defeated=render({active:false,completed:true,leader:false});
 const locked=render({active:false,completed:false,leader:false});
 assert.equal(active.edge,palette.gold);
 assert.equal(defeated.edge,palette.green);
 assert.equal(locked.edge,0x587790);
 for(const model of [active,defeated,locked]){
  assert.equal(model.objects.length,2,'box and overlay must be graphics only');
  assert.ok(model.draws.filter(x=>x.operation==='rect').length>=20);
  assert.ok(model.draws.some(x=>x.operation==='rect'&&x.x===25&&x.y===111&&x.w===95&&x.h===2),
   'role strip separates the trainer title from the real sprite');
 }
});

test('real FireRed and PMD portraits, half-size preview and battle controls remain',()=>{
 assert.match(source,/addFireRedNPC\(scene,kind,x,y/);
 assert.match(source,/requestCardPortrait\(scene,key/);
 assert.match(source,/OPPONENT_SPRITE_SCALE=0\.5/);
 assert.match(source,/OPPONENT_LIST_SPRITE_SIZE=22\*OPPONENT_SPRITE_SCALE/);
 assert.match(source,/OPPONENT_DETAIL_SPRITE_SIZE=53\*OPPONENT_SPRITE_SCALE/);
 for(const name of ['cards-more','cards-prev','cards-next','cards-fight',
  'torre2-card-fight-index','torre2-card-control']){
  assert.ok(source.includes(name),name+' contract is required');
 }
 assert.match(source,/if\(!muted\)\{/);
 assert.match(source,/if\(now-lastPress<190\)return;/);
});
