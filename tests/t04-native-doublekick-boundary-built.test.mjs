import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const version=JSON.parse(fs.readFileSync('_site/arena2d/version.json','utf8')).modules;
const built=path.resolve('_site/arena2d',version,'torre2/prebrock-damage-fx.js');
const {doublekick}=await import(pathToFileURL(built).href);
import {clearDepartingCombat} from '../tools/pokearena/torre2-combat-boundary.js';

// Execute the ACTUAL approved Double Kick renderer/timing logic with a small
// scene adapter. No modified move data, forced damage, or fabricated callbacks.
function match(){
 const destroyed=[];
 const graphics=()=>({
  clear(){return this},fillStyle(){return this},fillRect(){return this},
  destroy(){destroyed.push(this)}
 });
 const scene={efectos:[],tareas:[],foco:null,add:{graphics(){return { ...graphics(),setDepth(){return this} }}}};
 const foe={x:185,y:100,alto:36,hp:100,ko:false,contacts:[],
  recibir(source,hit){this.contacts.push({source,hit});this.hp-=hit.dano;return 'golpe'}};
 const player={x:100,y:100,alto:36,ax:185,ay:100,t:0,ko:false,est:{},
  animar(){},limitar(){},escena:scene,rival:foe,accion:null,vx:0,vy:0};
 scene.luchadores=[player,foe];scene.foco=foe;
 const fx=doublekick(player,{dano:6,tipo:'FIGHTING',alcance:76},{slot:'q'});
 assert.equal(scene.efectos[0],fx,'Use the real registered renderer');
 const step=()=>{fx.update(.05);player.t+=.05};
 return {scene,foe,player,fx,step,destroyed};
}
test('T04 actual Double Kick delivers two distinct native hit callbacks without a switch',()=>{
 const s=match();
 for(let i=0;i<25;i++)s.step();
 assert.equal(s.foe.contacts.length,2,'Both native kicks must resolve');
 assert.equal(s.foe.hp,88,'Each physical kick applies its own native damage');
 assert.equal(s.foe.contacts[0].hit.slot,'q');
 assert.equal(s.foe.contacts[1].hit.slot,'q');
 assert.equal(s.destroyed.length,2,'The two Phaser graphics children are released once');
});
test('T04 switching after the first real kick cancels its second pending impact',()=>{
 const s=match();
 for(let i=0;i<12&&s.foe.contacts.length===0;i++)s.step();
 assert.equal(s.foe.contacts.length,1,'The first native kick must actually connect');
 const hp=s.foe.hp;
 s.scene.tareas.push({fn(){throw Error('Stale hit must never execute')}});
 clearDepartingCombat(s.scene);
 assert.equal(s.scene.efectos.length,0);
 assert.equal(s.scene.tareas.length,0);
 assert.equal(s.player.accion,null);
 assert.equal(s.destroyed.length,2,'Both native VFX graphics destroyed exactly once');
 // Simulate the renderer being ticked accidentally after cleanup: it is dead.
 for(let i=0;i<20;i++)s.step();
 assert.equal(s.foe.contacts.length,1,'No second hit after recall');
 assert.equal(s.foe.hp,hp,'Opponent HP remains unchanged after recall');
 assert.equal(s.destroyed.length,2,'Idempotent destruction');
});
