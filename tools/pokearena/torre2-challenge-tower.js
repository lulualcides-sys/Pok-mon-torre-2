/* Pokémon Torre 2 — Torre de desafios (owner list 2026-11-20, item 14).
 * Pure rules (no Phaser). Floors of trainers in a row; the team is NOT healed
 * between floors (the campaign's own HP/status carry over). Leaving, losing
 * or healing the team ends the run; the best floor is kept. Every 5 floors
 * gives a reward. A separate battle: it never moves the trainer ladder.
 * Opponents fight with untouched kits (same loadout rules as the campaign).
 */
export const TOWER_UNLOCK_BADGES=1;
export const TOWER_REWARD_EVERY=5;
// Rewards cycle every 25 floors (5 milestones), money grows with the cycle.
export const TOWER_REWARDS=Object.freeze([
 {money:1500,items:{greatball:3}},
 {money:2500,items:{superpotion:3}},
 {money:3500,items:{ultraball:3}},
 {money:4500,items:{fullheal:3}},
 {money:6000,items:{ultraball:5}}
]);
const list=v=>Array.isArray(v)?v:[];
export const TOWER_ITEM_NAMES=Object.freeze({greatball:'Great Ball',ultraball:'Ultra Ball',superpotion:'Super Poção',fullheal:'Cura Total'});
const LEGENDS=new Set(['articuno','zapdos','moltres','mewtwo','mew','lugia','hooh']);
export function towerStatus(s){
 const badges=list(s?.badges).length;
 if(!s?.champion&&badges<TOWER_UNLOCK_BADGES)return {state:'locked',reason:'Ganhe a 1ª insígnia para entrar.'};
 return {state:'open',reason:''};
}
export function towerRun(s){const t=s?.tower;return t&&t.active?t:null}
export function towerBest(s){return Math.max(0,Number(s?.tower?.best)||0)}
// Sum of the team's HP percentages: if it goes UP between floors the team was
// healed outside the tower, which ends the run.
export function teamHpMark(s){
 return list(s?.team).reduce((a,m)=>a+Math.max(0,Math.min(100,Number(m?.hp??100)||0)),0);
}
// Small deterministic RNG (per run seed and floor).
function rng(seed){let x=(seed>>>0)||1;return ()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296}}
// pool: species the engine can field (campaign-core supplies it).
// cap: the campaign level cap of the current stage.
export function towerFloor(seed,floor,pool,cap){
 const f=Math.max(1,Math.floor(Number(floor)||1));
 const species=list(pool).filter(id=>!LEGENDS.has(id));
 if(!species.length)return null;
 const r=rng((Number(seed)||1)*7919+f*104729);
 const size=Math.min(3,1+Math.floor((f-1)/4));
 const top=Math.max(5,Math.min(100,(Number(cap)||20)+5));
 const level=Math.max(5,Math.min(top,(Number(cap)||20)-6+Math.floor(f*.7)));
 const team=[];
 while(team.length<size){const id=species[Math.floor(r()*species.length)];if(!team.some(m=>m.id===id))team.push({id,level:Math.min(top,level+team.length)})}
 const classes=['ace','blackbelt','psychic','swimmer','hiker','biker','scientist','gentleman','camper','picnicker','rocker','sailor','lass','channeler'];
 return {floor:f,team,trainer:classes[Math.floor(r()*classes.length)],boss:f%TOWER_REWARD_EVERY===0};
}
export function towerReward(floor){
 const f=Math.floor(Number(floor)||0);
 if(f<=0||f%TOWER_REWARD_EVERY)return null;
 const k=f/TOWER_REWARD_EVERY-1,cycle=Math.floor(k/TOWER_REWARDS.length),base=TOWER_REWARDS[k%TOWER_REWARDS.length];
 return {money:base.money+cycle*2000,items:{...base.items}};
}
// --- run lifecycle (return new state objects; the caller saves) -------------
export function startTowerRun(s,seed=Date.now()){
 const st=towerStatus(s);if(st.state!=='open')return {ok:false,reason:st.reason};
 const t={active:true,floor:1,seed:Math.floor(Number(seed)||1)%2147483647||1,best:towerBest(s),
  hpMark:teamHpMark(s),token:null,started:Date.now()};
 return {ok:true,state:{...s,tower:t}};
}
// Before each floor: a heal since the last floor ends the run.
export function towerCheckHeal(s){
 const t=towerRun(s);if(!t)return {ok:false,reason:'Nenhuma sequência ativa.'};
 if(teamHpMark(s)>t.hpMark+.001)return {ok:false,healed:true,state:endTowerRun(s,'Você curou a equipe fora da Torre: a sequência terminou.')};
 return {ok:true};
}
export function endTowerRun(s,message){
 const t=s?.tower||{};
 const reached=Math.max(0,(Number(t.floor)||1)-1);
 return {...s,tower:{active:false,best:Math.max(towerBest(s),reached),last:reached},
  lastMessage:message||('Torre de desafios: você chegou ao andar '+reached+'.')};
}
export function towerToken(s){return 'tower-'+(s?.tower?.seed||0)+'-'+(s?.tower?.floor||0)}
// After a floor battle. hpMark is taken from the state AFTER the battle HP
// was applied. Returns {state, won, reward, message}.
export function resolveTowerFloor(s,token,won){
 const t=towerRun(s);
 if(!t||token!==towerToken(s))return {ok:false,reason:'Resultado antigo da Torre ignorado.'};
 if(!won){const next=endTowerRun(s,'Derrota no andar '+t.floor+'. Melhor marca: andar '+Math.max(towerBest(s),t.floor-1)+'.');
  return {ok:true,won:false,state:next,message:next.lastMessage}}
 const reward=towerReward(t.floor);
 const inventory={...(s.inventory||{})};
 if(reward)for(const [k,v] of Object.entries(reward.items))inventory[k]=(Number(inventory[k])||0)+v;
 const cleared=t.floor;
 const next={...s,inventory,money:(Number(s.money)||0)+(reward?.money||0),
  tower:{...t,floor:cleared+1,best:Math.max(towerBest(s),cleared),hpMark:teamHpMark(s)},
  lastMessage:'Andar '+cleared+' vencido!'+(reward?' Prêmio: $'+reward.money+' e '+Object.entries(reward.items).map(([k,v])=>v+'× '+(TOWER_ITEM_NAMES[k]||k)).join(', ')+'.':'')};
 return {ok:true,won:true,state:next,reward,message:next.lastMessage};
}
