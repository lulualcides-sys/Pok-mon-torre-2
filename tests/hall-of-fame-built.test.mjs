import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const stage=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const ver=JSON.parse(fs.readFileSync(path.join(stage,'version.json'),'utf8')).modules;
const {hallOfFameModel,HALL_GYM_BADGES,HALL_LEAGUE_AWARDS}=await import(
 pathToFileURL(path.join(stage,ver,'torre2/hall-of-fame.js')).href);
const member=(id,lvl=50)=>({id,uid:id+'-1',hp:80,
 progression:{species:id,level:lvl}});
function state(){
 return {stage:13,champion:true,
  badges:[...HALL_GYM_BADGES],leagueHonors:[...HALL_LEAGUE_AWARDS],
  wins:200,losses:3,money:15200,
  team:[member('charizard',56),member('pikachu',52),member('mewtwo',50)]};
}
test('Hall is locked until resolver actually sets completed Champion flag/stage',()=>{
 const s=state();s.champion=false;assert.equal(hallOfFameModel(s),null);
 s.champion=true;s.stage=12;assert.equal(hallOfFameModel(s),null);
 s.stage=13;assert.equal(hallOfFameModel(s)?.complete,true);
});
test('Hall shows real six-member team, earned badges and honors, not invented records',()=>{
 const s=state();s.badges.pop();s.leagueHonors.pop();
 s.team.push(member('lapras',51),member('gyarados',55),
  member('raichu',58),member('snorlax',58));
 const before=JSON.stringify(s),h=hallOfFameModel(s);
 assert.equal(h.team.length,6);
 assert.equal(h.badgeCount,7);assert.equal(h.honorCount,4);
 assert.equal(h.complete,false,'Missing honors cannot be fabricated');
 assert.deepEqual(h.team.map(m=>m.id),s.team.slice(0,6).map(m=>m.id));
 assert.equal(JSON.stringify(s),before,'Hall is strictly read-only');
});
test('Hall does not grant XP, money, badge, TM, duplicate victory or heal a Pokémon',()=>{
 const s=state();s.team[0].hp=23;
 const before=JSON.stringify(s);
 for(let i=0;i<8;i++)hallOfFameModel(s);
 assert.equal(JSON.stringify(s),before);
 assert.equal(hallOfFameModel(s).team[0].hp,23);
});
test('Hall safely renders legacy completed saves without a full active party',()=>{
 const s=state();s.team=[];s.leagueHonors=undefined;s.badges=undefined;
 const m=hallOfFameModel(s);
 assert.equal(m.complete,false);assert.equal(m.team.length,0);
 assert.equal(m.honorCount,0);assert.equal(m.badgeCount,0);
});
