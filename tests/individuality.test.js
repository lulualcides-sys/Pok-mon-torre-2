// Owner 2026-11-22 (README 5, 9, 1, 10): individual Pokémon, campaign only.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {potentialOf,potentialStars,hiddenAbilityOf,HIDDEN_ABILITIES,HIDDEN_CHANCE,HELD_ITEMS,equipItem,giveItem,
 areRivals,rivalsOf,partyHasRivalry,hpMultiplier,damageMultiplier,installIndividuality,
 LEADER_ITEMS,EVENT_ITEMS,wildItemRoll,itemForType} from '../tools/pokearena/torre2-individuality.js';
const read=f=>fs.readFileSync(new URL('../tools/pokearena/'+f,import.meta.url),'utf8');

test('potential: stable per Pokémon, 0–31, different between same-species individuals',()=>{
 const a={id:'pikachu',uid:'pikachu-aaa111'},b={id:'pikachu',uid:'pikachu-bbb222'};
 assert.deepEqual(potentialOf(a),potentialOf({...a}));
 for(const v of Object.values(potentialOf(a)))assert.ok(v>=0&&v<=31);
 const many=Array.from({length:40},(_,i)=>JSON.stringify(potentialOf({uid:'p-'+i})));
 assert.ok(new Set(many).size>30,'individuals differ');
 assert.deepEqual(potentialOf({potential:{hp:31,atk:0,def:40}}),{hp:31,atk:0,def:31});
 assert.equal(potentialStars({hp:31,atk:31,def:31}),5);assert.equal(potentialStars({hp:0,atk:0,def:0}),1);
});
test('hidden ability: about 5%, stable, known kinds only',()=>{
 let n=0;for(let i=0;i<4000;i++)if(hiddenAbilityOf({uid:'x-'+i}))n++;
 assert.ok(n>100&&n<320,'≈'+HIDDEN_CHANCE+'%: '+n);
 assert.equal(hiddenAbilityOf({uid:'y',hiddenAbility:'casca'}),'casca');
 assert.equal(hiddenAbilityOf({uid:'y',hiddenAbility:null}),null);
 assert.equal(Object.keys(HIDDEN_ABILITIES).length,5);
});
test('held items: equip from the bag, swap back, unknown refused',()=>{
 let s={team:[{id:'charmander',uid:'c1'}],box:[],inventory:{}};
 s=giveItem(s,'charcoal',1);s=giveItem(s,'magnet',1);s=giveItem(s,'vest',1);
 s=equipItem(s,'c1','charcoal');assert.equal(s.team[0].heldItem,'charcoal');assert.equal(s.inventory.held.charcoal,undefined);
 assert.equal(s.inventory.held.vest,undefined,'only original FRLG items');
 s=equipItem(s,'c1','magnet');assert.equal(s.team[0].heldItem,'magnet');assert.equal(s.inventory.held.charcoal,1);
 s=equipItem(s,'c1',null);assert.equal(s.team[0].heldItem,null);assert.equal(s.inventory.held.magnet,1);
 assert.equal(equipItem(s,'c1','dragonfang'),null,'not owned');assert.equal(equipItem(s,'c1','nope'),null);
 assert.equal(Object.keys(HELD_ITEMS).length,17);
});
test('rivalries: families, both directions, party check',()=>{
 assert.ok(areRivals('charizard','blastoise'));assert.ok(areRivals('hitmonchan','hitmonlee'));
 assert.ok(!areRivals('charmander','charizard'));assert.ok(!areRivals('pidgey','rattata'));
 assert.deepEqual(rivalsOf('wartortle').sort(),['bulbasaur','charmander']);
 assert.ok(partyHasRivalry({friend:[{id:'electabuzz'}],foes:[{id:'magmar'}]}));
});
test('combat multipliers: small and campaign-side only',()=>{
 const strong={id:'charmander',uid:'u',potential:{hp:31,atk:31,def:31},heldItem:'charcoal',hiddenAbility:null};
 const weak={id:'charmander',uid:'u',potential:{hp:0,atk:0,def:0},hiddenAbility:null};
 assert.ok(Math.abs(hpMultiplier(strong)-1.05)<1e-9);assert.ok(Math.abs(hpMultiplier(weak)-.95)<1e-9);
 assert.equal(hpMultiplier(strong,1),1,'opponents unchanged');
 const foe={member:{id:'onix'},side:1,types:['ROCK']};
 const fire=damageMultiplier({member:strong,side:0,hpRatio:1,types:['FIRE']},foe,{tipo:'FIRE'});
 assert.ok(Math.abs(fire-1.05*1.10)<1e-9,'potential + item');
 const normal=damageMultiplier({member:strong,side:0,hpRatio:1,types:['FIRE']},foe,{tipo:'NORMAL'});
 assert.ok(Math.abs(normal-1.05)<1e-9,'item only for its type');
 assert.equal(damageMultiplier(foe,{member:{id:'pidgey'},side:1},{tipo:'ROCK'}),1,'foe vs foe untouched');
 const rival=damageMultiplier({member:{id:'magmar',potential:{hp:15.5,atk:15.5,def:15.5}},side:1},{member:{id:'electabuzz',uid:'e',potential:{hp:15,atk:15,def:15}},side:0},{tipo:'FIRE'});
 assert.ok(rival>1.09&&rival<1.12,'rivals +10%');
 const t={};installIndividuality(t);assert.equal(typeof t.__torre2Indiv.damage,'function');
 assert.equal(t.__torre2Indiv.hp({escena:{datos:{}}}),1,'outside the campaign: no change');
});
test('wiring: luchador campaign branches only, party carries traits, Ficha screen',()=>{
 const pub=read('publish-alpha0762.mjs');
 assert.match(pub,/torre2ScaledHp\(base,torre2FighterLevel\(this\)\)\*\(globalThis\.__torre2Indiv\?\.hp\?\.\(this\)\?\?1\)/);
 assert.match(pub,/d\*=globalThis\.__torre2Indiv\?\.damage\?\.\(fuente,this,g\)\?\?1;/);
 assert.match(read('torre2-party-battle.js'),/heldItem:m\.heldItem\?\?null/);
 const scene=read('torre2-campaign-scene.js');
 assert.match(scene,/installIndividuality\(\);/);assert.match(scene,/individualScreen\(state,index\)\{/);
 assert.match(scene,/if\(completed\.won&&partyHasRivalry\(marker\.party\)\)next\.rivalryWins=/);
});

test('held items: original FRLG icons vendored with provenance, every item has one',()=>{
 const dir=new URL('../tools/pokearena/torre2-held-items/',import.meta.url);
 const prov=JSON.parse(fs.readFileSync(new URL('PROVENANCE.json',dir),'utf8'));
 assert.equal(prov.source,'pret/pokefirered');assert.match(prov.commit,/^[0-9a-f]{40}$/);
 assert.deepEqual(Object.keys(prov.items).sort(),Object.keys(HELD_ITEMS).sort());
 for(const key of Object.keys(HELD_ITEMS)){
  const png=fs.readFileSync(new URL(key+'.png',dir));
  assert.equal(png.readUInt32BE(16),24);assert.equal(png.readUInt32BE(20),24);assert.equal(png[25],3,'indexed GBA palette');
  assert.equal(createHash('sha256').update(png).digest('hex'),prov.files[key+'.png'],key);
 }
 const pub=read('publish-alpha0762.mjs');
 assert.match(pub,/tools\/pokearena\/torre2-held-items/);assert.match(pub,/assets\/ui\/frlg\/items\/held/);
});
test('held items: how to earn them (leaders, 3x3 events, wild 5%)',()=>{
 assert.equal(LEADER_ITEMS.length,13);for(const k of [...LEADER_ITEMS,...Object.values(EVENT_ITEMS)])assert.ok(HELD_ITEMS[k],k);
 assert.equal(LEADER_ITEMS[0],'hardstone');assert.equal(LEADER_ITEMS[6],'charcoal');
 assert.equal(itemForType('fire'),'charcoal');assert.equal(itemForType('???'),null);
 assert.equal(wildItemRoll(['ELECTRIC'],()=>0.01),'magnet');assert.equal(wildItemRoll(['ELECTRIC'],()=>0.06),null);
 const core=read('torre2-campaign-core.js');
 assert.match(core,/LEADER_ITEMS\[/);assert.match(core,/EVENT_ITEMS\[/);assert.match(core,/wildItemRoll\(/);
});
