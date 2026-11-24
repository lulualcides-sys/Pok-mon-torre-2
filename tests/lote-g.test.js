// Lote G (owner 2026-11-24): impossible daily missions, trainer-only battle
// record, the trainer walking with its Pokémon, more end-of-battle lines,
// more achievements, MAIS navigation, PC box summary and the new-journey
// name + look steps.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {missionsFor,ensureDaily,missionProgress,feasibleKind} from '../tools/pokearena/torre2-daily-missions.js';
import {facingToward,endLine,END_LINES} from '../tools/pokearena/torre2-arena-follow.js';
import {ACHIEVEMENT_REWARDS} from '../tools/pokearena/torre2-legacy.js';
const read=f=>fs.readFileSync(new URL('../tools/pokearena/'+f,import.meta.url),'utf8');

test('daily missions only ask what the player can do where they are',()=>{
 const ctx={types:['NORMAL','BUG','FLYING','GRASS','POISON','ELECTRIC'],rematch:false};
 for(let d=1;d<=60;d++){
  const key='2026-12-'+String(d%28+1).padStart(2,'0')+'x'+d;
  for(const m of missionsFor(key,ctx)){
   assert.notEqual(m.kind,'rematch',key);
   if(m.kind==='captureType')assert.ok(ctx.types.includes(m.type),key+' '+m.type);
  }
  assert.equal(missionsFor(key,ctx).length,3);
 }
 assert.equal(feasibleKind({kind:'captureType'},{types:[]}),false);
 assert.equal(feasibleKind({kind:'captureType'},null),true);
});
test('a stored impossible mission is rebuilt today only when nothing was claimed',()=>{
 const base={wins:4,team:[{uid:'a',id:'squirtle'}],box:[],dexSeen:['squirtle']};
 const day='2026-11-24';
 const bad={...base,daily:{day,baseline:{wins:4,uids:['a'],dexSeen:1,rematchWins:0},claimed:[],bonus:false,
  missions:[{id:day+'-0',kind:'captureType',goal:1,type:'PSYCHIC',text:'x',reward:{money:1}},{id:day+'-1',kind:'wins',goal:3,text:'y',reward:{money:1}},{id:day+'-2',kind:'captures',goal:1,text:'z',reward:{money:1}}]}};
 const ctx={types:['BUG','NORMAL'],rematch:true};
 const fixed=ensureDaily(bad,day,ctx);
 assert.notEqual(fixed,bad);
 assert.ok(!fixed.daily.missions.some(m=>m.kind==='captureType'&&!ctx.types.includes(m.type)));
 assert.deepEqual(fixed.daily.baseline,bad.daily.baseline,'progress baseline kept');
 const claimed={...bad,daily:{...bad.daily,claimed:[day+'-1']}};
 assert.equal(ensureDaily(claimed,day,ctx),claimed,'never rebuilt after a claim');
});
test('daily "wins" counts trainer battles only',()=>{
 const s0={wins:10,wildWins:4,team:[],box:[],dexSeen:[]};
 const d=ensureDaily(s0,'2026-11-25');
 const m={kind:'wins',goal:5};
 assert.equal(missionProgress({...d,wins:13,wildWins:7},m),0,'three wild wins do not count');
 assert.equal(missionProgress({...d,wins:13,wildWins:4},m),3);
 assert.match(missionsFor('2026-11-25').map(x=>x.text).join(' '),/./);
});
test('campaign core keeps wild results apart for the Trainer Card',()=>{
 const core=read('torre2-campaign-core.js');
 assert.match(core,/next\.wins\+\+;next\.wildWins=\(Number\(next\.wildWins\)\|\|0\)\+1;/);
 assert.match(core,/next\.losses\+\+;next\.wildLosses=/);
 assert.match(core,/export function trainerRecord\(s\)/);
 const scene=read('torre2-campaign-scene.js');
 assert.match(scene,/\['Batalhas',trainerRecord\(state\)\.wins/);
 assert.doesNotMatch(scene,/\['Vitórias',\(state\.wins\|\|0\)/);
});
test('the trainer stays in place and only turns to watch its Pokémon',()=>{
 assert.equal(facingToward({x:0,y:0},{x:80,y:10}),'side-right');
 assert.equal(facingToward({x:0,y:0},{x:-80,y:10}),'side-left');
 assert.equal(facingToward({x:0,y:0},{x:10,y:90}),'front');
 assert.equal(facingToward({x:0,y:0},{x:10,y:-90}),'back');
 assert.equal(facingToward({x:0,y:0},{x:3,y:3},'back'),'back','dead zone keeps facing');
 const at=read('torre2-arena-trainers.js');
 assert.match(at,/scene\.events\.on\('update',walk\)/);
 assert.doesNotMatch(at,/followStep/);
 assert.match(at,/Only the facing frame changes, never the position/);
});
test('ten end-of-battle lines for each side and result',()=>{
 for(const k of ['playerWin','playerLose','foeWin','foeLose']){
  assert.ok(END_LINES[k].length>=10,k);assert.equal(new Set(END_LINES[k]).size,END_LINES[k].length);
  assert.equal(endLine(k,()=>0),END_LINES[k][0]);assert.equal(endLine(k,()=>.9999),END_LINES[k].at(-1));
 }
});
test('more achievements, each with a reward, counting trainer wins',()=>{
 const scene=read('torre2-campaign-scene.js');
 const names=[...scene.matchAll(/\['([^']+)','[^']+',[^\]]+\],?\n/g)].map(m=>m[1]);
 for(const n of ['Centenário','Treinador de elite','Explorador','Lendário','Mestre lendário','Rei da Torre','Ajudante da cidade','Nível máximo','Com carinho'])
  assert.ok(ACHIEVEMENT_REWARDS[n],n+' has a reward');
 assert.match(scene,/const wins=trainerRecord\(state\)\.wins/);
 assert.match(scene,/achievementsScreen\(state,page=0\)/);
 assert.ok(Object.keys(ACHIEVEMENT_REWARDS).length>=33);
 assert.ok(names.length>0);
});
test('MAIS: back returns to MAIS, CAPTURA on the bar, Lendários with the Master Ball',()=>{
 const cards=read('torre2-trainer-cards.js'),scene=read('torre2-campaign-scene.js');
 assert.match(cards,/scene\.__torre2BackToExtras=back/);
 assert.match(scene,/if\(this\.__torre2BackToExtras\)\{this\.__torre2BackToExtras=false;extrasPage\(this,state,handlers\)\}/);
 assert.doesNotMatch(cards,/\['CAPTURA',handlers\.capture/);
 assert.match(cards,/control\(scene,layer,344,324,70,30,'CAPTURA'/);
 assert.match(cards,/control\(scene,layer,418,324,70,30,'MAIS'/);
 assert.match(cards,/\['LENDÁRIOS',handlers\.legendaries,'masterball'\]/);
 assert.match(cards,/originalBallSprite\(scene,x,y,'masterball'/);
 assert.match(cards,/torre2-empty-slot-ball/);
});
test('new journey: Oak, required name, look (only here), then the starter',()=>{
 const scene=read('torre2-campaign-scene.js');
 assert.match(scene,/this\.introNameScreen\(\);\n  \},true,10\)\.setData\('torre2-oak-continue',true\)/);
 assert.match(scene,/if\(!name\)\{error\.setVisible\(true\)/);
 assert.match(scene,/this\.lookScreen\(null,null,\{intro:true\}\)/);
 assert.match(scene,/this\.__torre2OakIntroSeen=true;this\.children\.removeAll\(true\);this\.starterSelection\(\)/);
 assert.doesNotMatch(scene,/'VISUAL',\(\)=>this\.lookScreen/);
});
test('PC box Pokémon have a read-only Summary; city missions warn when ready',()=>{
 const scene=read('torre2-campaign-scene.js');
 assert.match(scene,/boxSummary\(state,boxIndex,pcPage=0\)\{/);
 assert.match(scene,/'VER',\(\)=>this\.boxSummary\(state,actualIndex,safePage\)/);
 assert.match(scene,/Missão da cidade concluída/);
 assert.match(scene,/readyAnnounced/);
});
test('points shop: 16 items with sprites, specific held items and money',async()=>{
 const {POINT_SHOP,buyWithPoints}=await import('../tools/pokearena/torre2-daily-missions.js');
 const {HELD_ITEMS}=await import('../tools/pokearena/torre2-individuality.js');
 assert.ok(POINT_SHOP.length>=16);
 for(const it of POINT_SHOP){assert.ok(it.icon&&it.desc&&it.cost>0,it.id);if(it.held)assert.ok(HELD_ITEMS[it.held],it.held)}
 const s={missionPoints:300,money:100,inventory:{held:{}},pointShopBought:[]};
 const a=buyWithPoints(s,'leftovers',Math.random,Object.keys(HELD_ITEMS));
 assert.equal(a.inventory.held.leftovers,1);assert.equal(a.missionPoints,210);
 const m=buyWithPoints(s,'money5k');assert.equal(m.money,5100);assert.equal(m.missionPoints,265);
 const k=buyWithPoints(s,'status10');assert.equal(k.inventory.antidote,2);assert.equal(k.inventory.iceheal,2);
 const scene=read('torre2-campaign-scene.js');
 assert.match(scene,/pointShopScreen\(state,page=0\)\{/);
 assert.match(scene,/const x=18\+\(i%3\)\*204,y=92\+Math\.floor\(i\/3\)\*70/);
});
test('challenges: reward shown, won once, prizes grow with the map',async()=>{
 const {ALL_EVENTS,eventStatus,rewardTier}=await import('../tools/pokearena/torre2-battle-events.js');
 const {EVENT_ITEMS,HELD_ITEMS}=await import('../tools/pokearena/torre2-individuality.js');
 for(const ev of ALL_EVENTS){assert.ok(HELD_ITEMS[EVENT_ITEMS[ev.id]],ev.id+' gives a battle item');assert.ok(ev.reward.money>=2000)}
 const lvl=ev=>ev.champion?9:ev.minBadges;
 const sorted=[...ALL_EVENTS].sort((a,b)=>lvl(a)-lvl(b));
 for(let i=1;i<sorted.length;i++)if(lvl(sorted[i])>lvl(sorted[i-1]))assert.ok(sorted[i].reward.money>=sorted[i-1].reward.money,sorted[i].id);
 assert.equal(rewardTier(ALL_EVENTS.find(e=>e.id==='e1')),'MÉDIO');assert.equal(rewardTier(ALL_EVENTS.find(e=>e.id==='k5')),'ÉPICO');
 const won={badges:['a','b'],events3x3:{won:['e1']}};
 assert.equal(eventStatus(won,ALL_EVENTS[0]).state,'won');
 const core=read('torre2-campaign-core.js'),scene=read('torre2-campaign-scene.js');
 assert.match(core,/if\(st\.state==='won'\)return \{ok:false,reason:'Você já venceu este desafio\.'\}/);
 assert.match(scene,/if\(st\.state==='open'\)this\.button\(x\+150,y\+104,90,18,'LUTAR'/);
 assert.match(scene,/eventRewardPanel\(g,ev,x\+48,y\+35,148/);
});
