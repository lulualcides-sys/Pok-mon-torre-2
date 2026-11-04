/* Kanto campaign encounter identity, independent of card rendering.
 * Each regular trainer currently battles with ONE Pokémon; do not display
 * a fictional full team until the underlying party battle supports it.
 * Areas are grouped by Torre 2 stages, not one-to-one FireRed trainer IDs.
 * Preserve stage/trainer indices so existing Kanto saves remain valid.
 */
const TRAINERS=[
 // Route 1/2, Viridian Forest, Route 22, Pewter outskirts
 ['youngster:rattata','bugcatcher:caterpie','bugcatcher:weedle',
  'youngster:pidgey','bugcatcher:metapod','bugcatcher:kakuna',
  'lass:nidoran-f','bugcatcher:butterfree','youngster:mankey',
  'hiker:geodude','youngster:spearow','hiker:geodude','hiker:onix'],
 // Route 3, Mt. Moon, Route 4, Cerulean and its water gym
 ['youngster:ekans','lass:jigglypuff','hiker:geodude','bugcatcher:paras',
  'hiker:geodude','lass:clefairy','hiker:onix','youngster:sandshrew',
  'swimmer:goldeen','swimmer:horsea','swimmer:staryu','sailor:tentacool'],
 // Nugget Bridge, routes 24/25, Vermilion and S.S. Anne
 ['youngster:oddish','lass:bellsprout','ace:pidgeotto','sailor:machop',
  'sailor:tentacool','gentleman:growlithe','sailor:shellder',
  'youngster:meowth','sailor:horsea','scientist:magnemite',
  'rocker:voltorb','scientist:voltorb','sailor:krabby'],
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
 ['hiker:graveler','blackbelt:machoke','ace:golbat','hiker:onix',
  'ace:persian','blackbelt:primeape','ace:arbok','hiker:marowak',
  'ace:venomoth','blackbelt:machamp','hiker:rhydon','ace:exeggutor']
].map(rows=>Object.freeze(rows.map(row=>{
 const [spriteKind,id]=row.split(':');
 return Object.freeze({spriteKind,id});
})));
export const REGIONAL_TRAINERS=Object.freeze(TRAINERS);
const TITLES=Object.freeze({
 youngster:'Jovem',bugcatcher:'Caça-Insetos',lass:'Garota',
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
