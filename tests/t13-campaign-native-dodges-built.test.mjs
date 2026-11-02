import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const load=p=>import(pathToFileURL(path.join(root,modules,p)).href);
const [{KANTO_151},{ARENA_APPROVED_121},{ROSTER},{resolveLoadout},
 {buildCampaignDodgeTemplates,ARENA_NATIVE_DODGE_FORMS}]=await Promise.all([
 load('torre2/all-kanto-species.js'),load('torre2/arena-approved-121.js'),
 load('datos.js'),load('torre2/move-pool.js'),
 load('torre2/campaign-native-dodges.js').then(async m=>({
 ...m,ARENA_NATIVE_DODGE_FORMS:(await load('torre2/arena-native-dodges.js')).ARENA_NATIVE_DODGE_FORMS}))
]);
test('all Kanto 151 campaign fighters have real defensive skill, native selection when available',()=>{
 const observed=[],errors=[];
 for(const {id} of KANTO_151){
  const member={id,progression:{species:id,level:8,experience:0}};
  const kit=resolveLoadout(member);
  const esp=kit.esp;
  if(!esp?.forma||!['dash','vuelo'].includes(esp.forma)||!Number.isFinite(esp.cd)||esp.cd<=0)
   errors.push({id,reason:'missing native dodge or safe fallback',esp});
  if(['lmb','rmb','q','e'].some(slot=>kit[slot]?.nombre===esp?.nombre))
   errors.push({id,reason:'ESP duplicated equipped attack'});
  observed.push({id,dodge:esp?.nombre,native:esp?.torre2CampaignNativeEvasion===true});
 }
 const native=observed.filter(x=>x.native);
 console.log('KANTO_NATIVE_CAMPAIGN_ESP',JSON.stringify({
  total:observed.length,native:native.length,distinct:new Set(native.map(x=>x.dodge)).size,
  samples:observed.filter(x=>['abra','geodude','butterfree','diglett','lapras','starmie','charmander'].includes(x.id)),
  errors
 }));
 assert.equal(observed.length,151);
 assert.deepEqual(errors,[]);
 assert.ok(native.length>=90,'Most Kanto species should have real Poké Arena ESP technique');
 for(const id of Object.keys(ARENA_APPROVED_121)){
  const value=observed.find(x=>x.id===id);
  assert.ok(value,id+' missing');
 }
});
