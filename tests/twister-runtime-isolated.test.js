import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import twister from '../tools/pokearena/batch24/twister.js';

// Execute the REAL Batch24 runtime offline with an isolated, minimum Phaser
// Graphics/actor harness. No third-party client download, sprites or bypass.
test('Twister collision shows impact only after verified damage in runtime',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'torre2-twister-'));
 const root=fileURLToPath(new URL('../',import.meta.url));
 try{
  await fs.mkdir(path.join(dir,'client/batch24'),{recursive:true});
  await fs.writeFile(path.join(dir,'package.json'),'{"type":"module"}');
  await fs.copyFile(path.join(root,'tools/pokearena/batch24/runtime.js'),
   path.join(dir,'client/batch24/runtime.js'));
  await fs.copyFile(path.join(root,'tools/pokearena/batch24/hit-impacts.js'),
   path.join(dir,'client/batch24/hit-impacts.js'));
  const files=[
   ['client/batch24/catalog.js','export const BATCH24_MOVES='+JSON.stringify([twister])+';'],
   ['client/batch24/pixels.js',
    'export const PALETTES={dragon:[0,1,2,3,4]};export const stamp=()=>{};export const pixel=()=>{};export const impact=()=>{};'],
   ['client/batch24/visual-upgrades.js',
    'export const paintReworkedMove=()=>true;export function paintReworkedImpact(g){g.impactCount++;return true;}'],
   ['client/clash-fx.js','export const clashAt=()=>false;'],
   ['client/early-route-fx.js',
    'export function contactDash(){return {step(){},release(){}};}'],
   ['azar.js','export const aleatorio=()=>0.01;']
  ];
  for(const [name,src] of files)await fs.writeFile(path.join(dir,name),src);
  const mod=await import(new URL('file://'+dir+'/client/batch24/runtime.js'));
  const cast=mod.BATCH24_FORMS[twister.forma];
  assert.equal(typeof cast,'function','original Twister renderer is dispatched');

  const sample=(mode)=>{
   const graphics=[];
   const scene={efectos:[],add:{graphics(){
    const g={dead:false,impactCount:0,setDepth(){return this;},
     clear(){return this;},destroy(){this.dead=true;}};graphics.push(g);return g;
   }}};
   const actor={x:100,y:100,alto:36,ax:180,ay:100,escena:scene,
    hp:100,hpMax:100,t:0,est:{},ko:false,animar(){}};
   let calls=0;
   const rival={x:180,y:100,alto:36,hp:1000,ko:false,
    tipos:['NORMAL'],ponerEstado(){},recibir(_actor,attack){
     calls++;
     if(mode==='blocked')return 'bloqueado';
     this.hp-=attack.dano;return 'golpe';
    }};
   actor.rival=rival;
   const attack=mode==='accuracy'?{...twister,precisao:0}:twister;
   const fx=cast(actor,attack,{slot:'q'});
   for(let i=0;i<44;i++){actor.t+=1/60;fx.update(1/60);}
   return {graphics,rival,calls,fx};
  };
  const blocked=sample('blocked');
  assert.ok(blocked.calls>0,'blocked target was physically contacted');
  assert.equal(blocked.rival.hp,1000);
  assert.equal(blocked.graphics[0].impactCount,0,
   'no phantom pixel impact after an actual blocked contact');
  assert.equal(blocked.graphics[0].dead,true,'missed Twister cleans up');

  const accuracy=sample('accuracy');
  assert.equal(accuracy.calls,0,'failed precision should never call recibir');
  assert.equal(accuracy.rival.hp,1000);
  assert.equal(accuracy.graphics[0].impactCount,0);
  assert.equal(accuracy.graphics[0].dead,true);

  const hit=sample('landed');
  assert.ok(hit.rival.hp<1000,'Twister still deals real contact damage');
  assert.ok(hit.graphics[0].impactCount>0,'existing hit animation remains');
  assert.equal(hit.graphics[0].dead,false,'hit impact stays briefly visible');
  hit.fx.destroy();
 }finally{
  await fs.rm(dir,{recursive:true,force:true});
 }
});
