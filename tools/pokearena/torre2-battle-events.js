/* Pokémon Torre 2 — campaign battle events (owner request 2026-11-22).
 * Pure rules (no Phaser):
 *  - Battle weather by chance (item 7): a LOW chance that a battle starts
 *    with the weather of the leader's type (Blaine: sun, Misty: rain...) or
 *    of the city's route weather. Uses the existing Torre 2 battle weather
 *    (weather.js), never a new move and never a native kit change.
 *  - Eventos 3x3 (item 2): fifteen special battles across the journey, each a
 *    named trainer with exactly three Pokémon who challenges the player's
 *    first three healthy Pokémon, with a 3x3 line before the fight. A
 *    separate battle: it never moves the trainer ladder.
 */
const list=v=>Array.isArray(v)?v:[];

// --- Battle weather by chance ------------------------------------------------
export const TYPE_WEATHER=Object.freeze({FIRE:'sun',GRASS:'sun',WATER:'rain',ELECTRIC:'rain',
 ROCK:'sand',GROUND:'sand',ICE:'hail'});
export const WEATHER_CHANCE=Object.freeze({leader:.18,trainer:.08,wild:.06});
// stageType: the gym/leader type of the stage; routeSky: today's route weather
// of the stage (route-weather.js, 'clear' = none). Returns a weather.js kind.
export function battleWeatherRoll({leader=false,wild=false,stageType=null,routeSky='clear'},random=Math.random){
 const leaderKind=leader?TYPE_WEATHER[String(stageType||'').toUpperCase()]:null;
 const routeKind=['rain','sun','sand','hail'].includes(routeSky)?routeSky:null;
 const kind=leaderKind||routeKind;
 if(!kind)return 'none';
 const chance=leader?WEATHER_CHANCE.leader:wild?WEATHER_CHANCE.wild:WEATHER_CHANCE.trainer;
 const r=Number(random());
 return Number.isFinite(r)&&r>=0&&r<chance?kind:'none';
}
export const WEATHER_INTRO=Object.freeze({
 sun:'O sol está muito forte nesta luta!',rain:'Começou a chover forte!',
 sand:'Uma tempestade de areia toma conta da arena!',hail:'Está caindo granizo!'
});

