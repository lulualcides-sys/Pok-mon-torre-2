import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const stage=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const dir=JSON.parse(fs.readFileSync(path.join(stage,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(stage,dir,'torre2/campaign-core.js')).href);
function storage(){
 const map=new Map();
 return {map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)}
}
function progressed(){
 const s=core.createCampaign('charmander');
 s.stage=7;s.trainer=9;s.money=5370;s.inventory.potion=4;
 s.badges=['Rocha','Cascata','Trovao','Arco-Iris','Alma','Pantano','Vulcao'];
 s.team[0].hp=37;
 return s;
}
test('valid primary wins over an older backup; exact saved progress survives',()=>{
 const st=storage(),old=core.createCampaign('bulbasaur'),latest=progressed();
 st.setItem(core.SAVE_BACKUP_KEY,JSON.stringify(old));
 st.setItem(core.SAVE_KEY,JSON.stringify(latest));
 const restored=core.readCampaign(st);
 assert.equal(restored.stage,7);assert.equal(restored.trainer,9);
 assert.equal(restored.team[0].hp,37);assert.equal(restored.money,5370);
 assert.deepEqual(restored.team.map(p=>p.uid),latest.team.map(p=>p.uid));
});
test('syntactically broken primary recovers last valid backup without resetting story',()=>{
 const st=storage(),s=progressed(),raw=JSON.stringify(s);
 st.setItem(core.SAVE_BACKUP_KEY,raw);
 st.setItem(core.SAVE_KEY,'{"stage":');
 const restored=core.readCampaign(st);
 assert.equal(restored.stage,7);assert.equal(restored.money,5370);
 assert.equal(restored.trainer,9);
 assert.deepEqual(restored.team,s.team);
 assert.equal(st.getItem(core.SAVE_KEY),raw);
 assert.equal(st.getItem(core.SAVE_BACKUP_KEY),raw);
});
test('valid JSON with invalid campaign structure uses backup instead of resetting',()=>{
 for(const fake of ['{}','null','[]',JSON.stringify({...progressed(),team:[]}),
  JSON.stringify({...progressed(),team:[{id:0}]}),
  JSON.stringify({...progressed(),stage:99}),
  JSON.stringify({...progressed(),trainer:-1})]){
  const st=storage(),s=progressed(),raw=JSON.stringify(s);
  st.setItem(core.SAVE_KEY,fake);
  st.setItem(core.SAVE_BACKUP_KEY,raw);
  const back=core.readCampaign(st);
  assert.ok(back,'Last backup must survive '+fake.slice(0,30));
  assert.equal(back.stage,7);
  assert.equal(back.money,5370);
  assert.equal(back.trainer,9);
  assert.equal(st.getItem(core.SAVE_BACKUP_KEY),raw);
 }
});
test('bad current save cannot poison backup when a new valid save is written',()=>{
 const st=storage(),trusted=progressed(),trustedRaw=JSON.stringify(trusted);
 st.setItem(core.SAVE_BACKUP_KEY,trustedRaw);
 for(const invalid of ['not JSON','{}','{"team":[],"version":1,"stage":0,"trainer":0}']){
  st.setItem(core.SAVE_KEY,invalid);
  core.saveCampaign(core.createCampaign('squirtle'),st);
  assert.equal(st.getItem(core.SAVE_BACKUP_KEY),trustedRaw);
 }
});
test('invalid primary and invalid backup remain untouched, not silently reset',()=>{
 const st=storage(),bad='{invalid',badBackup=JSON.stringify({foo:1});
 st.setItem(core.SAVE_KEY,bad);
 st.setItem(core.SAVE_BACKUP_KEY,badBackup);
 assert.equal(core.readCampaign(st),null);
 assert.equal(st.getItem(core.SAVE_KEY),bad);
 assert.equal(st.getItem(core.SAVE_BACKUP_KEY),badBackup);
});
test('primary missing with intact backup resumes progress; explicit reset clears both',()=>{
 const st=storage(),s=progressed(),raw=JSON.stringify(s);
 st.setItem(core.SAVE_BACKUP_KEY,raw);
 assert.equal(core.readCampaign(st).stage,7);
 assert.equal(st.getItem(core.SAVE_KEY),raw);
 core.resetCampaign(st);
 assert.equal(core.readCampaign(st),null);
});
test('a valid old-v1 save migrates additively without losing party or awards',()=>{
 const st=storage(),s=progressed();
 delete s.leagueHonors;delete s.gymTMClaims;delete s.box;
 const raw=JSON.stringify(s);
 st.setItem(core.SAVE_KEY,raw);
 const loaded=core.readCampaign(st);
 assert.ok(loaded);
 assert.equal(loaded.money,5370);assert.equal(loaded.stage,7);
 assert.equal(loaded.team[0].uid,s.team[0].uid);
 assert.equal(loaded.team[0].hp,37);
 assert.equal(loaded.badges.length,7);
 assert.ok(Array.isArray(loaded.box));
 assert.ok(Array.isArray(loaded.gymTMClaims));
 assert.equal(st.getItem(core.SAVE_BACKUP_KEY),raw);
 assert.deepEqual(core.readCampaign(st),loaded);
});
