import {addCitySprite,CITY_ATLAS_KEY} from './city-atlas.js';
/* Original modular pixel architecture, rendered by Phaser/WebGL.
 * No map screenshot, no uploaded sheet with uncertain redistribution rights.
 * Geometry is local to each building; vegetation uses shared original textures.
 */
export const CITY_ART_VERSION='cerulean-atlas-v2';
const px=(g,x,y,w,h,c,a=1)=>g.fillStyle(c,a).fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
function rng(seed){let s=seed;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296)}
function poly(g,pts,c){g.fillStyle(c);g.fillPoints(pts.map(([x,y])=>({x,y})),true)}
function ellipse(g,x,y,w,h,c,a=1){g.fillStyle(c,a).fillEllipse(x,y,w,h)}
function treeTexture(scene){
 const key='torre2-city-oak-v1';if(scene.textures.exists(key))return key;
 const g=scene.make.graphics({x:0,y:0,add:false}),r=rng(814);
 ellipse(g,25,56,43,12,0x153f42,.35);
 px(g,22,37,8,21,0x4c4235);px(g,24,38,3,20,0x9a7950);
 for(const [x,y,w,h,c] of [[24,33,44,33,0x174b43],[16,23,31,32,0x206747],[33,22,31,30,0x237f48],[24,14,32,26,0x3e9947],[15,15,20,17,0x61ad4b],[31,10,20,16,0x83bd4f]]){
  // Stepped pixel silhouette, no antialiased vector canopy.
  for(let yy=-h/2;yy<h/2;yy+=3){const ww=Math.floor(Math.sqrt(Math.max(0,1-(yy/(h/2))**2))*w/2/2)*2;px(g,x-ww,y+yy,ww*2,3,c)}
 }
 for(let i=0;i<100;i++){
  const x=5+r()*39,y=3+r()*38;
  if(((x-25)/21)**2+((y-24)/23)**2<1)px(g,x,y,2+r()*3,2,[0xa5cf60,0x72b950,0x4b9e47,0x287749][Math.floor(r()*4)],.85);
 }
 g.generateTexture(key,52,64);g.destroy();return key;
}
function masonry(g,x,y,w,h){
 px(g,x+3,y+4,w,h,0x133f4e,.4);px(g,x,y,w,h,0x687e84);
 for(let yy=0;yy<h;yy+=6)for(let xx=-8;xx<w;xx+=16){
  const left=Math.max(0,xx+(yy%12?8:0)),right=Math.min(w,xx+(yy%12?8:0)+15);
  if(right>left){px(g,x+left,y+yy,right-left,5,0x95a6a1);px(g,x+left,y+yy,right-left,1,0xb9c4b3)}
 }
 px(g,x-1,y-3,w+2,4,0xdddcc2);px(g,x,y-2,w,1,0xfff2d1);
}
function pavement(g,x,y,w,h){
 px(g,x,y,w,h,0xcfcbb0);
 for(let yy=0;yy<h;yy+=8)for(let xx=0;xx<w;xx+=12){
  const width=Math.min(11,w-xx),height=Math.min(7,h-yy);
  px(g,x+xx,y+yy,width,height,(xx+yy)%3?0xe0dcc3:0xd9d5b9);
  px(g,x+xx,y+yy,width,1,0xeee9d0);
 }
}
function steps(g,x,y,w,n){
 for(let i=0;i<n;i++){
  px(g,x,y+i*4,w,4,0x8b9c98);px(g,x,y+i*4,w,2,0xe7e3ca);px(g,x+2,y+i*4,w-4,1,0xf8eed4);
 }
 masonry(g,x-5,y,5,n*4);masonry(g,x+w,y,5,n*4);
}
function window(g,x,y,w,h){
 px(g,x-2,y-2,w+4,h+4,0x426174);px(g,x,y,w,h,0x6bbacc);
 px(g,x+1,y+1,w-2,2,0xc5eff0);px(g,x+2,y+3,2,h-4,0x9fe0e5);
 px(g,x+Math.floor(w/2),y,1,h,0xe2d9be);px(g,x,y+Math.floor(h/2),w,1,0xe2d9be);
 px(g,x-2,y+h+1,w+4,2,0xf3e6c8);
}
function roof(g,x,y,w,h,red=false){
 const base=red?0xb94245:0x245580,light=red?0xf17c65:0x5497bf,mid=red?0xd75d54:0x367cad;
 poly(g,[[x+9,y],[x+w-9,y],[x+w,y+h],[x,y+h]],0x234257);
 poly(g,[[x+10,y+1],[x+w-10,y+1],[x+w-3,y+h-3],[x+3,y+h-3]],base);
 for(let yy=3;yy<h-2;yy+=4){
  const inset=Math.round(9*(1-yy/h));px(g,x+inset,y+yy,w-2*inset,2,mid);
  for(let xx=inset+3;xx<w-inset;xx+=8)px(g,x+xx,y+yy,1,3,light,.6);
 }
 px(g,x+10,y,w-20,2,light);px(g,x,y+h-2,w,3,0x18394d);px(g,x+2,y+h,w-4,2,light);
}
function building(scene,x,y,w,h,kind='house'){
 const art=addCitySprite(scene,kind,x+w/2,y+h,h+9);
 if(art)return art.setData('torre2-city-building',kind);
 const g=scene.add.graphics({x,y}).setDepth(20+(y+h)/1000).setData('torre2-city-building',kind);
 const red=kind==='center',gym=kind==='gym';
 px(g,4,h-3,w+5,9,0x2c5553,.32);
 px(g,2,26,w-4,h-24,0x596c6b);px(g,5,27,w-10,h-28,0xe4d8b7);
 px(g,7,30,w-14,h-34,0xf3e7c6);px(g,w-13,29,8,h-30,0xc6bd9f);
 for(let yy=34;yy<h-4;yy+=7)for(let xx=8;xx<w-15;xx+=15)px(g,xx+(yy%2?6:0),yy,7,1,0xc9c2a6,.65);
 if(gym){
  roof(g,-4,0,w+8,27);
  for(let i=0;i<6;i++)window(g,12+i*(w-24)/6,31,(w-40)/6,25);
  px(g,7,57,w-14,5,0x3079a0);px(g,7,58,w-14,1,0xa6dce6);
  for(const xx of [7,w-14]){px(g,xx,28,7,h-27,0x8aa7ad);px(g,xx,28,3,h-27,0xf3ecd4)}
 }else{
  roof(g,-3,3,w+6,27,red);
  window(g,12,38,13,16);window(g,w-26,38,13,16);
  if(kind==='mart'){
   px(g,-2,34,w+4,4,0x326e9c);
   for(let xx=0;xx<w;xx+=10){px(g,xx,38,10,9,xx%20?0xe8ebdb:0x4a9fbf);px(g,xx,47,10,3,xx%20?0xc9d6c8:0x2e668d)}
  }
 }
 const doorX=w/2-9;
 px(g,doorX-3,h-28,24,29,0xc4bda5);px(g,doorX-1,h-26,20,27,0x2a4d64);
 px(g,doorX+1,h-24,16,24,0x4c819a);px(g,doorX+2,h-23,6,20,0x86c9d6);
 px(g,doorX+9,h-23,1,23,0xd8e7d3);px(g,doorX+13,h-11,2,2,0xffe6a4);
 px(g,doorX-6,h-1,30,3,0xeee4c7);
 if(red){
  ellipse(g,w/2,20,25,23,0x5e4145);ellipse(g,w/2,19,21,20,0xf3edcf);
  g.fillStyle(0xdc5254).fillCircle(w/2,19,8);px(g,w/2-8,19,16,8,0xf8efd9);
  px(g,w/2-9,18,18,3,0x354e62);g.fillStyle(0x354e62).fillCircle(w/2,19,4);g.fillStyle(0xf9f2d8).fillCircle(w/2,19,2);
 }
 if(gym){
  ellipse(g,w/2,27,29,29,0xd3dfd6);ellipse(g,w/2,27,23,23,0x2b7396);
  poly(g,[[w/2,17],[w/2-6,28],[w/2-4,33],[w/2+4,33],[w/2+6,28]],0x8fe5ec);
  px(g,w/2-2,25,2,5,0xf2ffff);
 }
 return g;
}
function planter(g,x,y,w=30){
 px(g,x+1,y+5,w,8,0x627e77);px(g,x,y+4,w,4,0xd0cbb0);px(g,x+2,y,w-4,5,0x367a49);
 for(let i=3;i<w-3;i+=5){px(g,x+i,y-2,3,4,i%2?0xf5a2b2:0xf5de9b);px(g,x+i+1,y-1,1,1,0xfff2c9)}
}
function lamp(g,x,y){
 ellipse(g,x,y+1,12,4,0x405957,.4);px(g,x-1,y-22,3,24,0x294955);px(g,x-3,y,7,2,0x263e4d);
 px(g,x-5,y-30,11,9,0x2e4b59);px(g,x-3,y-28,7,6,0xffdf86);px(g,x-2,y-27,4,4,0xfff4c5);
 px(g,x-6,y-31,13,2,0x2e4b59);px(g,x-3,y-34,7,3,0x2e4b59);px(g,x,y-36,1,2,0x2e4b59);
}
function banner(g,x,y){
 px(g,x,y,2,30,0x405966);px(g,x-1,y,18,2,0xd7d5b5);
 px(g,x+3,y+3,13,23,0x267dba);px(g,x+4,y+4,11,20,0x479ac0);
 poly(g,[[x+9,y+8],[x+6,y+15],[x+9,y+18],[x+12,y+15]],0xa9e7ef);
}
export function renderCityScenery(scene){
 const water=scene.add.graphics().setDepth(0).setData('torre2-city-layer','water');
 px(water,0,0,640,360,0x188bb7);
 const random=rng(125);for(let i=0;i<260;i++){
  const x=random()*640,y=random()*310;
  px(water,x,y,4+random()*11,2,i%3?0x27a7c3:0x64cad7,.45);
 }
 const terrain=scene.add.graphics().setDepth(2).setData('torre2-city-layer','terrain');
 // Two stone islands separated by a canal, with a smaller west channel.
 for(const [x,y,w,h]of [[-8,35,343,239],[402,35,245,238]]){
  masonry(terrain,x,y+12,w,h);pavement(terrain,x,y,w,h-12);
 }
 px(terrain,154,196,44,80,0x188bb7);masonry(terrain,146,195,8,78);masonry(terrain,198,195,8,78);
 for(const [x,y,w,h]of [[1,39,73,30],[165,38,169,30],[408,39,47,35],[584,38,60,36],[1,187,44,74],[209,263,118,16],[409,259,40,14]]){
  px(terrain,x,y,w,h,0x3d914e);px(terrain,x+2,y+2,w-4,h-4,0x6aae55);
 }
 // Canal bridge with masonry arch, deck, balustrades and stair approaches.
 const bridge=scene.add.graphics().setDepth(5).setData('torre2-city-layer','bridge');
 masonry(bridge,329,139,80,24);px(bridge,349,148,38,16,0x286d85);px(bridge,356,144,24,20,0x23738e);
 pavement(bridge,329,124,80,20);masonry(bridge,327,121,84,7);masonry(bridge,327,143,84,7);
 for(let x=329;x<410;x+=10){px(bridge,x,116,3,9,0xdedec4);px(bridge,x,139,3,9,0xe7e1c6)}
 steps(bridge,308,125,20,5);steps(bridge,411,125,20,5);
 steps(bridge,270,267,38,9);
 // Small decorative weir; falling water remains independent and animated.
 masonry(terrain,348,233,50,9);px(terrain,356,232,34,24,0x6dd6e4);
 const details=scene.add.graphics().setDepth(24).setData('torre2-city-layer','street-furniture');
 building(scene,81,69,84,82,'center');building(scene,62,177,82,76,'mart');
 building(scene,454,55,122,111,'gym');steps(details,487,167,57,6);
 building(scene,212,53,79,69);building(scene,-29,86,78,79);building(scene,569,191,85,72);
 for(const p of [[205,123,91],[64,257,80],[442,180,28],[573,167,45],[212,251,42],[302,75,26],[9,172,30]])planter(details,...p);
 for(const p of [[55,150],[177,192],[320,169],[438,166],[584,184],[244,262],[443,251]])lamp(details,...p);
 for(const p of [[301,162],[421,94],[582,103],[314,243]])banner(details,...p);
 // Timber quay and boat are separate scenery objects.
 const quay=scene.add.graphics().setDepth(8).setData('torre2-city-layer','quay');
 px(quay,493,267,64,39,0x765c43);
 for(let y=268;y<306;y+=5){px(quay,493,y,64,4,0xc29866);px(quay,496,y,55,1,0xe4bd80)}
 for(const x of [491,551])for(const y of [267,303]){px(quay,x,y,5,10,0x644a37);px(quay,x,y,5,2,0xe4c08b)}
 ellipse(quay,454,293,24,43,0x145c7c,.6);poly(quay,[[443,273],[461,273],[468,290],[460,308],[448,308],[438,290]],0xcededb);
 poly(quay,[[446,278],[458,278],[463,290],[457,301],[449,301],[443,290]],0x477a94);px(quay,446,282,14,9,0xa4c5d0);px(quay,448,284,10,5,0x315575);
 const treeKey=scene.textures.exists(CITY_ATLAS_KEY)?null:treeTexture(scene),positions=[
 [10,70],[43,64],[178,73],[195,61],[317,74],[333,44],[422,69],[446,51],[596,65],[628,61],
 [12,213],[25,239],[206,279],[226,291],[319,284],[414,275],[633,186],[612,182],
 [179,131],[321,223],[434,240],[32,302],[91,309],[243,309],[610,302]
 ];
 for(const [x,y]of positions){
  const tree=addCitySprite(scene,'tree',x,y,44);
  if(tree)tree.setData('torre2-city-layer','vegetation');
  else scene.add.image(x,y,treeKey).setOrigin(.5,1).setScale(.72)
   .setDepth(20+y/1000).setData('torre2-city-layer','vegetation');
 }
 for(const [x,y,w]of [[250,134,45],[297,261,32],[436,184,27],[585,176,30]])
  addCitySprite(scene,'planter',x,y,w*188/447,{depth:25});
 const ripples=scene.add.graphics().setDepth(1).setData('torre2-city-layer','water-animation');
 const falls=scene.add.graphics().setDepth(9);
 let tick=0;
 const animate=()=>{
  ripples.clear();falls.clear();tick++;
  for(let i=0;i<56;i++){
   const x=338+(i*17%63),y=40+((i*29+tick)%225);
   px(ripples,x,y,5+(i%5),1,0xc2f4eb,i%3?.38:.7);
  }
  for(let i=0;i<54;i++){
   const x=(i*47)%640,y=286+(i*7+tick)%25;
   px(ripples,x,y,4+i%7,1,0xb5f1eb,.5);
  }
  for(let i=0;i<9;i++){px(falls,357+i*4,235+(tick+i*3)%13,2,7,0xe1ffff,.75)}
  for(let i=0;i<15;i++)px(falls,351+i*3,256+(i+tick)%4,3,1,0xd3ffff,.8);
 };
 animate();const timer=scene.time.addEvent({delay:120,loop:true,callback:animate});
 // Tag only this city's animation: the campaign owns other legitimate
 // looping events, so their count must never be used as a leak threshold.
 timer.__torre2CityWaterTimer=true;
 scene.__torre2CityWaterTimer=timer;
 // Remove from the actual Phaser Clock, not only TimerEvent.remove(): the
 // latter can leave a looping event in the clock's active queue until tick.
 ripples.once('destroy',()=>{
  scene.time.removeEvent(timer);
  if(scene.__torre2CityWaterTimer===timer)scene.__torre2CityWaterTimer=null;
  if(falls.active)falls.destroy();
 });
 return {version:CITY_ART_VERSION,layers:6,landmarks:3};
}
