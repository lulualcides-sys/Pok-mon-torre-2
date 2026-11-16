import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import iceShard from '../tools/pokearena/batch24/ice-shard.js';
import darkPulse from '../tools/pokearena/batch24/dark-pulse.js';
import twister from '../tools/pokearena/batch24/twister.js';
import {shouldShowVerifiedProjectileImpact} from '../tools/pokearena/batch24/verified-projectile-impact.js';

const root=fileURLToPath(new URL('../',import.meta.url));
test('impact policy excludes failed damaging contacts, preserving Twister patch ownership',()=>{
 for(const move of [iceShard,darkPulse]){
  assert.equal(move.approved,true);
  for(const result of [null,{landed:false,damage:0},{landed:true,damage:0},
   {landed:true,damage:NaN},{landed:false,damage:10}]){
   assert.equal(shouldShowVerifiedProjectileImpact(move,result),false);
  }
  assert.equal(shouldShowVerifiedProjectileImpact(move,{landed:true,damage:3}),true);
 }
 assert.equal(shouldShowVerifiedProjectileImpact(twister,{landed:false,damage:0}),true,
  'Twister gate remains exclusively in draft PR #604');
});

test('real Batch24 runtime: blocked, accuracy-missed and damaging projectile contacts',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'torre2-projectile-proof-'));
 const location=path.join(dir,'client/batch24');
 try{
  await fs.mkdir(location,{recursive:true});
  await fs.writeFile(path.join(dir,'package.json'),'{"type":"module"}');
  for(const name of ['runtime.js','verified-projectile-impact.js'])
   await fs.copyFile(path.join(root,'tools/pokearena/batch24',name),path.join(location,name));
  const stubs={
   'client/batch24/catalog.js':'export const BATCH24_MOVES='+JSON.stringify([iceShard,darkPulse])+';',
   'client/batch24/pixels.js':'export const PALETTES={ice:[0,1,2,3,4],dark:[0,1,2,3,4]};export const stamp=()=>{};export const pixel=()=>{};export const impact=g=>{g.impactCount++};',
   'client/batch24/visual-upgrades.js':'export const paintReworkedMove=()=>true;export const paintReworkedImpact=g=>{g.impactCount++;return true};',
   'client/clash-fx.js':'export const clashAt=()=>false;',
   'client/early-route-fx.js':'export const contactDash=()=>({step(){},release(){}});',
   'azar.js':'export const aleatorio=()=>0.1;'
  };
  for(const [name,text] of Object.entries(stubs)){
   const filename=path.join(dir,name);
   await fs.mkdir(path.dirname(filename),{recursive:true});
   await fs.writeFile(filename,text);
  }
  const {BATCH24_FORMS}=await import(pathToFileURL(path.join(location,'runtime.js')).href);
  const sample=(move,mode)=>{
   const rendered=[];
   const scene={efectos:[],add:{graphics(){
    const g={impactCount:0,dead:false,setDepth(){return this},clear(){return this},
     destroy(){this.dead=true}};rendered.push(g);return g;
   }}};
   const actor={x:100,y:100,ax:180,ay:100,alto:36,t:0,ko:false,
    escena:scene,hp:100,hpMax:100,est:{},animar(){}};
   const rival={x:180,y:100,alto:36,hp:1000,ko:false,tipos:['NORMAL'],hits:0,
    ponerEstado(){},recibir(_actor,attack){
     this.hits++;
     if(mode==='blocked')return 'bloqueado';
     this.hp-=attack.dano;return 'golpe';
    }};
   actor.rival=rival;
   const attack=mode==='accuracy'?{...move,precisao:0}:move;
   const fx=BATCH24_FORMS[move.forma](actor,attack,{slot:'q'});
   for(let i=0;i<120;i++){actor.t+=1/60;fx.update(1/60);}
   return {rival,rendered,fx};
  };
  for(const move of [iceShard,darkPulse]){
   const blocked=sample(move,'blocked');
   assert.ok(blocked.rival.hits>0,move.id+' actually contacted a blocked target');
   assert.equal(blocked.rival.hp,1000);
   assert.equal(blocked.rendered[0].impactCount,0,move.id+' must not render phantom hit');
   assert.equal(blocked.rendered[0].dead,true,move.id+' releases blocked projectile');
   const inaccurate=sample(move,'accuracy');
   assert.equal(inaccurate.rival.hits,0);
   assert.equal(inaccurate.rendered[0].impactCount,0);
   const landed=sample(move,'landed');
   assert.ok(landed.rival.hp<1000,move.id+' damage is preserved');
   assert.ok(landed.rendered[0].impactCount>0,move.id+' original hit VFX preserved');
   assert.equal(landed.rendered[0].dead,true,move.id+' releases hit projectile');
  }
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});

test('renderer is wired into the assembled Phaser arena, not metadata-only',async()=>{
 const build=await fs.readFile(path.join(root,'tools/pokearena/build-preview.mjs'),'utf8');
 const runtime=await fs.readFile(path.join(root,'tools/pokearena/batch24/runtime.js'),'utf8');
 assert.match(build,/fs\.cp\('tools\/pokearena\/batch24'/);
 assert.match(runtime,/shouldShowVerifiedProjectileImpact\(h,result\)/);
});
