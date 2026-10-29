import test from 'node:test';
import assert from 'node:assert/strict';
import {clearDepartingCombat} from '../tools/pokearena/torre2-combat-boundary.js';
test('switch cancels queued contact and projectiles without healing or clearing peer status',()=>{
 let destroyed=0;const actor={hp:30,est:{veneno:{dur:4}},accion:{},vx:22};
 const scene={efectos:[{destroy(){destroyed++}}],tareas:[{fn(){actor.hp-=20}}],luchadores:[actor]};
 clearDepartingCombat(scene);clearDepartingCombat(scene);
 assert.equal(destroyed,1);assert.deepEqual(scene.tareas,[]);assert.deepEqual(scene.efectos,[]);
 assert.equal(actor.hp,30);assert.equal(actor.est.veneno.dur,4);assert.equal(actor.accion,null);assert.equal(actor.vx,0);
});

test('T04 queued multihit and repeated projectile references cannot block safe switch',()=>{
 const actor={hp:44,ko:false,est:{paralizado:{turns:2}},accion:{hit:'old'},
  animAccion:'attack',animAccionHasta:12,dash:{},mediaCarga:4,cargaTipo:'charge',
  vx:3,vy:-2,empX:9,empY:-7};
 const opponent={hp:68,ko:false,est:{veneno:{turns:3}},accion:{hit:'old'},
  vx:2,vy:2};
 let destroyed=0;
 const vfx={destroy(){destroyed++}};
 const queued=[
  {fn(){actor.hp-=20;}},{fn(){opponent.hp-=25;}},
  {fn(){actor.hp=0;}}
 ];
 const scene={efectos:[vfx,null,vfx,undefined],tareas:queued,
  foco:actor,luchadores:[actor,null,opponent]};
 clearDepartingCombat(scene);
 assert.equal(destroyed,1,'Repeated reference destroyed once');
 assert.equal(scene.foco,null);
 assert.equal(scene.efectos.length,0);
 assert.equal(scene.tareas.length,0);
 assert.equal(actor.hp,44,'Outgoing Pokémon HP unchanged');
 assert.equal(opponent.hp,68,'Opponent HP unchanged');
 assert.equal(actor.ko,false);
 assert.equal(opponent.ko,false);
 assert.deepEqual(actor.est.paralizado,{turns:2});
 assert.deepEqual(opponent.est.veneno,{turns:3});
 for(const a of [actor,opponent]){
  assert.equal(a.accion,null);
  for(const k of ['vx','vy','empX','empY'])assert.equal(a[k],0);
 }
 clearDepartingCombat(scene);
 assert.equal(destroyed,1,'Re-entering cleanup cannot re-destroy effect');
});

test('T04 an empty effect collection still clears native delayed hits and living actions',()=>{
 const actor={hp:100,est:{},accion:{kind:'charging'},dash:{},
  vx:4,vy:9,empX:12,empY:8};
 const scene={efectos:null,tareas:[{fn(){actor.hp-=40}}],luchadores:[actor]};
 clearDepartingCombat(scene);
 assert.deepEqual(scene.efectos,[]);
 assert.deepEqual(scene.tareas,[]);
 assert.equal(actor.hp,100);
 assert.equal(actor.accion,null);
 assert.equal(actor.dash,null);
});

test('T04 a broken VFX destructor does not interrupt recall cleanup',()=>{
 const calls={broken:0,healthy:0};
 const broken={destroy(){calls.broken++;throw Error('Phaser texture already released')}};
 const healthy={destroy(){calls.healthy++}};
 const player={hp:27,status:{kind:'poison'},accion:{kind:'charge'},dash:{},vx:7,vy:2};
 const enemy={hp:61,status:{kind:'burn'},accion:{kind:'hit'},vx:-4,vy:1};
 const scene={efectos:[broken,null,broken,healthy],tareas:[{fn(){enemy.hp-=20}}],
  foco:player,luchadores:[player,enemy]};
 assert.doesNotThrow(()=>clearDepartingCombat(scene));
 assert.deepEqual(calls,{broken:1,healthy:1},'Destroy each reference once, even after a throw');
 assert.deepEqual(scene.efectos,[]);
 assert.deepEqual(scene.tareas,[]);
 assert.equal(scene.foco,null);
 assert.deepEqual([player.hp,enemy.hp],[27,61]);
 assert.deepEqual([player.status,enemy.status],[{kind:'poison'},{kind:'burn'}]);
 for(const actor of [player,enemy]){
  assert.equal(actor.accion,null);
  assert.equal(actor.dash,null);
  assert.equal(actor.vx,0);
  assert.equal(actor.vy,0);
 }
 clearDepartingCombat(scene);
 assert.deepEqual(calls,{broken:1,healthy:1},'Cleanup must be idempotent');
});
