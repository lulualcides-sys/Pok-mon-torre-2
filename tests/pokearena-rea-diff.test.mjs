import test from 'node:test';
import assert from 'node:assert/strict';
import {compareAlpha,buildVerifiedBacklog} from '../tools/pokearena/rea-incremental-diff.mjs';

test('Alpha semver is independent of public JS hashes',()=>{
 assert.equal(compareAlpha('0.65.8','0.65.1'),1);
 assert.equal(compareAlpha('0.65.7','0.65.8'),-1);
 assert.equal(compareAlpha('0.65.8','0.65.8'),0);
 assert.equal(compareAlpha('src-e20c1e16eb','0.65.8'),null);
});
test('REA current 0.65.8 generates prioritized differences without pretending integration',()=>{
 const archive={alpha:{lastConfirmedFromArchivedConfig:'0.65.1'}};
 const live={liveAlpha:'0.65.8',liveVersionEvidence:'REA_CDP_PUBLIC_CONFIG_JS',
  evidenceId:'ev_test',
  officialScripts:[{name:'config.js',included:true,cdpHash:'a',
   url:'https://www.pokearena2d.com/src-e20c1e16eb/config.js'},
   {name:'notas.js',included:true,cdpHash:'b'}],
  latestChangelog:[
   {alpha:'0.65.8',title:'DEOXYS REBALANCED',description:'Form change',bullets:[]},
   {alpha:'0.65.7',title:'SPEED DEOXYS',description:'Dash during ultimate',bullets:[]},
   {alpha:'0.65.5',title:'LUCARIO REWORK',description:'Reworked',bullets:[]},
   {alpha:'0.65.1',title:'2VS2 FIXES',description:'Older',bullets:[]}],
  verifiedSpeciesDelta:[{id:'deoxys',recordChanged:true,
   old:{sha256:'old',forms:['DEOXYS']},new:{sha256:'new',forms:['DEOXYS','SPEED DEOXYS']}}]
 };
 const r=buildVerifiedBacklog(archive,live);
 assert.equal(r.liveVersionVerified,true);
 assert.equal(r.liveAlpha,'0.65.8');
 assert.deepEqual(r.newReleaseNotes.map(n=>n.alpha),['0.65.8','0.65.7','0.65.5']);
 assert.equal(r.newReleaseNotes[0].priority,'P0');
 assert.equal(r.newReleaseNotes[2].priority,'P1');
 assert.deepEqual(r.comparedNativeKits.map(x=>x.id),['deoxys']);
 assert.deepEqual(r.implementedIntoArena,[]);
 assert.equal(r.provenance.copiedSourceToGame,false);
});
test('No verified config source means version unknown, even when hash changes',()=>{
 const r=buildVerifiedBacklog({alpha:{lastConfirmedFromArchivedConfig:'0.65.1'}},
  {liveAlpha:'0.68.0',liveVersionEvidence:'UNKNOWN',officialScripts:[]});
 assert.equal(r.liveVersionVerified,false);
 assert.equal(r.liveAlpha,null);
 assert.deepEqual(r.newReleaseNotes,[]);
});
