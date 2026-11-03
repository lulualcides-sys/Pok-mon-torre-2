import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const modules=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(root,modules,'torre2/campaign-core.js')).href);
const progression=await import(pathToFileURL(path.join(root,modules,'torre2/progression.js')).href);
const db=new Map();
const storage={
 getItem:key=>db.get(key)??null,
 setItem:(key,value)=>db.set(key,String(value)),
 removeItem:key=>db.delete(key)
};
globalThis.localStorage=storage;
function fixture(){
 db.clear();const s=core.createCampaign('squirtle');
 s.inventory.pokeball=5;
 s.pendingWild={id:'pikachu',stage:0,trainer:0,level:4,hpPercent:45,shiny:false};
 core.saveCampaign(s,storage);return core.readCampaign(storage);
}
const args={duringBattle:true,hpPercent:45,hp:45,hpMax:100,status:'none'};
test('T92 successful capture awards real persisted EXP to existing party, not captured Pokémon',()=>{
 const s=fixture();const before=structuredClone(s),teamRef=s.team,progressRef=s.team[0].progression;
 const out=core.attemptCapture(s,()=>0,'pokeball',args);
 assert.equal(out.ok,true);
 assert.equal(s.team.length,before.team.length+1);
 assert.strictEqual(s.team,teamRef);
 assert.strictEqual(s.team[0].progression,progressRef);
 assert.ok(s.team[0].progression.experience>before.team[0].progression.experience);
 assert.ok(out.sharedExp.some(x=>x.index===0&&x.reward>0));
 assert.ok(out.sharedExp.some(x=>x.tester&&x.reward===0));
 assert.equal(s.team.at(-1).id,'pikachu');
 assert.equal(s.team.at(-1).progression.experience,progression.createPokemonProgression('pikachu',4).experience);
 assert.equal(s.wins,before.wins);
 assert.equal(s.trainer,before.trainer);
 assert.equal(s.money,before.money);
 assert.ok(s.lastMessage.includes('XP por captura'));
 assert.deepEqual(core.readCampaign(storage),s);
});
test('T92 failed capture spends ball but grants no EXP and no caught dex entry',()=>{
 const s=fixture(),before=structuredClone(s);
 const result=core.attemptCapture(s,()=>.999999,'pokeball',args);
 assert.equal(result.ok,false);
 assert.equal(s.inventory.pokeball,before.inventory.pokeball-1);
 assert.equal(s.team[0].progression.experience,before.team[0].progression.experience);
 assert.ok(!s.dexCaught.includes('pikachu'));
});
