/* Verify real compiled Phaser roster, not an isolated unit fixture.
 * All new Arena evolutions must be battle-capable and use installed attacks.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const site=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(site,'version.json'),'utf8'));
const load=p=>import(pathToFileURL(path.join(site,modules,p)).href);
const [{ROSTER},{JOHTO_100_ROWS}]=await Promise.all([
 load('datos.js'),load('torre2/johto-100-data.js')
]);
const find=id=>{const p=ROSTER.find(p=>p.id===id);
 assert.ok(p,'Missing actual Arena fighter '+id);return p};
const stages=p=>[p,...(p.evoluciones||[])];
const magby=find('magby'),eevee=find('eevee'),togepi=find('togepi');
assert.equal(magby.torre2ArenaAdded,true);
assert.deepEqual(magby.evoluciones.map(p=>p.nombre),['MAGMAR','MAGMORTAR']);
assert.deepEqual(magby.expEvolucion,[50,90]);
assert.deepEqual(eevee.evoluciones.map(p=>p.nombre),
 ['VAPOREON','JOLTEON','FLAREON','ESPEON','UMBREON']);
assert.equal(eevee.torre2ArenaAdded,true);
// Umbreon's DARK move is a legal HGSS TM79 from the installed approved
// catalog, or the original P2 ability if the client later adds it.
const umbreon=eevee.evoluciones.find(p=>p.nombre==='UMBREON');
assert.equal(umbreon?.kit?.e?.nombre,'Dark Pulse');
assert.equal(umbreon.kit.e.tipo,'DARK');
assert.ok(umbreon.kit.e.forma,'Umbreon cannot have a placeholder ULT');
const legal=(name)=>new Set(JOHTO_100_ROWS.find(p=>p[1]===name)[10]
 .map(([move])=>move));
const checked={};
for(const [name,stage] of [['togepi',togepi],['togetic',togepi.evoluciones
 .find(p=>p.nombre.toLowerCase()==='togetic')]]){
 assert.ok(stage,'Missing '+name+' in real Togepi evolution family');
 const valid=legal(name),names=[];
 for(const slot of ['lmb','rmb','q','e']){
  const m=stage.kit?.[slot];assert.ok(m?.nombre&&m?.forma,
   name+' missing executable '+slot);
  assert.equal(m.pendiente,false,name+' move pending '+slot);
  assert.ok(valid.has(m.nombre.toLowerCase().replace(/[^a-z0-9]+/g,'-')),
   name+' has incompatible/unverified move '+m.nombre);
  assert.ok(m.torre2JohtoLegal,
   name+' missing recorded installed original/approved move source');
  names.push(m.nombre);
 }
 assert.equal(new Set(names).size,4,name+' has repeated attacks');
 assert.ok(['lmb','rmb','q','e'].filter(slot=>stage.kit[slot].dano>0).length>=2,
  name+' needs two real offensive moves');
 checked[name]=names;
}
for(const p of [magby,...magby.evoluciones,eevee,...eevee.evoluciones]){
 assert.ok(fs.existsSync(path.join(site,'assets/pmd',p.dex,'portrait.png')),
  'Missing PMD portrait for '+p.nombre);
}
console.log('PASS_REAL_BUILT_ARENA_JOHTO_EVOLUTIONS',JSON.stringify({
 modules,magby:magby.evoluciones.map(p=>p.nombre),
 eevee:eevee.evoluciones.map(p=>p.nombre),togepiTogetic:checked
}));
