import test from 'node:test';
import assert from 'node:assert/strict';
import {gymInteriorHeading} from '../tools/pokearena/torre2-gym-interior.js';
import {GYM_ART_PROTECTED} from '../tools/pokearena/torre2-gym-stage-art.js';

const gyms=[
 ['Pewter','Brock','onix'],['Cerulean','Misty','starmie'],
 ['Vermilion','Lt. Surge','raichu'],['Celadon','Erika','vileplume'],
 ['Fuchsia','Koga','weezing'],['Saffron','Sabrina','alakazam'],
 ['Cinnabar','Blaine','arcanine'],['Viridian','Giovanni','rhyhorn']
];

test('all eight gym boss labels stay in the header, never on the central bridge',()=>{
 for(const [city,leader,ace] of gyms){
  const model=Object.freeze({city,leader,ace});
  const before=JSON.stringify(model),heading=gymInteriorHeading(model);
  assert.ok(heading.text.includes(leader.toUpperCase()));
  assert.ok(heading.text.includes(ace.toUpperCase()));
  assert.equal(heading.x,320);
  assert.ok(heading.y-heading.size/2>=0);
  assert.ok(heading.y+heading.size/2<40,'header stays above the boss platform');
  assert.ok(heading.text.length*heading.size*.8<640,'longest name fits 640px stage');
  const labelBounds=[heading.x-heading.text.length*heading.size*.4,
   heading.y-heading.size/2,heading.text.length*heading.size*.8,heading.size];
  for(const [x,y,w,h] of GYM_ART_PROTECTED){
   const overlap=labelBounds[0]<x+w&&labelBounds[0]+labelBounds[2]>x&&
    labelBounds[1]<y+h&&labelBounds[1]+labelBounds[3]>y;
   assert.equal(overlap,false,'heading cannot obscure boss or trainer paths');
  }
  assert.equal(JSON.stringify(model),before,'render metadata cannot alter campaign state');
 }
 assert.equal(gymInteriorHeading(null),null);
});
