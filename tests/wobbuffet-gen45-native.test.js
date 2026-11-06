import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 TORRE2_WOBBUFFET_MOVES,TORRE2_WOBBUFFET_FORMS,
 wobbuffetBlocksStatus,wobbuffetHitCategory,wobbuffetAfterHit
} from '../tools/pokearena/torre2-wobbuffet-native.js';
const source=readFileSync('tools/pokearena/build-preview.mjs','utf8');
test('battle Phaser registers real Wobbuffet forms and damage/status hooks',()=>{
 for(const move of TORRE2_WOBBUFFET_MOVES){
  assert.ok(move.forma.startsWith('torre2_wobbuffet_'));
  assert.equal(typeof TORRE2_WOBBUFFET_FORMS[move.forma],'function');
  assert.ok(source.includes('...TORRE2_WOBBUFFET_FORMS'));
 }
 assert.ok(source.includes('wobbuffetAfterHit(this,fuente,g,d)'),
  'Must use native recibir combat HP path, not a fake text-only attack');
 assert.ok(source.includes('wobbuffetBlocksStatus(this,nombre)'),
  'Safeguard must intercept the real native status pathway');
});
function fighter(id,hp=120){
 const e={add:{graphics(){return{
  setDepth(){return this},lineStyle(){return this},
  strokeRect(){return this},destroy(){} }}},
  time:{delayedCall(){} }};
 const f={
  def:{id},x:150,y:130,alto:35,escena:e,t:10,est:{},
  hp,hpMax:hp,remoto:false,inmortal:false,
  animar(){},accion:null,ko:false,tipos:['NORMAL'],
  ponerEstado(name,dur){this.est[name]={hasta:this.t+dur}},
  recibir(source,g){this.hp=Math.max(0,this.hp-g.dano);this.ko=this.hp===0}
 };
 return f;
}
test('Counter returns exactly 2x actual incoming PHYSICAL damage and expires',()=>{
 const wob=fighter('wobbuffet'),attacker=fighter('rattata');
 const move=TORRE2_WOBBUFFET_MOVES[0];
 TORRE2_WOBBUFFET_FORMS[move.forma](wob,move);
 assert.equal(wob.est.torre2WobbuffetCounter.hasta,11.35);
 wob.hp=112;
 wobbuffetAfterHit(wob,attacker,{tipo:'NORMAL',categoria:'PHYSICAL',slot:'lmb'},8);
 assert.equal(attacker.hp,104);
 assert.equal(wob.est.torre2WobbuffetCounter,undefined);
 wobbuffetAfterHit(wob,attacker,{tipo:'NORMAL'},8);
 assert.equal(attacker.hp,104,'Counter can only trigger once per cast');
});
test('Counter does not reflect special damage, DOT, pure damage or ghost immunity',()=>{
 const f=fighter('wobbuffet'),a=fighter('gengar');
 a.tipos=['GHOST','POISON'];
 TORRE2_WOBBUFFET_FORMS.torre2_wobbuffet_counter(f,TORRE2_WOBBUFFET_MOVES[0]);
 wobbuffetAfterHit(f,a,{tipo:'FIRE',categoria:'SPECIAL'},7);
 assert.equal(a.hp,120);
 wobbuffetAfterHit(f,a,{tipo:'NORMAL',tick:true},7);
 assert.equal(a.hp,120);
 wobbuffetAfterHit(f,a,{tipo:'NORMAL',puro:true},7);
 assert.equal(a.hp,120);
 wobbuffetAfterHit(f,a,{tipo:'NORMAL'},7);
 assert.equal(a.hp,120,'Gen III Ghost immunity to Counter');
 assert.equal(wobbuffetHitCategory({tipo:'DARK'}),'SPECIAL');
 assert.equal(wobbuffetHitCategory({tipo:'STEEL'}),'PHYSICAL');
});
test('Safeguard blocks only adverse status and expires with native fighter timer',()=>{
 const f=fighter('wobbuffet'),m=TORRE2_WOBBUFFET_MOVES[1];
 TORRE2_WOBBUFFET_FORMS[m.forma](f,m);
 for(const s of ['veneno','toxic','paralizado','dormido','quema','confuso'])
  assert.equal(wobbuffetBlocksStatus(f,s),true,s);
 for(const s of ['escudo','potencia','torre2WobbuffetCounter'])
  assert.equal(wobbuffetBlocksStatus(f,s),false,s);
 f.t=18;assert.equal(wobbuffetBlocksStatus(f,'veneno'),false);
});
test('Destiny Bond faints the attacker only on an actual opponent direct KO',()=>{
 const f=fighter('wobbuffet'),a=fighter('rattata');
 const m=TORRE2_WOBBUFFET_MOVES[2];
 TORRE2_WOBBUFFET_FORMS[m.forma](f,m);
 f.hp=0;
 wobbuffetAfterHit(f,a,{tipo:'NORMAL',slot:'lmb'},30);
 assert.equal(a.hp,0);
 assert.equal(f.est.torre2WobbuffetDestinyBond,undefined);
 const f2=fighter('wobbuffet'),b=fighter('rattata');
 TORRE2_WOBBUFFET_FORMS[m.forma](f2,m);f2.hp=0;
 wobbuffetAfterHit(f2,b,{tipo:'POISON',tick:true},30);
 assert.equal(b.hp,120,'Poison damage must not trigger Destiny Bond');
});
