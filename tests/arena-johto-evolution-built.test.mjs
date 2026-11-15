/* Regression against the BUILT Phaser roster: never trust source-only patches. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const {ROSTER}=await import(pathToFileURL(path.join(root,modules,'datos.js')).href);
const find=id=>ROSTER.find(p=>p.id===id);
const magby=find('magby'),magmar=find('magmar'),eevee=find('eevee'),
 togepi=find('togepi'),togetic=find('togetic'),tyrogue=find('tyrogue');
const scyther=find('scyther'),scizor=find('scizor');
assert.ok(scyther?.torre2ArenaAdded&&scyther?.torre2Kanto151,
 'Scyther must be an added Kanto offline fighter, not native P2');
assert.ok(scizor?.torre2ArenaAdded&&scizor?.torre2Johto100,
 'Scizor must be an already installed Johto fighter');
assert.deepEqual(scyther.evoluciones.map(x=>[x.dex,x.nombre]),
 [['0212','SCIZOR']], 'Scyther must evolve once into genuine #0212');
assert.deepEqual(scyther.evoluciones[0].kit,scizor.kit,
 'Scizor stage must reuse approved installed Johto moves without new VFX');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/pmd/manifest.json'),'utf8'));
for(const dex of ['0123','0212'])
 assert.ok(manifest[dex]?.anims?.Idle?.file,'Evolved Scyther idle sprite missing: '+dex);
assert.ok(magby?.torre2ArenaAdded,'Missing added Magby');
assert.ok(magmar,'Missing Kanto Magmar');
assert.ok(eevee&&find('espeon')&&find('umbreon'),'Eevee has no installed Johto branch source');
const stages=magby.evoluciones||[];
assert.equal(stages[0]?.nombre,'MAGMAR','Magby must evolve during battle');
assert.equal(Number(stages[0].dex),126);
if(magmar.evoluciones?.some(e=>Number(e.dex)===467))
 assert.ok(stages.some(e=>Number(e.dex)===467),'Magmortar exists but Magby cannot evolve twice');
assert.deepEqual(eevee.evoluciones.slice(0,3).map(e=>e.nombre.toLowerCase()),
 ['vaporeon','jolteon','flareon'],'Do not overwrite native P2 Eevee evolution kits');
assert.ok(tyrogue?.torre2Johto100,'Tyrogue must be a playable Johto root');
assert.deepEqual(tyrogue.evoluciones.map(e=>e.nombre),
 ['HITMONCHAN','HITMONLEE','HITMONTOP'],
 'Tyrogue gets exactly three alternative final evolutions, never successive stages');
assert.deepEqual(tyrogue.evoluciones.map(e=>Number(e.dex)),[107,106,237],
 'Tyrogue final forms must have real national Dex sprites');
for(const evolution of tyrogue.evoluciones){
 assert.ok(evolution.kit?.lmb?.forma,
  'Tyrogue evolution must retain installed executable skills: '+evolution.nombre);
 const original=find(evolution.nombre.toLowerCase());
 if(original){
  assert.ok(original.kit?.lmb?.forma,
   'The original Kanto fighter must retain its playable native kit');
  assert.ok(Object.values(evolution.kit).some(move=>move?.forma&&Number(move?.dano)>0),
   'The copied Tyrogue final form must remain able to attack');
 }
}
for(const [id,p] of [['togepi',togepi],['togetic',togetic]]){
 assert.ok(p?.torre2Johto100,id+' must use the added Johto legal kit');
 const kit=p.kit||{},slots=['lmb','rmb','q','e'];
 const attacks=slots.filter(s=>kit[s]?.forma&&!kit[s]?.pendiente);
 assert.ok(attacks.length>=2,id+' has no executable attack roles');
 assert.ok(Number(kit.lmb?.dano)>0,id+' cannot lead with non-damaging ATK');
 assert.ok(attacks.some(s=>Number(kit[s]?.dano)>0),id+' has no damaging moves');
}
const combat=fs.readFileSync(path.join(root,modules,'escenas/combate.js'),'utf8');
assert.match(combat,/ids\.includes\("eevee"\)/,'Offline Eevee must preload both Johto evolutions');
assert.match(combat,/dex of \["0196","0197"\]/,'Espeon/Umbreon animations unavailable at evolution');
assert.match(combat,/d\.modo!=="online"/,'Never change online native battle preloading');
console.log('PASS_BUILT_ARENA_JOHTO',JSON.stringify({
 release:modules,magbyStages:stages.map(e=>e.nombre),
 tyrogueBranches:tyrogue.evoluciones.map(e=>e.nombre),
 togepiMoves:['lmb','rmb','q','e'].map(s=>togepi.kit?.[s]?.nombre||null),
 togeticMoves:['lmb','rmb','q','e'].map(s=>togetic.kit?.[s]?.nombre||null)
}));
