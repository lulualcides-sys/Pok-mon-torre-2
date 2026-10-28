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
