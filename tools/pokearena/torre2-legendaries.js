/* Pokémon Torre 2 — legendary encounters of the Kanto campaign.
 * Pure rules only (no Phaser): where each legendary waits, when it unlocks,
 * its battle level and whether it is available, caught or gone for now.
 * Owner-approved plan (2026-11-19), FireRed style:
 *  - one fixed encounter per legendary, never in the tall-grass tables;
 *  - it fights with its untouched native kit; capture uses the Gen III
 *    formula and the real catch rate (3 for birds/Mewtwo, 45 for Mew);
 *  - running away keeps it there; knocking it out makes it leave until the
 *    League is beaten (or, after the League, until 10 more victories);
 *  - one Master Ball per journey, from Giovanni.
 */
export const LEGENDARIES=Object.freeze([
 {id:'zapdos',name:'Zapdos',place:'Usina Elétrica',scene:'powerplant',type:'ELECTRIC',
  level:50,arena:'neon',badges:3,unlock:'Depois da 3ª insígnia'},
 {id:'articuno',name:'Articuno',place:'Ilhas Seafoam',scene:'seafoam',type:'ICE',
  level:50,arena:'estadio',badges:5,unlock:'Depois da 5ª insígnia'},
 {id:'moltres',name:'Moltres',place:'Monte Ember',scene:'ember',type:'FIRE',
  level:50,arena:'crater',badges:7,unlock:'Depois da 7ª insígnia'},
 {id:'mewtwo',name:'Mewtwo',place:'Caverna de Cerulean',scene:'cave',type:'PSYCHIC',
  level:70,arena:'ruinas',champion:true,unlock:'Depois de zerar a Liga'},
 {id:'mew',name:'Mew',place:'Ilha Distante',scene:'faraway',type:'PSYCHIC',
  level:30,arena:'ruinas',champion:true,needs:['zapdos','articuno','moltres','mewtwo'],
  unlock:'Depois de capturar os outros 4'}
]);
export const MASTER_BALL_STAGE=7; // Giovanni, Viridian gym.
export const LEGENDARY_RETURN_WINS=10;

const list=v=>Array.isArray(v)?v:[];
export function legendaryById(id){return LEGENDARIES.find(l=>l.id===id)||null}
export function isLegendary(id){return !!legendaryById(id)}
const badgeCount=s=>list(s?.badges).length;
export function legendaryCaught(s,id){return list(s?.dexCaught).includes(id)}
// Battle level: the real level after the League; before it, never more than
// 3 above the current campaign cap so an early encounter is hard, not hopeless.
// levelCap: the campaign cap of the current stage (kanto-levels currentLevelCap).
export function legendaryLevel(s,leg,levelCap=Infinity){
 if(!leg)return 5;
 if(s?.champion||!Number.isFinite(levelCap))return leg.level;
 return Math.min(leg.level,levelCap+3);
}
export function legendaryStatus(s,id,levelCap=Infinity){
 const leg=legendaryById(id);
 if(!leg)return {state:'unknown',reason:'Lendário desconhecido.'};
 if(legendaryCaught(s,id))return {state:'caught',reason:'Capturado!'};
 if(leg.champion&&!s?.champion)return {state:'locked',reason:leg.unlock};
 if(leg.badges&&badgeCount(s)<leg.badges&&!s?.champion)return {state:'locked',reason:leg.unlock};
 const missing=list(leg.needs).filter(n=>!legendaryCaught(s,n));
 if(missing.length)return {state:'locked',reason:leg.unlock+' (faltam '+missing.length+')'};
 const gone=list(s?.legendaryDefeated).find(d=>d?.id===id);
 if(gone){
  // FireRed: a knocked-out legendary returns once the League is beaten.
  const back=s?.champion&&(!gone.champion||(s.wins||0)>=(gone.wins||0)+LEGENDARY_RETURN_WINS);
  if(!back){
   const left=gone.champion?Math.max(1,(gone.wins||0)+LEGENDARY_RETURN_WINS-(s?.wins||0)):0;
   return {state:'gone',reason:gone.champion?'Volta depois de mais '+left+' vitória(s)':'Volta depois de zerar a Liga'};
  }
 }
 return {state:'available',reason:'Nv '+legendaryLevel(s,leg,levelCap)};
}
// Stage the encounter as the campaign's single wild battle. Caller saves it.
export function legendaryEncounter(s,id,levelCap=Infinity,random=Math.random){
 const leg=legendaryById(id);
 if(!leg||legendaryStatus(s,id,levelCap).state!=='available')return null;
 const roll=Number(random());
 const shiny=Number.isFinite(roll)&&roll>=0&&roll<.01;
 return {id,stage:s.stage,trainer:s.trainer,shiny,level:legendaryLevel(s,leg,levelCap),
  area:leg.place,hpPercent:100,legendary:true,arena:leg.arena};
}
// Record a knock-out (the legendary leaves). Returns a new array.
export function markLegendaryDefeated(s,id){
 return [...list(s?.legendaryDefeated).filter(d=>d?.id!==id),
  {id,wins:s?.wins||0,champion:!!s?.champion}];
}
