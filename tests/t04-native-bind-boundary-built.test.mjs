import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {clearDepartingCombat} from '../tools/pokearena/torre2-combat-boundary.js';

const version=JSON.parse(fs.readFileSync('_site/arena2d/version.json','utf8')).modules;
const built=path.resolve('_site/arena2d',version,'torre2/prebrock-damage-fx.js');
const {bind}=await import(pathToFileURL(built).href);

// Use the ORIGINAL approved Bind renderer and its real timed hit callbacks.
// Only accuracy and actor geometry are deterministic fixtures; no hit is
// injected and the move/VFX/cooldown implementation is never modified.
function match(){
 const destroyed=[];
 const graphics=()=>({
  clear(){return this},fillStyle(){return this},fillRect(){return this},
  setDepth(){return this},destroy(){destroyed.push(this)}
 });
 const scene={efectos:[],tareas:[],foco:null,add:{graphics}};
 const foe={x:185,y:100,alto:36,hp:100,ko:false,contacts:[],statuses:[],
  ponerEstado(...args){this.statuses.push(args)},
  recibir(source,hit){this.contacts.push({source,hit});this.hp-=hit.dano;return 'golpe'}};
 const player={x:100,y:100,alto:36,ax:185,ay:100,t:0,ko:false,est:{},
  animar(){},limitar(){},escena:scene,rival:foe,accion:null,vx:0,vy:0};
 scene.luchadores=[player,foe];scene.foco=foe;
 const previous=Math.random;
 let fx;
 try{Math.random=()=>0.1;fx=bind(player,{dano:6,tipo:'NORMAL',alcance:76,precisao:85},{slot:'q'});}
 finally{Math.random=previous;}
 assert.equal(scene.efectos[0],fx,'Use the real registered Bind renderer');
 const step=()=>{fx.update(.05);player.t+=.05};
 return {scene,foe,player,fx,step,destroyed};
}
test('T04 native Bind produces its contact plus three genuine delayed pulses',()=>{
 const s=match();
 for(let i=0;i<37;i++)s.step();
 assert.equal(s.foe.contacts.length,4,'Bind must produce one contact and three pulses');
 assert.equal(s.foe.hp,76,'All four native hit callbacks use the original damage');
 assert.equal(s.foe.statuses[0]?.[0],'lento','First contact applies original slowdown');
 assert.equal(s.destroyed.length,2,'Both Phaser graphics destroyed once');
});
test('T04 recall after native Bind contact cancels all three remaining pulses',()=>{
 const s=match();
 for(let i=0;i<12&&s.foe.contacts.length===0;i++)s.step();
 assert.equal(s.foe.contacts.length,1,'Real Bind melee must connect before recall');
 const hp=s.foe.hp;
 s.scene.tareas.push({fn(){throw Error('Stale Bind pulse executed')}});
 clearDepartingCombat(s.scene);
 assert.equal(s.scene.efectos.length,0);
 assert.equal(s.scene.tareas.length,0);
 assert.equal(s.player.accion,null);
 assert.equal(s.destroyed.length,2,'Both native graphics destroyed once');
 for(let i=0;i<37;i++)s.step();
 assert.equal(s.foe.contacts.length,1,'No delayed Bind pulse after recall');
 assert.equal(s.foe.hp,hp,'No residual Bind damage after recall');
 assert.equal(s.destroyed.length,2,'Cleanup is idempotent');
});
