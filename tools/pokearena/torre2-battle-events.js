/* Pokémon Torre 2 — campaign battle events (owner request 2026-11-22).
 * Pure rules (no Phaser):
 *  - Battle weather by chance (item 7): a LOW chance that a battle starts
 *    with the weather of the leader's type (Blaine: sun, Misty: rain...) or
 *    of the city's route weather. Uses the existing Torre 2 battle weather
 *    (weather.js), never a new move and never a native kit change.
 *  - Eventos 3x3 (item 2): six special battles across the journey, each a
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
  reward:{money:10000,items:{ultraball:10}}}
]);
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
 const ev=EVENTS_3X3.find(e=>e.id===id);
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
  message:won?(first?'Evento 3x3 vencido! '+ev.name+' te deu $'+reward.money+' e itens.':'Evento 3x3 vencido de novo!'):'Derrota no evento 3x3 contra '+ev.name+'.'};
}
