import test from 'node:test';
import assert from 'node:assert/strict';
import {STORY,LEADERS,SPEAKERS,storyFor,storyCrop,markStorySeen,matchup} from '../tools/pokearena/torre2-story.js';
import fs from 'node:fs';
// Stage leaders/types straight from the campaign source (core imports build-time names).
const SRC=fs.readFileSync(new URL('../tools/pokearena/torre2-campaign-core.js',import.meta.url),'utf8');
const STAGES=[...SRC.matchAll(/leader:'([^']+)',badge:'[^']+',arena:'[a-z]+',type:'([A-Z]+)'/g)].map(m=>({leader:m[1],type:m[2]}));
test('one story scene per Rival/Rocket stage, shown once',()=>{
 assert.deepEqual(Object.keys(STORY).sort(),['rival-0','rival-1','rival-2','rival-4','rival-5','rival-8','rocket-1','rocket-3','rocket-5','rocket-7'].sort());
 const s={stage:1};
 assert.equal(storyFor(s,{kind:'rocket'}).place,'Mt. Moon');
 assert.equal(storyFor(s,{kind:'trainer'}),null);
 assert.equal(storyFor({stage:6},{kind:'rival'}),null,'no scene where FireRed has none');
 const seen=markStorySeen(s,'rocket-1');
 assert.equal(storyFor(seen,{kind:'rocket'}),null);
 assert.equal(storyFor(seen,{kind:'rival',id:'wartortle'}).key,'rival-1');
});
test('the Rival names his real starter',()=>{
 const sc=storyFor({stage:0},{kind:'rival',id:'squirtle'});
 assert.match(sc.lines.at(-1)[1],/Squirtle/);
 assert.ok(sc.lines.every(([,t])=>!t.includes('{')));
});
test('every gym, Elite Four and Champion stage has a leader scene',()=>{
 assert.equal(LEADERS.length,STAGES.length);
 LEADERS.forEach((L,i)=>{
  assert.ok(SPEAKERS[L.who],L.who);
  if(i<12)assert.equal(L.type,STAGES[i].type,'leader type matches the stage');
  assert.ok(L.intro.length>=2&&L.retry.length>=2);
 });
});
test('leaders react to the player lead type and change after a loss',()=>{
 const brock={kind:'leader',leader:true,id:'onix'};
 assert.equal(matchup('ROCK',['WATER']),'strong');
 assert.equal(matchup('ROCK',['FIRE']),'weak');
 assert.equal(matchup('ROCK',['NORMAL']),'neutral');
 const strong=storyFor({stage:0},brock,{leadTypes:['GRASS','POISON']});
 const weak=storyFor({stage:0},brock,{leadTypes:['FIRE']});
 const neutral=storyFor({stage:0},brock,{leadTypes:['NORMAL']});
 assert.equal(strong.speaker,'brock');
 assert.equal(strong.lines.length,neutral.lines.length+1);
 assert.notEqual(strong.lines.at(-1)[1],weak.lines.at(-1)[1]);
 const after=markStorySeen({stage:0,losses:0},strong.key);
 const r0=storyFor(after,brock),r1=storyFor({...after,losses:1},brock);
 assert.equal(r0.lines.length,1);assert.notEqual(r0.lines[0][1],r1.lines[0][1]);
 const champ=storyFor({stage:12},{kind:'leader',leader:true,id:'blastoise'},{leadTypes:['GRASS']});
 assert.equal(champ.speaker,'rival');assert.match(champ.lines.at(-1)[1],/Blastoise/);
});
test('every line fits the FireRed box',()=>{
 const all=[...Object.values(STORY).flatMap(s=>s.lines.map(l=>l[1])),
  ...LEADERS.flatMap(L=>[...L.intro,...L.retry,L.strong||'',L.weak||''])];
 for(const t of all)assert.ok(t.length<90,t);
});
test('every scene has a FireRed place behind it (16:9 slice of a real sheet)',()=>{
 const SHEETS=['pewter','cerulean','vermilion','celadon','fuchsia','saffron','cinnabar','viridian','indigo',
  'route24','ssanne','pokemontower','silph','mtmoon','rockethideout'];
 for(const bg of [...Object.values(STORY).map(s=>s.bg),...LEADERS.map(L=>L.bg)]){
  if(bg.art)assert.ok(fs.existsSync(new URL('../tools/pokearena/campaign-art/'+bg.art+'.png',import.meta.url)),bg.art);
  else assert.ok(SHEETS.includes(bg.loc),bg.loc);
  const c=storyCrop(bg).crop;
  assert.ok(Math.abs(c[2]/c[3]-16/9)<.02,'16:9 '+(bg.loc||bg.art));
  assert.ok(c[0]>=0&&c[1]>=0,'inside the sheet '+bg.loc);
  if(bg.rect)assert.ok(c[0]>=bg.rect[0]&&c[1]>=bg.rect[1]&&c[0]+c[2]<=bg.rect[0]+bg.rect[2]&&c[1]+c[3]<=bg.rect[1]+bg.rect[3],'inside the room '+bg.loc);
  // Feet anchors: the two figures land exactly on the chosen floor points.
  // (crop rounded to whole map pixels: within one map pixel on screen)
  if(bg.feet){const k=640/c[2];
   assert.ok(Math.abs((bg.feet[0]-c[0])*k-200)<=k&&Math.abs((bg.feet[0]+bg.d-c[0])*k-440)<=k,'figures x '+bg.loc);
   assert.ok(Math.abs((bg.feet[1]-c[1])*k-238)<=k,'figures feet y '+bg.loc);}
 }
 assert.equal(storyFor({stage:3},{kind:'leader',leader:true,id:'vileplume'}).bg.loc,'celadon');
});
test('Giovanni speaks in his own office (owner art); Silph Rocket stays on 11F',()=>{
 const g=storyFor({stage:7},{kind:'leader',leader:true,id:'rhyhorn'});
 assert.equal(g.speaker,'giovanni');assert.equal(g.bg.art,'silph-office');
 const [x,y,w,h]=g.bg.crop;assert.ok(x>=0&&y>=0&&x+w<=835&&y+h<=470,'inside the 835x470 office art');
 assert.equal(storyFor({stage:5},{kind:'rocket',id:'koffing'}).bg.loc,'silph');
});