// --- Eventos 3x3 -------------------------------------------------------------
// minBadges: badges needed (champion:true = after the League). Teams are
// Kanto species the engine can field; levels follow the campaign cap.
export const EVENTS_3X3=Object.freeze([
 {id:'e1',name:'Gêmeos Léo e Lia',sprite:'camper',minBadges:1,
  team:['pidgeotto','nidorino','oddish'],
  line:'Três contra três! Um só Pokémon não segura a gente. Monte sua melhor trinca!',
  reward:{money:1500,items:{greatball:3}}},
 {id:'e2',name:'Marujo Bruto',sprite:'sailor',minBadges:2,
  team:['machop','tentacool','krabby'],
  line:'No mar a gente luta em trio! Três dos seus contra três dos meus. Segura essa onda!',
  reward:{money:2500,items:{superpotion:3}}},
 {id:'e3',name:'Cientista Dra. Vera',sprite:'scientist',minBadges:3,
  team:['magnemite','voltorb','grimer'],
  line:'Hipótese: três Pokémon bem combinados vencem qualquer um sozinho. Vamos testar no 3x3!',
  reward:{money:3500,items:{ultraball:3}}},
 {id:'e4',name:'Faixa-Preta Kenji',sprite:'blackbelt',minBadges:5,
  team:['primeape','hitmonlee','machoke'],
  line:'Um golpe é força. Três golpes em sequência é arte! Mostre o seu trio!',
  reward:{money:4500,items:{fullheal:3}}},
 {id:'e5',name:'Médium Selene',sprite:'channeler',minBadges:7,
  team:['haunter','hypno','kadabra'],
  line:'Três espíritos me acompanham... e os seus três vão sentir o frio do outro lado!',
  reward:{money:6000,items:{ultraball:5}}},
 {id:'e6',name:'Ás Lendário Rafa',sprite:'ace',champion:true,
  team:['dragonite','gyarados','arcanine'],
  line:'Campeão, hein? Campeões de verdade vencem em trio. 3x3, sem desculpas!',
  reward:{money:10000,items:{ultraball:10}}},
 // Nine more (owner 2026-11-22: "umas 15 batalhas 3x3"), spread across the journey.
 {id:'e7',name:'Caçador Beto',sprite:'bugcatcher',minBadges:1,
  team:['beedrill','butterfree','parasect'],
  line:'Meus insetos atacam em enxame! Três de uma vez. Você aguenta o zumbido?',
  reward:{money:1800,items:{potion:5}}},
 {id:'e8',name:'Pescador Tonho',sprite:'fisherman',minBadges:2,
  team:['poliwhirl','seaking','starmie'],
  line:'Pesquei os três maiores do lago hoje. Vamos ver se você fisga uma vitória!',
  reward:{money:2800,items:{greatball:5}}},
 {id:'e9',name:'Motoqueiro Rex',sprite:'biker',minBadges:3,
  team:['weezing','muk','raticate'],
  line:'Na estrada a gangue anda em trio! Acelera aí, 3x3 sem freio!',
  reward:{money:3600,items:{superpotion:4}}},
 {id:'e10',name:'Montanhista Duda',sprite:'hiker',minBadges:4,
  team:['graveler','onix','rhyhorn'],
  line:'Três rochas são uma montanha! Tenta escalar essa, se for capaz!',
  reward:{money:4000,items:{fullheal:3}}},
 {id:'e11',name:'Domadora Lume',sprite:'picnicker',minBadges:4,
  team:['rapidash','growlithe','ninetales'],
  line:'Minha trinca de fogo nunca se apaga. Prepare-se para o calor do 3x3!',
  reward:{money:4200,items:{ultraball:2}}},
 {id:'e12',name:'Ninja Sombra',sprite:'rocker',minBadges:6,
  team:['venomoth','golbat','arbok'],
  line:'Você nem vai ver de onde vêm os três golpes... Silêncio. Começou.',
  reward:{money:5200,items:{ultraball:3}}},
 {id:'e13',name:'Patinadora Neve',sprite:'acef',minBadges:6,
  team:['dewgong','cloyster','jynx'],
  line:'Três passos no gelo e você escorrega! Vamos dançar um 3x3 congelante!',
  reward:{money:5400,items:{superpotion:5}}},
 {id:'e14',name:'Professora Íris',sprite:'woman',minBadges:8,
  team:['alakazam','slowbro','exeggutor'],
  line:'Já previ esta luta: três mentes contra três corações. Mostre que eu errei!',
  reward:{money:7500,items:{ultraball:5}}},
 {id:'e15',name:'Veterano Heitor',sprite:'gentleman',champion:true,
  team:['aerodactyl','lapras','snorlax'],
  line:'Lendas de Kanto, meu jovem. Três gigantes contra o seu melhor trio!',
  reward:{money:12000,items:{ultraball:10}}}
]);
// Eventos da Equipe Rocket (owner 2026-11-22, item 19): small stories from
// FireRed's Rocket plot, each ending in a 3x3 against a Rocket trio. Same
// rules as the 3x3 events (separate battles, reward on the first win).
export const ROCKET_EVENTS=Object.freeze([
 {id:'k1',rocket:true,name:'Recrutas do Mt. Moon',place:'Mt. Moon',sprite:'rocket',minBadges:1,
  team:['zubat','rattata','ekans'],
  story:['Ei, pirralho! Os fósseis do Mt. Moon agora são da Equipe Rocket!','O chefe quer os fósseis para vender caro... e ninguém vai atrapalhar!'],
  line:'Quer os fósseis? Então derrote nosso trio!',reward:{money:2500,items:{greatball:5}}},
 {id:'k2',rocket:true,name:'Esconderijo do Cassino',place:'Cassino de Celadon',sprite:'rocketf',minBadges:3,
  team:['koffing','grimer','raticate'],
  story:['Shh! O Cassino de Celadon é só fachada...','O esconderijo da Equipe Rocket fica atrás do pôster. Você viu demais!'],
  line:'Agora vai ter que lutar contra nós três!',reward:{money:5000,items:{ultraball:3}}},
 {id:'k3',rocket:true,name:'Invasão da Torre Pokémon',place:'Torre Pokémon',sprite:'rocket',minBadges:4,
  team:['golbat','arbok','gastly'],
  story:['A Torre Pokémon de Lavender é nossa base agora!','O Sr. Fuji está preso lá em cima e os espíritos estão agitados...'],
  line:'Ninguém sobe enquanto a Equipe Rocket estiver aqui!',reward:{money:6500,items:{superpotion:5}}},
 {id:'k4',rocket:true,name:'Segredos da Mansão',place:'Mansão Pokémon',sprite:'scientist',minBadges:6,
  team:['muk','weezing','hypno'],
  story:['Os diários da Mansão Pokémon falam de um Pokémon criado em laboratório...','A Equipe Rocket me pagou para apagar tudo. Você não vai ler nada!'],
  line:'Meus Pokémon vão proteger os segredos!',reward:{money:8000,items:{ultraball:5}}},
 {id:'k5',rocket:true,name:'O retorno de Giovanni',place:'Esconderijo secreto',sprite:'giovanni',champion:true,
  team:['nidoking','nidoqueen','rhydon'],
  story:['Então você é o treinador que derrotou a Equipe Rocket tantas vezes...','Mesmo Campeão, você não conhece o verdadeiro poder de Giovanni.'],
  line:'Três contra três. Vamos ver quem é o mais forte de Kanto!',reward:{money:20000,items:{ultraball:10}}}
]);
export const ALL_EVENTS=Object.freeze([...EVENTS_3X3,...ROCKET_EVENTS]);
// Each win has a small chance to earn one of the challenger's Pokémon.
export const EVENT_POKEMON_CHANCE=.05;
export function eventPokemonRoll(ev,random=Math.random){
 const r=Number(random());
 if(!(Number.isFinite(r)&&r>=0&&r<EVENT_POKEMON_CHANCE))return null;
 const team=list(ev?.team);if(!team.length)return null;
 return team[Math.min(team.length-1,Math.floor(Math.max(0,Math.min(.999999,Number(random())||0))*team.length))];
}
export const EVENT_SIZE=3;
const badgeCount=s=>list(s?.badges).length;
export function eventStatus(s,ev){
 if(!ev)return {state:'locked',reason:'Evento desconhecido.'};
 const done=list(s?.events3x3?.won).includes(ev.id);
 if(ev.champion&&!s?.champion)return {state:'locked',reason:'Depois de zerar a Liga'};
 if(!ev.champion&&badgeCount(s)<ev.minBadges&&!s?.champion)return {state:'locked',reason:'Precisa de '+ev.minBadges+' insígnia(s)'};
 return {state:done?'won':'open',reason:done?'Vencido · pode lutar de novo':'Disponível'};
}
// Levels: from the cap of the current stage, the ace a bit stronger.
export function eventTeam(ev,cap){
 const top=Math.max(5,Math.min(100,(Number(cap)||20)+2));
 return list(ev?.team).slice(0,EVENT_SIZE).map((id,i)=>({id,level:Math.max(5,top-(EVENT_SIZE-1-i)*2)}));
}
// The player's three: the first three Pokémon of the team with HP left.
export function playerTrio(team){
 return list(team).map((m,i)=>({m,i})).filter(x=>(Number(x.m?.hp??100))>0).slice(0,EVENT_SIZE);
}
export function eventToken(s,id){return 'event3-'+id+'-'+(s?.wins||0)+'-'+(s?.losses||0)}
// Result: first win gives the reward; later wins only XP (caller adds XP).
export function resolveEventResult(s,id,won){
 const ev=ALL_EVENTS.find(e=>e.id===id);
 if(!ev)return {ok:false,reason:'Evento desconhecido.'};
 const prev=s?.events3x3||{};
 const first=won&&!list(prev.won).includes(id);
 const next={...s,events3x3:{won:won?[...new Set([...list(prev.won),id])]:list(prev.won),
  fights:(Number(prev.fights)||0)+1,wins:(Number(prev.wins)||0)+(won?1:0)}};
 let reward=null;
 if(first){
  reward=ev.reward;
  next.inventory={...(s.inventory||{})};
  for(const [k,v] of Object.entries(reward.items||{}))next.inventory[k]=(Number(next.inventory[k])||0)+v;
  next.money=(Number(s.money)||0)+(reward.money||0);
 }
 return {ok:true,won:!!won,first,reward,state:next,
  message:won?(first?(ev.rocket?'A Equipe Rocket fugiu! ':'Evento 3x3 vencido! ')+ev.name+': $'+reward.money+' e itens.':(ev.rocket?'Equipe Rocket derrotada de novo!':'Evento 3x3 vencido de novo!')):(ev.rocket?'A Equipe Rocket venceu desta vez...':'Derrota no evento 3x3 contra '+ev.name+'.')};
}
