import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../tools/pokearena/build-preview.mjs',import.meta.url),'utf8');
const match=source.match(/\['return this\.aspecto\?vfx\.kitAspecto\(kit,this\.aspecto\):kit',\s*'([^'\n]+)'\]/);
assert.ok(match,'The non-campaign move patch must be installed in the Phaser builder');
// Execute the exact getter expression that the builder installs, with a
// synthetic starter kit. No edits to original Poké Arena assets are needed.
const readKit=new Function('kit','vfx',match[1]);
const initial={
 lmb:{nombre:'Tackle',pendiente:false,forma:'impact'},
 rmb:{nombre:'Vine Whip',pendiente:true,torre2UnlockLevel:10,forma:'vine'},
 q:{nombre:'Leech Seed',pendiente:true,torre2RequiresTM:true,forma:'seed'},
 e:{nombre:'Solar Beam',pendiente:true,ulti:true,forma:'beam'},
 esp:{nombre:'Dodge',pendiente:true,forma:'dash'}
};
const vfx={kitAspecto:(kit,aspecto)=>Object.fromEntries(
 Object.entries(kit).map(([slot,move])=>[slot,{...move,skin:aspecto}]))};
const scene=(modo,other={})=>({aspecto:'approved',lado:0,escena:{datos:{modo,...other}}});

test('Arena, Training, VS CPU and League have all four moves usable',()=>{
 for(const modo of ['arena','entreno','cpu','liga']){
  const output=readKit.call(scene(modo),initial,vfx);
  for(const slot of ['lmb','rmb','q','e']){
   assert.equal(output[slot].pendiente,false,modo+' '+slot);
   assert.equal(output[slot].skin,'approved','preserve approved move appearance');
  }
  assert.equal(output.e.ulti,true,'ultimate still requires combat energy');
  assert.equal(output.esp.pendiente,true,'do not change special dodge');
  assert.equal(output.rmb.torre2UnlockLevel,10,'retain campaign learn-level metadata');
  assert.equal(output.q.torre2RequiresTM,true,'retain campaign TM metadata');
 }
});

test('Kanto campaign retains level/TM locking and its own resolved moves',()=>{
 const context=scene('campanha',{torre2:true,torre2Loadout:{
  lmb:{nombre:'Tackle',forma:'impact',pendiente:false}
 }});
 const output=readKit.call(context,initial,vfx);
 assert.equal(output.lmb.nombre,'Tackle');
 assert.equal(output.lmb.pendiente,false);
 for(const slot of ['rmb','q','e']){
  assert.equal(output[slot].nombre,'LOCKED');
  assert.equal(output[slot].pendiente,true);
 }
 const enemy={...context,lado:1,escena:{datos:{
  torre2:true,torre2OpponentLoadout:{lmb:{nombre:'Scratch',pendiente:false}}
 }}};
 assert.equal(readKit.call(enemy,initial,vfx).lmb.nombre,'Scratch');
 assert.equal(readKit.call(enemy,initial,vfx).q.pendiente,true);
});

test('the original starter kit and approved animations are never mutated',()=>{
 readKit.call(scene('arena'),initial,vfx);
 assert.equal(initial.rmb.pendiente,true);
 assert.equal(initial.e.pendiente,true);
 assert.equal(initial.e.forma,'beam');
 assert.equal(initial.esp.forma,'dash');
});
