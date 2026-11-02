import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCampaignDodgeTemplates,campaignNativeDodge,CAMPAIGN_DODGE_FALLBACK}
 from '../tools/pokearena/torre2-campaign-native-dodges.js';
const h=(nombre,forma='dash',extra={})=>({nombre,forma,tipo:'NORMAL',
 dano:0,dist:100,dur:.22,cd:5,anim:'Walk',...extra});
const roster=[
 {id:'original',kit:{esp:h('Teleport')},evoluciones:[{kit:{esp:h('Fly','vuelo')}}]},
 {id:'new',torre2ArenaAdded:true,kit:{esp:h('Fake Dodge')}}
];
const templates=()=>buildCampaignDodgeTemplates(roster,[
 h('Rollout'),h('Dig'),h('Acrobatics','vuelo'),h('Quick Attack'),
 h('Dive','vuelo'),h('Flame Charge'),h('Rapid Spin'),
 h('Unapproved','dash',{source:'new-phaser-fx',approved:false}),
 h('Pending','dash',{pendiente:true})]);
test('campaign templates reuse only P2 native dash/flight, not fake, pending or unapproved moves',()=>{
 const before=JSON.stringify(roster),lib=templates();
 assert.equal(lib.get('teleport').nombre,'Teleport');
 assert.equal(lib.get('fly').forma,'vuelo');
 assert.equal(lib.has('fake-dodge'),false);
 assert.equal(lib.has('unapproved'),false);
 assert.equal(lib.has('pending'),false);
 assert.equal(JSON.stringify(roster),before);
});
test('species-specific native techniques occupy ESP instead of generic Dodge',()=>{
 const map=templates();
 for(const [id,expected] of [['abra','Teleport'],['geodude','Rollout'],
  ['diglett','Dig'],['butterfree','Fly'],['psyduck','Dive'],
  ['arcanine','Flame Charge'],['staryu','Rapid Spin']]){
  const picked=campaignNativeDodge(id,{lmb:{nombre:'Tackle'}},map);
  assert.equal(picked.nombre,expected,id);
  assert.equal(picked.torre2CampaignNativeEvasion,true);
  assert.ok(['dash','vuelo'].includes(picked.forma));
  assert.ok(picked.cd>0);
 }
});
test('campaign ESP never duplicates already equipped four attack slot names',()=>{
 const map=templates();
 const move=campaignNativeDodge('geodude',{q:{nombre:'Rollout'}},map);
 assert.notEqual(move.nombre,'Rollout');
 assert.ok(move.forma==='dash'||move.forma==='vuelo');
});
test('original P2 species retains exact native ESP and original objects are immutable',()=>{
 const original=h('Native Fly','vuelo',{cd:12,dist:170,alPunto:true});
 const old=JSON.stringify(original),map=templates();
 const selected=campaignNativeDodge('charmander',{lmb:{nombre:'Ember'}},map,original);
 assert.equal(selected.nombre,'Native Fly');assert.equal(selected.cd,12);
 assert.equal(selected.alPunto,true);
 assert.notStrictEqual(selected,original);
 assert.equal(JSON.stringify(original),old);
});
test('original native ESP colliding with equipped attack selects another real dodge',()=>{
 const original=h('Quick Attack'),map=templates();
 const output=campaignNativeDodge('bulbasaur',{lmb:{nombre:'Quick Attack'}},map,original);
 assert.notEqual(output.nombre,'Quick Attack');
 assert.ok(output.forma==='dash'||output.forma==='vuelo');
 assert.ok(output.torre2CampaignNativeEvasion||output.nombre==='Dodge');
});
test('unavailable renderer uses existing safe dash, not a fabricated special',()=>{
 const m=campaignNativeDodge('unknown',{},new Map());
 assert.equal(m.nombre,'Dodge');
 assert.equal(m.forma,'dash');assert.equal(m.cd,CAMPAIGN_DODGE_FALLBACK.cd);
 assert.notEqual(m.torre2CampaignNativeEvasion,true);
 const invalid=campaignNativeDodge('geodude',{},new Map(),h('Bad','projectile'));
 assert.equal(invalid.nome,undefined);
 assert.equal(invalid.nombre,'Dodge');
});
