/* Pokémon Torre 2 — Gen III-inspired capture math. Unit: HP percent (1..100).
 * No network requests, browser storage, or battle-scene dependencies.
 */
export const BALL_BONUS=Object.freeze({pokeball:1,greatball:1.5,ultraball:2});
const RATES=Object.freeze({
 bulbasaur:45,ivysaur:45,venusaur:45,charmander:45,charmeleon:45,charizard:45,
 squirtle:45,wartortle:45,blastoise:45,caterpie:255,metapod:120,butterfree:45,
 weedle:255,kakuna:120,beedrill:45,pidgey:255,pidgeotto:120,pidgeot:45,
 rattata:255,raticate:127,spearow:255,fearow:90,ekans:255,arbok:90,
 pikachu:190,raichu:75,sandshrew:255,sandslash:90,
 'nidoran-f':235,'nidoran-m':235,nidorina:120,nidorino:120,nidoqueen:45,nidoking:45,
 clefairy:150,clefable:25,vulpix:190,ninetales:75,zubat:255,golbat:90,
 oddish:255,gloom:120,vileplume:45,paras:190,parasect:75,venonat:190,venomoth:75,
 diglett:255,dugtrio:50,meowth:255,persian:90,psyduck:190,golduck:75,
 mankey:190,primeape:75,growlithe:190,arcanine:75,abra:200,kadabra:100,alakazam:50,
 machop:180,machoke:90,machamp:45,bellsprout:255,weepinbell:120,victreebel:45,
 geodude:255,graveler:120,golem:45,ponyta:190,rapidash:60,slowpoke:190,slowbro:75,
 magnemite:190,magneton:60,doduo:190,dodrio:45,grimer:190,muk:75,
 gastly:190,haunter:90,gengar:45,onix:45,drowzee:190,hypno:75,
 krabby:225,kingler:60,voltorb:190,electrode:60,exeggcute:90,exeggutor:45,
 cubone:190,marowak:75,rhyhorn:120,rhydon:60,chansey:30,tangela:45,
 magikarp:255,gyarados:45,eevee:45,dratini:45,dragonair:45,dragonite:45,
 mewtwo:3,mew:45
});
export function catchRate(species){return RATES[String(species||'').toLowerCase()]??90}
export function normalizedCaptureStatus(status){
 const s=String(status||'').toLowerCase();
 if(/sleep|asleep|dorm|sono|freeze|frozen|congel/.test(s))return 'sleep';
 if(/para|poison|venen|burn|queima|toxic/.test(s))return 'paralyzed';
 return 'none';
}
export function captureChance(candidate,ball='pokeball'){
 const pct=Math.max(1,Math.min(100,Number(candidate?.hpPercent??100)));
 const mult=BALL_BONUS[ball]??1;
 const status=normalizedCaptureStatus(candidate?.status);
 const statusBonus=status==='sleep'?2:status==='paralyzed'?1.5:1;
 // Trainer prize captures retain their pre-existing base chance, but using
 // more effective balls, health and status now follows the same progression.
 if(!candidate?.wild)return Math.max(.01,Math.min(.995,
  (Number(candidate?.chance??45)/100)*mult*((3*100-2*pct)/100)*statusBonus));
 const adjusted=(3*100-2*pct)/(3*100)*catchRate(candidate.id)*mult*statusBonus;
 return Math.max(.001,Math.min(1,Math.floor(adjusted)/255));
}
export function rollCapture(candidate,ball='pokeball',random=Math.random){
 const chance=captureChance(candidate,ball);
 // Gen III applies four independent shake checks; the FOURTH is the
 // success check, after the three visible wobbles of the ball.
 const shakeProbability=chance>=1?1:Math.pow(chance,.25);
 for(let check=0;check<4;check++){
  if(Number(random())>=shakeProbability)
   return {caught:false,shakes:Math.min(3,check),chance};
 }
 return {caught:true,shakes:3,chance};
}
