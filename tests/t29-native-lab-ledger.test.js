import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// The laboratory module imports the all-Kanto roster that is installed in
// _site by build-preview, so native behavior is tested separately in Chromium.
// This lightweight source test can run before capture/build.
const source=readFileSync(new URL('../tools/pokearena/torre2-laboratory.js',import.meta.url),'utf8');
test('only laboratory mode initializes original Phaser training damage history',()=>{
 assert.match(source,/if\(!scene\.datos\?\.torre2\?\.laboratory\|\|scene\.__torre2LabInstalled\)return;/);
 assert.match(source,/scene\.__torre2LabInstalled=true;/);
 assert.match(source,/scene\.registroDano=\[\];/,'Native anotarEntreno needs a push-capable array');
 assert.match(source,/scene\.comboActual=0;/);
 assert.match(source,/scene\.mejorCombo=0;/);
 assert.match(source,/scene\.ultimoGolpeEntreno=-Infinity;/);
 assert.match(source,/scene\.ultimoDano=0;/);
 assert.ok(source.indexOf('scene.registroDano=[]')>source.indexOf('if(!scene.datos?.torre2?.laboratory'),
  'Never initialize training ledger outside the isolated laboratory');
});

test('built client guards original native first-hit ledger only inside Torre 2',()=>{
 const builder=readFileSync(new URL('../tools/pokearena/build-preview.mjs',import.meta.url),'utf8');
 assert.match(builder,/anotarEntreno\(d\)\{this\.registroDano\.push/);
 assert.match(builder,/if\(this\.datos\?\.torre2&&\!Array\.isArray\(this\.registroDano\)\)/);
 assert.match(builder,/this\.registroDano=\[\];this\.comboActual=0;/);
});
