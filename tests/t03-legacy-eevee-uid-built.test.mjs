// T03: old v1 saves without member UIDs must still evolve Eevee via the
// real campaign choice and preserve party/PC identity. Prepared fixtures,
// NOT natural battle victories or a visually observed evolution.
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
function fixture({boxed=false,collision=false}={}){
 const data=new Map();
 let denyPrimary=false;
 const storage={
  getItem:k=>data.get(k)??null,
  setItem(k,v){
   if(denyPrimary&&k===core.SAVE_KEY)throw Error('primary write denied');
   data.set(k,String(v));
  },
  removeItem:k=>data.delete(k),
  deny:()=>{denyPrimary=true;},
  allow:()=>{denyPrimary=false;}
 };
 globalThis.localStorage=storage;
 const s=core.createCampaign('bulbasaur');
 s.stage=4;
 const eevee={id:'eevee',hp:58,shiny:true,nickname:'Legacy Eevee',
  progression:progression.createPokemonProgression('eevee',30,{
   experience:progression.totalExperienceForLevel(30)}),
  tmMoves:['Protect'],moves:['Tackle'],movePlanSpecies:'eevee'};
 const target=boxed?s.box:s.team;
 const index=target.length;
 target.push(eevee);
 const expectedBase='legacy-eevee:'+(boxed?'box':'team')+':'+index;
 if(collision)s.box.push({id:'rattata',uid:expectedBase,hp:100,
  progression:progression.createPokemonProgression('rattata',5)});
 core.saveCampaign(s,storage);
 return {s,storage,eevee,expectedBase};
}
for(const boxed of [false,true])for(const collision of [false,true]){
 test('T03 legacy UID-less Eevee '+(boxed?'PC':'party')+
  (collision?' with reserved UID collision':'')+' persists only after successful choice',()=>{
  const {s,storage,eevee,expectedBase}=fixture({boxed,collision});
  const group=boxed?s.box:s.team;
  const other=group.filter(p=>p!==eevee);
  const token=core.pendingEeveeEvolution(s)?.uid;
  assert.equal(token,expectedBase+(collision?':recovered':''));
  assert.equal(eevee.uid,undefined,'Pending lookup must not rewrite old save');
  const before=structuredClone(s);
  const primary=storage.getItem(core.SAVE_KEY);
  const backup=storage.getItem(core.SAVE_BACKUP_KEY);
  storage.deny();
  assert.throws(()=>core.chooseEeveeEvolution(s,token,'jolteon'),/primary write denied/);
  assert.deepEqual(s,before,'Denied save changed the live Pokémon');
  assert.equal(storage.getItem(core.SAVE_KEY),primary);
  assert.equal(storage.getItem(core.SAVE_BACKUP_KEY),backup);
  storage.allow();
  const result=core.chooseEeveeEvolution(s,token,'jolteon');
  assert.equal(result.ok,true);
  assert.equal(result.uid,token);
  assert.equal(eevee.id,'jolteon');
  assert.equal(eevee.uid,token,'UID assigned after durable commit');
  assert.equal(eevee.progression.species,'jolteon');
  assert.equal(eevee.hp,58);
  assert.equal(eevee.shiny,true);
  assert.equal(eevee.nickname,'Legacy Eevee');
  assert.deepEqual(eevee.tmMoves,['Protect']);
  assert.deepEqual(eevee.moves,[]);
  assert.ok(s.dexCaught.includes('jolteon'));
  assert.equal(core.pendingEeveeEvolution(s),null);
  assert.deepEqual(group.filter(p=>p!==eevee),other,'Other members changed');
  const loaded=core.readCampaign(storage);
  const restored=(boxed?loaded.box:loaded.team).find(p=>p.uid===token);
  assert.equal(restored?.id,'jolteon');
  assert.equal(restored.shiny,true);
  assert.deepEqual(restored.tmMoves,['Protect']);
  assert.equal(core.chooseEeveeEvolution(loaded,token,'jolteon').ok,false);
  assert.equal(storage.getItem(core.SAVE_KEY),JSON.stringify(loaded));
 });
}
console.log('T03 legacy Eevee UID, PC/party, collision, atomic save: prepared fixtures');
