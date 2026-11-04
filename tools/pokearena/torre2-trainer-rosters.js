/* Kanto campaign encounter identity, independent of card rendering.
 * Each regular trainer has a persistent, area-specific real team (1–4).
 * Areas are grouped by Torre 2 stages, not one-to-one FireRed trainer IDs.
 * Preserve stage/trainer indices so existing Kanto saves remain valid.
 */
// FireRed/LeafGreen-inspired regional extensions: every required checkpoint
// has its OWN trainer identity. These are curated stage composites, not a
// claim to reproduce the precise trainer order from Game Freak's cartridge.
// References: https://github.com/pret/pokefirered/blob/master/src/data/trainer_parties.h
// Keep every species in the game's native Gen I roster; no Johto/Pokédex hacks.
const EXTRA_TRAINERS=Object.freeze([
 [],[],
 // Vermilion, S.S. Anne and nearby routes (17 regular checkpoints).
 ['rocker:pikachu','sailor:machop','gentleman:ponyta','scientist:magnemite'],
 // Celadon, routes 7/8 and Rocket Hideout (19).
 ['ace:exeggcute','lass:oddish','ace:growlithe','lass:weepinbell',
  'ace:pidgeotto','lass:tangela','ace:venomoth'],
 // Cycling Road, Safari outskirts, Fuchsia and water routes (21).
 ['fisher:magikarp','cyclist:raticate','ace:doduo','swimmer:golduck',
  'fisher:seaking','cyclist:koffing','ace:venomoth','fisher:goldeen',
  'swimmer:horsea'],
 // Fighting Dojo, Silph Co and Sabrina's gym (23).
 ['psychic:drowzee','scientist:grimer','blackbelt:machoke','scientist:magnemite',
  'psychic:hypno','blackbelt:machop','psychic:mr-mime','scientist:electrode',
  'psychic:abra','scientist:koffing','psychic:kadabra'],
 // Seafoam, Mansion and Cinnabar Gym: vary archetype as well as species (25).
 ['scientist:voltorb','scientist:magnemite','ace:growlithe','scientist:muk',
  'ace:ponyta','scientist:electrode','ace:rapidash','scientist:weezing',
  'scientist:magmar','ace:arcanine','scientist:koffing','ace:ponyta',
  'scientist:grimer'],
 // Viridian Gym, routes 22/23 and the ground-type approach (27).
 ['hiker:graveler','blackbelt:machoke','ace:nidorino','hiker:dugtrio',
  'ace:nidorina','blackbelt:machamp','hiker:marowak','ace:persian',
  'hiker:geodude','blackbelt:machop','hiker:rhydon','ace:nidoking',
  'hiker:onix','ace:sandshrew','blackbelt:hitmonlee'],
 []
].map(rows=>Object.freeze(rows)));

