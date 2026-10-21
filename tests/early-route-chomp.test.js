import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../tools/pokearena/torre2-early-route-fx.js',import.meta.url),'utf8');
const moduleSource=src.replace("import {clashAt} from './clash-fx.js';",'const clashAt=()=>false;');
assert.notEqual(moduleSource,src,'single dependency replaced only in isolated tests');
const {bite,crunch,peck,leechlife,bugbite,CHOMP_POSES}=await import(
 'data:text/javascript;base64,'+Buffer.from(moduleSource).toString('base64'));
const makeBattle=(targetX)=>{
 const pixels=[];
 const escena={efectos:[],add:{graphics:()=>({
  setDepth(){return this;},fillStyle(){return this;},
  fillRect(...coords){pixels.push(coords);return this;},clear(){return this;},
  destroy(){this.destroyed=true;}
 })}};
 const contacts=[],enemy={
  x:targetX,y:100,alto:36,hp:150,est:{},tipos:[],
  recibir(_attacker,hit){contacts.push(hit);this.hp-=hit.dano;return 'golpe';}
 };
 const attacker={x:0,y:100,alto:36,ax:78,ay:100,t:0,hp:40,hpMax:100,escena,
  est:{},ko:false,rival:enemy,animar(){}};
 return {pixels,escena,contacts,attacker,enemy};
};
function simulate(fn,targetX,h){
 const b=makeBattle(targetX);
 fn(b.attacker,h,{slot:'lmb'});
 const effect=b.escena.efectos[0];assert.ok(effect,'FX installed');
 const path=[];
 for(let i=0;i<110;i++){
  const active=effect.update(.016);
  path.push(b.attacker.x);
  if(!active)break;
 }
 b.path=path;
 assert.equal(effect.destroyed,undefined);
 return b;
}
test('Bite uses 8 distinct pixel poses with no auto-hit',()=>{
 assert.equal(CHOMP_POSES.length,8);
 const hit=simulate(bite,68,{alcance:76,dano:12,tipo:'DARK'});
 assert.equal(hit.contacts.length,1);
 assert.equal(hit.enemy.hp,138);
 assert.ok(hit.pixels.length>200,'hand-pixeled upper/lower jaws must render');
 const miss=simulate(bite,240,{alcance:76,dano:12,tipo:'DARK'});
 assert.equal(miss.contacts.length,0,'manually missed attacks must not deal damage');
});
test('Crunch has two distinct bite orientations but one damage event',()=>{
 const hit=simulate(crunch,68,{alcance:80,dano:16,tipo:'DARK'});
 assert.equal(hit.contacts.length,1,'two visual bites must not double full attack power');
 assert.equal(hit.enemy.hp,134);
 assert.ok(hit.pixels.length>400);
 const miss=simulate(crunch,260,{alcance:80,dano:16,tipo:'DARK'});
 assert.equal(miss.contacts.length,0,'vertical second bite must not auto-hit');
});

test('Bite and Crunch move fighter forward and return to launch position',()=>{
 for(const fn of [bite,crunch]){
  const b=simulate(fn,68,{alcance:76,dano:12,tipo:'DARK'});
  assert.ok(Math.max(...b.path)>42,fn.name+' actor must advance');
  assert.ok(Math.abs(b.attacker.x)<1,fn.name+' actor must retreat');
  assert.equal(b.contacts.length,1,fn.name+' does not double damage');
 }
});
test('Peck: tiny physical beak advances, hits once and retreats',()=>{
 const hit=simulate(peck,64,{alcance:76,dano:7,tipo:'FLYING'});
 assert.equal(hit.contacts.length,1);
 assert.ok(Math.max(...hit.path)>40);
 assert.ok(Math.abs(hit.attacker.x)<1);
 assert.ok(hit.pixels.length>65);
 const miss=simulate(peck,240,{alcance:76,dano:7,tipo:'FLYING'});
 assert.equal(miss.contacts.length,0);
});
test('Bug Bite: green chitin jaws are contact-only and never double-hit',()=>{
 const hit=simulate(bugbite,63,{alcance:74,dano:12,tipo:'BUG'});
 assert.equal(hit.contacts.length,1);
 assert.ok(Math.max(...hit.path)>40);
 assert.ok(Math.abs(hit.attacker.x)<1);
 assert.ok(hit.pixels.length>120);
 const miss=simulate(bugbite,240,{alcance:74,dano:12,tipo:'BUG'});
 assert.equal(miss.contacts.length,0);
});
test('Leech Life uses green Poison-Sting silhouette and heals only real damage',()=>{
 const hit=simulate(leechlife,155,{alcance:205,dano:10,tipo:'BUG'});
 assert.equal(hit.contacts.length,1);
 assert.equal(hit.enemy.hp,140);
 assert.equal(hit.attacker.hp,45,'heals half of actual inflicted 10 damage');
 assert.ok(hit.pixels.length>100);
 const miss=simulate(leechlife,280,{alcance:205,dano:10,tipo:'BUG'});
 assert.equal(miss.contacts.length,0);
 assert.equal(miss.attacker.hp,40,'no damage means no heal');
});
