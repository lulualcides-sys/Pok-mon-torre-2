import test from 'node:test';
import assert from 'node:assert/strict';
import {batch24AreaTargets} from '../tools/pokearena/batch24/area-targets.js';
const fighter=(equipe,ko=false)=>({equipe,ko});
test('1v1 and Kanto campaign keep the one-rival contract',()=>{
 const rival=fighter(),actor={rival,escena:{luchadores:[{},{}]}};
 assert.deepEqual(batch24AreaTargets(actor),[rival]);
 assert.deepEqual(batch24AreaTargets({rival}),[rival]);
 assert.deepEqual(batch24AreaTargets({rival:{ko:true}}),[]);
 assert.deepEqual(batch24AreaTargets({}),[]);
});
test('Arena free-for-all selects all live opposing fighters exactly once',()=>{
 const actor=fighter(1),a=fighter(2),b=fighter(3),ally=fighter(1),ko=fighter(4,true);
 actor.rival=a;actor.escena={luchadores:[actor,a,ally,b,ko,null]};
 const before=actor.escena.luchadores.slice();
 assert.deepEqual(batch24AreaTargets(actor),[a,b]);
 assert.deepEqual(actor.escena.luchadores,before,'Never mutate arena roster');
});
test('Arena with neutral fighters does not accidentally exclude opponents',()=>{
 const actor=fighter(undefined),a=fighter(undefined),b=fighter(undefined);
 actor.rival=a;actor.escena={luchadores:[actor,a,b]};
 assert.deepEqual(batch24AreaTargets(actor),[a,b]);
});
