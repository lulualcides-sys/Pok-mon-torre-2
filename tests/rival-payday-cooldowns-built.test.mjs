// Regression on the real built Phaser module graph; no save or native FX edits.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const base=path.join(root,version,'torre2');
const load=name=>import(pathToFileURL(path.join(base,name)).href);
const core=await load('campaign-core.js');
const party=await load('party-battle.js');
const moves=await load('move-pool.js');
const stateStore=new Map();
globalThis.localStorage={
 getItem:key=>stateStore.get(key)??null,
 setItem:(key,value)=>stateStore.set(key,String(value)),
 removeItem:key=>stateStore.delete(key)
};

test('Rival starter evolves in Kanto when and only when required levels are reached',()=>{
 const expected={
  bulbasaur:[[15,'bulbasaur'],[16,'ivysaur'],[31,'ivysaur'],[32,'venusaur']],
  charmander:[[15,'charmander'],[16,'charmeleon'],[35,'charmeleon'],[36,'charizard']],
  squirtle:[[15,'squirtle'],[16,'wartortle'],[35,'wartortle'],[36,'blastoise']]
 };
 for(const [starter,pairs] of Object.entries(expected)){
  for(const [level,id] of pairs){
   assert.equal(core.trainerSpeciesForLevel(starter,level),id,starter+' Nv.'+level);
  }
 }
 assert.equal(core.trainerSpeciesForLevel('eevee',30),'eevee','No arbitrary branch');
 assert.equal(core.trainerSpeciesForLevel('starmie',21),'starmie','No regression of gym form');
});

test('Rival from actual Kanto route launches and uses evolved sprite species and loadout',()=>{
 const s=core.createCampaign('bulbasaur');
 s.stage=6;
 s.trainer=3; // Route 3rd NPC checkpoint is the official rival.
 const opponent=core.currentOpponent(s);
 assert.equal(opponent.kind,'rival');
 assert.equal(opponent.id,'charizard','Rival counters Bulbasaur with its evolved Fire starter');
 const match=core.startBattle(s);
 const lineup=party.createPartyMatch(s,opponent,false);
 assert.equal(match.p2,'charizard');
 assert.equal(lineup.foes[0].id,'charizard');
 assert.equal(lineup.foes[0].level,opponent.level);
 assert.deepEqual(Object.keys(lineup.foes[0].loadout).filter(x=>['lmb','rmb','q','e'].includes(x)),
  Object.keys(moves.resolveLoadout({id:'charizard',progression:{species:'charizard',level:opponent.level}})).filter(x=>['lmb','rmb','q','e'].includes(x)));
 assert.ok(core.readCampaign().dexSeen.includes('charizard'),'Seen species must match real opponent');
});

test('Author-defined leaders and wild captures retain their exact species and teams',()=>{
 const s=core.createCampaign('squirtle');
 s.stage=1;s.trainer=core.TRAINERS_PER_GYM(1);
 const leader=core.currentOpponent(s);
 const gym=party.createPartyMatch(s,leader,false);
 assert.deepEqual(gym.foes.map(x=>x.id),['staryu','starmie']);
 s.pendingWild={id:'zubat',stage:1,trainer:s.trainer,level:18,hpPercent:100};
 const wild=party.createPartyMatch(s,{id:'zubat',level:18,leader:true},true);
 assert.deepEqual(wild.foes.map(x=>x.id),['zubat']);
});

test('Campaign cooldown is exactly 1.5 seconds for Charge Beam and Supersonic',()=>{
 assert.deepEqual(moves.KANTO_CAMPAIGN_QUICK_COOLDOWNS,{'charge-beam':1.5,supersonic:1.5,'seismic-toss':1.8});
 for(const label of ['Charge Beam','Supersonic']){
  const native={nombre:label,cd:5.8,forma:'proyectil',dano:4};
  const copy=moves.balanceCampaignQuickCooldown(native);
  assert.equal(copy.cd,1.5,label);
  assert.equal(native.cd,5.8,'Native original must remain untouched');
  assert.notStrictEqual(copy,native);
 }
 const practice={nombre:'ULT · Supersonic',torre2IntroSource:'supersonic',torre2IntroPractice:true,cd:8};
 assert.strictEqual(moves.balanceCampaignQuickCooldown(practice),practice,'Lv8 practice ULT must stay capped');
 const other={nombre:'Thunderbolt',cd:7.1};
 assert.strictEqual(moves.balanceCampaignQuickCooldown(other),other);
 const source=fs.readFileSync(new URL('../tools/pokearena/torre2-move-pool.js',import.meta.url),'utf8');
 assert.match(source,/balanceCampaignQuickCooldown\(balanceCampaignLeechSeed\(battle\[slot\]\)\)/);
});

test('Pay Day draws coins at 60% size with the same nine independent hits and trajectory',()=>{
 const fx=fs.readFileSync(new URL('../tools/pokearena/torre2-signature-fx.js',import.meta.url),'utf8');
 assert.match(fx,/coin\(g,x,y,3\.6,t\*21\+i\*\.83\)/);
 assert.match(fx,/for\(let i=0;i<9;i\+\+\)/);
 assert.match(fx,/contact\(l,h,extra,target,\.14/);
 assert.match(fx,/const fan=\[\[-40,-27\]/);
 assert.match(fx,/const s=size\/6/);
 assert.match(fx,/size\*2-3\*s/);
});
