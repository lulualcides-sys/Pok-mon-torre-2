import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../tools/pokearena/'+p,import.meta.url),'utf8');
test('published copy never starts the base client NEWS side tab or patch-notes popup',()=>{
 const pub=read('publish-alpha0762.mjs');
 assert.ok(pub.includes("exactly(main,'iniciarNoticias(juego);iniciarComunicado(juego);','native news/patch-notes start');"));
 assert.ok(pub.includes("main.replace('iniciarNoticias(juego);iniciarComunicado(juego);','')"));
 assert.ok(pub.includes("const mainFile=path.join(dest,'main.js');"),'only the new module tree is patched');
});
test('Kanto map: a completed city reopens its own tall grass',()=>{
 const cards=read('torre2-trainer-cards.js'),core=read('torre2-campaign-core.js'),scene=read('torre2-campaign-scene.js');
 assert.ok(cards.includes('else if(done&&i<8&&handlers.capture){layer.destroy(true);handlers.capture(i)}'));
 assert.ok(core.includes('export function startWildEncounter(s,random=Math.random,areaStage=null){'));
 assert.ok(core.includes("if(revisit&&!(areaStage>=0&&areaStage<GYMS.length&&(areaStage<s.stage||s.champion)))"),'only completed cities');
 assert.ok(core.includes('wildLevelFor(areaAt,TRAINERS_PER_GYM(areaAt),TRAINERS_PER_GYM(areaAt))'),'levels of that area');
 assert.equal((scene.match(/capture:at=>this\.grassScreen\(state,Number\.isInteger\(at\)\?at:null\)/g)||[]).length,4);
 assert.ok(scene.includes('try{found=startWildEncounter(state,Math.random,revisit?areaStage:null);}'));
});
test('trade: an overlay Pokémon sprite is destroyed with its window',()=>{
 assert.ok(read('torre2-campaign-scene.js').includes("owner.once('destroy',()=>{if(sprite.active)sprite.destroy()});"));
});
test('Mais opções labels sit right of the icon and wrap instead of overlapping',()=>{
 const cards=read('torre2-trainer-cards.js');
 assert.ok(cards.includes("{id:'cards-extras-'+i,size:9,icon,wrap:true}"));
 assert.ok(cards.includes('caption.setWordWrapWidth(tw,true).setAlign(\'center\')'));
});
test('VS intro: the biker sheet (32x32 cells) is not cut in half',async()=>{
 const {npcCellWidth}=await import('../tools/pokearena/torre2-frlg-npc.js');
 assert.equal(npcCellWidth(320,32),32);
 assert.equal(npcCellWidth(160,32),16);
 assert.equal(npcCellWidth(48,32),16);
});
test('party switch brings a fighter caught mid-Fly/Dig back into view',()=>{
 const src=read('torre2-combat-boundary.js');
 assert.ok(src.includes('actor.ocultoVuelo=null;actor.salto=0;'));
 assert.ok(src.includes('delete actor.est.vuelo;delete actor.est.invul;'));
 assert.ok(src.indexOf('actor.ocultoVuelo=null')<src.indexOf('actor.accion=null'),'restore before cancelling the action');
});
