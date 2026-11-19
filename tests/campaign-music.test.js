import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const dir=path.join(here,'../tools/pokearena/campaign-music');
const prov=JSON.parse(fs.readFileSync(path.join(dir,'PROVENANCE.json'),'utf8'));

test('campaign music is CC0, credited and every file matches its SHA-256',()=>{
 assert.match(prov.license,/^CC0/);
 assert.equal(prov.author,'Guy G. Gamerson');
 assert.match(prov.source,/^https:\/\/opengameart\.org\/content\/bite-sized-rpg-tunes$/);
 const files=fs.readdirSync(dir).filter(f=>/\.(ogg|mp3)$/.test(f)).sort();
 assert.deepEqual(Object.keys(prov.files).sort(),files);
 for(const [f,sha] of Object.entries(prov.files))
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(dir,f))).digest('hex'),sha,f);
 for(const t of ['town','route','victory','hall'])for(const ext of ['ogg','mp3'])assert.ok(prov.files[t+'.'+ext],t+'.'+ext);
});

test('publisher installs the verified music; the campaign stops it outside the campaign',()=>{
 const pub=fs.readFileSync(path.join(here,'../tools/pokearena/publish-alpha0762.mjs'),'utf8');
 assert.match(pub,/campaign music hash mismatch/);
 assert.match(pub,/assets\/audio\/torre2-campaign/);
 const wf=fs.readFileSync(path.join(here,'../.github/workflows/torre2-alpha0762-publish.yml'),'utf8');
 assert.equal(wf.split("'tools/pokearena/campaign-music/**'").length,3);
 const scene=fs.readFileSync(path.join(here,'../tools/pokearena/torre2-campaign-scene.js'),'utf8');
 assert.match(scene,/if\(!game\.scene\.isActive\('campanha'\)\)\{snd\.stop\(\)/);
 assert.match(scene,/const p=readAudioSettings\(\);return p\.muted\?0:p\.music/);
});
