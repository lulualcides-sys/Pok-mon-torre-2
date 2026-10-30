import test from 'node:test';
import assert from 'node:assert/strict';
import {gotchaSparklePoints} from '../tools/pokearena/torre2-ball-choreography.js';
test('short GOTCHA sparkle animation uses no more than three pixels stars',()=>{
 for(const t of [0,.25,.5,.75,1])assert.ok(gotchaSparklePoints(t).length<=3);
 assert.deepEqual(gotchaSparklePoints(1),[]);
});
