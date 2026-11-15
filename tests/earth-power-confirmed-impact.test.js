import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const runtime=readFileSync(new URL('../tools/pokearena/batch24/runtime.js',import.meta.url),'utf8');
const earth=runtime.slice(runtime.indexOf('function earth(l,h,extra){'),runtime.indexOf('export const BATCH24_FORMS='));
test('Earth Power keeps native telegraph but gates damage impact on actual strike',()=>{
 assert.ok(earth.includes("stamp(g,'crack',point.x"));
 assert.ok(earth.includes('drawMove(g,h,point.x,point.y'));
 assert.match(earth,/landed=result\.landed/);
 assert.match(earth,/if\(landed&&hitPoint&&age>\.42\)impact/);
 assert.doesNotMatch(earth,/if\(age>\.42\)impact/);
});
test('Earth Power checks collision once and cannot impact on a miss',()=>{
 assert.match(earth,/if\(!checked&&age>=\.36\)/);
 assert.match(earth,/const r=l\.rival,contact=swept\(point,point,r,22\)/);
 assert.match(earth,/if\(contact\)\{\s*const result=strike/);
 assert.match(earth,/if\(landed\)hitPoint=contact/);
});
