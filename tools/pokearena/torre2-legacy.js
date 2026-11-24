/* Pokémon Torre 2 — permanent trainer legacy (survives "Reiniciar jornada").
 * Pure functions only: no Phaser, no DOM. Stored under its own key, never in
 * the campaign save, so a reset of the journey keeps titles and completions.
 * Achievement rewards are claimed into the campaign save once per journey.
 */
export const LEGACY_KEY='torre2-legacy-v1';
export const RANKING_KEY='torre2-ranking-v1';

const list=v=>Array.isArray(v)?v:[];
const count=v=>new Set(list(v)).size;
export function emptyLegacy(){
 return {version:1,championRuns:[],champions:[],titles:{},activeTitle:null,bestShiny:0,bestCaught:0,flawlessRuns:0};
}
export function readLegacy(storage=globalThis.localStorage){
 try{
  const raw=JSON.parse(storage?.getItem?.(LEGACY_KEY)||'null');
  if(!raw||typeof raw!=='object')return emptyLegacy();
  const l={...emptyLegacy(),...raw};
  l.championRuns=list(l.championRuns).filter(x=>typeof x==='string').slice(0,999);
  l.titles=l.titles&&typeof l.titles==='object'?l.titles:{};
  l.champions=list(l.champions).filter(c=>c&&typeof c.run==='string'&&Array.isArray(c.team)).slice(-100);
  return l;
 }catch{return emptyLegacy()}
}
export function saveLegacy(legacy,storage=globalThis.localStorage){
 try{storage?.setItem?.(LEGACY_KEY,JSON.stringify(legacy));return true}catch{return false}
}
// A journey is identified by its starter's UID (kept through evolution).
export function runIdOf(state){
 const starter=String(state?.starter||'');
 const m=[...list(state?.team),...list(state?.box)].find(x=>typeof x?.uid==='string'&&x.uid.startsWith(starter+'-'));
 return m?.uid||null;
}
const LEGENDARY_BIRDS=['articuno','zapdos','moltres'];
// Permanent titles: hard goals, kept forever once earned.
export const TITLES=Object.freeze([
 {id:'champion',name:'Campeão de Kanto',desc:'Zere a campanha',rarity:'gold',test:(s,l)=>l.championRuns.length>=1},
 {id:'bichampion',name:'Bicampeão',desc:'Zere 2 vezes',rarity:'gold',test:(s,l)=>l.championRuns.length>=2},
 {id:'trichampion',name:'Tricampeão',desc:'Zere 3 vezes',rarity:'gold',test:(s,l)=>l.championRuns.length>=3},
 {id:'legend',name:'Lenda de Kanto',desc:'Zere 5 vezes',rarity:'rainbow',test:(s,l)=>l.championRuns.length>=5},
 {id:'immortal',name:'Imortal da Liga',desc:'Zere 10 vezes',rarity:'rainbow',test:(s,l)=>l.championRuns.length>=10},
 {id:'flawless',name:'Invicto',desc:'Zere sem perder nenhuma batalha',rarity:'rainbow',test:(s,l)=>l.flawlessRuns>=1},
 {id:'dexmaster',name:'Mestre da Pokédex',desc:'Capture as 151 espécies',rarity:'rainbow',test:(s,l)=>Math.max(l.bestCaught,count(s?.dexCaught))>=151},
 {id:'dexhalf',name:'Pesquisador Dedicado',desc:'Capture 75 espécies numa jornada',rarity:'silver',test:(s,l)=>Math.max(l.bestCaught,count(s?.dexCaught))>=75},
 {id:'shiny1',name:'Caçador de Shinies',desc:'Capture um Pokémon shiny',rarity:'silver',test:(s,l)=>Math.max(l.bestShiny,count(s?.dexShinyCaught))>=1},
 {id:'shiny5',name:'Colecionador Brilhante',desc:'Capture 5 espécies shiny',rarity:'gold',test:(s,l)=>Math.max(l.bestShiny,count(s?.dexShinyCaught))>=5},
 {id:'shiny10',name:'Aurora Shiny',desc:'Capture 10 espécies shiny',rarity:'rainbow',test:(s,l)=>Math.max(l.bestShiny,count(s?.dexShinyCaught))>=10},
 {id:'birds',name:'Guardião das Aves',desc:'Capture Articuno, Zapdos e Moltres',rarity:'gold',test:s=>LEGENDARY_BIRDS.every(id=>list(s?.dexCaught).includes(id))},
 {id:'mew',name:'Sombra Mítica',desc:'Capture Mew',rarity:'rainbow',test:s=>list(s?.dexCaught).includes('mew')},
 // Secret titles (owner list 2026-11-20, item 20): shown as "???" until earned.
 {id:'monotype',name:'Especialista',desc:'Vença um líder com a equipe toda de um mesmo tipo',rarity:'gold',secret:true,
  test:s=>!!s?.secretFlags?.monoLeader},
 {id:'cleancatch',name:'Captura Perfeita',desc:'Capture um Pokémon sem seu Pokémon tomar dano',rarity:'silver',secret:true,
  test:s=>!!s?.secretFlags?.cleanCatch},
 {id:'towermaster',name:'Mestre da Torre',desc:'Chegue ao andar 25 da Torre de desafios',rarity:'rainbow',secret:true,
  test:s=>(Number(s?.tower?.best)||0)>=25}
]);
// Update the legacy from the live campaign; returns the titles earned now.
export function syncLegacy(state,legacy=emptyLegacy(),now=Date.now(),{name=null}={}){
 const l={...legacy,championRuns:[...legacy.championRuns],champions:[...list(legacy.champions)],titles:{...legacy.titles}};
 const run=runIdOf(state);
 if(state?.champion&&run&&!l.championRuns.includes(run)){
  l.championRuns.push(run);
  if((state.losses||0)===0)l.flawlessRuns=(l.flawlessRuns||0)+1;
  // Hall of Fame history: the champion team of this journey, kept forever.
  l.champions.push({run,at:now,name:name?String(name).slice(0,12):null,title:l.activeTitle||null,
   wins:state.wins||0,losses:state.losses||0,
   team:list(state.team).slice(0,6).map(m=>({id:String(m?.id||''),level:Number(m?.progression?.level)||0,shiny:m?.shiny===true}))});
  l.champions=l.champions.slice(-100);
 }
 l.bestShiny=Math.max(l.bestShiny||0,count(state?.dexShinyCaught));
 l.bestCaught=Math.max(l.bestCaught||0,count(state?.dexCaught));
 const earned=[];
 for(const t of TITLES)if(!l.titles[t.id]&&t.test(state||{},l)){l.titles[t.id]={at:now};earned.push(t)}
 if(!l.activeTitle&&earned.length)l.activeTitle=earned.at(-1).id;
 return {legacy:l,earned};
}
export function titleById(id){return TITLES.find(t=>t.id===id)||null}

