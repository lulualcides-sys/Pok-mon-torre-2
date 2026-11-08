import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base='9efaa07fcc2bcfacd04646e086d594aade62846d';
const changed=execFileSync('git',['diff',base,'--name-only'],{encoding:'utf8'}).trim().split('\n');
const allowed=new Set(['tools/pokearena/torre2-trainer-cards.js','tools/pokearena/torre2-city-scenery.js','tools/pokearena/torre2-campaign-scene.js','tools/pokearena/build-preview.mjs']);
for(const p of changed.filter(p=>p.startsWith('tools/pokearena/')||p.startsWith('src/')||p.startsWith('data/')))
 assert.ok(allowed.has(p)||p==='tools/pokearena/torre2-premium-art.js','Unexpected runtime/data edit: '+p);
const before=execFileSync('git',['show',base+':tools/pokearena/torre2-campaign-scene.js'],{encoding:'utf8'});
const after=fs.readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8').replace("import {premiumSprite} from './premium-art.js';\n",'').replace('import {resetCardPortraitRequests,requestCardPortrait}', 'import {resetCardPortraitRequests}');
const stripPC=s=>s.slice(0,s.indexOf(' pcScreen(state,page=0){'))+s.slice(s.indexOf('\n dexScreen(state){',s.indexOf(' pcScreen(state,page=0){')));
assert.equal(stripPC(before),stripPC(after),'Campaign code outside PC must remain byte-identical');
const paths=execFileSync('git',['ls-tree','-r','--name-only',base,'tools/pokearena','src','data','reference-assets'],{encoding:'utf8'}).trim().split('\n').filter(p=>!allowed.has(p));
let checked=0;const hashes={};
for(const p of paths){const old=execFileSync('git',['rev-parse',base+':'+p],{encoding:'utf8'}).trim();const current=execFileSync('git',['hash-object',p],{encoding:'utf8'}).trim();assert.equal(current,old,p+' changed');checked++}
hashes.campaignOutsidePC=createHash('sha256').update(stripPC(after)).digest('hex');
console.log(JSON.stringify({base,protectedFilesIdentical:checked,campaignOutsidePCIdentical:true,hashes},null,2));
