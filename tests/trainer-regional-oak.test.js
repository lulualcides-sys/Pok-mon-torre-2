import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {REGIONAL_TRAINERS,regionalTrainer,regionalRocket,regionalTrainerParty,regionalTrainerPartySize} from '../tools/pokearena/torre2-trainer-rosters.js';
// Test routeNode's actual pure source without importing build-time-only
// './frlg-learnsets.js' (created by build-preview, absent in source tree).
const file=path=>readFileSync(path,'utf8');
const routeSource=file('tools/pokearena/torre2-route-data.js');
const routeBody=routeSource.match(/export function routeNode\(stage,index,max\)\{([\s\S]*?)\n\}/)?.[1];
assert.ok(routeBody,'routeNode must remain an explicit pure function');
const routeNode=new Function('stage','index','max',routeBody);
const core=file('tools/pokearena/torre2-campaign-core.js');
const scene=file('tools/pokearena/torre2-campaign-scene.js');
const card=file('tools/pokearena/torre2-trainer-cards.js');
const battle=file('tools/pokearena/torre2-party-battle.js');
const versus=file('tools/pokearena/torre2-versus-intro.js');
const frlg=file('tools/pokearena/torre2-frlg-npc.js');
const builder=file('tools/pokearena/build-preview.mjs');
const assets=file('tools/pokearena/install-frlg-npcs.mjs');

