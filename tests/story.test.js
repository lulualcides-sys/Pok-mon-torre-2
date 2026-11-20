import test from 'node:test';
import assert from 'node:assert/strict';
import {STORY,storyFor,markStorySeen} from '../tools/pokearena/torre2-story.js';
test('one story scene per Rival/Rocket stage, shown once',()=>{
 assert.deepEqual(Object.keys(STORY).sort(),['rival-0','rival-1','rival-2','rival-4','rival-5','rival-8','rocket-1','rocket-3','rocket-5','rocket-7'].sort());
 const s={stage:1};
 assert.equal(storyFor(s,{kind:'rocket'}).place,'Mt. Moon');
 assert.equal(storyFor(s,{kind:'trainer'}),null);
 assert.equal(storyFor({stage:6},{kind:'rival'}),null,'no scene where FireRed has none');
 const seen=markStorySeen(s,'rocket-1');
 assert.equal(storyFor(seen,{kind:'rocket'}),null);
 assert.equal(storyFor(seen,{kind:'rival'}).key,'rival-1');
 for(const sc of Object.values(STORY))for(const [who,text] of sc.lines){assert.ok(['rival','rocket'].includes(who));assert.ok(text.length<90,text)}
});
