import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CERULEAN_GARDEN_BEDS,CERULEAN_CLEAR_ROUTES,
 ceruleanLandscapeReport} from '../tools/pokearena/torre2-cerulean-landscape.js';
test('the organic gardens stay clear of every live city service and water channel',()=>{
 const report=ceruleanLandscapeReport();
 assert.equal(report.pass,true,JSON.stringify(report.blocked));
 assert.equal(report.beds,8);
 assert.equal(report.uniqueZones,8);
 assert.ok(CERULEAN_CLEAR_ROUTES.length>=9);
 for(const bed of CERULEAN_GARDEN_BEDS){
  assert.ok(bed.points.length>=6);
  assert.ok(new Set(bed.points.map(p=>p.join(','))).size>=6);
 }
});
test('rendering has exactly one masked grass texture and no clickable scenery',()=>{
 const source=fs.readFileSync('tools/pokearena/torre2-cerulean-landscape.js','utf8');
 assert.match(source,/\.createGeometryMask\(\)/);
 assert.match(source,/\.setMask\(mask\)/);
 assert.match(source,/\.once\('destroy'/);
 assert.doesNotMatch(source,/setInteractive\(|saveCampaign|localStorage|scene\.scene\.start|fetch\(/);
 const tileScale=Number(source.match(/\.setTileScale\((0?\.\d+)\)/)?.[1]);
 assert.ok(Number.isFinite(tileScale)&&tileScale>=.20&&tileScale<=.30,
  `garden texture scale ${tileScale} must remain within readable pixel-art bounds`);
 const city=fs.readFileSync('tools/pokearena/torre2-city-scenery.js','utf8');
 assert.match(city,/renderCeruleanLandscape\(scene\)/);
 assert.match(city,/const gardens=renderCeruleanLandscape/);
 const builder=fs.readFileSync('tools/pokearena/build-preview.mjs','utf8');
 assert.match(builder,/torre2-cerulean-landscape\.js','cerulean-landscape\.js/);
});
test('protected access survives a deliberately obstructive park',()=>{
 const bad={id:'bridge-obstruction',points:[[337,122],[361,122],[369,133],[367,145],[345,148],[334,139]]};
 const report=ceruleanLandscapeReport([...CERULEAN_GARDEN_BEDS,bad]);
 assert.equal(report.pass,false);
 assert.ok(report.blocked.includes('bridge-obstruction:blocks-bridge'));
});
