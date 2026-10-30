/* T16: only the original, approved Rain Dance renderer is installed.
 * The other three climates remain motor states until four-source VFX approval.
 * Validate native compiled editor, FireRed compatibility and role boundaries.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const load=x=>import(pathToFileURL(path.join(root,modules,x)).href);
const [{
 TEST_LIBRARY,availableMoves,equipMove,resolveLoadout,selectedMoves,
 campaignMoveSlotReason,KANTO_RAIN_DANCE_SPECIES,KANTO_RAIN_DANCE_LEVEL
},{frlgMachineCompatible,frlgEvolutionLevel}, {WEATHER_MOVES}]=await Promise.all([
 load('torre2/move-pool.js'),load('torre2/frlg-learnsets.js'),load('torre2/weather.js')
]);
assert.equal(KANTO_RAIN_DANCE_LEVEL,25);
assert.equal(KANTO_RAIN_DANCE_SPECIES.length,40);
assert.equal(new Set(KANTO_RAIN_DANCE_SPECIES).size,40);
const installed=TEST_LIBRARY.find(m=>m.id==='rain-dance');
assert.equal(installed?.approved,true);
assert.equal(installed.forma,'torre2_finale_raindance');
assert.ok(!installed.pendiente);
const make=(id,level,tmMoves=[])=>({
 id,progression:{species:id,level},tmMoves
});
const successes=[];
for(const id of KANTO_RAIN_DANCE_SPECIES){
 assert.equal(frlgMachineCompatible(id,'rain-dance'),true,
  id+' is missing the official FireRed/LeafGreen TM18 compatibility');
 const before=make(id,24);
 assert.equal(availableMoves(before).some(m=>m.id==='rain-dance'),false,
  id+' illegally learned Rain Dance before level 25');
 const equipmentLevel=Math.max(KANTO_RAIN_DANCE_LEVEL,frlgEvolutionLevel(id));
 const member=make(id,equipmentLevel);
 const legal=availableMoves(member).find(m=>m.id==='rain-dance');
 assert.ok(legal?.forma&&!legal.pendiente,id+' lacks approved climate renderer');
 assert.equal(Number(legal.dano),0,id+' weather move must be non damaging');
 let slot=-1;
 for(const candidate of [1,2]){
  const pokemon=make(id,equipmentLevel);
  if(campaignMoveSlotReason(pokemon,candidate,legal))continue;
  if(!equipMove(pokemon,candidate,'rain-dance'))continue;
  assert.equal(selectedMoves(pokemon)[candidate],'rain-dance');
  const kit=resolveLoadout(pokemon);
  assert.equal(kit[['lmb','rmb','q','e'][candidate]]?.forma,'torre2_finale_raindance');
  assert.notEqual(kit.e?.id,'rain-dance','Weather must never replace the charged finisher');
  slot=candidate;break;
 }
 assert.notEqual(slot,-1,id+' failed to equip rain in HAB2/HAB3: '+
  JSON.stringify({equipmentLevel,defaultSlots:selectedMoves(make(id,equipmentLevel)),
   reasonHAB2:campaignMoveSlotReason(member,1,legal),
   reasonHAB3:campaignMoveSlotReason(member,2,legal)}));
 successes.push({id,slot,at:equipmentLevel});
}
for(const [id,kind] of Object.entries({
 'sunny-day':'sun','sandstorm':'sand','hail':'hail'
})){
 assert.equal(Object.values(WEATHER_MOVES).includes(kind),true);
 assert.equal(TEST_LIBRARY.some(m=>m.id===id),false,
  id+' must not be advertised as executable without vetted four-source FX');
}
for(const id of ['charizard','bulbasaur','geodude','moltres']){
 // FireRed TM18 compatibility alone must not auto-grant climate affinity
 // to non-water/non-electric Pokémon. A genuinely taught TM is separate.
 assert.equal(availableMoves(make(id,25)).some(m=>m.id==='rain-dance'),false,
  id+' got a free off-type weather move');
}
for(const id of ['squirtle','pikachu','voltorb']){
 assert.equal(availableMoves(make(id,5)).some(m=>m.id==='rain-dance'),false);
 assert.equal(resolveLoadout(make(id,8)).e?.torre2IntroPractice,true,
  'Early meter-gated ULT was replaced for '+id);
}
console.log('PASS_T16_RAIN_EQUIPMENT_40_FRLG',JSON.stringify({
 newPlayableWeather:['Rain Dance'],species:successes.length,
 eligible:successes.map(x=>x.id),minLevel:KANTO_RAIN_DANCE_LEVEL,
 pendingVfx:['Sunny Day','Sandstorm','Hail'],
 mode:'compiled Phaser/WebGL loadout; original VFX unchanged'
}));
