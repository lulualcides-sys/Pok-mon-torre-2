import test from 'node:test';
import assert from 'node:assert/strict';
import {
 MISTY_ROUTE_BASE,SURGE_ROUTE_BASE,LATE_GYM_BASE,EARLY_KANTO_BASE,EARLY_KANTO_FORMS,
 EARLY_KANTO_LEARNSETS,EARLY_KANTO_SLOTS,KANTO_ROUTE_SLOTS,
 nativeKantoEvolutionPlan,addEarlyKantoSpecies
} from '../tools/pokearena/torre2-early-kanto-species.js';
import {BATCH24_MOVES} from '../tools/pokearena/batch24/catalog.js';
import {paintReworkedMove} from '../tools/pokearena/batch24/visual-upgrades.js';

const allBases=[...EARLY_KANTO_BASE,...MISTY_ROUTE_BASE,...SURGE_ROUTE_BASE,...LATE_GYM_BASE];
const native=Object.values(EARLY_KANTO_SLOTS).flat();
const known=[...new Set(native)].map((nombre,i)=>({
 id:'upstream-test-'+i,kit:{lmb:{nombre,forma:'native-test',tipo:'NORMAL',
 dano:6,cd:4,coste:8,alcance:130}}
}));
test('All eight Kanto gyms: 31 unique base families and original Pokémon never overwritten',()=>{
 assert.equal(EARLY_KANTO_BASE.length,10);
 assert.equal(MISTY_ROUTE_BASE.length,7);
 assert.equal(SURGE_ROUTE_BASE.length,6);
 assert.equal(LATE_GYM_BASE.length,8);
 assert.equal(new Set(allBases).size,31);
 const result=addEarlyKantoSpecies(known);
 assert.equal(result.length,31);
 for(const id of allBases){
  const line=result.find(x=>x.id===id);
  assert.ok(line,'Missing family '+id);
  assert.equal(line.dex,EARLY_KANTO_FORMS[id][0]);
  assert.equal(line.evoluciones.length,EARLY_KANTO_FORMS[id].length-1);
  assert.ok(line.kit.lmb&&line.kit.rmb&&line.kit.q&&line.kit.e);
  assert.equal(line.kit.e.ulti,true);
  assert.equal(line.kit.esp.dano,0);
  assert.equal(line.kit.esp.forma,'dash');
  for(const [index,evo] of line.evoluciones.entries()){
   assert.equal(evo.dex,EARLY_KANTO_FORMS[id][index+1]);
   assert.equal(evo.kit.esp.dano,0);
   assert.equal(evo.kit.e.ulti,true,'evolved ultimate uses E');
   const evoId=evo.nombre.toLowerCase();
   const required=EARLY_KANTO_SLOTS[evoId];
   assert.deepEqual(
    [evo.kit.lmb,evo.kit.rmb,evo.kit.q,evo.kit.e].map(m=>m.nombre),
    required,'Evolution inherits wrong 4-slot plan: '+evoId);
  }
 }
 assert.equal(addEarlyKantoSpecies([...known,{id:'paras'}]).some(x=>x.id==='paras'),false,
 'Never duplicate an existing native species');
});
test('Five controls stay distinct: ATK, HAB2, HAB3, ULT and non-damaging Space dodge',()=>{
 for(const [species,slots] of Object.entries(EARLY_KANTO_SLOTS)){
  assert.equal(slots.length,4,species);
  assert.equal(new Set(slots).size,4,'same attack duplicated across roles '+species);
  const learnset=EARLY_KANTO_LEARNSETS[species];
  assert.ok(learnset,'No learnset for '+species);
  for(const move of slots){
   const key=move.toLowerCase().replace(/[^a-z0-9]+/g,'-');
   const evolvedOnly=(['caterpie','metapod'].includes(species)&&move==='Confusion')||
    (['weedle','kakuna'].includes(species)&&move==='Fury Attack');
   if(!evolvedOnly)assert.ok(Number.isInteger(learnset[key]),species+' lacks '+move);
  }
 }
 assert.deepEqual(KANTO_ROUTE_SLOTS.starmie,
  ['Water Gun','Bubble Beam','Psybeam','Water Pulse']);
 assert.deepEqual(KANTO_ROUTE_SLOTS.electrode,
  ['Tackle','Sonic Boom','Discharge','Explosion']);
 assert.deepEqual(KANTO_ROUTE_SLOTS.beedrill,
  ['Poison Sting','Peck','Fury Attack','Cross Poison']);
 assert.deepEqual(nativeKantoEvolutionPlan('venusaur'),
  ['Razor Leaf','Sludge Bomb','Ingrain','Frenzy Plant']);
 assert.deepEqual(nativeKantoEvolutionPlan('blastoise'),
  ['Water Gun','Bubble Beam','Hydro Typhoon','Hydro Cannon']);
 assert.equal(nativeKantoEvolutionPlan('charmander'),null,
  'original basic starters retain native P2 attack kit');
 assert.ok(EARLY_KANTO_LEARNSETS.butterfree.confusion<=10,
  'Butterfree real evolution confusion unlock remains backward-compatible');
});
function draw(){
 const rows=[];let color,alpha;
 return {rows,fillStyle(c,a=1){color=c;alpha=a;return this},
 fillRect(x,y,w,h){rows.push([x,y,w,h,color,alpha]);return this}};
}
test('Ancient Power scales +20% and rock outline is MINT without recoloring originals',()=>{
 const h=BATCH24_MOVES.find(h=>h.id==='ancient-power');
 assert.equal(h.approved,true);
 const g=draw();assert.equal(paintReworkedMove(g,h,100,100,3,.3),true);
 assert.ok(g.rows.some(r=>r[4]===0xb5f8a1),'green outline must be clearly rendered');
 assert.ok(g.rows.length>130,'nine textured rocks and dust remain visible');
 const other=BATCH24_MOVES.find(h=>h.id==='earth-power'),old=draw();
 assert.equal(paintReworkedMove(old,other,100,100,3,.3),false);
 assert.equal(old.rows.length,0,'do not redraw approved native-style rock FX');
});
test('Ice Shard keeps seven-shot physics; crystal sparkle/tumbling has independent 12-frame motion',async()=>{
 const ice=BATCH24_MOVES.find(h=>h.id==='ice-shard');
 assert.equal(ice.approved,true);
 const frames=[];
 for(let i=0;i<12;i++){
  const g=draw();paintReworkedMove(g,ice,100,100,i,.2);
  assert.ok(g.rows.some(r=>r[4]===0xffffff),'crystal must look icy');
  frames.push(JSON.stringify(g.rows.map(r=>[r[0],r[1],r[5]])));
 }
 assert.ok(new Set(frames).size>=10,'visible varied poses, not static crystal');
 const fs=await import('node:fs/promises');
 const runtime=await fs.readFile(new URL('../tools/pokearena/batch24/runtime.js',import.meta.url),'utf8');
 assert.ok(runtime.includes('const count=iceFan?7:'));
 assert.ok(runtime.includes('delay:i*(iceFan?.075:.12)'));
 assert.ok(runtime.includes('(i-(count-1)/2)*.09'));
 assert.ok(runtime.includes('iceFan?1/count:1'));
});
