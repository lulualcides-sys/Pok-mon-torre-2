/* FRLG integer capture arithmetic: pret/pokefirered src/battle_script_commands.c,
 * Cmd_handleballthrow; species rates: src/data/pokemon/species_info.h.
 * HP is rounded down to game integer units; hpPercent is legacy-save fallback.
 */
export const BALL_BONUS=Object.freeze({pokeball:1,greatball:1.5,ultraball:2});
export const CATCH_RATES=Object.freeze({"bulbasaur":45,"ivysaur":45,"venusaur":45,"charmander":45,"charmeleon":45,"charizard":45,"squirtle":45,"wartortle":45,"blastoise":45,"caterpie":255,"metapod":120,"butterfree":45,"weedle":255,"kakuna":120,"beedrill":45,"pidgey":255,"pidgeotto":120,"pidgeot":45,"rattata":255,"raticate":127,"spearow":255,"fearow":90,"ekans":255,"arbok":90,"pikachu":190,"raichu":75,"sandshrew":255,"sandslash":90,"nidoran-f":235,"nidorina":120,"nidoqueen":45,"nidoran-m":235,"nidorino":120,"nidoking":45,"clefairy":150,"clefable":25,"vulpix":190,"ninetales":75,"jigglypuff":170,"wigglytuff":50,"zubat":255,"golbat":90,"oddish":255,"gloom":120,"vileplume":45,"paras":190,"parasect":75,"venonat":190,"venomoth":75,"diglett":255,"dugtrio":50,"meowth":255,"persian":90,"psyduck":190,"golduck":75,"mankey":190,"primeape":75,"growlithe":190,"arcanine":75,"poliwag":255,"poliwhirl":120,"poliwrath":45,"abra":200,"kadabra":100,"alakazam":50,"machop":180,"machoke":90,"machamp":45,"bellsprout":255,"weepinbell":120,"victreebel":45,"tentacool":190,"tentacruel":60,"geodude":255,"graveler":120,"golem":45,"ponyta":190,"rapidash":60,"slowpoke":190,"slowbro":75,"magnemite":190,"magneton":60,"farfetchd":45,"doduo":190,"dodrio":45,"seel":190,"dewgong":75,"grimer":190,"muk":75,"shellder":190,"cloyster":60,"gastly":190,"haunter":90,"gengar":45,"onix":45,"drowzee":190,"hypno":75,"krabby":225,"kingler":60,"voltorb":190,"electrode":60,"exeggcute":90,"exeggutor":45,"cubone":190,"marowak":75,"hitmonlee":45,"hitmonchan":45,"lickitung":45,"koffing":190,"weezing":60,"rhyhorn":120,"rhydon":60,"chansey":30,"tangela":45,"kangaskhan":45,"horsea":225,"seadra":75,"goldeen":225,"seaking":60,"staryu":225,"starmie":60,"mr-mime":45,"scyther":45,"jynx":45,"electabuzz":45,"magmar":45,"pinsir":45,"tauros":45,"magikarp":255,"gyarados":45,"lapras":45,"ditto":35,"eevee":45,"vaporeon":45,"jolteon":45,"flareon":45,"porygon":45,"omanyte":45,"omastar":45,"kabuto":45,"kabutops":45,"aerodactyl":45,"snorlax":25,"articuno":3,"zapdos":3,"moltres":3,"dratini":45,"dragonair":45,"dragonite":45,"mewtwo":3,"mew":45});
export function catchRate(species){
 const id=String(species||'').toLowerCase().replace('♀','-f').replace('♂','-m').replace('mr. mime','mr-mime').replace('farfetch’d','farfetchd').replace("farfetch'd",'farfetchd');
 return CATCH_RATES[id]??0;
}
export function normalizedCaptureStatus(status){
 // Saved Gen III statuses are objects ({kind:'dormido'|'veneno'|...});
 // native combat usually supplies a text label. Both must yield exactly
 // the same FireRed catch bonus, without treating arbitrary objects as one.
 const raw=status&&typeof status==='object'?
  status.kind??status.nombre??status.name??status.status??status.estado:status;
 const s=typeof raw==='string'?raw.toLowerCase():'';
 if(/sleep|asleep|dorm|sono|freeze|frozen|congel|slp|frz/.test(s))return 'sleep';
 if(/para|poison|venen|burn|queima|quemad|toxic|psn|brn/.test(s))return 'paralyzed';
 return 'none';
}
export function captureThreshold(candidate,ball='pokeball'){
 if(!candidate?.wild||!catchRate(candidate.id))return 0;
 if(ball==='masterball')return 65536;
 if(!(ball in BALL_BONUS))return 0;
 const max=Math.max(1,Math.floor(Number(candidate.hpMax)||100));
 const hp=Math.max(1,Math.min(max,Math.floor(Number(candidate.hp??candidate.hpPercent??max))));
 const rate=Math.floor(catchRate(candidate.id)*BALL_BONUS[ball]);
 let a=Math.floor(rate*(3*max-2*hp)/(3*max));
 const status=normalizedCaptureStatus(candidate.status);
 if(status==='sleep')a*=2;
 else if(status==='paralyzed')a=Math.floor(a*15/10);
 if(a>=255)return 65536;
 if(a<=0)return 0;
 const root=Math.floor(Math.sqrt(Math.floor(Math.sqrt(Math.floor(16711680/a)))));
 return Math.min(65536,Math.floor(1048560/root));
}
export function captureChance(candidate,ball='pokeball'){
 return (captureThreshold(candidate,ball)/65536)**4;
}
export function rollCapture(candidate,ball='pokeball',random=Math.random){
 const threshold=captureThreshold(candidate,ball),chance=(threshold/65536)**4;
 if(threshold===65536)return {caught:true,shakes:3,chance};
 if(!threshold)return {caught:false,shakes:0,chance};
 for(let check=0;check<4;check++){
  if(Math.floor(Math.max(0,Math.min(1,Number(random())))*65536)>=threshold)
   return {caught:false,shakes:Math.min(3,check),chance};
 }
 return {caught:true,shakes:3,chance};
}

/** Read the actual Arena fighter states, not a disconnected display label. */
export function fighterCaptureStatus(fighter){
 const est=fighter?.est||{};
 if(est.dormido)return 'sleep';
 if(est.congelado)return 'freeze';
 if(est.paralizado)return 'paralyzed';
 if(est.veneno)return 'poison';
 if(est.quema||est.quemado)return 'burn';
 return fighter?.status?.nombre??fighter?.status??fighter?.estado?.nombre??fighter?.estado??'none';
}
