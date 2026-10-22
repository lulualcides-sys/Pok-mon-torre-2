/* FireRed/LeafGreen ACE-LEVEL CAPS for the first Kanto clear.
 * Campaign only. Never affects Arena 2D or its live-evolution mode.
 * Battle rewards are calibrated so completing the ordinary trainer ladder
 * approaches the leader's ace, without exceeding it.
 */
import {totalExperienceForLevel,awardBattleExperience} from './progression.js';
export const KANTO_LEVEL_CAPS=Object.freeze([14,21,24,29,43,43,47,50,54,56,58,60,63]);
export const KANTO_ACE_NAMES=Object.freeze([
 'Brock · Onix','Misty · Starmie','Lt. Surge · Raichu',
 'Erika · Vileplume','Koga · Weezing','Sabrina · Alakazam',
 'Blaine · Arcanine','Giovanni · Rhyhorn','Lorelei · Lapras',
 'Bruno · Machamp','Agatha · Gengar','Lance · Dragonite','Campeão · inicial'
]);
export function currentLevelCap(stage){
 return KANTO_LEVEL_CAPS[Math.max(0,Math.min(KANTO_LEVEL_CAPS.length-1,
 Number.isFinite(stage)?Math.floor(stage):0))];
}
export function trainerLevelFor(stage,trainer,limit,leader=false){
 const cap=currentLevelCap(stage);
 if(leader)return cap;
 const previous=stage===0?5:currentLevelCap(stage-1);
 const start=stage===0?5:Math.min(cap-2,Math.max(6,previous-1));
 // Last regular trainer is still lower than the boss, as in FireRed.
 const fraction=Math.max(0,Math.min(1,(trainer+1)/Math.max(1,limit)));
 return Math.min(cap-1,Math.max(3,Math.round(start+(cap-1-start)*fraction)));
}
export function wildLevelFor(stage,trainer=0,limit=13){
 const cap=currentLevelCap(stage);
 const base=stage===0?3:Math.max(3,currentLevelCap(stage-1)-4);
 const highest=Math.max(base,cap-5);
 return Math.min(cap-3,Math.max(3,Math.round(base+
 (highest-base)*Math.max(0,Math.min(1,trainer/Math.max(1,limit))))));
}
export function xpRewardFor(stage,trainerCount,kind='trainer'){
 const cap=currentLevelCap(stage),previous=stage===0?5:currentLevelCap(stage-1);
 const growth=totalExperienceForLevel(cap)-totalExperienceForLevel(previous);
 // Trainer ladder + leader weighted 1.5 + five optional wild fights at 0.4.
 // Default non-wild clear reaches around 90%-95% of the current ace.
 const per=Math.round(growth/(trainerCount+1.5+5*.4));
 const weight=kind==='leader'?1.5:kind==='wild'?.4:1;
 return Math.max(8,Math.floor(per*weight));
}
export function awardCampaignExperience(pokemon,reward,stage,{tester=false}={}){
 if(tester)return {fromLevel:pokemon.level,toLevel:pokemon.level,
  levelsGained:0,experienceGained:0,evolutionPending:false,atCap:false,tester:true};
 const cap=currentLevelCap(stage);
 // Old version might have overleveled campaign saves; clamp non-testers
 // without deleting species, moves or team slots.
 if(pokemon.level>cap){
  pokemon.level=cap;
  pokemon.experience=Math.min(pokemon.experience,
   totalExperienceForLevel(cap+1,pokemon.growth)-1);
 }
 const available=Math.max(0,totalExperienceForLevel(cap+1,pokemon.growth)-1-pokemon.experience);
 const granted=Math.max(0,Math.min(Math.floor(reward),available));
 const growth=awardBattleExperience(pokemon,granted,'fighting');
 return {...growth,atCap:pokemon.level===cap,levelCap:cap};
}
export function enforceCampaignCap(member,stage){
 if(!member?.progression||member.id==='mewtwo')return false; // special arena tester
 const cap=currentLevelCap(stage),p=member.progression;
 if(p.level<=cap)return false;
 p.level=cap;
 p.experience=Math.min(p.experience,totalExperienceForLevel(cap+1,p.growth)-1);
 return true;
}
