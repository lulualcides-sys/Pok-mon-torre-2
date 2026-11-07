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
 togepi=find('togepi'),togetic=find('togetic');
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
 togepiMoves:['lmb','rmb','q','e'].map(s=>togepi.kit?.[s]?.nombre||null),
 togeticMoves:['lmb','rmb','q','e'].map(s=>togetic.kit?.[s]?.nombre||null)
}));
