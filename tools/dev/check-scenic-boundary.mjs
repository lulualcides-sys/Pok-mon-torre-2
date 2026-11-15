import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const base=process.env.SCENIC_BASE_SHA||'f079d9c7fc7794a21e45198d423af23c3271c9d8';
const allowed=new Set(['tools/pokearena/torre2-trainer-cards.js','tools/pokearena/torre2-premium-art.js','tools/pokearena/build-preview.mjs','tools/pokearena/publish-hotfix-on-alpha0713.mjs']);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();

// Release publisher is usually immutable in scenic-only patches. The sole
// exception is exactly the reviewed, presentation-only trainer-cards overlay
// added to the pinned Alpha 0.71.3, with mandatory runtime guards. No other
// deletion/insertion/edit to the release publisher is authorized here.
const publisher='tools/pokearena/publish-hotfix-on-alpha0713.mjs';
const publisherBefore=git('show',base+':'+publisher);
const publisherNow=fs.readFileSync(publisher,'utf8').trim();
const once=(s,oldText,newText,label)=>{
 assert.equal(s.split(oldText).length,2,'Release guard anchor drift: '+label);
 return s.replace(oldText,newText);
};
const oldOverlay=" ['tools/pokearena/torre2-campaign-core.js','torre2/campaign-core.js']\n];";
const newOverlay=" ['tools/pokearena/torre2-campaign-core.js','torre2/campaign-core.js'],\n"+
 " // Audited presentation-only #600 backport; preserves sprites and campaign save order.\n"+
 " ['tools/pokearena/torre2-trainer-cards.js','torre2/trainer-cards.js']\n];";
const oldCheck="   'Campaign native battle and regional roster patch missing');";
const newCheck=oldCheck+"\n"+
 " if(target==='torre2/trainer-cards.js')\n"+
 "  must(content.includes('export function trainerCardSections(stage,total)')&&\n"+
 "   content.includes('const visibleEntries=sections[page].indices.map(index=>all[index])')&&\n"+
 "   content.includes('scenicBackdrop(scene,layer,state.stage)')&&\n"+
 '   content.includes("setData(\'torre2-trainer-card-index\',entry.index)"),\n'+
 "   'Safe campaign route/gym card partition or approved touch hitboxes absent');";
// After #640 becomes the merge base, identical publisher code is the safe
// baseline. Only calculate the one-off backport when a PR actually changes it.
if(publisherBefore!==publisherNow){
 const expectedPublisher=once(once(publisherBefore,oldOverlay,newOverlay,'publisher overlay'),
  oldCheck,newCheck,'publisher cards-only integrity guard');
 assert.equal(publisherNow,expectedPublisher,
  'Unreviewed publisher logic change; allow only the pinned cards-only overlay');
}

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
