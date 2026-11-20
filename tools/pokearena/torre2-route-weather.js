/* Pokémon Torre 2 — weather on the Kanto routes (owner list 2026-11-20, item 16).
 * Visual + encounters only: it never sets battle weather and never changes a
 * move, a kit or a level. Each route has a weather that changes every 3 hours
 * of the player's clock (deterministic, so both screens agree). The weather
 * makes Pokémon of matching types appear more often and opposed types less
 * often, ONLY among the species that already live in that route's FireRed
 * table: no species is ever added. Clear weather keeps the old uniform pick.
 */
export const ROUTE_WEATHER_HOURS=3;
export const ROUTE_WEATHERS=Object.freeze({
 clear:{name:'Tempo bom',hint:'Todos aparecem igual.',more:[],less:[]},
 rain:{name:'Chuva',hint:'Água e Elétrico aparecem mais; Fogo, menos.',more:['WATER','ELECTRIC'],less:['FIRE','GROUND','ROCK']},
 sun:{name:'Sol forte',hint:'Fogo e Planta aparecem mais; Água, menos.',more:['FIRE','GRASS'],less:['WATER','ICE']},
 sand:{name:'Tempestade de areia',hint:'Pedra e Terra aparecem mais; Planta, menos.',more:['ROCK','GROUND','STEEL'],less:['GRASS','FLYING']},
 hail:{name:'Granizo',hint:'Gelo aparece mais; Fogo e Planta, menos.',more:['ICE'],less:['FIRE','GRASS']},
 fog:{name:'Neblina',hint:'Fantasma e Psíquico aparecem mais.',more:['GHOST','PSYCHIC'],less:[]}
});
// Weather pool per campaign stage (the route before each gym). Hail only near
// the Seafoam Islands (stage 6, Cinnabar sea routes); fog near Lavender (4).
const POOLS=Object.freeze({
 default:['clear','clear','clear','rain','sun'],
 0:['clear','clear','rain','sun','sand'],
 3:['clear','clear','rain','sun','sun'],
 4:['clear','clear','rain','fog','fog'],
 5:['clear','clear','rain','sun','fog'],
 6:['clear','rain','rain','hail','sun'],
 7:['clear','clear','sand','sun','rain'],
 8:['clear','sand','sand','rain','fog']
});
export const WEATHER_MORE=3,WEATHER_LESS=.4;
const hash=t=>{let h=2166136261;for(const c of t){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
// date: a Date (player's local clock). Returns a key of ROUTE_WEATHERS.
export function routeWeather(stage,date=new Date()){
 const st=Number.isInteger(stage)?stage:0;
 const pool=POOLS[st]||POOLS.default;
 const d=date instanceof Date&&!Number.isNaN(date.getTime())?date:new Date(0);
 const slot=`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}-${Math.floor(d.getHours()/ROUTE_WEATHER_HOURS)}`;
 return pool[hash(slot+'|'+st)%pool.length];
}
// Weight of one species in a weather (types: array of upper-case types).
export function weatherWeight(kind,types){
 const w=ROUTE_WEATHERS[kind];if(!w||kind==='clear')return 1;
 const t=Array.isArray(types)?types.map(x=>String(x).toUpperCase()):[];
 const more=t.some(x=>w.more.includes(x)),less=t.some(x=>w.less.includes(x));
 return more&&!less?WEATHER_MORE:less&&!more?WEATHER_LESS:1;
}
// One random draw r in [0,1) picks from the available list. With equal
// weights it is exactly the old pick: list[floor(r*n)].
export function pickWeighted(list,weights,r){
 const n=list.length;if(!n)return null;
 const x=Math.max(0,Math.min(.999999,Number(r)||0));
 const w=list.map((_,i)=>Math.max(0,Number(weights?.[i])||0));
 const total=w.reduce((a,b)=>a+b,0);
 if(!(total>0)||w.every(v=>v===w[0]))return list[Math.min(n-1,Math.floor(x*n))];
 let acc=0;const target=x*total;
 for(let i=0;i<n;i++){acc+=w[i];if(target<acc)return list[i]}
 return list[n-1];
}
// Share of each species (for the grass screen: "aparece mais").
export function weatherShares(kind,list,typesOf){
 const w=list.map(id=>weatherWeight(kind,typesOf(id)));
 const total=w.reduce((a,b)=>a+b,0)||1;
 return Object.fromEntries(list.map((id,i)=>[id,w[i]/total]));
}
