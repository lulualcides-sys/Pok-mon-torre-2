import test from 'node:test';
import assert from 'node:assert/strict';
import {powerRating} from '../tools/pokearena/torre2-individuality.js';

const stats={level:50,hp:135,attack:120,defense:110,speed:105,types:['ELECTRIC']};
const base={uid:'power-rating-test',id:'pikachu',progression:{level:50},
 potential:{hp:15,atk:15,def:15},hiddenAbility:null,heldItem:null};

test('power rating is bounded from 0 to 100',()=>{
 const score=powerRating(base,stats);
 assert.ok(Number.isInteger(score));
 assert.ok(score>=0&&score<=100);
});

test('higher level and potential increase the rating',()=>{
 const high={...base,progression:{level:100},potential:{hp:31,atk:31,def:31}};
 const highStats={...stats,level:100,hp:stats.hp*(1+100/95)/(1+50/95)};
 assert.ok(powerRating(high,highStats)>powerRating(base,stats));
});

test('combat hidden ability and equipped battle item contribute to total power',()=>{
 const equipped={...base,hiddenAbility:'forca',heldItem:'choiceband'};
 assert.ok(powerRating(equipped,stats)>powerRating(base,stats));
});

test('an item for another species does not inflate the score',()=>{
 const invalid={...base,id:'raichu',heldItem:'lightball'};
 const without={...base,id:'raichu'};
 assert.equal(powerRating(invalid,stats),powerRating(without,stats));
});
