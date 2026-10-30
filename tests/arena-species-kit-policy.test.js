import test from 'node:test';
import assert from 'node:assert/strict';
import {selectArenaSpeciesKit,enforceArenaMoveCooldowns,replaceGengarHyperBeam,chooseEeveeBranch,installArenaMovePolicy}
 from '../tools/pokearena/torre2-arena-move-policy.js';
import darkPulse from '../tools/pokearena/batch24/dark-pulse.js';
const move=(nombre,dano=10,cd=5,tipo='NORMAL')=>({nombre,forma:'proyectil',dano,cd,tipo,coste:20,alcance:200});
const set=(...moves)=>new Map(moves.map(m=>[m.nombre.toLowerCase(),m]));
test('Blizzard Hydro Pump Seismic Toss and Egg Bomb use the requested 2–4s Arena rhythm',()=>{
 const kit={lmb:move('Hydro Pump',20,0,'WATER'),
            rmb:move('Seismic Toss',16,0,'FIGHTING'),
            q:move('Blizzard',19,0,'ICE'),
            e:move('Ice Beam',13,6.8,'ICE')};
 const tuned=enforceArenaMoveCooldowns(kit);
 assert.equal(tuned.lmb.cd,3.5);assert.equal(tuned.rmb.cd,3);
 assert.equal(tuned.q.cd,4);assert.equal(tuned.e.cd,6.8);
 assert.equal(kit.q.cd,0,'Do not mutate original source move metadata');
 const oldHigh={lmb:move('Hydro Pump',20,9.5,'WATER'),
  rmb:move('Seismic Toss',16,8,'FIGHTING'),
  q:move('Blizzard',19,10,'ICE'),esp:move('Dodge',0,4.2)};
 const normalized=enforceArenaMoveCooldowns(oldHigh);
 assert.deepEqual(['lmb','rmb','q'].map(slot=>normalized[slot].cd),[3.5,3,4]);
 assert.equal(oldHigh.lmb.cd,9.5,'Source remains intact');
 assert.strictEqual(normalized.esp,oldHigh.esp,'Dodge unchanged');
 assert.strictEqual(enforceArenaMoveCooldowns(normalized),normalized,'Idempotent normalization');
 const aliases={lmb:move('Hidrobomba',20,0),rmb:move('Movimiento Sismico',15,0),
  q:move('Ventisca',20,0)};
 assert.deepEqual(['lmb','rmb','q'].map(k=>enforceArenaMoveCooldowns(aliases)[k].cd),[3.5,3,4]);
 const eggs=['Egg Bomb','Eggbomb','Bomba de Ovo','Bomba-ovo','Bomba de Huevos'];
 for(const name of eggs){
  const raw={q:move(name,16,0,'NORMAL')};
  const adjusted=enforceArenaMoveCooldowns(raw);
  assert.equal(adjusted.q.cd,3,'Egg Bomb alias '+name+' should have 3s cooldown');
  assert.equal(raw.q.cd,0,'Original Egg Bomb must remain untouched');
 }
 const eggLegacy={e:move('Egg Bomb',18,7,'NORMAL')};
 assert.equal(enforceArenaMoveCooldowns(eggLegacy).e.cd,3,'Old higher cooldown must be reduced');
 const missing=Object.freeze({rmb:move('Egg Bomb',18,undefined,'NORMAL')});
 assert.equal(enforceArenaMoveCooldowns(missing).rmb.cd,3,'Missing Egg Bomb cooldown must be set');

});
test('Thunder cooldown is 3s in Arena without changing other electrical moves or source metadata',()=>{
 const native={lmb:move('Thunder',25,15,'ELECTRIC'),
  rmb:move('Thunderbolt',17,6.25,'ELECTRIC'),
  q:move('Thunder Wave',0,9,'ELECTRIC'),
  e:move('Discharge',16,7.5,'ELECTRIC'),
  esp:move('Dash',0,1)};
 const output=enforceArenaMoveCooldowns(native);
 assert.equal(output.lmb.cd,3,'Thunder is exactly 3s');
 assert.equal(output.rmb.cd,6.25,'Thunderbolt stays untouched');
 assert.equal(output.q.cd,9,'Thunder Wave stays untouched');
 assert.equal(output.e.cd,3,'Discharge must follow the requested 3s cooldown');
 assert.strictEqual(output.rmb,native.rmb);
 assert.strictEqual(output.q,native.q);
 assert.notStrictEqual(output.e,native.e);
 assert.equal(native.e.cd,7.5,'Original Discharge metadata is preserved');
 assert.strictEqual(output.esp,native.esp);
 assert.equal(native.lmb.cd,15,'Original source client remains unchanged');
 assert.equal(output.lmb.forma,native.lmb.forma,'Approved VFX renderer untouched');
 assert.equal(output.lmb.dano,native.lmb.dano,'Attack damage untouched');
 assert.strictEqual(enforceArenaMoveCooldowns(output),output,'Cooldown is stable');
 const empty={lmb:move('Thunder',20,0,'ELECTRIC')};
 assert.equal(enforceArenaMoveCooldowns(empty).lmb.cd,3,'Zero cooldown fixed');
 const unavailable={q:move('Thunder Shock',10,5,'ELECTRIC')};
 assert.strictEqual(enforceArenaMoveCooldowns(unavailable),unavailable,'Different move remains unchanged');
});
test('Psybeam cooldown is 3s, while Psychic, Psywave and Confusion keep their original timing',()=>{
 const kit={lmb:move('Psybeam',18,12,'PSYCHIC'),
            rmb:move('Psychic',20,8.5,'PSYCHIC'),
            q:move('Psywave',12,4.7,'PSYCHIC'),
            e:move('Confusion',10,2.6,'PSYCHIC')};
 const out=enforceArenaMoveCooldowns(kit);
 assert.equal(out.lmb.cd,3);
 assert.equal(out.rmb.cd,8.5);
 assert.equal(out.q.cd,4.7);
 assert.equal(out.e.cd,2.6);
 assert.equal(kit.lmb.cd,12,'Source client move unchanged');
 assert.equal(out.lmb.forma,kit.lmb.forma,'Renderer unchanged');
 assert.equal(out.lmb.dano,kit.lmb.dano,'Damage unchanged');
 assert.strictEqual(out.rmb,kit.rmb);
 assert.strictEqual(out.q,kit.q);
 assert.strictEqual(out.e,kit.e);
 assert.strictEqual(enforceArenaMoveCooldowns(out),out);
 const alternate={q:move('Psy Beam',16,0,'PSYCHIC')};
 assert.equal(enforceArenaMoveCooldowns(alternate).q.cd,3,'Psy Beam alternate spelling');
});
test('Only Fire Blast and Charge gain 2–4s cooldowns; unrelated moves and source metadata are preserved',()=>{
 const raw={lmb:move('Fire Blast',23,12,'FIRE'),rmb:move('Charge',0,9,'ELECTRIC'),
  q:move('Flamethrower',16,5.6,'FIRE'),e:move('Fire Punch',12,4.8,'FIRE')};
 const next=enforceArenaMoveCooldowns(raw);
 assert.equal(next.lmb.cd,3.5);
 assert.equal(next.rmb.cd,3);
 assert.equal(next.q.cd,5.6);
 assert.equal(next.e.cd,4.8);
 assert.equal(raw.lmb.cd,12);
 assert.equal(raw.rmb.cd,9);
 assert.strictEqual(next.q,raw.q);
 assert.strictEqual(next.e,raw.e);
 assert.equal(next.lmb.forma,raw.lmb.forma);
 assert.equal(next.rmb.forma,raw.rmb.forma);
 assert.equal(next.lmb.dano,raw.lmb.dano);
 assert.strictEqual(enforceArenaMoveCooldowns(next),next);
 const oldZero={e:move('Fire Blast',22,0),q:move('Charge',0,0)};
 assert.equal(enforceArenaMoveCooldowns(oldZero).e.cd,3.5);
 assert.equal(enforceArenaMoveCooldowns(oldZero).q.cd,3);
 const other={lmb:move('Flame Charge',15,8,'FIRE'),q:move('Thunderbolt',13,6,'ELECTRIC')};
 assert.strictEqual(enforceArenaMoveCooldowns(other),other);
});
test('Solar Beam cooldown is 3s outside campaign, without altering other grass moves',()=>{
 const original={lmb:move('Solar Beam',22,11,'GRASS'),
  rmb:move('Razor Leaf',12,4.5,'GRASS'),
  q:move('Petal Dance',19,10,'GRASS'),
  e:move('Sunny Day',0,7,'FIRE')};
 const out=enforceArenaMoveCooldowns(original);
 assert.equal(out.lmb.cd,3,'Solar Beam 3s');
 assert.equal(original.lmb.cd,11,'No mutation of original move data');
 assert.equal(out.lmb.forma,original.lmb.forma,'Retain original approved VFX');
 assert.equal(out.lmb.dano,original.lmb.dano,'Retain damage');
 for(const slot of ['rmb','q','e'])assert.strictEqual(out[slot],original[slot],'Do not affect '+slot);
 assert.strictEqual(enforceArenaMoveCooldowns(out),out,'Idempotent');
 for(const name of ['Solarbeam','Rayo Solar']){
  const raw={q:move(name,18,0,'GRASS')};
  assert.equal(enforceArenaMoveCooldowns(raw).q.cd,3,name+' alias');
  assert.equal(raw.q.cd,0,'Do not change original metadata');
 }
});
test('Clefairy uses its installed characteristic Metronome, not generic Hyper Beam',()=>{
 const attacks=[
  move('Pound',6),move('Double Slap',10),move('Psychic',17,8,'PSYCHIC'),
  move('Hyper Beam',32,0),move('Metronome',0,12)
 ];
 const kit={lmb:attacks[0],rmb:attacks[1],q:attacks[2],e:attacks[3]};
 const out=selectArenaSpeciesKit(kit,'clefairy',['NORMAL'],set(...attacks));
 assert.equal(Object.values(out).some(m=>m?.nombre==='Hyper Beam'),false);
 assert.ok(['rmb','q','e'].some(s=>out[s]?.nombre==='Metronome'),'Metronome must remain available');
 assert.equal(kit.e.nombre,'Hyper Beam','Raw native/legacy data must be preserved');
});
test('Persian gets approved Pay Day instead of copied Hyper Beam',()=>{
 const attacks=[
  move('Scratch',5),move('Quick Attack',8),move('Pay Day',10,5.4),
  move('Slash',14),move('Hyper Beam',32,0)
 ];
 const kit={lmb:attacks[0],rmb:attacks[1],q:attacks[2],e:attacks[4]};
 const out=selectArenaSpeciesKit(kit,'persian',['NORMAL'],set(...attacks));
 assert.equal(Object.values(out).some(m=>m?.nombre==='Hyper Beam'),false);
 assert.ok(['rmb','q','e'].some(s=>out[s]?.nombre==='Pay Day'));
});
test('Legal signature attacks keep their approved renderer and unique slots',()=>{
 const attacks=[
  move('Tackle',5),move('Bite',11,5,'DARK'),
  {...move('Bonemerang',11,5.7,'GROUND'),forma:'torre2_bonemerang'},
  move('Bone Club',12,5,'GROUND'),move('Earthquake',21,11,'GROUND'),
  move('Hyper Beam',30,0)
 ];
 const kit={lmb:attacks[0],rmb:attacks[1],q:attacks[2],e:attacks[5]};
 const out=selectArenaSpeciesKit(kit,'marowak',['GROUND'],set(...attacks));
 assert.ok(['rmb','q','e'].some(s=>out[s]?.nombre==='Bonemerang'));
 assert.ok(Object.values(out).some(h=>h?.forma==='torre2_bonemerang'));
 assert.equal(new Set(['lmb','rmb','q','e'].map(s=>out[s]?.nombre).filter(Boolean)).size,
 ['lmb','rmb','q','e'].map(s=>out[s]?.nombre).filter(Boolean).length);
 assert.ok(!Object.values(out).some(h=>h?.nombre==='Hyper Beam'));
});
test('Only Dragonair and Clefable get legal installed fourth Arena slots without changing approved attacks',()=>{
 const twister=move('Twister',9,5,'DRAGON'),
  outrage=move('Outrage',19,7,'DRAGON'),
  thunderWave=move('Thunder Wave',0,6,'ELECTRIC'),
  hyperBeam=move('Hyper Beam',31,9,'NORMAL');
 const dragonRaw={lmb:twister,rmb:outrage,q:thunderWave};
 const dragon=selectArenaSpeciesKit(dragonRaw,'dragonair',['DRAGON'],
  set(twister,outrage,thunderWave,hyperBeam));
 assert.equal(dragon.e?.nombre,'Hyper Beam','Dragonair may learn Hyper Beam in Gen III');
 assert.equal(dragon.e?.forma,hyperBeam.forma,'reuse installed native renderer');
 assert.equal(dragon.e?.dano,hyperBeam.dano,'do not change approved VFX damage');
 assert.equal(dragon.e?.ulti,true);
 assert.deepEqual(['lmb','rmb','q'].map(s=>dragon[s]?.nombre),
  ['Twister','Outrage','Thunder Wave']);
 assert.equal(dragonRaw.e,undefined,'base kit stays untouched');
 const pound=move('Pound',6),metronome=move('Metronome',0,12),
  light=move('Light Screen',0,8,'PSYCHIC'),
  psychic=move('Psychic',19,7,'PSYCHIC');
 const fairyRaw={lmb:pound,rmb:metronome,q:light};
 const pool=set(pound,metronome,light,psychic,hyperBeam);
 const fairy=selectArenaSpeciesKit(fairyRaw,'clefable',['NORMAL'],pool);
 assert.equal(fairy.e?.nombre,'Psychic','legal Gen III TM, not generic Hyper Beam');
 assert.equal(fairy.e?.forma,psychic.forma);
 assert.equal(fairy.e?.dano,psychic.dano);
 assert.equal(fairy.e?.ulti,true);
 assert.deepEqual(['lmb','rmb','q'].map(s=>fairy[s]?.nombre),
  ['Pound','Metronome','Light Screen']);
 assert.ok(!['lmb','rmb','q','e'].some(s=>fairy[s]?.nombre==='Hyper Beam'));
 assert.equal(fairyRaw.e,undefined);
 const unevolved=selectArenaSpeciesKit(fairyRaw,'clefairy',['NORMAL'],pool);
 assert.notEqual(unevolved.e?.nombre,'Psychic','do not automatically teach a TM to Clefairy');
 assert.notEqual(unevolved.e?.nombre,'Hyper Beam');
});