// Rewards for the per-journey achievements (items/money, once per journey).
export const ACHIEVEMENT_REWARDS=Object.freeze({
 'Primeira captura':{items:{pokeball:5}},
 'Colecionador':{items:{greatball:5}},
 'Pesquisador':{money:3000},
 'Equipe completa':{items:{superpotion:3}},
 'Primeira insígnia':{money:1000},
 'Meio caminho':{items:{ultraball:3},money:3000},
 'Todas as insígnias':{items:{fullheal:5}},
 'Veterano':{items:{potion:5}},
 'Lenda':{money:10000},
 'Brilho raro':{items:{ultraball:10}},
 'Campeão de Kanto':{money:20000},
 'Mestre da Pokédex':{money:50000},
 // Owner 2026-11-24: more achievements (wins count trainers only).
 'Centenário':{items:{ultraball:5}},
 'Treinador de elite':{money:25000},
 'Explorador':{items:{greatball:5}},
 'Caçador':{items:{ultraball:3}},
 'Pesquisador sênior':{money:8000},
 'Quase lá':{money:15000},
 'Reta final':{items:{fullheal:3},money:5000},
 'Lendário':{items:{ultraball:5}},
 'Mestre lendário':{money:30000},
 'Rico':{items:{superpotion:5}},
 'Revanchista':{items:{greatball:10}},
 'Rei da Torre':{items:{ultraball:5}},
 'Herói dos eventos':{money:10000},
 'Ajudante da cidade':{items:{superpotion:5}},
 'Herói de Kanto':{money:20000},
 'Rival à altura':{items:{ultraball:3}},
 'Equipe forte':{items:{fullheal:3}},
 'Nível máximo':{money:20000},
 'Bem equipado':{items:{potion:5}},
 'Com carinho':{items:{pokeball:5}},
 'Missão rara':{items:{ultraball:5}}
});
export function rewardLabel(reward){
 if(!reward)return '';
 const names={pokeball:'Poké Ball',greatball:'Great Ball',ultraball:'Ultra Ball',potion:'Poção',superpotion:'Super Poção',fullheal:'Cura Total'};
 const parts=Object.entries(reward.items||{}).map(([k,n])=>n+'× '+(names[k]||k));
 if(reward.money)parts.push('₽ '+Number(reward.money).toLocaleString('pt-BR'));
 return parts.join(' + ');
}
// Returns a NEW state with the reward applied (the caller saves it), or null.
export function claimAchievement(state,name){
 const reward=ACHIEVEMENT_REWARDS[name];
 if(!reward||list(state?.achievementClaims).includes(name))return null;
 const next=JSON.parse(JSON.stringify(state));
 next.achievementClaims=[...list(next.achievementClaims),name];
 next.inventory={...next.inventory};
 for(const [k,n] of Object.entries(reward.items||{}))next.inventory[k]=(Number.isInteger(next.inventory[k])?next.inventory[k]:0)+n;
 if(reward.money)next.money=(Number(next.money)||0)+reward.money;
 return next;
}

