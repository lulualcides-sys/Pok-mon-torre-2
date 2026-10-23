import test from 'node:test';
import assert from 'node:assert/strict';
import {paintReworkedMove,paintReworkedImpact,REWORKED_STYLES} from '../tools/pokearena/batch24/visual-upgrades.js';
import {BATCH24_MOVES} from '../tools/pokearena/batch24/catalog.js';

const expected=['mudshot','mudbomb','acid','spray','jab','shard',
 'darkpulse','ancient','icywind','silverwind','twister'];
const approved=new Set(['fury-cutter','earth-power','giga-drain','energy-ball',
 'ice-fang','icicle-spear','mega-drain','leaf-blade','pin-missile',
 'night-slash','poison-fang','sludge']);
function graphics(){
 const rows=[];let color=0,opacity=1;
 return{rows,
  fillStyle(c,a=1){
   assert.ok(Number.isInteger(c)&&c>=0&&c<=0xffffff,'invalid palette entry');
   assert.ok(Number.isFinite(a)&&a>=0&&a<=1,'invalid opacity');
   color=c;opacity=a;return this;
  },
  fillRect(x,y,w,h){
   assert.ok([x,y,w,h].every(Number.isFinite),'No NaN/Infinity in pixel renderer');
   assert.ok(w>0&&h>0,'visible individual pixel');
   assert.ok(w<=30&&h<=30,'avoid oversized artificial rectangles');
   rows.push([x,y,w,h,color,opacity]);return this;
  }
 };
}
test('Exactly the 11 requested upgrades, never an approved animation',()=>{
 assert.equal(new Set(REWORKED_STYLES).size,11);
 assert.deepEqual([...REWORKED_STYLES].sort(),[...expected].sort());
 assert.deepEqual(new Set(BATCH24_MOVES.filter(h=>h.approved).map(h=>h.id)),approved);
 for(const move of BATCH24_MOVES.filter(h=>h.approved)){
  const g=graphics();
  assert.equal(paintReworkedMove(g,move,100,100,0,0),false,
   'MUST NOT overpaint approved '+move.id);
  assert.equal(paintReworkedImpact(g,move,100,100,.1),false,
   'MUST NOT change approved impact '+move.id);
  assert.equal(g.rows.length,0);
 }
});
test('Each upgraded attack draws 12 deterministic pixel-art phases with bounded cost',()=>{
 for(const style of REWORKED_STYLES){
  const move=BATCH24_MOVES.find(h=>h.style===style);
  assert.ok(move&&!move.approved,style+' must be unapproved pending review');
  const frames=[];
  for(let f=0;f<12;f++){
   const g=graphics();
   assert.equal(paintReworkedMove(g,move,100,100,f,.24),true);
   assert.ok(g.rows.length>=35,style+' must be a detailed frame');
   assert.ok(g.rows.length<=14000,style+' too many draw calls on mobile');
   frames.push(g.rows.map(row=>row.slice(0,4).join(',')).join('|'));
  }
  assert.ok(new Set(frames).size>=6,style+' animation needs at least 6 distinct poses');
  const impact=graphics();
  assert.equal(paintReworkedImpact(impact,move,100,100,.1),true);
  assert.ok(impact.rows.length>25,style+' must show physical impact particles');
  const cleared=graphics();
  assert.equal(paintReworkedImpact(cleared,move,100,100,.6),false);
  assert.equal(cleared.rows.length,0,'Impact must disappear after ~0.4s');
 }
});
test('Ice Shard has Pay Day-inspired seven independently hittable tips and stays balanced',async()=>{
 const fs=await import('node:fs/promises');
 const runtime=await fs.readFile(new URL('../tools/pokearena/batch24/runtime.js',import.meta.url),'utf8');
 assert.ok(runtime.includes('const count=iceFan?7:'),'Seven independent projectiles');
 assert.ok(runtime.includes('delay:i*(iceFan?.075:.12)'),'Staggered projectiles');
 assert.ok(runtime.includes('(i-(count-1)/2)*.09'),'Spread fans out without lock-on');
 assert.ok(runtime.includes('iceFan?1/count:1'),'Total damage split across hits');
 assert.ok(runtime.includes('paintReworkedImpact('),'Visual polish must not add extra damage');
});
test('Training removes cooldown locally, leaves original battle timers intact',async()=>{
 const fs=await import('node:fs/promises');
 const training=await fs.readFile(new URL('../tools/pokearena/torre2-training.js',import.meta.url),'utf8');
 assert.ok(training.includes('for(const slot of Object.keys(fighter.cd||{}))fighter.cd[slot]=0'));
 assert.ok(training.includes("scene.game.events.on('poststep',freeze)"));
 assert.ok(training.includes("scene.game.events.off('poststep',freeze)"));
 assert.ok(training.includes('SEM COOLDOWN'));
});
