/* Design Taste polish: real drawing helpers from the trainer-card module.
 * No actual game builds, saves, original Poké Arena kits or combat assets change.
 * The Phaser/Chromium visual gate is still mandatory prior to publication.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('tools/pokearena/torre2-trainer-cards.js','utf8');
const start=source.indexOf('function box(');
const middle=source.indexOf('function control(');
const cardStart=source.indexOf('function trainerCardFrame(');
const cardEnd=source.indexOf('function npc(');
assert.ok(start>0&&middle>start&&cardStart>middle&&cardEnd>cardStart);
const palette={
 navy:0x06172b,panel:0x0c2845,body:0x123755,edge:0x3b77a6,
 ocean:0x1e527a,light:0x8cc9ed,gold:0xf6c851,sun:0xffe6a2,
 cream:0xf7f4df,green:0x50cc84,lock:0x50677c,shadow:0x040d1d
};
// Native Poké Arena UI kit (ui.js): only the calls the frame makes.
const UI={oro:0xf8c448,panelBorde:0x3f74b8};
const marcos=[];
const marco=(g,x,y,w,h,estilo,opts={})=>marcos.push({x,y,w,h,estilo,...opts});
const drawing=source.slice(start,middle)+'\n'+source.slice(cardStart,cardEnd);
const trainerCardFrame=vm.runInNewContext('({'+
 'run: function(){'+drawing+'return trainerCardFrame;}'+'}).run()',
 {PALETTE:palette,Math,UI,marco,NATIVE_GREEN:0x50cc84});

function render(entry){
 marcos.length=0;const objects=[];
 const scene={add:{graphics:()=>({})}};
 const layer={add(item){objects.push(item)}};
 const edge=trainerCardFrame(scene,layer,166,56,110,244,entry);
 return{edge,objects,frame:{...marcos[0]}};
}

test('four native trainer cards (110x244, League width) keep touch and data keys',()=>{
 assert.match(source,/export const CARDS_PER_PAGE=4;/);
 assert.match(source,/const CW=110,GAP=8,X0=166,CY=56,CH=244;/);
 assert.match(source,/for\(let c=0;c<CARDS_PER_PAGE;c\+\+\)/);
 assert.match(source,/trainerCardFrame\(scene,layer,x,y,w,h,entry\)/);
 assert.match(source,/\.setData\('torre2-trainer-card-index',entry.index\)/);
 assert.match(source,/detailPage\(scene,state,handlers,entry\)/);
 assert.match(source,/const zone=scene.add.zone\(x\+w\/2,y\+h\/2,w,h\)/);
 // Native kit, not a parallel look: same font/panels as the base client menus.
 assert.match(source,/from '\.\.\/ui\.js'/);
 assert.match(source,/texto\(scene,x,y,pretty\(value\)/);
 assert.match(source,/marco\(g,x,y,w,h,muted\?'apagado':gold\?'oro':'azul'\)/);
});

test('the active, completed and locked native frames remain distinguishable',()=>{
 const active=render({active:true,completed:false,leader:false,locked:false});
 const defeated=render({active:false,completed:true,leader:false,locked:false});
 const locked=render({active:false,completed:false,leader:false,locked:true});
 assert.equal(active.edge,palette.gold);
 assert.equal(defeated.edge,palette.green);
 assert.equal(locked.edge,0x587790);
 for(const model of [active,defeated,locked]){
  assert.equal(model.objects.length,1,'one native frame graphic per card');
  assert.equal(model.frame.estilo,'panel');
  assert.deepEqual([model.frame.x,model.frame.y,model.frame.w,model.frame.h],[166,56,110,244]);
 }
 assert.equal(active.frame.borde,UI.oro);
 assert.equal(defeated.frame.borde,0x50cc84);
 assert.equal(locked.frame.borde,undefined);
 assert.ok(locked.frame.alfa<active.frame.alfa,'locked cards are dimmed');
});
