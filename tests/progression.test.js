import test from 'node:test';
import assert from 'node:assert/strict';
import {createPokemonProgression,totalExperienceForLevel,awardBattleExperience,
 resolveEvolutionAfterBattle,levelEvolutionChoices,LEVEL_EVOLUTIONS} from '../src/progression.js';

test('Charmander levels to 16 in battle, evolves only after battle',()=>{
 const mon=createPokemonProgression('charmander',15);
 const before=mon.species;
 const exp=totalExperienceForLevel(16)-mon.experience;
 const reward=awardBattleExperience(mon,exp);
 assert.equal(reward.toLevel,16);
 assert.equal(reward.evolutionPending,true);
 assert.equal(mon.species,before,'species cannot change while fight is active');
 assert.equal(resolveEvolutionAfterBattle(mon,'fighting').ok,false);
 assert.equal(mon.species,'charmander');
 const result=resolveEvolutionAfterBattle(mon,'victory');
 assert.equal(result.evolutions[0].to,'charmeleon');
 assert.equal(mon.species,'charmeleon');
});
test('large experience gain queues entire evolution line until post battle',()=>{
 const mon=createPokemonProgression('bulbasaur',15);
 awardBattleExperience(mon,totalExperienceForLevel(36)-mon.experience);
 assert.equal(mon.level,36);
 assert.equal(mon.species,'bulbasaur');
 const result=resolveEvolutionAfterBattle(mon,'victory');
 assert.deepEqual(result.evolutions.map(e=>e.to),['ivysaur','venusaur']);
 assert.equal(mon.pendingEvolution,false);
});
test('trade and item families evolve solely by level after combat',()=>{
 for (const [species,level,to] of [
  ['pikachu',32,'raichu'],['kadabra',36,'alakazam'],
  ['machoke',40,'machamp'],['onix',40,'steelix'],
  ['golbat',40,'crobat'],['exeggcute',36,'exeggutor']]) {
  const mon=createPokemonProgression(species,level-1);
  awardBattleExperience(mon,totalExperienceForLevel(level)-mon.experience);
  assert.equal(mon.species,species);
  assert.equal(resolveEvolutionAfterBattle(mon,'finished').evolutions[0].to,to);
 }
});
test('Eevee branches are level gated and selected only after combat',()=>{
 const mon=createPokemonProgression('eevee',29);
 assert.deepEqual(levelEvolutionChoices(mon),[]);
 awardBattleExperience(mon,totalExperienceForLevel(30)-mon.experience);
 assert.equal(resolveEvolutionAfterBattle(mon,'fighting').ok,false);
 const waiting=resolveEvolutionAfterBattle(mon,'victory');
 assert.equal(waiting.needsChoice,true);
 assert.deepEqual(waiting.choices,['vaporeon','jolteon','flareon']);
 assert.equal(mon.species,'eevee');
 assert.equal(resolveEvolutionAfterBattle(mon,'finished','jolteon').evolutions[0].to,'jolteon');
});
test('no evolution if level threshold is not met or species does not evolve',()=>{
 const mon=createPokemonProgression('magikarp',19);
 assert.equal(resolveEvolutionAfterBattle(mon,'victory').evolutions.length,0);
 const mewtwo=createPokemonProgression('mewtwo',99);
 awardBattleExperience(mewtwo,totalExperienceForLevel(100)-mewtwo.experience);
 assert.deepEqual(resolveEvolutionAfterBattle(mewtwo,'finished').evolutions,[]);
 assert.equal(mewtwo.species,'mewtwo');
});
test('levels max at 100; negative XP and battle phase abuses rejected',()=>{
 const mon=createPokemonProgression('squirtle',99);
 awardBattleExperience(mon,totalExperienceForLevel(100)-mon.experience+100000);
 assert.equal(mon.level,100);
 assert.throws(()=>awardBattleExperience(mon,-1),RangeError);
 assert.throws(()=>awardBattleExperience(mon,50,'victory'));
 assert.equal(resolveEvolutionAfterBattle(mon,'starting').reason,'battle-active');
 assert.ok(Object.isFrozen(LEVEL_EVOLUTIONS));
});