test('Eevee branches to each of Vaporeon Jolteon Flareon using independently seeded draws',()=>{
 assert.equal(chooseEeveeBranch(3,()=>0),1);
 assert.equal(chooseEeveeBranch(3,()=>.40),2);
 assert.equal(chooseEeveeBranch(3,()=>.99),3);
 assert.equal(chooseEeveeBranch(3,()=>1),3);
});
test('Arena fighter modifications are conditional; campaign/native kits stay untouched',()=>{
 class Fighter{
  constructor(def,campaign=false){this.def=def;this.etapa=0;this.escena={datos:campaign?{torre2:true}:{modo:'cpu'}};}
  get forma(){const e=this.def.evoluciones[this.etapa-1];return this.etapa?{...this.def,...e}:this.def;}
  get puedeEvolucionar(){return this.etapa<this.def.evoluciones.length;}
  kitActual(){return this.forma.kit;}
 }
 const eevee={
  id:'eevee',tipos:['NORMAL'],kit:{lmb:move('Quick Attack',7)},
  evoluciones:[
   {nombre:'VAPOREON',tipos:['WATER'],kit:{lmb:move('Hydro Pump',20,0,'WATER')}},
   {nombre:'JOLTEON',tipos:['ELECTRIC'],kit:{lmb:move('Thunderbolt',15,5,'ELECTRIC')}},
   {nombre:'FLAREON',tipos:['FIRE'],kit:{lmb:move('Fire Blast',20,5,'FIRE')}}
  ]
 };
 const originalKit=eevee.kit;
 installArenaMovePolicy(Fighter,[eevee]);
 const native=new Fighter(eevee);
 assert.strictEqual(native.kitActual(),originalKit);
 native.etapa=1;
 const evolved=native.forma;
 assert.ok(['VAPOREON','JOLTEON','FLAREON'].includes(evolved.nombre));
 assert.equal(native.forma.nombre,evolved.nombre,'Evolution stable for one fighter');
 assert.equal(native.puedeEvolucionar,false,'Eevee cannot evolve again into another branch');
 assert.equal(native.kitActual().lmb.cd,evolved.nombre==='VAPOREON'?3.5:evolved.nombre==='FLAREON'?3.5:5);
 const story=new Fighter(eevee,true);story.etapa=1;
 assert.equal(story.forma.nombre,'VAPOREON','Campaign stays on existing evolution branch');
 assert.strictEqual(story.kitActual(),eevee.evoluciones[0].kit,'No Arena cooldown patch in campaign');
 assert.equal(story.puedeEvolucionar,true,'Campaign evolution rule unchanged');
});

