import test from 'node:test';
import assert from 'node:assert/strict';
import {petaldance} from '../tools/pokearena/torre2-kanto-signatures-fx.js';

// Phaser/WebGL Graphics stand-in: records actual pixel tiles drawn per frame.
function battle(misses=false){
 const graphics=[];
 const scene={
  efectos:[],
  add:{graphics(){
   const g={
    tiles:[],destroyed:false,
    setDepth(){return this},
    clear(){this.tiles=[];return this},
    fillStyle(){return this},
    fillRect(x,y,w,h){this.tiles.push({x,y,w,h});return this},
    destroy(){this.destroyed=true}
   };
   graphics.push(g);
   return g;
  }}
 };
 const enemy={x:misses?650:309,y:misses?370:215,alto:38,hp:250,ko:false,hits:0,
  recibir(_user,hit){this.hits++;this.hp-=hit.dano||0;return 'golpe'}};
 const player={x:174,y:215,alto:38,ax:480,ay:215,t:0,ko:false,
  escena:scene,rival:enemy,status:[],animar(){},
  ponerEstado(s){this.status.push(s)}};
 return {graphics,scene,enemy,player};
}
function center(tiles){
 assert.ok(tiles.length>0,'Petals should render in the opening frames');
 const n=tiles.length;
 return tiles.reduce((p,c)=>({x:p.x+(c.x+c.w/2)/n,
  y:p.y+(c.y+c.h/2)/n}),{x:0,y:0});
}
function run(misses=false,moveEnemy=null){
 const b=battle(misses);
 const fx=petaldance(b.player,{dano:18,tipo:'GRASS',alcance:230},{slot:'lmb'});
 const positions=[],samples=[];
 let alive=true;
 for(let frame=1;frame<=150&&alive;frame++){
  if(moveEnemy)moveEnemy(b.enemy,frame,b.player);
  alive=fx.update(.016);
  if(frame===3||frame===6)positions.push(center(b.graphics[0].tiles));
  if(frame===12||frame===24)samples.push(center(b.graphics[0].tiles));
 }
 assert.equal(alive,false,'Animation ends without retained effects');
 assert.ok(b.graphics.every(g=>g.destroyed),'Pixel graphics cleaned up');
 return {...b,positions,samples};
}
test('Petal Dance petals travel and swirl rather than remaining fixed',()=>{
 const b=run(false);
 assert.equal(b.positions.length,2);
 assert.ok(b.positions[1].x-b.positions[0].x>5,
  'Pixel petals need visible forward travel within 48 ms');
 assert.ok(Math.abs(b.positions[1].y-b.positions[0].y)>1,
  'Pixel petals need visible swirling vertical motion');
 assert.equal(b.enemy.hits,3,'Exactly three independent landed contacts');
 assert.ok(b.player.status.includes('confuso'),'Dance ends in self-confusion');
});
test('Petal Dance never automatically damages a foe outside the vortex',()=>{
 const b=run(true);
 assert.equal(b.enemy.hits,0);
 assert.ok(b.player.status.includes('confuso'));
});

test("Petal Dance DOES NOT chase an enemy dodging the player\'s fixed aim",()=>{
 const still=run();
 const dodged=run(false,(enemy,frame)=>{
  if(frame===8)enemy.y=115; // target dodges away, but the player never re-aims
 });
 assert.deepEqual(dodged.samples,still.samples,
  'Enemy movement alone must not affect pixel trajectories');
 assert.equal(dodged.enemy.hits,0,
  'A foe that dodges the projected flower stream must escape damage');
 assert.equal(dodged.player.accion.angulo,still.player.accion.angulo,
  'Caster rotation must not lock onto enemy coordinates');
});
test('Petal Dance uses Ice Beam-style controlled aim, not automatic lock-on',()=>{
 const still=run();
 const aimed=run(false,(_enemy,frame,player)=>{
  if(frame===8)player.ay=115; // PLAYER actively moves the pointer up
 });
 assert.equal(aimed.samples.length,2);
 assert.ok(aimed.samples[1].y<still.samples[1].y-8,
  'Petals should curve when the player changes aim');
 assert.ok(aimed.player.accion.angulo<-.2,
  'Caster turns toward player's aim with the original Chorro-style angular limit');
});
