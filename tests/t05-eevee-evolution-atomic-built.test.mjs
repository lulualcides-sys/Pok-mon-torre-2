// T05: Eevee's three level-gated evolutions must survive storage denial.
// Prepared Lv30 checkpoints and denied writes are fixtures, not earned XP.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const modules=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const at=p=>import(pathToFileURL(path.join(root,modules,p)).href);
const [core,progression]=await Promise.all([
 at('torre2/campaign-core.js'),at('torre2/progression.js')
]);
function fixture({boxed=false}={}){
 const data=new Map();let denied=null;
 const storage={
  getItem:k=>data.get(k)??null,
  setItem(k,v){if(k===denied)throw new Error('QuotaExceededError: '+k);data.set(k,String(v));},
  removeItem:k=>data.delete(k),
  deny:k=>{denied=k;},allow:()=>{denied=null;}
 };
 globalThis.localStorage=storage;
 const s=core.createCampaign('bulbasaur');
 s.stage=4;
 const eevee={id:'eevee',uid:'t05-eevee',hp:67,nickname:'Eevee Save',
  progression:progression.createPokemonProgression('eevee',30,{
   experience:progression.totalExperienceForLevel(30)}),
  tmMoves:['Protect'],moves:['Tackle'],movePlanSpecies:'eevee'};
 if(boxed)s.box.push(eevee);else s.team.push(eevee);
 core.saveCampaign(s,storage);
 const loaded=core.readCampaign(storage);
 core.saveCampaign(loaded,storage);
 storage.setItem(core.SAVE_BACKUP_KEY,storage.getItem(core.SAVE_KEY));
 assert.equal(core.pendingEeveeEvolution(loaded)?.uid,eevee.uid);
 return {s:loaded,storage,uid:eevee.uid};
}
for(const boxed of [false,true]){
 for(const denied of [core.SAVE_KEY,core.SAVE_BACKUP_KEY]){
  test('T05 Eevee '+(boxed?'PC':'party')+' is atomic on '+denied,()=>{
   const {s,storage,uid}=fixture({boxed});
   const team=s.team,box=s.box,member=(boxed?box:team).find(p=>p.uid===uid);
   const progress=member.progression,prior=structuredClone(s);
   const primary=storage.getItem(core.SAVE_KEY);
   const backup=storage.getItem(core.SAVE_BACKUP_KEY);
   storage.deny(denied);
   assert.throws(()=>core.chooseEeveeEvolution(s,uid,'jolteon'),/QuotaExceededError/);
   assert.deepEqual(s,prior,'Denied evolution changed live state');
   assert.strictEqual(s.team,team);
   assert.strictEqual(s.box,box);
   assert.strictEqual((boxed?s.box:s.team).find(p=>p.uid===uid),member);
   assert.strictEqual(member.progression,progress);
   assert.equal(storage.getItem(core.SAVE_KEY),primary);
   assert.equal(storage.getItem(core.SAVE_BACKUP_KEY),backup);
   assert.equal(core.pendingEeveeEvolution(s)?.uid,uid);
   storage.allow();
   assert.deepEqual(core.readCampaign(storage),prior);
   const result=core.chooseEeveeEvolution(s,uid,'jolteon');
   assert.equal(result.ok,true);
   assert.equal(member.id,'jolteon');
   assert.equal(member.progression.species,'jolteon');
   assert.strictEqual(member.progression,progress);
   assert.deepEqual(member.moves,[]);
   assert.equal(member.movePlanSpecies,undefined);
   assert.deepEqual(member.tmMoves,['Protect']);
   assert.equal(member.hp,67);
   assert.ok(s.dexCaught.includes('jolteon'));
   assert.equal(core.pendingEeveeEvolution(s),null);
   assert.deepEqual(core.readCampaign(storage),s);
   assert.equal(core.chooseEeveeEvolution(s,uid,'jolteon').ok,false);
   assert.equal(storage.getItem(core.SAVE_KEY),JSON.stringify(s));
  });
 }
}
console.log('T05 Eevee evolution: primary/backup denial, team/PC, retry and identity (fixtures)');
