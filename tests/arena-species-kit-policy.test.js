import test from 'node:test';
import assert from 'node:assert/strict';
import {selectArenaSpeciesKit,enforceArenaMoveCooldowns,chooseEeveeBranch,installArenaMovePolicy}
 from '../tools/pokearena/torre2-arena-move-policy.js';
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
 assert.equal(output.e.cd,7.5,'Discharge stays untouched');
 assert.strictEqual(output.rmb,native.rmb);
 assert.strictEqual(output.q,native.q);
 assert.strictEqual(output.e,native.e);
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
 assert.equal(native.kitActual().lmb.cd,evolved.nombre==='VAPOREON'?3.5:5);
 const story=new Fighter(eevee,true);story.etapa=1;
 assert.equal(story.forma.nombre,'VAPOREON','Campaign stays on existing evolution branch');
 assert.strictEqual(story.kitActual(),eevee.evoluciones[0].kit,'No Arena cooldown patch in campaign');
 assert.equal(story.puedeEvolucionar,true,'Campaign evolution rule unchanged');
});
