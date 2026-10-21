import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../tools/pokearena/torre2-prebrock-damage-fx.js',import.meta.url),'utf8');
const moduleText=src.replace("import {clashAt} from './clash-fx.js';",'const clashAt=()=>false;');
assert.notEqual(src,moduleText);
const {rocktomb,hornattack,doublekick,furyattack,TORRE2_PREBROCK_DAMAGE_FORMS}=await import(
 'data:text/javascript;base64,'+Buffer.from(moduleText).toString('base64'));
const EPS=.1;
function battle(targetX,{block=false,immune=false,aimY=100}={}){
 const items=[],pixels=[],scene={efectos:[],add:{graphics(){
  const g={dead:false,setDepth(){return this;},fillStyle(){return this;},
   fillRect(...x){pixels.push(x);return this;},clear(){return this;},
   destroy(){this.dead=true}};
  items.push(g);return g;
 }}};
 const damage=[],state=[],foe={x:targetX,y:100,alto:36,hp:150,est:{},ko:false,
  invulnerable:block,recibir(_l,attack){
   if(block)return'miss';damage.push(attack);this.hp-=attack.dano;return 'golpe';
  },ponerEstado(name,duration,params){state.push([name,duration,params]);}};
 const attacker={x:0,y:100,alto:36,ax:220,ay:aimY,t:0,ko:false,est:{},
  escena:scene,rival:foe,animar(){}};
 return {pixels,items,scene,damage,state,foe,attacker};
}
function run(fn,target,stats,opts){
 const b=battle(target,opts),save=Math.random;
 try{
  Math.random=()=>.1;
  const fx=fn(b.attacker,stats,{slot:'lmb'});
  assert.ok(fx,'Installed Phaser effect');
  const path=[];let active=true,frame=0;
  while(active&&frame++<170){
   active=fx.update(.016);
   path.push(b.attacker.x);
  }
  assert.equal(active,false,'Effect must finish');
  assert.ok(b.items.every(x=>x.dead),'Graphics resources must be disposed');
  assert.ok(b.pixels.length>50,'Pixel matrix rendering required');
  b.path=path;return b;
 }finally{Math.random=save;}
}
test('Only unique absent early Kanto moves are registered',()=>{
 assert.deepEqual(Object.keys(TORRE2_PREBROCK_DAMAGE_FORMS).sort(),[
  'torre2_doublekick','torre2_furyattack','torre2_hornattack','torre2_rocktomb'
 ]);
});
test('Horn Attack: one physical hit after lunge, retreat, miss when out of reach',()=>{
 const h={dano:13,tipo:'NORMAL',alcance:76,precisao:100};
 const hit=run(hornattack,65,h);
 assert.equal(hit.damage.length,1);
 assert.ok(Math.max(...hit.path)>42);
 assert.ok(Math.abs(hit.attacker.x)<EPS);
 assert.equal(run(hornattack,200,h).damage.length,0);
 assert.equal(run(hornattack,65,h,{aimY:260}).damage.length,0);
});
test('Double Kick: two separate timed contacts and genuine retreat',()=>{
 const h={dano:6,tipo:'FIGHTING',alcance:76,precisao:100};
 const b=run(doublekick,62,h);
 assert.equal(b.damage.length,2,'Two independent physical hits');
 assert.equal(b.foe.hp,138);
 assert.ok(Math.max(...b.path)>42);
 assert.ok(Math.abs(b.attacker.x)<EPS);
 assert.equal(run(doublekick,270,h).damage.length,0,'No homing or guaranteed damage');
});
test('Fury Attack: 2-5 separate hit windows, with misses supported',()=>{
 const h={dano:3,tipo:'NORMAL',alcance:76,precisao:85};
 const b=run(furyattack,64,h);
 assert.ok(b.damage.length>=2&&b.damage.length<=5);
 assert.ok(Math.abs(b.attacker.x)<EPS);
 assert.equal(run(furyattack,260,h).damage.length,0);
});
test('Rock Tomb: one physical boulder impact and speed debuff only on hit',()=>{
 const h={dano:12,tipo:'ROCK',alcance:235,precisao:95};
 const hit=run(rocktomb,140,h);
 assert.equal(hit.damage.length,1);
 assert.equal(hit.foe.hp,138);
 assert.equal(hit.state.filter(x=>x[0]==='lento').length,1);
 const miss=run(rocktomb,270,h);
 assert.equal(miss.damage.length,0);
 assert.equal(miss.state.length,0);
 const blocked=run(rocktomb,140,h,{block:true});
 assert.equal(blocked.damage.length,0);
 assert.equal(blocked.state.length,0,'Blocked projectile must never inflict slow');
});
