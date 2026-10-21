import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../tools/pokearena/torre2-early-route-fx.js',import.meta.url),'utf8');
const moduleSource=src.replace("import {clashAt} from './clash-fx.js';",'const clashAt=()=>false;');
assert.notEqual(moduleSource,src,'single dependency replaced only in isolated tests');
const {bite,crunch,CHOMP_POSES}=await import(
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
 const attacker={x:0,y:100,alto:36,ax:78,ay:100,t:0,escena,
  est:{},ko:false,rival:enemy,animar(){}};
 return {pixels,escena,contacts,attacker,enemy};
};
function simulate(fn,targetX,h){
 const b=makeBattle(targetX);
 fn(b.attacker,h,{slot:'lmb'});
 const effect=b.escena.efectos[0];assert.ok(effect,'FX installed');
 for(let i=0;i<65;i++)if(!effect.update(.016))break;
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
