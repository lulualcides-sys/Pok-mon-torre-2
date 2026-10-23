import test from 'node:test';
import assert from 'node:assert/strict';
import {paintReworkedMove,paintReworkedImpact,REWORKED_STYLES} from '../tools/pokearena/batch24/visual-upgrades.js';
import {BATCH24_MOVES} from '../tools/pokearena/batch24/catalog.js';

const expected=['mudshot','mudbomb','acid','spray','jab','shard',
 'darkpulse','ancient','icywind','silverwind','twister'];
const approved=new Set(['fury-cutter','earth-power','giga-drain','energy-ball',
 'ice-fang','icicle-spear','mega-drain','leaf-blade','pin-missile',
 'night-slash','poison-fang','sludge','acid','acid-spray','icy-wind',
 'mud-shot','mud-bomb','silver-wind','twister','dark-pulse','poison-jab','ice-shard','ancient-power']);
const approvedReworked=new Set(['acid','acid-spray','icy-wind','mud-shot',
 'mud-bomb','silver-wind','twister','dark-pulse','poison-jab','ice-shard','ancient-power']);
const stillPending=new Set();
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
test('Accepted visual designs remain protected, pending effects isolated',()=>{
 assert.equal(new Set(REWORKED_STYLES).size,11);
 assert.deepEqual([...REWORKED_STYLES].sort(),[...expected].sort());
 assert.deepEqual(new Set(BATCH24_MOVES.filter(h=>h.approved).map(h=>h.id)),approved);
 for(const move of BATCH24_MOVES.filter(h=>h.approved&&!approvedReworked.has(h.id))){
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
  assert.ok(move,style+' move must exist');
  assert.equal(move.approved,!stillPending.has(move.id),
   style+' must respect user approval');
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
test('Approved reworked animation functions remain byte-identical to version src-934c8c7dab',async()=>{
 const fs=await import('node:fs/promises');
 const source=await fs.readFile(new URL('../tools/pokearena/batch24/visual-upgrades.js',import.meta.url),'utf8');
 // Exact FNV hashes of the original approved visual function bodies:
 // any later accidental change MUST fail the pipeline.
 const locked={acidJet:173985606,acidSpray:675398617,icyWind:2451380280,
  mudShot:2388012752,mudBomb:3675147426,silverWind:138426087,twister:2425531994,
  darkPulse:3417482802};
 for(const [name,expected] of Object.entries(locked)){
  const start=source.indexOf('function '+name+'(');
  let next=source.indexOf('\nfunction ',start+9);
  if(next<0)next=source.indexOf('\nexport function ',start+9);
  assert.ok(start>=0&&next>start,name+' remains installed');
  const body=source.slice(start,next);
  let hash=2166136261;
  for(let i=0;i<body.length;i++)hash=Math.imul(hash^body.charCodeAt(i),16777619)>>>0;
  assert.equal(hash,expected,name+' approved artwork was modified unexpectedly');
 }
});
test('Dark Pulse renders original-style black/violet rings and Ice Shard distinct ice crystals',async()=>{
 const {SHAPES}=await import('../tools/pokearena/batch24/pixels.js');
 assert.deepEqual(SHAPES.p2darkring,['..0000..','.011110.','01....10','01.33.10',
  '01.33.10','01....10','.011110.','..0000..']);
 assert.ok(SHAPES.iceDagger.length>=12);
 assert.ok(SHAPES.frostChip.length>=6);
 const ice=BATCH24_MOVES.find(h=>h.id==='ice-shard');
 const dark=BATCH24_MOVES.find(h=>h.id==='dark-pulse');
 const gIce=graphics(),gDark=graphics();
 paintReworkedMove(gIce,ice,100,100,4,0);
 paintReworkedMove(gDark,dark,100,100,4,0);
 assert.ok(gIce.rows.some(row=>row[4]===0xffffff),'Ice has bright white facets');
 assert.ok(gDark.rows.some(row=>row[4]===0x090b15),'Dark Pulse has a black ink core');
});
test('Poison Jab violet impact exists only when used on confirmed hit',()=>{
 const jab=BATCH24_MOVES.find(h=>h.id==='poison-jab'),g=graphics();
 assert.equal(paintReworkedImpact(g,jab,100,100,.11),true);
 assert.ok(g.rows.some(row=>row[4]===0xb08abe||row[4]===0x86539a),
  'Purple contact flash must be recognizable without being oversized');
});
test('Poison Jab contact flash stays small and translucent; no generic explosion',async()=>{
 const jab=BATCH24_MOVES.find(h=>h.id==='poison-jab');
 const impact=graphics();
 assert.equal(paintReworkedImpact(impact,jab,100,100,.08),true);
 assert.ok(impact.rows.length>=25&&impact.rows.length<100,'a single tiny pixel spark');
 assert.ok(impact.rows.every(row=>Math.abs(row[0]-100)<10&&Math.abs(row[1]-100)<10),
  'Poison Jab impact must occupy only a small contact radius');
 assert.ok(impact.rows.every(row=>row[5]<=.45),'the violet effect must be subtle');
 const late=graphics();
 assert.equal(paintReworkedImpact(late,jab,100,100,.20),false);
 assert.equal(late.rows.length,0,'brief effect disappears within 200ms');
 const fs=await import('node:fs/promises');
 const runtime=await fs.readFile(new URL('../tools/pokearena/batch24/runtime.js',import.meta.url),'utf8');
 assert.ok(runtime.includes('if(contact&&landed&&age>=impactAt)'),
  'no impact when the real physical hit misses');
 assert.ok(runtime.includes('if(jab){\n    // One small translucent violet FLASH on confirmed impact only.'));
 assert.ok(!runtime.includes('POISON_JAB_HIT'),'giant generic poison explosion was removed');
});
test('Crystal size is reduced without touching the seven-shot Pay Day trajectory',async()=>{
 const fs=await import('node:fs/promises');
 const visuals=await fs.readFile(new URL('../tools/pokearena/batch24/visual-upgrades.js',import.meta.url),'utf8');
 const start=visuals.indexOf('function iceShard('),end=visuals.indexOf('function icyWind(',start);
 const body=visuals.slice(start,end);
 assert.ok(body.includes("ICE_GLASS,.68,a-PI/4+spin+tip"),'main crystal is small');
 assert.ok(body.includes("ICE_GLASS,.24,"),'subcrystal is even smaller');
 const runtime=await fs.readFile(new URL('../tools/pokearena/batch24/runtime.js',import.meta.url),'utf8');
 assert.ok(runtime.includes('const count=iceFan?7:'));
 assert.ok(runtime.includes('delay:i*(iceFan?.075:.12)'));
 assert.ok(runtime.includes("(i-(count-1)/2)*.09"));
 assert.ok(runtime.includes('iceFan?1/count:1'));
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
