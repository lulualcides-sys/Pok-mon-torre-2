import test from 'node:test';
import assert from 'node:assert/strict';
import {LEGENDARIES,legendaryStatus,legendaryEncounter,legendaryLevel,markLegendaryDefeated,legendaryById,LEGENDARY_RETURN_WINS}
 from '../tools/pokearena/torre2-legendaries.js';

const base=(o={})=>({stage:3,trainer:0,badges:['Rocha','Cascata','Trovao'],dexCaught:[],wins:30,champion:false,...o});

test('five legendaries in their own places, never in tall grass',()=>{
 assert.deepEqual(LEGENDARIES.map(l=>l.id),['zapdos','articuno','moltres','mewtwo','mew']);
 assert.deepEqual(LEGENDARIES.map(l=>l.scene),['powerplant','seafoam','ember','cave','faraway']);
});

test('unlock order: badges, then the League, then Mew after the other four',()=>{
 assert.equal(legendaryStatus(base({badges:['Rocha','Cascata']}),'zapdos').state,'locked');
 assert.equal(legendaryStatus(base(),'zapdos').state,'available');
 assert.equal(legendaryStatus(base(),'articuno').state,'locked');
 assert.equal(legendaryStatus(base(),'mewtwo').state,'locked');
 const champ=base({champion:true,stage:13,badges:Array(8).fill('x')});
 assert.equal(legendaryStatus(champ,'mewtwo').state,'available');
 assert.equal(legendaryStatus(champ,'mew').state,'locked');
 assert.equal(legendaryStatus({...champ,dexCaught:['zapdos','articuno','moltres','mewtwo']},'mew').state,'available');
 assert.equal(legendaryStatus({...champ,dexCaught:['zapdos']},'zapdos').state,'caught');
});

test('battle level: real level after the League, at most cap+3 before',()=>{
 const z=legendaryById('zapdos');
 assert.equal(legendaryLevel(base(),z,29),32);
 assert.equal(legendaryLevel(base(),z,60),50);
 assert.equal(legendaryLevel(base({champion:true}),legendaryById('mewtwo'),63),70);
});

test('encounter is a single wild battle flagged legendary, with a 1% shiny roll',()=>{
 const e=legendaryEncounter(base(),'zapdos',29,()=>.5);
 assert.deepEqual({id:e.id,level:e.level,legendary:e.legendary,shiny:e.shiny,arena:e.arena,stage:e.stage},
  {id:'zapdos',level:32,legendary:true,shiny:false,arena:'neon',stage:3});
 assert.equal(legendaryEncounter(base(),'zapdos',29,()=>.001).shiny,true);
 assert.equal(legendaryEncounter(base(),'articuno',29),null,'locked legendary has no encounter');
});

test('knocked out: gone until the League; after the League, 10 more wins',()=>{
 const s=base();
 const gone={...s,legendaryDefeated:markLegendaryDefeated(s,'zapdos')};
 assert.equal(legendaryStatus(gone,'zapdos').state,'gone');
 assert.equal(legendaryStatus({...gone,champion:true},'zapdos').state,'available');
 const c=base({champion:true,stage:13,badges:Array(8).fill('x'),wins:80});
 const gone2={...c,legendaryDefeated:markLegendaryDefeated(c,'mewtwo')};
 assert.equal(legendaryStatus(gone2,'mewtwo').state,'gone');
 assert.equal(legendaryStatus({...gone2,wins:80+LEGENDARY_RETURN_WINS},'mewtwo').state,'available');
});

import {silphStatus,silphTeam,SILPH_GIOVANNI} from '../tools/pokearena/torre2-legendaries.js';
test('Silph Co.: opens in Saffron, gives the Master Ball once, FireRed team scaled to the cap',()=>{
 assert.equal(silphStatus({stage:4}).state,'locked');
 assert.equal(silphStatus({stage:5}).state,'available');
 assert.equal(silphStatus({stage:13,champion:true}).state,'available');
 assert.equal(silphStatus({stage:6,masterBallGiven:true}).state,'done');
 assert.deepEqual(silphTeam({stage:5},43).map(m=>m.id+':'+m.level),['nidorino:37','kangaskhan:35','rhyhorn:37','nidoqueen:41']);
 assert.deepEqual(silphTeam({stage:7},50).map(m=>m.level),[44,42,44,48]);
 assert.equal(SILPH_GIOVANNI.money,3000);
});
