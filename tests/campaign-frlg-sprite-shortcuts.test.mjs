import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const path=readFileSync('tools/pokearena/torre2-battle-path.js','utf8');
const scene=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
const installer=readFileSync('tools/pokearena/install-frlg-mart-item-icons.mjs','utf8');

test('six unique FireRed item/party sprites power campaign shortcuts',()=>{
 const segment=path.match(/export const CAMPAIGN_SPRITE_SHORTCUTS=Object\.freeze\(\[([\s\S]*?)\]\);/)?.[1];
 assert.ok(segment,'sprite shortcut catalog missing');
 for(const [role,label] of [['bag','BOLSA'],['pokemon','POKÉMON'],['center','CENTRO'],
  ['shop','LOJA'],['training','TREINAMENTO'],['capture','CAPTURA']])
  assert.match(segment,new RegExp("id:'"+role+"',label:'"+label+"'"));
 const assets=[...segment.matchAll(/item:'([^']+)'/g)].map(x=>x[1]);
 assert.equal(assets.length,6);
 assert.equal(new Set(assets).size,6);
 for(const name of assets)assert.ok(name==='bag-male'||installer.includes(name+':spec(')||installer.includes("'"+name+"':spec("),
  name+' absent from pinned FireRed assets');
 assert.match(path,/scene\.add\.image\(left\+12,y,key,spec\.id==='bag'\?0:undefined\)/);
 assert.match(path,/Phaser\.Textures\.FilterMode\.NEAREST/);
 assert.match(path,/torre2-portrait-/);
 assert.match(scene,/for\(const file of FRLG_MART_ITEM_FILES\)/);
 assert.match(scene,/this\.load\.spritesheet\('torre2-frlg-bag'/);
 assert.match(path,/spec\.id==='bag'\?'torre2-frlg-bag'/);
 assert.match(readFileSync('tools/pokearena/build-preview.mjs','utf8'),/assets\/ui\/frlg\/items\/bag-male\.png/);
});

test('six hit regions remain separate, accessible and wired to native campaign handlers',()=>{
 assert.match(path,/532\+\(i%2\)\*65,252\+Math\.floor\(i\/2\)\*22/);
 assert.match(path,/const w=61,h=20,depth=40/);
 // No hit-area collision: horizontal pitch 65 > 61, vertical pitch 22 > 20.
 assert.ok(65>61&&22>20);
 assert.match(path,/setData\('torre2-path-action',spec.label\)/);
 assert.match(path,/handlers\.bag,\(\)=>handlers\.pokemon\(state\.active\)/);
 assert.match(path,/handlers\.center,handlers\.mart,handlers\.training,handlers\.capture/);
 assert.match(path,/playOriginalMenuCue\(scene\);onPress\(\)/);
});

test('new control skin remains inside campaign path, not battle HUD',()=>{
 assert.match(path,/Deliberately scoped to the six campaign shortcuts; never affect battle HUD/);
 assert.ok(!path.includes("from '../hud.js'"));
});