test('Psybeam, Discharge and Hyper Beam take 3s / 3s / 4s without touching VFX or campaign',()=>{
 const base={lmb:move('Psybeam',14,0,'PSYCHIC'),
  rmb:move('Discharge',17,0,'ELECTRIC'),
  q:move('Hyper Beam',32,0,'NORMAL'),
  e:move('Shadow Ball',22,8,'GHOST')};
 const tuned=enforceArenaMoveCooldowns(base);
 assert.deepEqual(['lmb','rmb','q'].map(slot=>tuned[slot].cd),[3,3,4]);
 for(const slot of ['lmb','rmb','q']){
  assert.equal(base[slot].cd,0,'Original move must not be mutated');
  assert.equal(tuned[slot].forma,base[slot].forma,'Keep approved renderer');
  assert.equal(tuned[slot].dano,base[slot].dano,'Keep damage');
 }
 assert.strictEqual(tuned.e,base.e,'Unrelated move remains native');
 assert.strictEqual(enforceArenaMoveCooldowns(tuned),tuned);
 const aliases={lmb:move('Psy Beam',15,0),rmb:move('Descarga',18,0),q:move('Hiperrayo',30,0)};
 assert.deepEqual(['lmb','rmb','q'].map(slot=>enforceArenaMoveCooldowns(aliases)[slot].cd),[3,3,4]);
});
test('Native Gengar drops only generic Hyper Beam in Arena and keeps approved Ghost/Poison VFX',()=>{
 const shadow=move('Shadow Ball',23,6,'GHOST'),sludge=move('Sludge Bomb',24,7,'POISON');
 const nightmare=move('Night Shade',15,5,'GHOST'),hypnosis=move('Hypnosis',0,5,'PSYCHIC');
 const beam=move('Hyper Beam',35,0,'NORMAL');
 const native={lmb:hypnosis,rmb:shadow,q:beam,e:nightmare,esp:move('Dodge',0,1)};
 const pool=set(shadow,sludge,nightmare,hypnosis,beam);
 const cleaned=replaceGengarHyperBeam(native,pool);
 assert.equal(cleaned.q.nombre,'Sludge Bomb','Prefer installed Sludge Bomb when Shadow Ball already equipped');
 assert.equal(cleaned.q.forma,sludge.forma,'Do not fake or replace VFX');
 assert.equal(cleaned.q.dano,sludge.dano,'Keep installed move power');
 assert.deepEqual(['lmb','rmb','e'].map(k=>cleaned[k]),['lmb','rmb','e'].map(k=>native[k]));
 assert.strictEqual(cleaned.esp,native.esp,'Original dodge remains untouched');
 assert.equal(native.q.nombre,'Hyper Beam','Never mutate original native kit');
 assert.ok(!['lmb','rmb','q','e'].some(k=>cleaned[k]?.nombre==='Hyper Beam'));
 const missing=replaceGengarHyperBeam({lmb:beam},new Map());
 assert.equal(missing.lmb.nombre,'Hyper Beam','Never insert a nonexistent renderer');
});
test('Live Gengar Arena policy also covers evolved Gastly but not campaign or other native species',()=>{
 class Fighter{
  constructor(def,campaign=false,stage=0){this.def=def;this.etapa=stage;this.mega=false;
   this.aspecto=null;this.escena={datos:campaign?{torre2:true}:{modo:'cpu'}};}
  get forma(){return this.etapa?{...this.def,...this.def.evoluciones[this.etapa-1]}:this.def;}
  get puedeEvolucionar(){return this.etapa<this.def.evoluciones.length;}
  kitActual(){return this.forma.kit;}
 }
 const shadow=move('Shadow Ball',24,5,'GHOST'),sludge=move('Sludge Bomb',24,5,'POISON');
 const beam=move('Hyper Beam',30,0,'NORMAL'),confusion=move('Confusion',8,4,'PSYCHIC');
 const nativeKit={lmb:confusion,rmb:shadow,q:beam,e:move('Night Shade',19,5,'GHOST')};
 const gastly={id:'gastly',tipos:['GHOST','POISON'],kit:{lmb:confusion},
  evoluciones:[{nombre:'HAUNTER',kit:{lmb:confusion,rmb:shadow}},
   {nombre:'GENGAR',kit:nativeKit}]};
 const donor={id:'muk',tipos:['POISON'],kit:{lmb:sludge},evoluciones:[]};
 installArenaMovePolicy(Fighter,[gastly,donor]);
 const arena=new Fighter(gastly,false,2),campaign=new Fighter(gastly,true,2);
 const corrected=arena.kitActual();
 assert.equal(corrected.q.nombre,'Sludge Bomb','Gengar evolution must be corrected at fighter runtime');
 assert.strictEqual(campaign.kitActual(),nativeKit,'Gen III campaign keeps original kit');
 assert.equal(nativeKit.q.nombre,'Hyper Beam','Native source untouched');
 assert.equal(new Fighter(gastly,false,1).kitActual().rmb.nombre,'Shadow Ball',
  'Haunter existing approved move remains untouched');
});

