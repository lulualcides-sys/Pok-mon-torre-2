import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../tools/pokearena/torre2-legacy.js';

const run=(over={})=>({starter:'bulbasaur',team:[{id:'ivysaur',uid:'bulbasaur-abc'}],box:[],dexCaught:['bulbasaur'],dexShinyCaught:[],losses:2,champion:false,...over});
function mem(){const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),m}}

test('a journey counts once as a completion, and titles survive a reset',()=>{
 let l=L.emptyLegacy();
 ({legacy:l}=L.syncLegacy(run({champion:true}),l));
 ({legacy:l}=L.syncLegacy(run({champion:true}),l)); // same run again
 assert.equal(l.championRuns.length,1);
 assert.ok(l.titles.champion);
 // A new journey (new starter UID) after "Reiniciar jornada" adds a second completion.
 const second=L.syncLegacy(run({champion:true,team:[{id:'ivysaur',uid:'bulbasaur-zzz'}]}),l);
 assert.equal(second.legacy.championRuns.length,2);
 assert.ok(second.earned.some(t=>t.id==='bichampion'));
 // A fresh journey (no champion yet) keeps every earned title.
 assert.ok(L.syncLegacy(run(),second.legacy).legacy.titles.champion);
 const s=mem();L.saveLegacy(second.legacy,s);s.removeItem('pokemon-torre-2-kanto-campaign-v1');
 assert.equal(L.readLegacy(s).championRuns.length,2);
});

test('hard titles: flawless, shiny hunter, Mew',()=>{
 const {legacy}=L.syncLegacy(run({champion:true,losses:0,dexShinyCaught:['pikachu'],dexCaught:['mew']}),L.emptyLegacy());
 for(const id of ['flawless','shiny1','mew'])assert.ok(legacy.titles[id],id);
});

test('achievement rewards are claimed once and keep the save valid',()=>{
 const s={inventory:{pokeball:1,greatball:0,ultraball:0,potion:0,superpotion:0,tms:[]},money:100};
 const a=L.claimAchievement(s,'Meio caminho');
 assert.equal(a.inventory.ultraball,3);assert.equal(a.money,3100);
 assert.equal(L.claimAchievement(a,'Meio caminho'),null,'second claim refused');
 assert.equal(s.money,100,'original state untouched');
 assert.equal(L.claimAchievement(s,'Inexistente'),null);
});

test('trainer code round-trips and rejects tampering',()=>{
 const code=L.encodeTrainerCode({name:'Ash',completions:4,titles:6,activeTitle:'legend',gender:'red'});
 assert.match(code,/^T2-[A-Za-z0-9_-]+-[a-z0-9]{4}$/);
 assert.deepEqual(L.decodeTrainerCode(code),{name:'Ash',completions:4,titles:6,activeTitle:'legend',gender:'red'});
 const bad=code.slice(0,-1)+(code.endsWith('a')?'b':'a');
 assert.equal(L.decodeTrainerCode(bad),null);
 assert.equal(L.decodeTrainerCode('qualquer coisa'),null);
});

test('ranking orders by completions and updates a friend by name',()=>{
 let friends=L.addFriend([], {name:'Misty',completions:2,titles:3},'Ash');
 friends=L.addFriend(friends,{name:'Misty',completions:3,titles:3},'Ash');
 friends=L.addFriend(friends,{name:'Ash',completions:9,titles:9},'Ash'); // never self
 assert.equal(friends.length,1);
 const rows=L.rankingRows({name:'Ash',completions:4,titles:6},friends);
 assert.deepEqual(rows.map(r=>r.name),['Ash','Misty']);
 assert.equal(rows[0].self,true);
});
