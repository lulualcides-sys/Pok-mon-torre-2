import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import earth from '../tools/pokearena/batch24/earth-power.js';

/* Real Earth Power cast/strike/contact path, in a tiny offline Phaser-like
 * harness: no third-party client download, no copied art, no live web request.
 */
test('Earth Power applies one real area hit to each opponent, no ally fire',async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'torre2-area-'));
 const root=fileURLToPath(new URL('../',import.meta.url));
 try{
  await fs.mkdir(path.join(tmp,'client/batch24'),{recursive:true});
  await fs.writeFile(path.join(tmp,'package.json'),'{"type":"module"}');
  for(const p of ['runtime.js','area-targets.js'])
   await fs.copyFile(path.join(root,'tools/pokearena/batch24',p),
    path.join(tmp,'client/batch24',p));
  const stubs=[
   ['client/batch24/catalog.js','export const BATCH24_MOVES='+JSON.stringify([earth])+';'],
   ['client/batch24/pixels.js',
    'export const PALETTES={earth:[0,1,2,3,4]};export const stamp=()=>{};export const pixel=()=>{};export const impact=()=>{};'],
   ['client/batch24/visual-upgrades.js',
    'export const paintReworkedMove=()=>true;export const paintReworkedImpact=()=>false;'],
   ['client/clash-fx.js','export const clashAt=()=>false;'],
   ['client/early-route-fx.js',
    'export function contactDash(){return {step(){},release(){}};}'],
   ['azar.js','export const aleatorio=()=>0.01;']
  ];
  for(const [name,src] of stubs)
   await fs.writeFile(path.join(tmp,name),src);
  const mod=await import(pathToFileURL(path.join(tmp,'client/batch24/runtime.js')));
  const cast=mod.BATCH24_FORMS[earth.forma];
  assert.equal(typeof cast,'function');

  function fixture(multi){
   const graphics=[];
   const scene={efectos:[],add:{graphics(){
    const g={dead:false,setDepth(){return this;},clear(){return this;},
     destroy(){this.dead=true;}};graphics.push(g);return g;
   }}};
   const actor={x:100,y:100,ax:180,ay:100,alto:36,
    t:0,hp:100,ko:false,equipe:1,escena:scene,est:{},animar(){}};
   const target=(x,y,equipe,ko=false)=>{
    let calls=0;
    return {x,y,alto:36,equipe,ko,hp:1000,
     get hitCount(){return calls;},
     recibir(_l,h){calls++;this.hp-=h.dano;return 'golpe';},
     ponerEstado(){}};
   };
   const e1=target(180,100,2),e2=target(194,103,3);
   const ally=target(184,102,1),dead=target(180,100,4,true),far=target(280,100,5);
   actor.rival=e1;
   scene.luchadores=multi?[actor,e1,e2,ally,dead,far]:[actor,e1];
   const fx=cast(actor,earth,{slot:'q'});
   for(let i=0;i<150;i++){actor.t+=1/60;fx.update(1/60);}
   assert.ok(graphics.length>0&&graphics.every(g=>g.dead),
    'Earth Power must dispose graphics on both scene types');
   return {e1,e2,ally,dead,far};
  }

  const ffa=fixture(true);
  for(const target of [ffa.e1,ffa.e2]){
   assert.equal(target.hitCount,1,'Each in-range opponent gets one area hit');
   assert.equal(target.hp,1000-earth.dano);
  }
  for(const excluded of [ffa.ally,ffa.dead,ffa.far]){
   assert.equal(excluded.hitCount,0,'No friendly, KO, or out-of-range hit');
   assert.equal(excluded.hp,1000);
  }
  const duel=fixture(false);
  assert.equal(duel.e1.hitCount,1,'1v1 keeps its original rival-only hit');
  assert.equal(duel.e2.hitCount,0,'1v1 must not hit inactive roster');
 }finally{
  await fs.rm(tmp,{recursive:true,force:true});
 }
});
