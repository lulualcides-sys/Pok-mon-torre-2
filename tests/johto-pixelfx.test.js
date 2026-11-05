import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JOHTO_18,JOHTO_LAB_ALL,makeJohtoTrainingKit} from '../tools/pokearena/torre2-johto-lab-catalog.js';
import {
 JOHTO_APPROVED_3,JOHTO_PIXELFX_28,JOHTO_PIXELFX_REWORK_15,JOHTO_PIXELFX_43,PIXELFX_PIN
} from '../tools/pokearena/torre2-johto-pixelfx-catalog.js';

test('Three approved Johto FX stay original, 15 replaced, 28 added, no duplicate IDs',()=>{
 assert.deepEqual([...JOHTO_APPROVED_3].sort(),['powder-snow','whirlpool','zap-cannon']);
 assert.equal(JOHTO_18.length,18);
 assert.equal(JOHTO_PIXELFX_REWORK_15.length,15);
 assert.equal(JOHTO_PIXELFX_28.length,28);
 assert.equal(JOHTO_PIXELFX_43.length,43);
 assert.equal(JOHTO_LAB_ALL.length,46);
 for(const move of JOHTO_LAB_ALL)assert.equal(move.cd,1,move.id+' must use 1s cooldown');
 assert.equal(new Set(JOHTO_LAB_ALL.map(m=>m.id)).size,46);
 const fx=new Set(JOHTO_PIXELFX_43.map(m=>m.id));
 assert.equal(fx.size,43);
 for(const id of JOHTO_APPROVED_3)assert.equal(fx.has(id),false,id+' approved VFX cannot be overwritten');
 for(const m of JOHTO_18)assert.equal(fx.has(m.id),!JOHTO_APPROVED_3.includes(m.id));
 for(const m of JOHTO_PIXELFX_28){
  assert.equal(m.visualOnly,true,'New VFX cannot masquerade as battle mechanics');
  assert.equal(m.dano,0,'New previews must not apply damage');
  assert.equal(m.approved,false);
  assert.ok(makeJohtoTrainingKit([m.id,'zap-cannon','whirlpool','powder-snow']).lmb.visualOnly);
 }
 assert.match(PIXELFX_PIN,/^[0-9a-f]{40}$/);
 assert.equal(new Set(JOHTO_PIXELFX_43.map(m=>m.fx)).size,43,'Avoid recoloring the same generic effect');
});

test('PixelFX is build-time only; native Phaser runtime and 3 approved originals remain preserved',()=>{
 const runtime=readFileSync('tools/pokearena/torre2-johto-lab-runtime.js','utf8');
 const newruntime=readFileSync('tools/pokearena/torre2-johto-pixelfx-runtime.js','utf8');
 const generator=readFileSync('tools/pokearena/torre2-pixelfx-sheets.mjs','utf8');
 assert.match(runtime,/johtoPose\(h\.id/);
 assert.match(newruntime,/johtoPose\(h\.id/);
 const labCombat=readFileSync('tools/pokearena/torre2-johto-lab-combat.js','utf8');
 assert.doesNotMatch(labCombat,/fighter\.cd\[slot\]=0/);
 assert.match(runtime,/withJohtoLabCooldown/);
 const scene=readFileSync('tools/pokearena/torre2-johto-lab-scene.js','utf8');
 const build=readFileSync('tools/pokearena/build-preview.mjs','utf8');
 assert.match(runtime,/const rework=REWORK_IDS\.has\(h\.id\)/);
 assert.match(runtime,/else if\(nativeOrb\)/,'Approved Zap Cannon retains Electro Ball renderer');
 assert.match(runtime,/else if\(pilotSprite\)/,'Approved Snow/Whirlpool retain original pilot art');
 assert.match(runtime,/if\(pixelFXSprite\)/,'Only the unapproved 15 use new PixelFX strips');
 assert.match(newruntime,/if\(!scene\?\.datos\?\.johtoLab/,'No new casts outside isolated lab');
 assert.doesNotMatch(newruntime,/recibir\(|ponerEstado\(|\.hp\s*=/,'PixelFX-only casts cannot fake damage/status');
 assert.match(generator,/createFx\(mod/);
 assert.match(generator,/composite\(f,out,null/);
 assert.match(generator,/for\(const m of JOHTO_PIXELFX_43\)/);
 assert.match(scene,/for\(const m of JOHTO_LAB_ALL\.filter/);
 assert.match(build,/generateJohtoPixelFXSheets/);
 assert.doesNotMatch(readFileSync('tools/pokearena/torre2-move-pool.js','utf8'),/JOHTO_PIXELFX_43|pixelfx-visual-preview/);
 assert.doesNotMatch(readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8'),/JOHTO_PIXELFX_43|pixelfx-visual-preview/);
});
