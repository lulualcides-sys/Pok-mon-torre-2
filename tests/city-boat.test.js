/* T33 — Cerulean rowboat is pixel-art decoration, not a menu or battle. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../tools/pokearena/torre2-city-scenery.js',import.meta.url),'utf8');
const start=source.indexOf(' // Top-down Kanto rowboat:');
const end=source.indexOf(' const treeKey=',start);
assert.ok(start>=0&&end>start,'renderCityScenery must keep a local decorative rowboat');
const section=source.slice(start,end);

test('rowboat uses stepped wood silhouette and two benches, not a white capsule',()=>{
 const polys=[],rects=[],ellipses=[],lines=[];
 const quay={lineStyle(){return this},lineBetween(...points){lines.push(points);return this},
  strokeCircle(){return this}};
 vm.runInNewContext(section,{quay,
  px:(_g,...a)=>rects.push(a),poly:(_g,pts,c)=>polys.push({pts,c}),
  ellipse:(_g,...a)=>ellipses.push(a)},{timeout:1000});
 assert.ok(polys.length>=4,'hull, deck and both gunwales are distinct pixel shapes');
 assert.ok(rects.length>=12,'deck planks, benches and highlights are present');
 assert.equal(ellipses.length,1,'one shadow, not a large capsule body');
 assert.ok(polys.some(p=>p.c===0x94643f),'warm wooden deck');
 assert.ok(!polys.some(p=>p.c===0xf3eacb),'old white capsule hull must not return');
 const hull=polys[0].pts;
 const xs=hull.map(p=>p[0]),ys=hull.map(p=>p[1]);
 assert.deepEqual([Math.min(...xs),Math.max(...xs),Math.min(...ys),Math.max(...ys)],
  [439,468,269,311],'boat must stay in canal west of quay x493');
 assert.equal(lines.length,2,'one oar and one mooring line, no extra interactions');
 assert.doesNotMatch(section,/setInteractive|zone\(|enterBattle|saveCampaign/);
});
