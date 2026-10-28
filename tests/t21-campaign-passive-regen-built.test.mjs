import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Validate the produced original Phaser fighter, not only the build script.
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const native=fs.readFileSync(path.join(root,version,'luchador.js'),'utf8');
test('T21: only Torre 2 disables arcade passive HP refill; Arena remains untouched',()=>{
 const scoped='if(t-this.ultimoDano>=REGLAS.curaTras&&this.hp<this.hpMax&&!helado&&!this.est.enfermo&&!this.escena.datos?.torre2){';
 const original='if(t-this.ultimoDano>=REGLAS.curaTras&&this.hp<this.hpMax&&!helado&&!this.est.enfermo){';
 assert.ok(native.includes(scoped),'Built native fighter lacks campaign-only regen guard');
 assert.ok(!native.includes(original),'Unscoped arcade HP regeneration still applies to campaign');
 assert.equal(native.split(scoped).length-1,1,'Guard exactly one native passive-healing branch');
 // Original healing code stays inside the same native condition for Arena.
 assert.ok(native.includes('REGLAS.curaFuera*REGLAS.vidaGlobal*this.curaMult*dt'),
  'Native Arena passive heal calculation was deleted instead of scoped');
 // Explicit healing is still present: Leech-style drain and Ingrain-style
 // status heals are never classified as passive out-of-combat regeneration.
 assert.ok(native.includes('dr.cura??1'),'Approved draining/healing move removed');
 assert.ok(native.includes('this.est.arraigo'),'Explicit Ingrain healing removed');
});