const TRAINERS=[
 // Route 1/2, Viridian Forest, Route 22, Pewter outskirts
 ['youngster:rattata','bugcatcher:caterpie','bugcatcher:weedle',
  'youngster:pidgey','bugcatcher:metapod','bugcatcher:kakuna',
  'lass:nidoran-f','bugcatcher:butterfree','youngster:mankey',
  'youngster:spearow','bugcatcher:weedle','camper:geodude',
  'camper:sandshrew'],
 // Route 3, Mt. Moon, Route 4, Cerulean and its water gym
 // Route 3 starts with FRLG trainer archetypes/species (single-member
 // projections); Mt. Moon then introduces hikers and Rocket before Misty.
 ['lass:pidgey','bugcatcher:caterpie','youngster:rattata',
  'bugcatcher:weedle','lass:nidoran-f','youngster:spearow',
  'bugcatcher:metapod','lass:jigglypuff','hiker:geodude',
  'hiker:onix','lass:clefairy','swimmer:goldeen',
  'swimmer:horsea','swimmer:staryu','sailor:tentacool'],
 // Nugget Bridge, routes 24/25, Vermilion and S.S. Anne
 ['youngster:oddish','lass:bellsprout','ace:pidgeotto','sailor:machop',
  'sailor:tentacool','gentleman:growlithe','sailor:shellder',
  'youngster:meowth','sailor:horsea','scientist:magnemite',
  'rocker:voltorb','scientist:magnemite','sailor:krabby'],
 // Routes 7/8, Celadon park and Rocket hideout
 ['lass:oddish','lass:gloom','ace:growlithe','ace:ponyta',
  'lass:bellsprout','lass:weepinbell','ace:venonat','lass:exeggcute',
  'lass:oddish','ace:pidgeotto','lass:tangela','ace:kadabra'],
 // Cycling Road, Safari outskirts, routes 12-15/Fuchsia
 ['cyclist:grimer','cyclist:koffing','ace:doduo','fisher:magikarp',
  'fisher:goldeen','swimmer:tentacool','ace:exeggcute',
  'cyclist:weezing','fisher:seaking','ace:rhyhorn','swimmer:horsea',
  'ace:venomoth'],
 // Saffron, Fighting Dojo, Silph Co. and psychic gym
 ['blackbelt:machop','scientist:voltorb','psychic:abra','blackbelt:machoke',
  'scientist:magnemite','psychic:kadabra','blackbelt:hitmonlee',
  'psychic:drowzee','scientist:electrode','blackbelt:hitmonchan',
  'psychic:hypno','psychic:mr-mime'],
 // Seafoam Islands, Pokémon Mansion and Cinnabar gym
 ['swimmer:seel','swimmer:tentacool','swimmer:horsea','scientist:grimer',
  'scientist:koffing','scientist:growlithe','scientist:ponyta',
  'scientist:magmar','ace:rapidash','scientist:weezing',
  'ace:arcanine','swimmer:dewgong'],
 // Viridian Gym, route 22 and route 23
 ['hiker:rhyhorn','blackbelt:machoke','hiker:graveler','ace:nidorino',
  'blackbelt:machop','hiker:onix','ace:dugtrio','hiker:marowak',
  'ace:nidorina','blackbelt:machamp','hiker:rhydon','ace:nidoking'],
 // Victory Road before the Indigo League
 ['ace:persian','ace:raticate','blackbelt:machoke','ace:drowzee',
  'ace:golduck','ace:mr-mime','ace:exeggutor','ace:charmeleon',
  'ace:clefairy','ace:kingler','ace:weepinbell','ace:nidoking',
  'blackbelt:machoke','ace:rapidash','ace:electrode',
  'ace:seadra','ace:arcanine']
].map((rows,stage)=>Object.freeze([...rows,...EXTRA_TRAINERS[stage]].map(row=>{
 const [spriteKind,id]=row.split(':');
 return Object.freeze({spriteKind,id});
})));
export const REGIONAL_TRAINERS=Object.freeze(TRAINERS);
const TITLES=Object.freeze({
 youngster:'Jovem',bugcatcher:'Caça-Insetos',lass:'Garota',camper:'Campista',
 hiker:'Montanhista',swimmer:'Nadador',sailor:'Marinheiro',
 gentleman:'Cavalheiro',ace:'Treinador Elite',scientist:'Cientista',
 rocker:'Roqueiro',cyclist:'Ciclista',fisher:'Pescador',
 psychic:'Psíquico',blackbelt:'Lutador'
});
export function regionalTrainer(stage,index){
 const rows=REGIONAL_TRAINERS[stage];
 if(!rows||!Number.isInteger(index)||index<0)return null;
 const member=rows[index%rows.length];
 return {...member,name:(TITLES[member.spriteKind]||'Treinador')+' '+(index+1)};
}
// The same normal-party size and species projection drive both the
// information card AND the actual in-battle PartyMatch roster. No card-only
// species or hidden random regional pool can disagree with the battle.
export function regionalTrainerPartySize(stage,index){
 if(!Number.isInteger(stage)||stage<0||!Number.isInteger(index)||index<0)
  return 1;
 return Math.min(4,1+Math.floor((index+stage)/5));
}
// Related evolutionary forms count as ONE family. At later levels,
 // Ponyta/Rapidash, Grimer/Muk, Koffing/Weezing etc. would otherwise
 // evolve into visually duplicated fighters in the very same battle.
