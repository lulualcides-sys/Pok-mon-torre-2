import test from 'node:test';
import assert from 'node:assert/strict';
import {SURGE3_MOVES,SURGE_LEADER_LOADOUTS} from '../tools/pokearena/surge3/catalog.js';
import {SURGE3_FORMS,paintSurge3,paintSurge3Impact,
 surgeTargetEffect,surgeFixedHit} from '../tools/pokearena/surge3/runtime.js';
import {BATCH24_MOVES} from '../tools/pokearena/batch24/catalog.js';
function graphics(){
 const rows=[];let color=0,alpha=1,dead=false;
 return {
  rows,get dead(){return dead},
  setDepth(){return this},clear(){rows.length=0;return this},
  fillStyle(c,a=1){assert.ok(Number.isInteger(c)&&c>=0&&c<=0xffffff);color=c;alpha=a;return this},
  fillRect(x,y,w,h){
   assert.ok(!dead);assert.ok([x,y,w,h,alpha].every(Number.isFinite),'NaN graphics');
   assert.ok(w>0&&h>0&&w<=30&&h<=30,'no oversized rectangles');
   rows.push({x,y,w,h,color,alpha});return this
  },destroy(){dead=true}
 };
}
function fixture(type='NORMAL',targetX=185){
 const scene={efectos:[],add:{graphics}};
 const actor={x:100,y:100,ax:260,ay:100,alto:36,ko:false,t:0,
  est:{},escena:scene,animar(){},accion:null};
 const target={x:targetX,y:100,alto:36,ko:false,hp:1000,
  est:{},tipos:[type],
  recibir(actor,move){
   assert.equal(actor,scene.actor);
   assert.ok(move.puro,'SonicBoom must ignore the game's Defense and HP multiplier');
   this.hp-=move.dano;return 'golpe'
  },
  ponerEstado(name,duration,data={}){
   this.est[name]={...this.est[name],...data,hasta:actor.t+duration}
  }};
 actor.rival=target;scene.actor=actor;return{actor,target,scene};
}
function play(f,move){
 const fx=SURGE3_FORMS[move.forma](f.actor,move,{slot:'q'});
 for(let i=0;i<160;i++){f.actor.t+=1/60;fx.update(1/60)}
 assert.ok(f.scene.efectos.includes(fx));
 return fx;
}
test('three true FRLG attacks: 2 statuses and one exactly fixed HP hit',()=>{
 assert.deepEqual(SURGE3_MOVES.map(h=>h.id),['thunder-wave','sonic-boom','screech']);
 assert.deepEqual(SURGE3_MOVES.map(h=>h.precisao),[100,90,85]);
 assert.deepEqual(SURGE3_MOVES.map(h=>h.pp),[20,20,40]);
 assert.ok(SURGE3_MOVES.every(h=>h.approved===false&&h.frames===12));
 assert.equal(SURGE3_MOVES.filter(h=>h.dano===0).length,2);
 assert.equal(SURGE3_MOVES.find(h=>h.id==='sonic-boom').fixedDamage,20);
 assert.equal(new Set([...BATCH24_MOVES,...SURGE3_MOVES].map(m=>m.id)).size,26);
 for(const move of SURGE3_MOVES)assert.equal(typeof SURGE3_FORMS[move.forma],'function');
 assert.deepEqual(SURGE_LEADER_LOADOUTS.voltorb,
  ['Tackle','Sonic Boom','Screech','Shock Wave']);
});
test('12 separate pixel frames per move, real varied shock/audio/sound designs',()=>{
 for(const move of SURGE3_MOVES){
  const poses=[];
  for(let i=0;i<12;i++){
   const g=graphics();paintSurge3(g,move.style,110,110,i,.35);
   assert.ok(g.rows.length>35,move.id+' should not be a lone CSS-looking orb');
   assert.ok(g.rows.length<3800,move.id+' FPS safety');
   poses.push(g.rows.map(x=>[Math.round(x.x),Math.round(x.y),x.alpha]).join('|'));
  }
  assert.ok(new Set(poses).size>=8,move.id+' is too static');
  const impact=graphics();
  assert.equal(paintSurge3Impact(impact,move.style,110,110,.14),true);
  assert.ok(impact.rows.length>=15,'visible impact from existing pixel masks');
  const clear=graphics();
  assert.equal(paintSurge3Impact(clear,move.style,110,110,.4),false);
  assert.equal(clear.rows.length,0);
 }
});
test('Thunder Wave paralyzes on physically aimed hit; Ground and Electric are immune',()=>{
 const wave=SURGE3_MOVES[0];
 for(const type of ['NORMAL','GROUND','ELECTRIC']){
  const f=fixture(type);const start=f.target.hp;play(f,wave);
  assert.equal(f.target.hp,start,'paralysis must never damage');
  assert.equal(Boolean(f.target.est.paralizado),type==='NORMAL');
 }
 const miss=fixture('NORMAL',310);play(miss,wave);
 assert.equal(miss.target.est.paralizado,undefined,'manual aim misses long range');
});
test('Screech lowers Defense by 2 stages, stacks only to -6, never deals damage',()=>{
 const f=fixture('NORMAL'),screech=SURGE3_MOVES[2];
 for(const stages of [2,4,6,6]){
  play(f,screech);
  assert.equal(f.target.hp,1000);
  assert.equal(f.target.est.torre2Screech.stages,stages);
 }
 const blocked=fixture('NORMAL');blocked.target.est.bloqueo={hasta:9};
 assert.equal(surgeTargetEffect(blocked.target,screech),false);
 assert.equal(blocked.target.est.torre2Screech,undefined);
});
test('Sonic Boom deals EXACTLY 20 HP regardless of Defense; Ghost and dodge immune',()=>{
 const move=SURGE3_MOVES[1];
 const f=fixture('NORMAL');play(f,move);
 assert.equal(f.target.hp,980);
 const ghost=fixture('GHOST');play(ghost,move);
 assert.equal(ghost.target.hp,1000);
 const inv=fixture('NORMAL');inv.target.invulnerable=true;play(inv,move);
 assert.equal(inv.target.hp,1000);
 const training=fixture('NORMAL');
 training.target.__torre2TrainingDummy=true;
 training.target.recibir=(_actor,h)=>{assert.equal(h.dano,20);return 'golpe'};
 play(training,move);
 assert.equal(training.target.hp,1000,'training dummy stays immortal');
});
test('Accuracy rolls occur only on contact; projectile status never auto targets',()=>{
 const fx=fixture('NORMAL');
 const prev=Math.random;try{
  Math.random=()=>.999;
  play(fx,SURGE3_MOVES[1]);
  assert.equal(fx.target.hp,1000,'Sonic Boom 90% can miss');
  const shrill=fixture('NORMAL');play(shrill,SURGE3_MOVES[2]);
  assert.equal(shrill.target.est.torre2Screech,undefined,'Screech 85% can miss');
 }finally{Math.random=prev}
});