// Trainer code for the offline ranking: name, completions, titles, title.
const B64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function sum(str){let h=2166136261;for(const ch of str){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0}return h.toString(36).slice(-4).padStart(4,'0')}
function toB64(text){const bytes=new TextEncoder().encode(text);let out='',bits=0,acc=0;
 for(const b of bytes){acc=(acc<<8)|b;bits+=8;while(bits>=6){bits-=6;out+=B64[(acc>>bits)&63]}}
 if(bits)out+=B64[(acc<<(6-bits))&63];return out}
function fromB64(code){const bytes=[];let bits=0,acc=0;
 for(const ch of code){const v=B64.indexOf(ch);if(v<0)throw Error('bad');acc=(acc<<6)|v;bits+=6;if(bits>=8){bits-=8;bytes.push((acc>>bits)&255)}}
 return new TextDecoder().decode(new Uint8Array(bytes))}
export function encodeTrainerCode({name,completions,titles,activeTitle,gender}){
 const body=JSON.stringify({v:1,n:String(name||'Treinador').slice(0,12),c:Math.max(0,completions|0),
  t:Math.max(0,titles|0),a:activeTitle||null,g:gender==='leaf'?'leaf':'red'});
 const b=toB64(body);return 'T2-'+b+'-'+sum(b);
}
export function decodeTrainerCode(code){
 const m=String(code||'').trim().match(/^T2-([A-Za-z0-9_-]+)-([a-z0-9]{4})$/);
 if(!m||sum(m[1])!==m[2])return null;
 try{const d=JSON.parse(fromB64(m[1]));
  if(d?.v!==1||typeof d.n!=='string')return null;
  return {name:d.n.slice(0,12),completions:Math.max(0,d.c|0),titles:Math.max(0,d.t|0),
   activeTitle:titleById(d.a)?d.a:null,gender:d.g==='leaf'?'leaf':'red'};
 }catch{return null}
}
export function readRanking(storage=globalThis.localStorage){
 try{const r=JSON.parse(storage?.getItem?.(RANKING_KEY)||'[]');return list(r).filter(x=>x&&typeof x.name==='string').slice(0,50)}catch{return []}
}
export function saveRanking(entries,storage=globalThis.localStorage){
 try{storage?.setItem?.(RANKING_KEY,JSON.stringify(list(entries).slice(0,50)));return true}catch{return false}
}
// Add/replace a friend (same name = update). Never stores the player twice.
export function addFriend(entries,friend,selfName){
 if(!friend||friend.name===selfName)return list(entries);
 return [...list(entries).filter(e=>e.name!==friend.name),{...friend,addedAt:Date.now()}];
}
export function rankingRows(self,entries){
 return [{...self,self:true},...list(entries)].sort((a,b)=>b.completions-a.completions||b.titles-a.titles||a.name.localeCompare(b.name));
}
