// Owner 2026-11-22 (README 3): trainer customization from the original FRLG sheet.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {defaultLook,cleanLook,cycleLook,lookLabel,isDefaultLook,recolor,applyLook,accessoryPixels,OUTFITS,POSES,ACCESSORIES,readLook,saveLook}
 from '../tools/pokearena/torre2-trainer-look.js';
test('look options cycle and clean',()=>{
 assert.deepEqual(defaultLook(),{outfit:'original',pose:'frente',accessory:'nenhum'});
 assert.equal(cycleLook(defaultLook(),'outfit',1).outfit,'azul');assert.equal(cycleLook(defaultLook(),'outfit',-1).outfit,'preto');
 assert.equal(lookLabel({pose:'costas'},'pose'),'De costas');assert.deepEqual(cleanLook({outfit:'x',pose:9}),defaultLook());
 assert.ok(isDefaultLook({}));assert.equal(OUTFITS.length,7);assert.equal(POSES.length,4);assert.equal(ACCESSORIES.length,4);
});
test('recolor keeps shading and only touches outfit colours',()=>{
 const red=[0xc5,0x39,0x39],dark=[0x6a,0x29,0x29];
 assert.deepEqual(recolor(red,'original'),red);
 const blue=recolor(red,'azul');assert.ok(blue[2]>blue[0],'blue');
 const b2=recolor(dark,'azul');assert.ok(b2[2]<blue[2],'darker shade stays darker');
 // A 2x1 "sheet": outfit red pixel + skin pixel.
 const data=new Uint8ClampedArray([0xc5,0x39,0x39,255, 0xde,0x94,0x73,255]);
 applyLook(data,2,1,'red_normal',{outfit:'verde'});
 assert.ok(data[1]>data[0],'outfit became green');assert.deepEqual([...data.slice(4)],[0xde,0x94,0x73,255],'skin untouched');
});
test('pose copies the chosen frame into the front frame; accessories on front poses',()=>{
 const w=144,h=32,data=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=16;x<32;x++){const i=(y*w+x)*4;data[i]=10;data[i+1]=20;data[i+2]=30;data[i+3]=255}
 applyLook(data,w,h,'red_normal',{pose:'costas'});assert.deepEqual([...data.slice(0,4)],[10,20,30,255]);
 const d2=new Uint8ClampedArray(w*h*4);applyLook(d2,w,h,'red_normal',{accessory:'oculos'});
 const i=(21*w+6)*4;assert.equal(d2[i+3],255,'glasses pixel drawn');
 assert.equal(accessoryPixels('ambos').length,accessoryPixels('oculos').length+accessoryPixels('lenco').length);
});
test('stored per device; wiring in card, map, battle and publisher',()=>{
 const store={m:{},getItem(k){return this.m[k]??null},setItem(k,v){this.m[k]=v}};
 assert.ok(saveLook({outfit:'roxo'},store));assert.equal(readLook(store).outfit,'roxo');
 const read=f=>fs.readFileSync(new URL('../tools/pokearena/'+f,import.meta.url),'utf8');
 assert.match(read('torre2-campaign-scene.js'),/torre2-intro-look-continue/);
 assert.match(read('torre2-frlg-npc.js'),/player-look/);assert.match(read('torre2-party-battle.js'),/frlg-npc-player-look/);
 assert.match(read('publish-alpha0762.mjs'),/torre2-trainer-look\.js','torre2\/trainer-look\.js'/);
});
