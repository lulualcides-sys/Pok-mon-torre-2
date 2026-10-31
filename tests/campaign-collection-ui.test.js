import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// The source campaign core imports generated Phaser-client modules, which do
// not exist until build-preview. Extract ONLY its immutable 151-name literal
// instead of executing the runtime import graph during plain Node npm test.
const coreSource=readFileSync(new URL('../tools/pokearena/torre2-campaign-core.js',import.meta.url),'utf8');
const dexMarker="export const KANTO_DEX=Object.freeze('";
const dexStart=coreSource.indexOf(dexMarker);
assert.ok(dexStart>=0,'Official 151-name Kanto Dex declaration must be present');
const dexTail=coreSource.slice(dexStart+dexMarker.length);
const dexEnd=dexTail.indexOf("'.split(',')");
assert.ok(dexEnd>0,'Kanto Dex source must retain its 151-name literal');
const KANTO_DEX=dexTail.slice(0,dexEnd).split(',');
import {kantoDexSpeciesId,kantoDexPageModel,pcCondition,
 pcMemberLabel,pcPageModel,PC_FILTERS} from '../tools/pokearena/torre2-collection-ui.js';

const member=(id,level=12,extra={})=>({
 id,uid:'test-'+id,progression:{level},hp:100,status:null,shiny:false,...extra
});

test('T25: the 151 displayed Dex names map uniquely to 151 actual save species IDs',()=>{
 assert.equal(KANTO_DEX.length,151);
 const ids=KANTO_DEX.map(kantoDexSpeciesId);
 assert.equal(new Set(ids).size,151,'No two Kanto names may collide');
 assert.equal(ids[28],'nidoran-f');
 assert.equal(ids[31],'nidoran-m');
 assert.equal(kantoDexSpeciesId('MrMime'),'mr-mime');
 assert.equal(kantoDexSpeciesId('Mr. Mime'),'mr-mime');
 assert.equal(kantoDexSpeciesId('Farfetchd'),'farfetchd');
 assert.equal(kantoDexSpeciesId("Farfetch'd"),'farfetchd');
 assert.equal(kantoDexSpeciesId('Nidoran♀'),'nidoran-f');
 assert.equal(kantoDexSpeciesId('Nidoran♂'),'nidoran-m');
});

test('T25: caught, seen, supported and Shiny markers use canonical species, not Dex display text',()=>{
 const save={
  dexCaught:['mr-mime','nidoran-f','farfetchd','mr-mime','deoxys'],
  dexSeen:['mr-mime','nidoran-m','deoxys'],
  dexShinySeen:['mr-mime','nidoran-f','deoxys'],
  dexShinyCaught:['nidoran-f']
 };
 const snap=JSON.stringify(save);
 const view=kantoDexPageModel(save,KANTO_DEX,['mr-mime','nidoran-f','nidoran-m','farfetchd']);
 assert.deepEqual(view.totals,{seen:4,caught:3,shinySeen:2,shinyCaught:1,all:151});
 assert.equal(view.pages,7);
 const all=Array.from({length:view.pages},(_,p)=>
  kantoDexPageModel(save,KANTO_DEX,['mr-mime','nidoran-f','nidoran-m','farfetchd'],p).rows).flat();
 for(const id of ['mr-mime','nidoran-f','nidoran-m','farfetchd'])
  assert.equal(all.find(r=>r.id===id)?.ready,true,id);
 assert.equal(all.find(r=>r.id==='mr-mime')?.caught,true);
 assert.equal(all.find(r=>r.id==='mr-mime')?.shinySeen,true);
 assert.equal(all.find(r=>r.id==='mr-mime')?.shinyCaught,false,'A sighting must not claim capture');
 assert.equal(all.find(r=>r.id==='nidoran-f')?.shinyCaught,true);
 assert.equal(all.find(r=>r.id==='farfetchd')?.seen,true,'A capture implies a sighting');
 assert.equal(JSON.stringify(save),snap,'Never rewrite a stored Dex or Shiny flag');
});

