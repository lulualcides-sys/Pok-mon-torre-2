import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const {TEST_LIBRARY,optimizeCampaignFireBlastVfx,resolveLoadout,equipMove}=
 await import(pathToFileURL(path.join(root,version,'torre2/move-pool.js')));
const approved=TEST_LIBRARY.find(x=>x.id==='fire-blast');
assert.equal(approved.forma,'proyectil');
assert.equal(approved.explosion.hoja,'fireblast-boom');
assert.equal(approved.explosion.ecos,true,'Original native Arena kit remains unmodified');
const optimized=optimizeCampaignFireBlastVfx(approved);
assert.notEqual(optimized,approved,'Kanto gets a separate immutable copy');
assert.notEqual(optimized.explosion,approved.explosion);
assert.equal(optimized.explosion.ecos,false,'Only decorative repeated echoes are skipped');
for(const key of ['id','nombre','forma','estilo','tipo','dano','vel','alcance','radio','escala','cd','anim','lanzar','hoja'])
 assert.deepEqual(optimized[key],approved[key],key+' cannot change');
for(const key of ['radio','hoja','arde'])
 assert.deepEqual(optimized.explosion[key],approved.explosion[key],'Explosion gameplay & core art: '+key);
assert.equal(approved.explosion.ecos,true,'No original object mutation');
const charizard={id:'charizard',progression:{species:'charizard',level:50}};
if(!resolveLoadout(charizard).e?.id==='fire-blast'){}
const selected=resolveLoadout(charizard);
const slot=['lmb','rmb','q','e'].find(k=>selected[k]?.id==='fire-blast');
if(!slot){
 assert.ok(equipMove(charizard,2,'fire-blast'),'Level-50 Charizard must equip Fire Blast');
}
const kit=resolveLoadout(charizard),live=['lmb','rmb','q','e'].find(k=>kit[k]?.id==='fire-blast');
assert.ok(live,'Actual campaign loadout must contain Fire Blast');
assert.equal(kit[live].explosion?.ecos,false,'Real Kanto fight must not spawn repeated explosion echoes');
assert.equal(kit[live].explosion?.arde,1.6,'Lingering burn effect and duration remain unchanged');
assert.equal(kit[live].dano,20);
assert.equal(kit[live].cd,approved.cd);
console.log('FIRE_BLAST_RENDER_BUDGET_PASS',JSON.stringify({originalEchos:true,
 campaignEchoes:kit[live].explosion.ecos,burn:kit[live].explosion.arde,
 unchangedDamage:kit[live].dano,sourceCatalog:TEST_LIBRARY.length}));
