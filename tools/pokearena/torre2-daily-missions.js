/* Pokémon Torre 2 — daily missions (campaign). Pure rules, no Phaser/DOM.
 * Three missions per local day, picked from the date (everyone gets the same
 * missions that day). Progress = what changed in the save since the day's
 * baseline, so nothing has to hook into battles. Rewards are claimed once.
 */
const list=v=>Array.isArray(v)?v:[];
const pad=n=>String(n).padStart(2,'0');
export function dayKey(date=new Date()){return date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate())}
function seedOf(key){let h=2166136261;for(const ch of key){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return h}
const rng=seed=>()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
export const MISSION_TYPES=Object.freeze(['FIRE','WATER','GRASS','ELECTRIC','BUG','NORMAL','POISON','FLYING','ROCK','PSYCHIC']);
const TYPE_PT={FIRE:'Fogo',WATER:'Água',GRASS:'Planta',ELECTRIC:'Elétrico',BUG:'Inseto',NORMAL:'Normal',POISON:'Veneno',FLYING:'Voador',ROCK:'Pedra',PSYCHIC:'Psíquico'};
// kind → how to describe and how much it asks.
const POOL=Object.freeze([
 {kind:'wins',goals:[3,4,5],text:n=>'Vença '+n+' batalhas'},
 {kind:'captures',goals:[1,2,3],text:n=>'Capture '+n+' Pokémon'},
 {kind:'captureType',goals:[1],text:(n,t)=>'Capture um Pokémon do tipo '+(TYPE_PT[t]||t)},
 {kind:'dexSeen',goals:[2,3],text:n=>'Veja '+n+' espécies novas na Pokédex'},
 {kind:'rematch',goals:[1,2],text:n=>'Vença '+n+' revanche'+(n>1?'s':'')+' do VS Seeker'}
]);
const REWARDS=Object.freeze([{items:{pokeball:5}},{items:{greatball:3}},{items:{superpotion:2}},{items:{ultraball:2}},{money:1500}]);
export const DAILY_BONUS=Object.freeze({items:{ultraball:3},money:3000});
export function missionsFor(key){
 const r=rng(seedOf('torre2-daily-'+key));
 const kinds=[...POOL].sort(()=>r()-.5).slice(0,3);
 return kinds.map((p,i)=>{const goal=p.goals[Math.floor(r()*p.goals.length)];
  const type=p.kind==='captureType'?MISSION_TYPES[Math.floor(r()*MISSION_TYPES.length)]:null;
  return {id:key+'-'+i,kind:p.kind,goal,type,text:p.text(goal,type),reward:REWARDS[Math.floor(r()*REWARDS.length)]}});
}
const uids=s=>[...list(s?.team),...list(s?.box)].map(m=>m?.uid).filter(u=>typeof u==='string');
export function baselineOf(s){return {wins:s?.wins||0,uids:uids(s),dexSeen:list(s?.dexSeen).length,rematchWins:s?.rematches?.wins||0}}
// Returns a NEW state whose daily block belongs to today (callers save it).
export function ensureDaily(s,key=dayKey()){
 if(s?.daily?.day===key&&Array.isArray(s.daily.missions))return s;
 return {...s,daily:{day:key,baseline:baselineOf(s),missions:missionsFor(key),claimed:[],bonus:false}};
}
// typesOf(id) → ['FIRE',...] for captureType; optional.
export function missionProgress(s,m,typesOf=()=>[]){
 const b=s?.daily?.baseline||baselineOf(s);
 const fresh=[...list(s?.team),...list(s?.box)].filter(x=>typeof x?.uid==='string'&&!list(b.uids).includes(x.uid));
 const n=m.kind==='wins'?(s?.wins||0)-b.wins:
  m.kind==='captures'?fresh.length:
  m.kind==='captureType'?fresh.filter(x=>list(typesOf(x.id)).includes(m.type)).length:
  m.kind==='dexSeen'?list(s?.dexSeen).length-b.dexSeen:
  m.kind==='rematch'?(s?.rematches?.wins||0)-b.rematchWins:0;
 return Math.max(0,Math.min(m.goal,n));
}
function applyReward(next,reward){
 next.inventory={...next.inventory};
 for(const [k,n] of Object.entries(reward?.items||{}))next.inventory[k]=(Number.isInteger(next.inventory[k])?next.inventory[k]:0)+n;
 if(reward?.money)next.money=(Number(next.money)||0)+reward.money;
}
// Claim one finished mission ('bonus' = all three done). New state or null.
export function claimDaily(s,id,typesOf=()=>[]){
 const d=s?.daily;if(!d)return null;
 const next=JSON.parse(JSON.stringify(s));
 if(id==='bonus'){
  if(d.bonus||!d.missions.every(m=>missionProgress(s,m,typesOf)>=m.goal))return null;
  next.daily.bonus=true;applyReward(next,DAILY_BONUS);return next;
 }
 const m=d.missions.find(x=>x.id===id);
 if(!m||list(d.claimed).includes(id)||missionProgress(s,m,typesOf)<m.goal)return null;
 next.daily.claimed=[...list(d.claimed),id];applyReward(next,m.reward);return next;
}

// --- Mission points + points shop (owner list 2026-11-20, item 19) ---------
// Each claimed mission gives points; the daily bonus gives more. Points are
// spent in the shop on existing campaign items. The Master Ball can be bought
// once per journey. Points live in the campaign save (missionPoints).
export const POINTS_PER_MISSION=10,POINTS_BONUS=25;
export const POINT_SHOP=Object.freeze([
 {id:'master',name:'Master Ball',cost:250,items:{masterball:1},oncePerJourney:true},
 {id:'ultra5',name:'5× Ultra Ball',cost:60,items:{ultraball:5}},
 {id:'great10',name:'10× Great Ball',cost:40,items:{greatball:10}},
 {id:'super5',name:'5× Super Poção',cost:50,items:{superpotion:5}},
 {id:'fullheal3',name:'3× Cura Total',cost:40,items:{fullheal:3}}
]);
export function missionPoints(s){return Math.max(0,Math.floor(Number(s?.missionPoints)||0))}
export function claimDailyWithPoints(s,id,typesOf=()=>[]){
 const next=claimDaily(s,id,typesOf);if(!next)return null;
 next.missionPoints=missionPoints(s)+(id==='bonus'?POINTS_BONUS:POINTS_PER_MISSION);
 return next;
}
export function shopItemState(s,item){
 if(item.oncePerJourney&&list(s?.pointShopBought).includes(item.id))return {ok:false,reason:'Já comprado nesta jornada'};
 if(missionPoints(s)<item.cost)return {ok:false,reason:'Faltam '+(item.cost-missionPoints(s))+' pontos'};
 return {ok:true,reason:''};
}
export function buyWithPoints(s,id){
 const item=POINT_SHOP.find(x=>x.id===id);if(!item)return null;
 if(!shopItemState(s,item).ok)return null;
 const next=JSON.parse(JSON.stringify(s));
 next.missionPoints=missionPoints(s)-item.cost;
 applyReward(next,{items:item.items});
 if(item.oncePerJourney)next.pointShopBought=[...list(s?.pointShopBought),item.id];
 return next;
}
