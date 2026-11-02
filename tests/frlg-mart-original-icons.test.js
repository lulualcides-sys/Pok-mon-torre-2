import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {FRLG_MART_ITEMS,FRLG_ICON_COMMIT,gbaItemPNGForWeb,paletteFromJASC} from
 '../tools/pokearena/install-frlg-mart-item-icons.mjs';
import {readFileSync} from 'node:fs';
const spriteSource=readFileSync('tools/pokearena/torre2-campaign-sprites.js','utf8');
const routeSource=readFileSync('tools/pokearena/torre2-route-data.js','utf8');
const spriteIds=[...spriteSource.split('export const FRLG_MART_ITEM_FILES=Object.freeze([')[1]
 .split(']);')[0].matchAll(/'([^']+)'/g)].map(x=>x[1]);
const routeIds=[...routeSource.split('export const MART_ITEMS=Object.freeze([')[1]
 .split('].map(')[0].matchAll(/\{id:'([^']+)'/g)].map(x=>x[1]);
const sig=Buffer.from([137,80,78,71,13,10,26,10]);
function chunk(type,payload){
 const head=Buffer.alloc(8);
 head.writeUInt32BE(payload.length,0);head.write(type,4);
 const bytes=Buffer.concat([Buffer.from(type),payload]);
 let crc=0xffffffff;
 for(const b of bytes){crc^=b;for(let i=0;i<8;i++)
  crc=(crc>>>1)^((crc&1)?0xedb88320:0)}
 const tail=Buffer.alloc(4);tail.writeUInt32BE((crc^0xffffffff)>>>0);
 return Buffer.concat([head,payload,tail]);
}
function indexedFixture(){
 const ihdr=Buffer.alloc(13);
 ihdr.writeUInt32BE(2,0);ihdr.writeUInt32BE(2,4);ihdr[8]=8;ihdr[9]=3;
 const plte=Buffer.from([0,0,0,255,0,0]);
 const pixels=deflateSync(Buffer.from([0,0,1,0,1,0]));
 return Buffer.concat([sig,chunk('IHDR',ihdr),chunk('PLTE',plte),
  chunk('IDAT',pixels),chunk('IEND',Buffer.alloc(0))]);
}
test('each Mart item is backed by the original pinned FireRed icon and correct type palette',()=>{
 assert.equal(FRLG_ICON_COMMIT.length,40,'Immutable upstream revision required');
 const ids=Object.keys(FRLG_MART_ITEMS);
 assert.deepEqual(spriteIds.slice().sort(),ids.slice().sort());
 assert.deepEqual(routeIds.slice().sort(),ids.slice().sort(),
  'No shop item may use a generic icon');
 for(const id of routeIds){
  assert.match(FRLG_MART_ITEMS[id].image,/^[a-z_]+$/);
  assert.match(FRLG_MART_ITEMS[id].palette,/^[a-z_]+$/);
 }
 assert.deepEqual(FRLG_MART_ITEMS.paralyzeheal,
  {image:'status_heal',palette:'paralyze_heal'});
 assert.deepEqual(FRLG_MART_ITEMS['tm-rock-tomb'],
  {image:'tm_hm',palette:'rock_tm_hm'});
 assert.deepEqual(FRLG_MART_ITEMS['tm-thunderbolt'],
  {image:'tm_hm',palette:'electric_tm_hm'});
});
test('authentic JASC GBA palettes reject unknown source files',()=>{
 const p=paletteFromJASC('JASC-PAL\n0100\n2\n4 8 16\n40 80 160\n');
 assert.deepEqual([...p],[4,8,16,40,80,160]);
 assert.throws(()=>paletteFromJASC('fake'),/Unrecognized/);
});
test('indexed GBA pixel icon transparency is preserved without rescaling or palette edits',()=>{
 const src=indexedFixture(),web=gbaItemPNGForWeb(src);
 assert.ok(web.subarray(0,8).equals(sig));
 const position=web.indexOf(Buffer.from('tRNS'));
 assert.ok(position>0,'indexed color zero must become transparent for Phaser');
 assert.equal(web.readUInt32BE(position-4),2);
 assert.deepEqual([...web.subarray(position+4,position+6)],[0,255]);
 assert.deepEqual(gbaItemPNGForWeb(web),web,'do not duplicate transparency metadata');
 assert.equal(src.indexOf(Buffer.from('tRNS')),-1,'source icon is unchanged');
 assert.throws(()=>gbaItemPNGForWeb(Buffer.from('not a PNG')),/Invalid/);
});

test('same real GBA pixel stencil accepts original distinct status/TM palettes',()=>{
 const src=indexedFixture(),palette=Buffer.from([1,2,3,10,20,30]);
 const converted=gbaItemPNGForWeb(src,palette);
 const marker=converted.indexOf(Buffer.from('PLTE'));
 assert.ok(marker>0);
 assert.deepEqual([...converted.subarray(marker+4,marker+10)],[1,2,3,10,20,30]);
 assert.ok(converted.indexOf(Buffer.from('tRNS'))>0);
 assert.deepEqual(gbaItemPNGForWeb(converted,palette),converted);
});
