// Owner 2026-11-22 (README 5, 9, 1, 10): individual Pokémon, campaign only.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {potentialOf,potentialStars,hiddenAbilityOf,HIDDEN_ABILITIES,HIDDEN_CHANCE,HELD_ITEMS,equipItem,giveItem,
 areRivals,rivalsOf,partyHasRivalry,hpMultiplier,damageMultiplier,installIndividuality,
 potentialPercent,LEADER_ITEMS,EVENT_ITEMS,wildItemRoll,itemForType,finalAdjust,tickAdjust,expFactor,blocksEvolution,moneyFactor,
 wildLevelShift,escapesWildLoss,machoBraceGrowth,potentialGrade,itemDesc} from '../tools/pokearena/torre2-individuality.js';
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
 assert.equal(Object.keys(HIDDEN_ABILITIES).length,25);
});
test('held items: equip from the bag, swap back, unknown refused',()=>{
 let s={team:[{id:'charmander',uid:'c1'}],box:[],inventory:{}};
 s=giveItem(s,'charcoal',1);s=giveItem(s,'magnet',1);s=giveItem(s,'vest',1);
 s=equipItem(s,'c1','charcoal');assert.equal(s.team[0].heldItem,'charcoal');assert.equal(s.inventory.held.charcoal,undefined);
 assert.equal(s.inventory.held.vest,undefined,'only original FRLG items');
 s=equipItem(s,'c1','magnet');assert.equal(s.team[0].heldItem,'magnet');assert.equal(s.inventory.held.charcoal,1);
 s=equipItem(s,'c1',null);assert.equal(s.team[0].heldItem,null);assert.equal(s.inventory.held.magnet,1);
 assert.equal(equipItem(s,'c1','dragonfang'),null,'not owned');assert.equal(equipItem(s,'c1','nope'),null);
 assert.equal(Object.keys(HELD_ITEMS).length,47);
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
test('held items: how to earn them (leaders, 3x3 events; no wild drops since 2026-11-24)',()=>{
 assert.equal(LEADER_ITEMS.length,13);for(const k of [...LEADER_ITEMS,...Object.values(EVENT_ITEMS)])assert.ok(HELD_ITEMS[k],k);
 assert.equal(LEADER_ITEMS[0],'hardstone');assert.equal(LEADER_ITEMS[6],'charcoal');
 assert.equal(itemForType('fire'),'charcoal');assert.equal(itemForType('???'),null);
 assert.equal(wildItemRoll(['ELECTRIC'],()=>0.01),'magnet');assert.equal(wildItemRoll(['ELECTRIC'],()=>0.06),null);
 const core=read('torre2-campaign-core.js');
 assert.match(core,/LEADER_ITEMS\[/);assert.match(core,/EVENT_ITEMS\[/);assert.doesNotMatch(core,/wildItemRoll\(/);
});

test('25 hidden abilities: type pinch, weather, absorb, sturdy, intimidate',()=>{
 const me=(ha,extra={})=>({member:{id:'charmander',uid:'u',potential:{hp:15.5,atk:15.5,def:15.5},hiddenAbility:ha},side:0,hpRatio:1,hp:100,hpMax:100,types:['FIRE'],...extra});
 const foe={member:{id:'onix'},side:1,types:['ROCK'],hp:100,hpMax:100,hpRatio:1};
 const F=1+((15-15.5)/31)*.1,near=(a,b)=>Math.abs(a-b)<1e-6;// potential 15 → ×F (atk) or ÷F (def)
 assert.ok(near(damageMultiplier(me('chama',{hpRatio:.2}),foe,{tipo:'FIRE'}),1.25*F));
 assert.ok(near(damageMultiplier(me('chama',{hpRatio:.9}),foe,{tipo:'FIRE'}),1*F));
 assert.ok(near(damageMultiplier(me('clorofila'),foe,{tipo:'GRASS'},{weather:'sun'}),1.2*F));
 assert.ok(near(damageMultiplier(me('clorofila'),foe,{tipo:'GRASS'},{weather:'rain'}),1*F));
 assert.ok(near(damageMultiplier(foe,me('gordura'),{tipo:'ICE'}),.5/F));
 assert.ok(near(damageMultiplier(foe,me('intimidacao'),{tipo:'ROCK'}),.9/F));
 assert.ok(near(damageMultiplier(me('coragem',{status:true}),foe,{tipo:'FIRE'}),1.2*F));
 const absorb=finalAdjust(foe,me('absorvevolt'),{tipo:'ELECTRIC'},40,()=>.5);
 assert.equal(absorb.d,0);assert.equal(absorb.dstHeal,12.5);
 const sturdy=finalAdjust(foe,me('robustez'),{tipo:'ROCK'},500,()=>.5);assert.equal(sturdy.d,99);
 assert.equal(finalAdjust(foe,me('robustez',{hpRatio:.5,hp:50}),{tipo:'ROCK'},500,()=>.5).d,500,'only at full HP');
 assert.equal(tickAdjust({side:1},.1,{playerAbility:'pressao'}).cdDelta<0,true);
});
test('47 FRLG held items: battle, tick and campaign effects',()=>{
 const m=(item,id='charmander',extra={})=>({member:{id,uid:'u',potential:{hp:15.5,atk:15.5,def:15.5},hiddenAbility:null,heldItem:item},side:0,hpRatio:1,hp:100,hpMax:100,types:['FIRE'],...extra});
 const foe={member:{id:'onix'},side:1,types:['ROCK'],hp:100,hpMax:100,hpRatio:1};
 const F=1+((15-15.5)/31)*.1,near=(a,b)=>Math.abs(a-b)<1e-6;// potential 15 → ×F (atk) or ÷F (def)
 for(const k of Object.keys(HELD_ITEMS))assert.ok(itemDesc(k).length>5,k);
 assert.ok(near(damageMultiplier(m('lightball','pikachu'),foe,{tipo:'ELECTRIC'}),1.4*F));
 assert.ok(near(damageMultiplier(m('lightball','raichu'),foe,{tipo:'ELECTRIC'}),1*F),'species items only for their species');
 assert.ok(near(damageMultiplier(m('choiceband'),foe,{tipo:'NORMAL'}),1.15*F));
 assert.equal(finalAdjust(foe,m('focusband'),{tipo:'ROCK'},500,()=>.05).d,99);
 assert.equal(finalAdjust(foe,m('focusband'),{tipo:'ROCK'},500,()=>.5).d,500);
 assert.equal(finalAdjust(m('shellbell'),foe,{tipo:'FIRE'},40,()=>.5).srcHeal,5);
 const crit=finalAdjust(m('scopelens'),foe,{tipo:'FIRE'},40,()=>.01);assert.equal(crit.d,60);assert.ok(crit.crit);
 assert.equal(finalAdjust(m('kingsrock'),foe,{tipo:'FIRE'},40,()=>.01).stun,.25);
 assert.ok(near(tickAdjust(m('leftovers'),.2).heal,100/64*.2));
 assert.ok(near(tickAdjust(m('quickclaw'),.2).cdDelta,.02));
 assert.equal(tickAdjust({...m('whiteherb'),est:{armaduraRota:{}}},.1).cure,'armaduraRota');
 assert.equal(tickAdjust({...m('whiteherb'),est:{armaduraRota:{}}},.1,{},{whiteherb:true}).cure,null,'once per battle');
 assert.equal(expFactor({heldItem:'luckyegg'}),1.5);assert.equal(expFactor({}),1);
 assert.ok(blocksEvolution({heldItem:'everstone'}));assert.equal(moneyFactor([{},{heldItem:'amuletcoin'}]),2);
 assert.equal(wildLevelShift({heldItem:'cleansetag'}),2);assert.ok(escapesWildLoss({heldItem:'smokeball'}));
 const brace={uid:'b',heldItem:'machobrace',potential:{hp:30,atk:10,def:31}};
 assert.equal(machoBraceGrowth(brace),'atk');assert.equal(brace.potential.atk,11);
 assert.equal(potentialGrade(31),'Perfeito');assert.equal(potentialGrade(3),'Fraco');
 const pub=read('publish-alpha0762.mjs');
 assert.match(pub,/globalThis\.__torre2Indiv\?\.final\?\.\(fuente,this,g,d\)/);
 assert.match(pub,/tickGen3Status\(this,dt\);globalThis\.__torre2Indiv\?\.tick\?\.\(this,dt\)/);
 const core=read('torre2-campaign-core.js');
 for(const f of ['expFactor(member)','blocksEvolution(member)','moneyFactor(next.team)','wildLevelShift(','escapesWildLoss(','machoBraceGrowth(member)'])assert.ok(core.includes(f),f);
});

test('potential percent shown in the UI',()=>{
 assert.equal(potentialPercent(31,'hp'),'+5%');assert.equal(potentialPercent(0,'atk'),'−5%');
 assert.equal(potentialPercent(31,'def'),'+4,8%','DEF: less damage taken');assert.equal(potentialPercent(0,'def'),'−5,3%');
 assert.equal(potentialPercent(16,'hp'),'+0,2%');
});
