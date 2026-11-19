import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const dir=path.join(__dirname,'../tools/pokearena/campaign-art');
const provenance=JSON.parse(fs.readFileSync(path.join(dir,'PROVENANCE.json'),'utf8'));
const cities=['pewter','cerulean','vermilion','celadon','fuchsia','saffron','cinnabar','viridian','indigo'];

test('owner campaign art: every file is listed with a matching SHA-256',()=>{
 const pngs=fs.readdirSync(dir).filter(f=>f.endsWith('.png')).sort();
 assert.deepEqual(Object.keys(provenance.files).sort(),pngs);
 for(const [file,sha] of Object.entries(provenance.files))
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(dir,file))).digest('hex'),sha,file);
 for(const c of cities)for(const kind of ['city','emblem'])assert.ok(provenance.files[kind+'-'+c+'.png'],kind+' '+c);
 for(const f of ['route-card.png','route-detail.png','journey-bg.png'])assert.ok(provenance.files[f],f);
 assert.match(provenance.note,/Sprites/);
});

test('publisher installs the verified art and the release workflow watches it',()=>{
 const pub=fs.readFileSync(path.join(__dirname,'../tools/pokearena/publish-alpha0762.mjs'),'utf8');
 assert.match(pub,/campaign art hash mismatch/);
 assert.match(pub,/assets\/ui\/torre2-campaign/);
 const wf=fs.readFileSync(path.join(__dirname,'../.github/workflows/torre2-alpha0762-publish.yml'),'utf8');
 assert.equal(wf.split("'tools/pokearena/campaign-art/**'").length,3);
 const cards=fs.readFileSync(path.join(__dirname,'../tools/pokearena/torre2-trainer-cards.js'),'utf8');
 assert.match(cards,/export const OWNER_ART_DIR='assets\/ui\/torre2-campaign\/'/);
});