const EVOLUTION_FAMILIES=Object.freeze({
 caterpie:'caterpie',metapod:'caterpie',butterfree:'caterpie',
 weedle:'weedle',kakuna:'weedle',beedrill:'weedle',
 pidgey:'pidgey',pidgeotto:'pidgey',pidgeot:'pidgey',
 rattata:'rattata',raticate:'rattata',spearow:'spearow',fearow:'spearow',
 'nidoran-f':'nidoran-f',nidorina:'nidoran-f',nidoqueen:'nidoran-f',
 'nidoran-m':'nidoran-m',nidorino:'nidoran-m',nidoking:'nidoran-m',
 geodude:'geodude',graveler:'geodude',golem:'geodude',
 sandshrew:'sandshrew',sandslash:'sandshrew',
 machop:'machop',machoke:'machop',machamp:'machop',
 abra:'abra',kadabra:'abra',alakazam:'abra',
 oddish:'oddish',gloom:'oddish',vileplume:'oddish',
 bellsprout:'bellsprout',weepinbell:'bellsprout',victreebel:'bellsprout',
 zubat:'zubat',golbat:'zubat',drowzee:'drowzee',hypno:'drowzee',
 meowth:'meowth',persian:'meowth',
 ponyta:'ponyta',rapidash:'ponyta',
 growlithe:'growlithe',arcanine:'growlithe',
 grimer:'grimer',muk:'grimer',koffing:'koffing',weezing:'koffing',
 magnemite:'magnemite',magneton:'magnemite',
 voltorb:'voltorb',electrode:'voltorb',
 tentacool:'tentacool',tentacruel:'tentacool',
 horsea:'horsea',seadra:'horsea',goldeen:'goldeen',seaking:'goldeen',
 krabby:'krabby',kingler:'krabby',magikarp:'magikarp',gyarados:'magikarp',
 staryu:'staryu',starmie:'staryu',shellder:'shellder',cloyster:'shellder',
 seel:'seel',dewgong:'seel',rhyhorn:'rhyhorn',rhydon:'rhyhorn',
 doduo:'doduo',dodrio:'doduo',exeggcute:'exeggcute',exeggutor:'exeggcute',
 venonat:'venonat',venomoth:'venonat',cubone:'cubone',marowak:'cubone'
});
const family=id=>EVOLUTION_FAMILIES[id]||id;
const unique=values=>[...new Set(values)];
// Stable for save/reload/preview/re-match: stage+trainer uniquely define the
// team, never Math.random(). The first/ace remains the canonical opponent.
// Prefer a trainer's FRLG class (swimmer, psychic, scientist...) but fall back
// to the full regional ecosystem to avoid making four identical evolved mons.
export function regionalTrainerParty(stage,index,firstId,count,kind='trainer'){
 const size=Math.max(1,Math.min(6,Math.trunc(count)||1));
 const result=[firstId];
 if(size===1)return result;
 const rivalPicks=['pidgey','abra','rattata','gyarados'];
 const stageRows=REGIONAL_TRAINERS[stage]||[];
 const trainer=regionalTrainer(stage,index);
 const classPicks=unique(stageRows.filter(row=>row.spriteKind===trainer?.spriteKind)
  .map(row=>row.id));
 const regionPicks=unique(stageRows.map(row=>row.id));
 const used=new Set([family(firstId)]);
 for(let slot=1;slot<size;slot++){
  const rocketPicks=kind==='rocket'?unique(
   [regionalRocket(stage,index+slot*5),...Object.values(ROCKET_ROSTERS[stage]||[])])
   :[];
  const picks=kind==='rival'?rivalPicks:
   kind==='rocket'?rocketPicks:
   unique([...(classPicks.length>=3?classPicks:[]),...regionPicks]);
  if(!picks.length){result.push(firstId);continue;}
  const start=kind==='rival'?slot-1:kind==='rocket'?0:
   (stage*5+index*7+slot*11)%picks.length;
  // First prefer an unseen evolutionary family; only relax the condition
  // if the regional pool is genuinely too small for the team size.
  let chosen=null;
  for(let offset=0;offset<picks.length;offset++){
   const id=picks[(start+offset)%picks.length];
   if(!used.has(family(id))){chosen=id;break;}
  }
  chosen??=picks.find(id=>!result.includes(id))||picks[start];
  result.push(chosen);used.add(family(chosen));
 }
 return result;
}
const ROCKET_ROSTERS=Object.freeze({
 1:['zubat','ekans','rattata'],
 3:['raticate','koffing','zubat'],
 5:['koffing','grimer','golbat'],
 7:['rhyhorn','nidorino','dugtrio']
});
export function regionalRocket(stage,index){
 const roster=ROCKET_ROSTERS[stage];
 return roster?.[Math.floor(index/5)%roster.length]||'zubat';
}
