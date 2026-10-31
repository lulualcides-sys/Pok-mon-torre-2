/* T34: eight isolated Kanto visual previews rendered by native Phaser/WebGL.
 * PREVIEW ONLY. No campaign stage, trainer, battle HUD, RNG or save writes.
 * All terrain and objects are original procedural graphics, not screenshots.
 */
export const REGIONS=Object.freeze([
 {id:'pallet',name:'PALLET TOWN',kind:'city',accent:0x6cad55,buildings:['Casa do Red','Casa do Rival','Laboratório Oak'],trainers:0,exit:'Rota 1'},
 {id:'route1',name:'ROTA 1',kind:'route',accent:0x78b85b,buildings:[],trainers:0,exit:'Viridian'},
 {id:'viridian',name:'VIRIDIAN CITY',kind:'city',accent:0x5aa76c,buildings:['Centro Pokémon','Poké Mart','Ginásio (fechado)','Casa'],trainers:0,exit:'Rota 2'},
 {id:'forest2',name:'ROTA 2 / FLORESTA',kind:'route',accent:0x397c49,buildings:[],trainers:3,exit:'Pewter'},
 {id:'pewter',name:'PEWTER CITY',kind:'city',accent:0x9da77b,buildings:['Centro Pokémon','Poké Mart','Ginásio Brock','Museu'],trainers:0,exit:'Rota 3'},
 {id:'route3',name:'ROTA 3',kind:'route',accent:0x9cb36a,buildings:[],trainers:4,exit:'Mt. Moon'},
 {id:'moon',name:'MT. MOON',kind:'cave',accent:0x706b8b,buildings:[],trainers:2,exit:'Rota 4'},
 {id:'route4',name:'ROTA 4',kind:'route',accent:0x8da965,buildings:[],trainers:0,exit:'Cerulean'}
]);
export const PREVIEW_ORDER=Object.freeze(REGIONS.map(x=>x.id));
export const REGION_TYPES=Object.freeze(['city','route','cave']);
export function getRegion(id){return REGIONS.find(x=>x.id===id)||null}
export function nextRegion(id,direction=1){
 const i=PREVIEW_ORDER.indexOf(id);
 return PREVIEW_ORDER[(Math.max(0,i)+direction+PREVIEW_ORDER.length)%PREVIEW_ORDER.length];
}
const FONT='Pixelify Sans, monospace';
function rect(g,x,y,w,h,c,a=1){g.fillStyle(c,a).fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function circle(g,x,y,r,c){g.fillStyle(c).fillCircle(x,y,r)}
function seedRng(n){let s=n>>>0;return()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296)}
function label(scene,x,y,value,size=10,color='#f6f0d9',center=false){
 return scene.add.text(x,y,value,{fontFamily:FONT,fontSize:size+'px',fontStyle:'bold',color,
 stroke:'#1a2831',strokeThickness:2}).setOrigin(center?.5:0,.5).setDepth(40);
}
function terrain(g,r){
 const cave=r.kind==='cave',forest=r.id==='forest2',city=r.kind==='city';
 rect(g,0,35,640,284,cave?0x343b4d:forest?0x29543b:r.id==='pewter'?0x82966a:r.accent);
 const rand=seedRng(r.id.split('').reduce((a,c)=>a*31+c.charCodeAt(0),7));
 for(let i=0;i<1000;i++){
  const x=rand()*640,y=40+rand()*275;
  rect(g,x,y,2+Math.floor(rand()*3),1+Math.floor(rand()*2),
   cave?(i%3?0x555a6b:0x7c7991):i%3?0x87bb63:0x487c4b,.22);
 }
 if(city){
  rect(g,281,43,78,274,0x9a977e);rect(g,289,43,62,274,0xd2c8a5);
  rect(g,46,180,550,48,0x9a977e);rect(g,46,187,550,34,0xd2c8a5);
  for(let x=48;x<594;x+=16){rect(g,x,188,14,2,0xe4ddc0);rect(g,x,213,14,2,0xb7ae90)}
  for(let y=46;y<315;y+=15){rect(g,290,y,60,1,0xe7dfc5)}
 }else if(cave){
  rect(g,267,42,104,277,0x555467);
  rect(g,282,42,76,277,0x817e8b);
  for(let y=44;y<318;y+=17)rect(g,286,y,67,2,0xa5a0a0);
 }else{
  // A north/south traversable corridor. Trees never occupy it.
  rect(g,256,42,128,277,forest?0x6d7956:0x8d9969);
  rect(g,269,42,102,277,forest?0xa5a779:0xc5b28b);
  for(let y=44;y<317;y+=14)rect(g,273,y,95,1,forest?0x9b9e74:0xd9c5a1);
 }
}
function tree(g,x,y,scale=1,autumn=false){
 const p=(a,b,c,d,e)=>rect(g,x+a*scale,y+b*scale,c*scale,d*scale,e);
 p(-3,1,7,18,0x594735);p(-1,2,3,16,0x96704c);
 p(-19,-24,38,25,0x183f35);p(-23,-17,46,17,0x1b5940);
 p(-16,-31,32,23,autumn?0x829c52:0x287647);
 p(-23,-20,19,14,autumn?0xa6b66b:0x348a50);
 p(3,-28,19,18,autumn?0x9ba966:0x429f55);
 p(-9,-35,19,12,autumn?0xc1bd7c:0x66b761);
 p(-14,-22,8,3,0x9dcb78);p(7,-24,6,3,0x96c56c);
 p(-20,-12,7,3,0x307548);p(10,-14,8,2,0x2a6241);
}
function flowers(g,x,y){
 rect(g,x,y,29,13,0x447e4d);
 for(let i=0;i<7;i++){
  const c=i%2?0xffd9a2:0xf2a8b6;
  rect(g,x+2+i*4,y+3+(i%3)*2,3,3,c);
  rect(g,x+3+i*4,y+4+(i%3)*2,1,1,0xfff2d7);
 }
}
function building(g,x,y,w,h,type){
 const red=type.includes('Centro'),gym=type.includes('Ginásio'),lab=type.includes('Oak');
 rect(g,x+4,y+6,w,h,0x334f4c,.35);
 rect(g,x,y+19,w,h-19,0x667568);rect(g,x+3,y+22,w-6,h-24,0xe7d8b6);
 rect(g,x+6,y+26,w-12,h-29,0xf3e7c8);
 const roof=red?0xc94f4d:gym?0x566d93:lab?0x538e95:0x3d79a0;
 rect(g,x-5,y+13,w+10,12,0x293f56);rect(g,x-2,y+9,w+4,13,roof);
 rect(g,x+5,y+3,w-10,9,roof);rect(g,x+9,y+1,w-18,3,0xb2d8cf);
 for(let yy=y+12;yy<y+21;yy+=4)for(let xx=x+4;xx<x+w-3;xx+=9)rect(g,xx,yy,6,1,0xb5d7da,.6);
 for(const wx of [x+12,x+w-23]){
  rect(g,wx,y+34,12,14,0x42647a);rect(g,wx+2,y+36,8,10,0x7ebecb);
  rect(g,wx+6,y+36,1,10,0xf6e6c8);rect(g,wx,y+49,12,2,0xb7a88e);
 }
 rect(g,x+w/2-10,y+h-24,20,24,0x314b62);
 rect(g,x+w/2-8,y+h-22,16,22,0x5b95a3);
 rect(g,x+w/2+3,y+h-11,2,2,0xffe1a0);
 rect(g,x+w/2-13,y+h-2,26,3,0xf4e7c8);
 if(red){rect(g,x+w/2-8,y+6,16,11,0xf7eddb);rect(g,x+w/2-2,y+6,4,11,0xd65a53);rect(g,x+w/2-8,y+10,16,3,0xd65a53)}
 if(gym){rect(g,x+w/2-12,y+4,24,10,0xd9c8a6);rect(g,x+w/2-7,y+6,14,5,0x759bcb)}
 if(lab){rect(g,x+10,y+24,w-20,3,0x6bb0b5)}
}
function npc(g,x,y,trainer=false){
 rect(g,x-3,y-13,7,4,trainer?0xc84d43:0x526b9c);
 rect(g,x-4,y-10,9,6,0xf1c8a0);
 rect(g,x-5,y-4,11,10,trainer?0x9c3d3c:0x477b9b);
 rect(g,x-4,y+6,3,5,0x4c4b59);rect(g,x+2,y+6,3,5,0x4c4b59);
}
function tallGrass(g,x,y){
 for(let i=0;i<5;i++){
  rect(g,x+i*6,y+2,3,8,0x276c3c);
  rect(g,x+i*6+2,y,3,6,0x58a75b);
  rect(g,x+i*6+4,y+5,2,5,0x99cb68);
 }
}
function cityObjects(g,r){
 let buildings=[];
 if(r.id==='pallet')buildings=[[78,70,112,89,'Casa do Red'],[431,70,112,89,'Casa do Rival'],[405,231,152,83,'Laboratório Oak']];
 if(r.id==='viridian')buildings=[[70,72,112,92,'Centro Pokémon'],[448,74,113,91,'Poké Mart'],[442,230,122,83,'Ginásio (fechado)'],[70,229,100,80,'Casa']];
 if(r.id==='pewter')buildings=[[64,72,112,92,'Centro Pokémon'],[448,70,112,91,'Poké Mart'],[423,228,145,84,'Ginásio Brock'],[68,225,119,86,'Museu']];
 for(const b of buildings)building(g,...b);
 for(const [x,y] of [[22,91],[25,149],[218,89],[217,155],[395,90],[609,94],[608,159],[23,260],[223,264],[391,268],[609,267]])
  tree(g,x,y,.78,r.id==='pewter');
 for(const [x,y] of [[194,195],[370,195],[236,247],[376,250],[202,82],[382,79]])flowers(g,x,y);
 for(const [x,y] of [[249,201],[380,208],[319,266]])npc(g,x,y,false);
 // Pallet's road leads north. No fake Gym or Mart.
 rect(g,295,46,48,3,0xf7ebc7);
}
function routeObjects(g,r){
 const forest=r.id==='forest2',rock=r.id==='route3',water=r.id==='route4';
 if(water){
  rect(g,393,42,247,277,0x2b91b4);
  for(let y=49;y<316;y+=12){rect(g,408+(y%4)*12,y,108,2,0x8ed7dd,.7);rect(g,553,y+3,66,1,0xcee8db,.5)}
  rect(g,385,42,9,277,0xd4c29e);
 }
 if(rock){
  for(const [x,y] of [[81,90],[148,198],[479,96],[525,246],[201,281]]){
   rect(g,x-16,y+4,37,15,0x596d61);rect(g,x-13,y-9,31,20,0x9c9b80);
   rect(g,x-6,y-13,17,6,0xc6b9a0);rect(g,x-13,y+8,31,3,0x596e67);
  }
 }
 for(let i=0;i<17;i++){
  const x=i%2?60+(i*47%170):410+(i*53%170);
  const y=54+(i*37%245);
  if(water&&x>392)continue;
  tree(g,x,y,forest?1.1:.72,rock);
 }
 for(let i=0;i<21;i++){
  const x=i%2?72+(i*31%143):396+(i*47%161),y=58+(i*41%245);
  if(water&&x>390)continue;
  tallGrass(g,x,y);
 }
 if(forest){
  rect(g,221,103,44,11,0x75573d);rect(g,226,99,35,6,0xa58153);
  for(const [x,y] of [[180,127],[448,154],[184,266]])flowers(g,x,y);
 }
 if(r.id==='route1'){
  for(const [x,y] of [[204,119],[416,204],[201,274]])flowers(g,x,y);
 }
 const spots=forest?[[321,110],[331,190],[310,266]]:rock?[[314,103],[333,161],[317,228],[335,285]]:[];
 for(const [x,y] of spots)npc(g,x,y,true);
 // Portal direction markers remain within the walkable corridor.
 rect(g,311,46,18,6,0xece4c4);rect(g,311,306,18,6,0xece4c4);
}
function caveObjects(g){
 // Natural walls, navigable center, two chamber branches.
 for(let i=0;i<26;i++){
  const x=i%2?40+(i*39%195):390+(i*37%208),y=52+(i*43%242);
  rect(g,x-12,y+4,30,13,0x272f40);
  rect(g,x-15,y-9,27,19,0x595d70);
  rect(g,x-8,y-15,18,10,0x88869a);
  rect(g,x-6,y-14,7,3,0xa9a5ac);
 }
 for(const [x,y] of [[158,109],[467,116],[190,260],[487,272]]){
  rect(g,x-10,y+6,24,8,0x31374d);
  rect(g,x-3,y-12,7,19,0x5ab6c6);
  rect(g,x+4,y-6,7,13,0x91d4d8);
  rect(g,x-2,y-9,3,11,0xc9f1e9);
 }
 rect(g,296,42,47,18,0x202735);rect(g,302,45,35,15,0x141b29);
 rect(g,296,301,47,17,0x202735);rect(g,302,301,35,14,0x141b29);
 npc(g,320,142,true);npc(g,333,244,true);
}
function header(scene,g,r){
 rect(g,0,0,640,35,0x142c36);rect(g,0,33,640,2,0x83b3ad);
 label(scene,15,17,r.name,16);
 label(scene,625,18,'PRÉVIA PHASER · NÃO INTEGRADA',9,'#c5d4cf',true).setOrigin(1,.5);
}
function footer(scene,g,r,onNavigate){
 rect(g,0,319,640,41,0x132a35);rect(g,0,319,640,2,0x93b1a0);
 const n=PREVIEW_ORDER.indexOf(r.id);
 label(scene,105,338,'◀ ANTERIOR',11,'#f4e3bb',true);
 label(scene,320,335,(n+1)+' / '+REGIONS.length+'  ·  '+r.kind.toUpperCase(),10,'#d9e6d2',true);
 label(scene,320,348,'PRÓXIMO DESTINO: '+r.exit.toUpperCase(),8,'#b7d8c8',true);
 label(scene,538,338,'PRÓXIMO ▶',11,'#f4e3bb',true);
 for(const [dir,x,key] of [[-1,105,'previous'],[1,538,'next']]){
  const z=scene.add.zone(x,340,180,38).setDepth(60).setInteractive({useHandCursor:true})
   .setData('kanto-preview-nav',key);
  z.on('pointerdown',()=>onNavigate(nextRegion(r.id,dir)));
 }
}
export function drawKantoPreview(scene,id,onNavigate){
 const r=getRegion(id);if(!r)throw Error('Unknown Kanto preview: '+id);
 if(typeof onNavigate!=='function')throw Error('Native preview navigation callback required');
 scene.children.removeAll(true);
 // Original Poké Arena Phaser runs at 1280×720 logical pixels. Preview
 // geometry is authored at 640×360; scale its own isolated camera, not HUD.
 const zoom=Math.min(scene.scale.gameSize.width/640,scene.scale.gameSize.height/360);
 scene.cameras.main.setZoom(zoom).centerOn(320,180);
 scene.cameras.main.setBackgroundColor(0x132b32);
 const g=scene.add.graphics().setDepth(0);
 terrain(g,r);
 if(r.kind==='city')cityObjects(g,r);
 else if(r.kind==='route')routeObjects(g,r);
 else caveObjects(g);
 header(scene,g,r);footer(scene,g,r,onNavigate);
 scene.__kantoPreview={id:r.id,kind:r.kind,buildings:[...r.buildings],
  trainers:r.trainers,renderer:scene.game.renderer.type,implemented:false};
 return scene.__kantoPreview;
}