test('T25: Dex pagination clamps corrupt page numbers without losing Kanto #151 Mew',()=>{
 const high=kantoDexPageModel({},KANTO_DEX,[],999);
 assert.equal(high.page,6);assert.equal(high.rows.at(-1).name,'Mew');
 assert.equal(high.rows.at(-1).index,150);
 assert.equal(high.rows.length,19);
 assert.equal(kantoDexPageModel({},KANTO_DEX,[],-100).page,0);
 assert.equal(kantoDexPageModel({},KANTO_DEX,[],'invalid').page,0);
 assert.equal(kantoDexPageModel({},[],[]).pages,1);
 assert.deepEqual(kantoDexPageModel({},[],[]).rows,[]);
});

test('T25: the PC filters paginate original box positions and do not reorder or change saves',()=>{
 const box=Array.from({length:17},(_,i)=>member('pidgey',i+5,{
  uid:'pid-'+i,shiny:i===3||i===12,hp:i===8||i===12?0:75,
  status:i===2||i===14?{kind:'veneno'}:null
 }));
 const state={box,team:[member('bulbasaur')]},before=JSON.stringify(state);
 assert.deepEqual(PC_FILTERS,['ALL','SHINY','KO','STATUS']);
 assert.deepEqual(pcPageModel(state,0).rows.map(r=>r.actualIndex),[0,1,2,3,4,5]);
 assert.deepEqual(pcPageModel(state,1).rows.map(r=>r.actualIndex),[6,7,8,9,10,11]);
 assert.deepEqual(pcPageModel(state,2).rows.map(r=>r.actualIndex),[12,13,14,15,16]);
 const shiny=pcPageModel(state,0,'SHINY');
 assert.equal(shiny.total,17);assert.equal(shiny.shiny,2);assert.equal(shiny.matched,2);
 assert.deepEqual(shiny.rows.map(r=>r.actualIndex),[3,12]);
 assert.deepEqual(pcPageModel(state,0,'KO').rows.map(r=>r.actualIndex),[8,12]);
 assert.deepEqual(pcPageModel(state,0,'STATUS').rows.map(r=>r.actualIndex),[2,14]);
 assert.equal(pcPageModel(state,777,'SHINY').page,0);
 assert.equal(pcPageModel(state,999,'ALL').page,2);
 assert.equal(pcPageModel(state,-4,'ALL').page,0);
 assert.equal(pcPageModel(state,0,'MALFORMED').filter,'ALL');
 assert.equal(JSON.stringify(state),before,'Filtering, paging and labels must never edit saves');
});

test('T25: PC labels show Shiny, KO, condition, level and active identity',()=>{
 assert.match(pcMemberLabel(member('mr-mime',30,{hp:0,shiny:true,status:{kind:'veneno'}}),{
  active:true,selected:true
 }),/^◆ MR-MIME NV\.30 · KO VEN ✦ ✓$/);
 assert.equal(pcCondition(member('pidgey',3,{hp:135})).hp,100);
 assert.equal(pcCondition(member('pidgey',3,{hp:-1})).hp,0);
 assert.equal(pcCondition(member('pidgey',3,{status:{kind:'paralizado'}})).status,'PAR');
 assert.equal(pcCondition(member('pidgey',3,{confusion:{turns:1}})).status,'CONF');
 assert.equal(pcMemberLabel(member('spearow',8,{hp:47.7})), 'SPEAROW NV.8 · 48%');
});

test('T25: Phaser renderer and preview build use the pure model and retain actual box index',()=>{
 const src=readFileSync(new URL('../tools/pokearena/torre2-campaign-scene.js',import.meta.url),'utf8');
 const build=readFileSync(new URL('../tools/pokearena/build-preview.mjs',import.meta.url),'utf8');
 assert.match(src,/pcPageModel\(state,page,this\.pcFilter\)/);
 assert.match(src,/withdrawPokemon\(state,actualIndex\)/);
 assert.match(src,/swapPokemon\(state,this\.pcSelected,actualIndex\)/);
 assert.match(src,/kantoDexPageModel\(state,KANTO_DEX/);
 assert.match(src,/setData\('torre2-pc-filter',filter\)/);
 assert.match(src,/setData\('torre2-dex-id',row\.id\)/);
 assert.match(build,/torre2-collection-ui\.js','collection-ui\.js'/);
 assert.doesNotMatch(src.slice(src.indexOf(' dexScreen(state){')),/raw\.toLowerCase\(\)/);
});