test('Gengar duplicated native Sludge Bomb is replaced by the approved Dark Pulse VFX',()=>{
 const hypnosis=move('Hypnosis',0,12,'PSYCHIC'),
  sludge=move('Sludge Bomb',22,7,'POISON'),
  shadow=move('Shadow Ball',24,6,'GHOST'),
  dodge=move('Dodge',0,4);
 const native={lmb:hypnosis,rmb:sludge,q:{...sludge},e:shadow,esp:dodge};
 const originalSlots=['lmb','rmb','q','e'].map(k=>native[k].nombre);
 assert.deepEqual(originalSlots,['Hypnosis','Sludge Bomb','Sludge Bomb','Shadow Ball'],
  'Reproduce the exact Gengar duplication observed in real Chromium');
 assert.equal(darkPulse.approved,true,'Use an approved effect, never invent a new renderer');
 assert.equal(darkPulse.forma,'torre2_batch24_dark_pulse','Installed Batch24 VFX');
 const library=set(hypnosis,sludge,shadow,darkPulse);
 const fixed=replaceGengarHyperBeam(native,library);
 const names=['lmb','rmb','q','e'].map(k=>fixed[k]?.nombre);
 assert.deepEqual(names,['Hypnosis','Sludge Bomb','Dark Pulse','Shadow Ball']);
 assert.equal(new Set(names).size,4,'No duplicate moves in the four attack slots');
 assert.strictEqual(fixed.lmb,native.lmb,'Preserve native Hypnosis');
 assert.strictEqual(fixed.rmb,native.rmb,'Preserve native Sludge Bomb and its VFX');
 assert.strictEqual(fixed.e,native.e,'Preserve native Shadow Ball ULT');
 assert.strictEqual(fixed.esp,native.esp,'Preserve dodge');
 assert.equal(fixed.q.forma,darkPulse.forma,'Reuse already-approved Dark Pulse animation');
 assert.equal(fixed.q.dano,darkPulse.dano,'Reuse balanced installed attack damage');
 assert.equal(fixed.q.cd,darkPulse.cd,'Reuse installed attack cooldown');
 assert.equal(fixed.q.ulti,false,'Dark Pulse must not become a second ultimate');
 assert.equal(fixed.q.pendiente,false,'New attack must be selectable');
 assert.strictEqual(replaceGengarHyperBeam(fixed,library),fixed,'No repeated kit rewrites');
 assert.equal(native.q.nombre,'Sludge Bomb','Never mutate original/native kit');
});
test('Gengar Hyper Beam is replaced with Dark Pulse without copying an occupied move',()=>{
 const base={lmb:move('Hypnosis',0),rmb:move('Sludge Bomb',22,7,'POISON'),
  q:move('Hyper Beam',33,4),e:move('Shadow Ball',25,6,'GHOST')};
 const pool=set(...Object.values(base),darkPulse);
 const out=replaceGengarHyperBeam(base,pool);
 assert.equal(out.q.nombre,'Dark Pulse');
 assert.equal(new Set(['lmb','rmb','q','e'].map(s=>out[s].nombre)).size,4);
 assert.equal(base.q.nombre,'Hyper Beam','Original native source remains intact');
});
