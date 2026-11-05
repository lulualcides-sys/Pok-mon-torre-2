/* Unit harness for the REAL Campanha.button method, without importing the
 * native Phaser capture or touching approved battle/card code.
 * This checks input geometry and callback behavior; it is NOT a browser visual
 * review, and cannot replace full Pages Chromium/Phaser validation.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
const start=source.indexOf(' button(x,y,w,h,label,callback,emphasis=false,tam=null,variant=null,captionInset=0){');
const end=source.indexOf('\n professorOakIntro(){',start);
assert.ok(start>0&&end>start,'The campaign-only button method must exist');

function harness(){
 const painted=[],rectangles=[],handlers=new Map(),labels=[];
 let time=1000;
 const graphics={
  setDepth(){return this},
  clear(){rectangles.push(['clear']);return this},
  fillStyle(...args){rectangles.push(['fillStyle',...args]);return this},
  fillRect(...args){rectangles.push(['fillRect',...args]);return this}
 };
 const caption={
  setOrigin(){return this},setDepth(){return this},setData(){return this},
  setX(value){this.x=value;return this},setY(value){this.y=value;return this},
  setColor(value){this.color=value;return this},
  setStroke(color,thickness){this.stroke={color,thickness};return this}
 };
 const zone={
  setDepth(){return this},setInteractive(){return this},
  setData(key,value){this.data={key,value};return this},
  on(name,handler){handlers.set(name,handler);return this}
 };
 const context={
  MENU_UI:{bordeTexto:'#0b2033'},
  textoMenu(_scene,x,y,label){labels.push({x,y,label});return caption},
  estrechar(t,maxWidth){t.maxWidth=maxWidth;return t},
  buttonFrame(_graphics,x,y,w,h,tone,hover){
   painted.push({x,y,w,h,tone,hover});
  },
  Date:{now:()=>time},
  Math
 };
 const method=vm.runInNewContext('({'+source.slice(start,end)+'})',context).button;
 const scene={add:{
  graphics:()=>graphics,
  zone(x,y,w,h){zone.bounds={x,y,w,h};return zone}
 }};
 return{method,scene,painted,rectangles,handlers,labels,caption,zone,
  tick:(ms)=>{time+=ms},fire:(name)=>handlers.get(name)?.(null,0,0,{stopPropagation(){}})};
}

test('campaign buttons keep native dimensions, callbacks and highlight hierarchy',()=>{
 const h=harness();let count=0;
 const button=h.method.call(h.scene,320,150,220,37,'CURAR POKÉMON',()=>{count++},true,12);
 assert.equal(button,h.zone);
 assert.deepEqual(h.zone.bounds,{x:320,y:150,w:220,h:37});
 assert.equal(h.zone.data.key,'torre2-campaign-button');
 assert.equal(h.zone.data.value.tone,'gold');
 assert.equal(h.painted.at(-1).tone,'gold');
 const originY=h.painted.at(-1).y;
 h.fire('pointerover');
 assert.equal(h.painted.at(-1).hover,true);
 h.fire('pointerdown');
 assert.equal(count,1);
 assert.equal(h.painted.at(-1).y,originY+1);
 assert.equal(h.caption.y,151);
 h.fire('pointerup');
 assert.equal(h.painted.at(-1).y,originY);
 assert.equal(h.caption.y,150);
 h.fire('pointerdown');
 assert.equal(count,1,'a duplicate tap inside 190ms must be ignored');
 h.tick(191);h.fire('pointerdown');
 assert.equal(count,2);
 h.fire('pointerout');
 assert.equal(h.painted.at(-1).hover,false);
 assert.equal(h.caption.y,150);
 assert.ok(h.rectangles.some(x=>x[0]==='fillRect'&&x[3]===2),
  'pixel accent bars should be painted');
});

test('back navigation keeps its original tap target and secondary color',()=>{
 const h=harness();let count=0;
 const z=h.method.call(h.scene,320,310,170,22,'◀ VOLTAR AO MAPA',()=>{count++});
 assert.deepEqual(z.bounds,{x:320,y:310,w:170,h:27});
 assert.equal(z.data.value.tone,'blue');
 assert.equal(h.painted.at(-1).w,170);
 assert.equal(h.painted.at(-1).h,22);
 h.fire('pointerdown');assert.equal(count,1);
 h.fire('pointerout');assert.equal(h.caption.y,310);
});

test('skin is restricted to campaign controls; approved card hub uses its own renderer',()=>{
 const cards=fs.readFileSync('tools/pokearena/torre2-trainer-cards.js','utf8');
 const art=fs.readFileSync('tools/pokearena/torre2-campaign-art.js','utf8');
 assert.match(source,/The trainer-card hub, Arena HUD, move keys and native combat UI are untouched/);
 assert.ok(cards.includes('function control(scene,layer,'));
 assert.ok(cards.includes("setData('torre2-card-control'"));
 assert.ok(art.includes('export function buttonFrame('));
 assert.ok(!source.includes("from './combat"));
});
