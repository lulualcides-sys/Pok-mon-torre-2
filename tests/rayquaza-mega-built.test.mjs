/* Runtime-built check: this is the REAL output consumed by Phaser, not a mock. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const base=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(base,'version.json'),'utf8'));
assert.match(version.modules,/^src-[0-9a-f]{10}$/);
const {ROSTER,etapaDe}=await import(pathToFileURL(path.join(base,version.modules,'datos.js')).href);
const ray=ROSTER.find(p=>p.id==='rayquaza');
assert.ok(ray,'Rayquaza missing from playable homologation roster');
assert.ok(ray.desactivado===false||!Object.hasOwn(ray,'desactivado'),
 'Rayquaza must be playable, including when original 0.65.1 already enables it');
assert.equal(ROSTER.filter(p=>p.id==='rayquaza').length,1,'duplicated Rayquaza');
assert.equal(ray.kit.lmb.nombre,'Dragon Claw');
assert.equal(ray.kit.rmb.nombre,'Twister');
assert.equal(ray.kit.e.nombre,'Dragon Ascent');
assert.equal(ray.kit.q.nombre,'Dragon Dance');
assert.equal(ray.kit.esp.nombre,'Extreme Speed');
assert.ok(ray.evoluciones.length>=2,'Rayquaza requires the two stage boosts');
const final=etapaDe(ray,ray.evoluciones.length);
assert.equal(final.mega?.dex,'0384-0001','Mega Rayquaza form must exist');
assert.equal(final.mega?.nombre,'MEGA RAYQUAZA');
assert.equal(final.mega?.kit?.rmb?.nombre,'Hurricane');
assert.equal(ROSTER.some(p=>p.id==='mimikyu'),false,'Mimikyu remains source-disabled');
assert.equal(ROSTER.some(p=>p.id==='gible'),false,'Gible remains source-disabled');
const manifest=JSON.parse(fs.readFileSync(path.join(base,'assets/pmd/manifest.json'),'utf8'));
const {rayquazaRequiredSpriteFiles}=await import('../tools/pokearena/torre2-rayquaza-preview.mjs');
for(const f of rayquazaRequiredSpriteFiles(manifest)){
 assert.ok(fs.statSync(path.join(base,'assets/pmd',f)).size>1000,'Missing/empty PMD sprite: '+f);
}
console.log('RAYQUAZA MEGA NATIVE PHASER BUILD VERIFIED',JSON.stringify({
 version:version.modules,normal:'0384',mega:'0384-0001',normalMoves:[
 ray.kit.lmb.nombre,ray.kit.rmb.nombre,ray.kit.q.nombre,ray.kit.e.nombre],
 megaRmb:final.mega.kit.rmb.nombre,spritesChecked:10
}));
