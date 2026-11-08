import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const base=process.env.SCENIC_BASE_SHA||'f079d9c7fc7794a21e45198d423af23c3271c9d8';
const allowed=new Set(['tools/pokearena/torre2-trainer-cards.js','tools/pokearena/torre2-premium-art.js','tools/pokearena/build-preview.mjs']);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
for(const p of git('diff',base,'--name-only').split('\n').filter(p=>p.startsWith('tools/pokearena/')||p.startsWith('src/')||p.startsWith('data/')))
 assert.ok(allowed.has(p),'Unexpected runtime edit: '+p);
const paths=git('ls-tree','-r','--name-only',base,'tools/pokearena','src','data','reference-assets').split('\n').filter(p=>!allowed.has(p));
for(const p of paths)assert.equal(git('hash-object',p),git('rev-parse',base+':'+p),p+' changed');
const before=git('show',base+':tools/pokearena/torre2-trainer-cards.js'),after=fs.readFileSync('tools/pokearena/torre2-trainer-cards.js','utf8');
for(const [start,end] of [['export const LEADER_DIALOGUE','const TX='],['export function trainerCardEntries','function status(']]){
 const section=s=>s.slice(s.indexOf(start),s.indexOf(end,s.indexOf(start)));
 assert.equal(section(after),section(before),start+' must remain unchanged');
}
console.log(JSON.stringify({base,protectedFilesIdentical:paths.length,campaignSceneIdentical:true,rostersAndVsDialogueIdentical:true},null,2));
