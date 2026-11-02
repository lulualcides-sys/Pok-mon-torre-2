/* T16 independent catalog/equipment audit, run on the actually built Phaser pool.
 * A supported engine weather state is NOT evidence of an equipable move.
 * Never grant, clone, modify or reinterpret an unapproved renderer.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const load=name=>import(pathToFileURL(path.join(root,modules,name)).href);
const [{TEST_LIBRARY,availableMoves,equipMove,selectedMoves,campaignMoveSlotReason},
 {WEATHER_MOVES,weatherFromMove,weatherDamageMultiplier}]=await Promise.all([
 load('torre2/move-pool.js'),load('torre2/weather.js')
]);
const supported=Object.entries(WEATHER_MOVES);
assert.deepEqual(supported.map(([name])=>name).sort(),
 ['Hail','Rain Dance','Sandstorm','Sunny Day'].sort());
const catalog=supported.map(([name,kind])=>({
 name,kind,move:TEST_LIBRARY.find(move=>move.nombre===name)
}));
const installed=catalog.filter(entry=>Boolean(entry.move));
assert.deepEqual(installed.map(entry=>entry.name),['Rain Dance'],
 'Approved weather move inventory changed; audit VFX and four-source policy before changing equip gates');
const rain=installed[0].move;
assert.equal(rain.id,'rain-dance');
assert.equal(rain.approved,true,'Only approved rain effect may reach the campaign');
assert.ok(rain.forma&&!rain.pendiente&&!rain.torre2Unavailable,
 'Existing rain dance must have a ready Phaser renderer');
assert.equal(rain.tipo,'WATER');
const make=(id,level)=>({id,progression:{species:id,level},tmMoves:[]});
for(const species of ['squirtle','lapras']){
 const before=make(species,24),after=make(species,25);
 assert.ok(!availableMoves(before).some(m=>m.id==='rain-dance'),
  species+' unlocked bonus Rain Dance before Lv25');
 const legal=availableMoves(after).find(m=>m.id==='rain-dance');
 assert.ok(legal?.forma,species+' lacks an equipped-eligible Rain Dance at Lv25');
 let equipped=null;
 for(const slot of [1,2,3]){
  const candidate=make(species,25);
  if(campaignMoveSlotReason(candidate,slot,legal))continue;
  if(equipMove(candidate,slot,legal.id)){
   assert.equal(selectedMoves(candidate)[slot],legal.id,
    'Editor and battle disagree for '+species+' slot '+slot);
   equipped=slot;
   break;
  }
 }
 assert.notEqual(equipped,null,species+' could not equip installed Rain Dance in any legal slot');
}
for(const name of ['Sunny Day','Sandstorm','Hail']){
 assert.ok(!TEST_LIBRARY.some(move=>move.nombre===name),
  name+' must not appear without verified approved VFX');
}
const actor={escena:{datos:{torre2:{}}}};
weatherFromMove(actor,rain);
assert.equal(actor.escena.__torre2Weather.kind,'rain');
assert.equal(actor.escena.__torre2Weather.remaining,20);
assert.equal(weatherDamageMultiplier(actor.escena.__torre2Weather,'NORMAL','Tackle',['WATER']),1.2);
const neutral={escena:{datos:{}}};
weatherFromMove(neutral,rain);
assert.equal(neutral.escena.__torre2Weather,undefined,
 'Original Arena should never receive campaign weather from a Kanto move');
console.log('PASS_T16_REAL_WEATHER_EQUIPMENT',JSON.stringify({
 catalogued:installed.map(x=>({name:x.name,id:x.move.id,renderer:x.move.forma})),
 engineOnly:catalog.filter(x=>!x.move).map(x=>x.name),
 verifiedSpecies:['squirtle','lapras'],firstCampaignLevel:25,
 originalArenaIsolated:true,mode:'compiled-phaser-catalog'
}));