test('Kanto trainer encounters have an explicit regional type and species',()=>{
 assert.equal(REGIONAL_TRAINERS.length,9);
 const expectedSizes=Array.from({length:9},(_,stage)=>stage<8?13+stage*2:17);
 assert.deepEqual(REGIONAL_TRAINERS.map(rows=>rows.length),expectedSizes,
  'No regional roster may wrap and recycle generic trainers in later cards');
 const allowed=new Set(['youngster','bugcatcher','lass','hiker','swimmer','sailor',
  'gentleman','camper','ace','scientist','rocker','cyclist','fisher','psychic','blackbelt']);
 for(let stage=0;stage<9;stage++){
  for(let index=0;index<expectedSizes[stage];index++){
   const foe=regionalTrainer(stage,index);
   assert.ok(foe?.id, 'Missing stage '+stage+' trainer '+index);
   assert.ok(allowed.has(foe.spriteKind),foe.spriteKind);
   assert.match(foe.name,/\d+$/);
   assert.equal(foe.name.split(' ').at(-1),String(index+1));
  }
 }
 assert.equal(regionalTrainer(9,0),null,'Elite has no ordinary NPC ladder');
});
test('Brock region keeps bugcatcher and early species, Cerulean contains swimmers',()=>{
 assert.equal(regionalTrainer(0,1).spriteKind,'bugcatcher');
 assert.equal(regionalTrainer(0,1).id,'caterpie');
 assert.ok(REGIONAL_TRAINERS[1].some(entry=>entry.spriteKind==='swimmer'));
 assert.ok(REGIONAL_TRAINERS[3].some(entry=>entry.id==='gloom'));
 assert.ok(REGIONAL_TRAINERS[7].some(entry=>entry.id==='rhyhorn'));
 assert.ok(REGIONAL_TRAINERS[8].some(entry=>entry.spriteKind==='blackbelt'));
});
test('Rivals and Rocket have stage-specific roles, no Rocket in Viridian Forest',()=>{
 const n=13;
 assert.notEqual(routeNode(0,5,n).type,'rocket');
 assert.equal(routeNode(0,3,n).type,'rival');
 assert.equal(routeNode(1,5,15).type,'rocket');
 assert.notEqual(routeNode(2,5,17).type,'rocket');
 assert.equal(routeNode(3,5,19).type,'rocket');
 assert.equal(routeNode(8,0,17).type,'trainer');
 assert.equal(routeNode(8,17,17).type,'leader');
 assert.equal(regionalRocket(3,5),'koffing');
});
test('the card and battle resolve the SAME actual species and sprite class',()=>{
 assert.match(core,/regionalTrainer\(s\.stage,s\.trainer\)/);
 assert.match(core,/spriteKind:leader\?null/);
 assert.match(core,/encounter\?\.id\|\|list/);
 assert.match(card,/currentOpponent\(\{\.\.\.state,trainer:index/);
 assert.match(card,/regionalTrainerParty\(stage,index,foe\?\.id/);
 assert.match(card,/regionalTrainerPartySize\(stage,index\)/);
 assert.match(card,/trainerSpeciesForLevel\(id,foe\?\.level\)/);
 assert.match(card,/rivalChampionTeam\(campaignStarter\(state\)\)/);
 assert.match(battle,/regionalTrainerParty\(state\.stage,state\.trainer,opponent\.id,count,/);
 assert.match(battle,/regionalTrainerPartySize\(state\.stage,state\.trainer\)/);
 assert.match(card,/opponent\?\.spriteKind\|\|trainerClass/);
 assert.match(scene,/projection\?\.spriteKind\|\|/);
 assert.match(scene,/spriteKind:opponent\.spriteKind/);
 assert.match(versus,/spriteKind\|\|trainerClass/);
 assert.doesNotMatch(card,/saveCampaign\(/);
});
test('every displayed NPC party slot corresponds to the actual battle projection',()=>{
 for(let stage=0;stage<=8;stage++){
  const limit=stage<8?13+stage*2:17;
  for(let index=0;index<limit;index++){
   const expected=regionalTrainerPartySize(stage,index);
   const party=regionalTrainerParty(stage,index,'pidgey',expected);
   assert.equal(party.length,expected);
   assert.equal(party[0],'pidgey');
   assert.deepEqual(
    regionalTrainerParty(stage,index,'pidgey',expected),
    party,'teams must be deterministic across save/reload and card/battle views');
   assert.equal(new Set(party).size,party.length,
    'Same trainer may not repeat an identical species '+stage+'/'+index);
   for(let slot=1;slot<party.length;slot++)
    assert.ok(REGIONAL_TRAINERS[stage].some(t=>t.id===party[slot]),
     'Secondary Pokémon must belong to this FireRed region');
  }
 }
 assert.equal(regionalTrainerPartySize(0,0),1);
 assert.equal(regionalTrainerPartySize(0,12),3);
 assert.equal(regionalTrainerPartySize(8,16),4);
 assert.equal(regionalTrainerParty(1,5,'zubat',2,'rocket')[1],'rattata');
 assert.equal(regionalTrainerParty(2,3,'squirtle',2,'rival')[1],'pidgeotto');
 assert.equal(regionalTrainerParty(0,3,'squirtle',2,'rival')[1],'pidgey');
 assert.equal(regionalTrainerParty(8,12,'venusaur',4,'rival')[1],'pidgeot');
 assert.equal(regionalTrainerParty(8,12,'venusaur',4,'rival')[2],'alakazam');
 assert.equal(regionalTrainerParty(1,5,'zubat',4,'rocket').length,4);
 assert.equal(new Set(regionalTrainerParty(1,5,'zubat',4,'rocket')).size,4,
  'Team Rocket must not copy identical members when the full party expands');
});
test('Professor Oak is new-game-only and uses real native FRLG sprites',()=>{
 assert.match(frlg,/oak:'prof_oak'/);
 assert.match(assets,/'prof_oak'/);
 assert.match(assets,/graphics\/oak_speech\/oak\/pic/);
 assert.match(assets,/graphics\/oak_speech\/platform/);
 assert.match(builder,/AVAILABLE_OAK_INTRO/);
 assert.match(scene,/AVAILABLE_OAK_INTRO\.includes\(name\)/);
 assert.match(scene,/frlg-oak-intro-oak/);
 assert.match(scene,/torre2-professor-oak-lecture/);
 assert.match(scene,/if\(!state\)return this\.starterSelection\(\)/);
 assert.match(scene,/professorOakIntro\(\)/);
 assert.match(scene,/addFireRedNPC\(this,'oak'/);
 assert.match(scene,/if\(!this\.__torre2OakIntroSeen\)return this\.professorOakIntro\(\)/);
 assert.match(scene,/this\.__torre2OakIntroSeen=true/);
 assert.match(scene,/this\.children\.removeAll\(true\)/);
 assert.match(scene,/this\.starterSelection\(\)/);
 assert.match(scene,/if\(!state\)for\(const dex of \['0001','0004','0007'\]\)/);
 assert.match(scene,/saveCampaign\(createPlayerCampaign\(id\)\)/);
 assert.match(builder,/torre2-trainer-rosters\.js','torre2-trainer-rosters\.js'/);
});

test('entire Kanto has individually-authored primary trainers, varying 4-member teams and Cinnabar sprites',()=>{
 const sizes=REGIONAL_TRAINERS.map(rows=>rows.length);
 assert.deepEqual(sizes,[13,15,17,19,21,23,25,27,17]);
 assert.equal(sizes.reduce((a,b)=>a+b,0),177);
 for(let stage=0;stage<9;stage++){
  for(let index=1;index<sizes[stage];index++){
   assert.notEqual(regionalTrainer(stage,index).id,regionalTrainer(stage,index-1).id,
    'Adjacent trainers should not have identical featured Pokémon '+stage+'/'+index);
  }
  // A single trainer can be a route composite; no random rerolls or
  // unregistered out-of-region species, even with a full six-slot request.
  for(let i=0;i<sizes[stage];i++){
   const featured=regionalTrainer(stage,i).id;
   const squad=regionalTrainerParty(stage,i,featured,4);
   assert.deepEqual(squad,regionalTrainerParty(stage,i,featured,4));
   assert.equal(new Set(squad).size,squad.length,
    'Trainer '+stage+'/'+i+' must have four distinct species');
   assert.ok(squad.slice(1).every(id=>REGIONAL_TRAINERS[stage].some(t=>t.id===id)));
  }
 }
 const lateCinnabar=REGIONAL_TRAINERS[6].slice(16,21);
 assert.ok(new Set(lateCinnabar.map(x=>x.id)).size>=4,
  'Cinnabar trainer cards 16–20 must not reuse the same science lineup');
 assert.ok(new Set(lateCinnabar.map(x=>x.spriteKind)).size>=2,
  'Cinnabar cards must show more than one FireRed trainer class');
});
