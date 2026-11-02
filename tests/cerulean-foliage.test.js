import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 CERULEAN_FOLIAGE_SOURCE_KEY,CERULEAN_FOLIAGE_FRAMES,
 CERULEAN_FOLIAGE_SOURCE_FILE,isFoliageBackdrop,isolateFoliagePixels,
 CERULEAN_NATIVE_SOURCE_KEY,CERULEAN_NATIVE_SOURCE_FILE,
 CERULEAN_NATIVE_FOLIAGE_FRAMES,
 addCeruleanOrganicTree
} from '../tools/pokearena/torre2-cerulean-organic-foliage.js';
import {CITY_TEXTURES} from '../tools/pokearena/torre2-city-atlas.js';

test('foliage crops stay within 512x384 source and are not whole maps',()=>{
 const names=Object.keys(CERULEAN_FOLIAGE_FRAMES);
 assert.ok(names.length>=5);
 const rects=new Set();
 for(const [name,[x,y,w,h]] of Object.entries(CERULEAN_FOLIAGE_FRAMES)){
  assert.ok(x>=0&&y>=10&&w>=20&&w<40&&h>=24&&h<40,name);
  assert.ok(x+w<=512&&y+h<=384);
  assert.ok(!rects.has(x+','+y));rects.add(x+','+y);
 }
 assert.ok(CITY_TEXTURES.some(([key,src])=>key===CERULEAN_FOLIAGE_SOURCE_KEY&&src===CERULEAN_FOLIAGE_SOURCE_FILE));
 const data=fs.readFileSync('reference-assets/kanto/concept-previews/vegetation_forest.webp');
 assert.equal(data.toString('ascii',0,4),'RIFF');
 assert.equal(data.toString('ascii',8,12),'WEBP');
 assert.ok(data.length<180000);
});

test('eight transparent native PNG tree frames use bounded mobile assets',()=>{
 const names=Object.keys(CERULEAN_NATIVE_FOLIAGE_FRAMES);
 assert.equal(names.length,8);
 const offsets=new Set();
 for(const [name,[x,y,w,h]] of Object.entries(CERULEAN_NATIVE_FOLIAGE_FRAMES)){
  assert.ok(name.length>=4&&x>=0&&y>=0&&w===80&&h===88);
  assert.ok(x+w<=320&&y+h<=176);
  offsets.add(x+','+y);
 }
 assert.equal(offsets.size,8);
 assert.ok(CITY_TEXTURES.some(([k,p])=>k===CERULEAN_NATIVE_SOURCE_KEY&&p===CERULEAN_NATIVE_SOURCE_FILE));
 const png=fs.readFileSync('reference-assets/kanto/city-original/cerulean-native-trees-v2.png');
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(png.readUInt32BE(16),320);
 assert.equal(png.readUInt32BE(20),176);
 assert.ok(png.length>8000&&png.length<100000,'bounded mobile atlas');
});
test('dark blue matte is removed while green leaves and brown trunk remain',()=>{
 assert.equal(isFoliageBackdrop(19,25,30),true);
 assert.equal(isFoliageBackdrop(21,23,34),true);
 assert.equal(isFoliageBackdrop(34,90,45),false);
 assert.equal(isFoliageBackdrop(130,91,64),false);
 const pixels=new Uint8ClampedArray([19,25,30,255,65,153,63,255,95,64,41,255]);
 isolateFoliagePixels(pixels);
 assert.deepEqual([...pixels],[19,25,30,0,65,153,63,255,95,64,41,255]);
});

test('foliage is decorative and has a safe fallback when no scene asset is loaded',()=>{
 const scene={textures:{exists:()=>false}};
 assert.equal(addCeruleanOrganicTree(scene,100,100,42,'oak_light'),null);
 const city=fs.readFileSync('tools/pokearena/torre2-city-scenery.js','utf8');
 assert.match(city,/addCeruleanOrganicTree/);
 assert.match(city,/addCitySprite\(scene,'tree',x,y,44\)/);
 assert.doesNotMatch(fs.readFileSync('tools/pokearena/torre2-cerulean-organic-foliage.js','utf8'),/setInteractive\(|localStorage|saveGame|battle/);
});
