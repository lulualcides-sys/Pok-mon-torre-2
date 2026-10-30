import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {FRLG_MART_ICONS,FRLG_ICON_COMMIT,gbaItemPNGForWeb} from
 '../tools/pokearena/install-frlg-mart-item-icons.mjs';
import {FRLG_MART_ICON_FILES,frlgMartIcon} from
 '../tools/pokearena/torre2-campaign-sprites.js';
import {MART_ITEMS} from '../tools/pokearena/torre2-route-data.js';
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
test('FireRed Mart item mapping points only to pinned native GBA icon filenames',()=>{
 assert.equal(FRLG_ICON_COMMIT.length,40,'Immutable upstream revision required');
 assert.deepEqual(FRLG_MART_ICON_FILES,FRLG_MART_ICONS);
 for(const item of MART_ITEMS){
  const file=frlgMartIcon(item);
  assert.ok(FRLG_MART_ICONS.includes(file),item.id+' has no native original icon');
 }
 assert.equal(frlgMartIcon({id:'tm-rock-tomb',kind:'tm'}),'tm_hm');
 assert.equal(frlgMartIcon({id:'superpotion',kind:'heal'}),'large_potion');
 assert.equal(frlgMartIcon({id:'pokeball',kind:'ball'}),'poke_ball');
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
