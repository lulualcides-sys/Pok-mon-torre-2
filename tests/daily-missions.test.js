import test from 'node:test';
import assert from 'node:assert/strict';
import {dayKey,missionsFor,ensureDaily,missionProgress,claimDaily,DAILY_BONUS} from '../tools/pokearena/torre2-daily-missions.js';
const base=()=>({wins:10,team:[{id:'bulbasaur',uid:'a'}],box:[],dexSeen:['bulbasaur'],rematches:{wins:0},inventory:{pokeball:1,greatball:0,ultraball:0,potion:0,superpotion:0,tms:[]},money:100});
test('same three missions for the same day, different on other days',()=>{
 assert.equal(dayKey(new Date(2026,10,20)),'2026-11-20');
 assert.deepEqual(missionsFor('2026-11-20'),missionsFor('2026-11-20'));
 assert.equal(missionsFor('2026-11-20').length,3);
 assert.notDeepEqual(missionsFor('2026-11-20').map(m=>m.kind+m.goal),missionsFor('2026-11-21').map(m=>m.kind+m.goal));
});
test('progress counts only what happened since the day started; claim once',()=>{
 let s=ensureDaily(base(),'2026-11-20');
 s={...s,daily:{...s.daily,missions:[{id:'x0',kind:'wins',goal:3,reward:{items:{pokeball:5}}},{id:'x1',kind:'captureType',goal:1,type:'FIRE',reward:{money:1500}},{id:'x2',kind:'dexSeen',goal:2,reward:{items:{greatball:3}}}]}};
 const typesOf=id=>id==='vulpix'?['FIRE']:['WATER'];
 assert.equal(missionProgress(s,s.daily.missions[0]),0);
 s={...s,wins:12,team:[...s.team,{id:'psyduck',uid:'b'},{id:'vulpix',uid:'c'}],dexSeen:['bulbasaur','psyduck','vulpix']};
 assert.equal(missionProgress(s,s.daily.missions[0]),2);
 assert.equal(missionProgress(s,s.daily.missions[1],typesOf),1);
 assert.equal(claimDaily(s,'x0'),null,'not finished yet');
 const c=claimDaily(s,'x1',typesOf);assert.equal(c.money,1600);
 assert.equal(claimDaily(c,'x1',typesOf),null,'claimed once');
 s={...c,wins:13};
 const all=claimDaily(claimDaily(s,'x0',typesOf),'x2',typesOf);
 const bonus=claimDaily(all,'bonus',typesOf);
 assert.equal(bonus.inventory.ultraball,DAILY_BONUS.items.ultraball);
 assert.equal(claimDaily(bonus,'bonus',typesOf),null);
});
test('a new day resets missions and baseline',()=>{
 const s=ensureDaily(base(),'2026-11-20');
 assert.strictEqual(ensureDaily(s,'2026-11-20'),s);
 const t=ensureDaily({...s,wins:20},'2026-11-21');
 assert.equal(t.daily.day,'2026-11-21');assert.equal(t.daily.baseline.wins,20);assert.deepEqual(t.daily.claimed,[]);
});
