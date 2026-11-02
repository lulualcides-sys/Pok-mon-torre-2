import {CERULEAN_LANDMARKS} from './city-layout.js';
import {addCitySprite,addCitySurface,addRegionalGym,addCityBoat} from './city-atlas.js';
const profiles=[
 ['PEWTER CITY','BROCK','stone',[[105,155],[115,257],[470,170]]],
 ['CERULEAN CITY','MISTY','water',[]],
 ['VERMILION CITY','LT. SURGE','electric',[[105,153],[295,153],[505,170]]],
 ['CELADON CITY','ERIKA','garden',[[105,155],[535,155],[320,250]]],
 ['FUCHSIA CITY','KOGA','poison',[[105,155],[535,155],[320,260]]],
 ['SAFFRON CITY','SABRINA','psychic',[[105,155],[535,155],[320,220]]],
 ['CINNABAR ISLAND','BLAINE','volcano',[[125,180],[305,260],[500,200]]],
 ['VIRIDIAN CITY','GIOVANNI','forest',[[100,150],[540,165],[320,260]]],
 ['INDIGO PLATEAU','ELITE DOS QUATRO','league',[[110,240],[530,240],[320,185]]]
];
export function cityProfile(stage){
 const p=profiles[Math.min(stage,8)];if(!p)return null;
 return {name:p[0],leader:p[1],theme:p[2],landmarks:stage===1?CERULEAN_LANDMARKS:
 p[3].map(([x,y],i)=>({id:['center','mart','gym'][i],label:['CENTRO POKÉMON','POKÉ MART',stage>=8?'LIGA POKÉMON':'GINÁSIO'][i],x,y,doorY:y-(i===2?(stage>=8?55:stage===7?44:27):27)}))};
}
export function renderRegionalScenery(scene,profile){
 const theme=profile.theme,water=[],g=scene.add.graphics().setDepth(4).setData('torre2-city-layer','terrain');
 const rect=(x,y,w,h,c)=>g.fillStyle(c).fillRect(x,y,w,h);
 const tile=(name,x,y,w,h,depth=2)=>{const o=addCitySurface(scene,name,x,y,w,h,depth,name==='water'?.65:.25);if(name==='water'&&o)water.push(o);return o};
 const road=(x,y,w,h)=>{rect(x-2,y-2,w+4,h+4,0x8c9a87);tile('paving',x,y,w,h,5)};
 const pond=(x,y,w,h)=>{rect(x-3,y-3,w+6,h+6,0x93b6a2);tile('water',x,y,w,h,5)};
 const tree=(x,y,h=43)=>addCitySprite(scene,'tree',x,y,h);
 const hedge=(x,y,w)=>{for(let i=0;i<w;i+=22)tree(x+i,y,31)};
 const flower=(x,y)=>addCitySprite(scene,'planter',x,y,15);
 const cliff=(x,y,w,h)=>{tile('stone',x,y,w,h,3);rect(x,y,w,3,0xc0c8b0);rect(x,y+h-3,w,3,0x526a69)};
 const stairs=(x,y,w,h)=>{road(x,y,w,h);const lines=scene.add.graphics().setDepth(6).fillStyle(0xb5b29a);for(let a=y;a<y+h;a+=5)lines.fillRect(x,a,w,2);};
 tile('grass',0,35,640,273,0);
 if(theme==='stone'){
  cliff(0,40,640,40);cliff(0,80,53,205);cliff(575,78,65,208);
  road(56,165,520,42);road(228,80,48,226);stairs(395,169,148,36);
  for(const [x,y]of [[65,95],[260,100],[320,95],[315,255],[555,257]]){cliff(x,y,35,24);flower(x+18,y+24)}
  addCitySprite(scene,'house',300,148,63);
 }else if(theme==='electric'){
  tile('water',0,220,640,88,0);cliff(0,211,640,12);road(0,173,640,37);
  for(const x of [85,275,485])road(x,144,36,40);
  rect(375,220,64,87,0x8e6749);for(let y=222;y<307;y+=6)rect(376,y,62,2,0xddb77b);
  for(const x of [373,435])for(let y=221;y<306;y+=25)rect(x,y,5,13,0xd6b683);
  addCityBoat(scene,333,302,78);addCityBoat(scene,485,294,58);
  for(const x of [35,220,590]){rect(x,150,3,42,0x706b55);rect(x-9,151,21,3,0xc7c5a6);}
 }else if(theme==='garden'){
  road(60,160,520,34);road(280,80,80,218);road(60,270,520,25);
  for(const x of [160,430])for(const y of [220,260]){hedge(x,y,70);flower(x+25,y+8)}
  pond(470,213,95,45);addCitySprite(scene,'house',220,125,60);
 }else if(theme==='poison'){
  road(70,167,500,28);road(295,190,50,110);pond(258,57,115,63);
  hedge(145,256,75);hedge(435,255,75);
  for(const x of [50,395]){for(let y=210;y<287;y+=14){rect(x,y,170,2,0xbb986a);}for(let dx=0;dx<=170;dx+=34)rect(x+dx,207,3,80,0xe0bb7f);}
  for(const [x,y]of [[80,245],[160,280],[438,280],[535,240]])tree(x,y,43);
 }else if(theme==='psychic'){
  tile('paving',0,35,640,273,0);road(0,167,640,35);road(282,35,76,273);
  for(const x of [190,420])for(const y of [130,285]){rect(x-28,y-65,57,65,0x354e64);rect(x-25,y-65,50,65,0x768ca3);rect(x+21,y-65,6,65,0x536a80);rect(x-29,y-68,59,7,0xbed3ce);rect(x-23,y-75,46,7,0x8fa5b0);rect(x-17,y-79,13,4,0xc4cfc7);for(let a=0;a<3;a++)for(let b=0;b<4;b++){rect(x-20+a*16,y-54+b*13,11,10,0x354e64);rect(x-19+a*16,y-53+b*13,8,7,0xaddfdf);rect(x-19+a*16,y-53+b*13,2,7,0x77b2c1);}rect(x-27,y-2,56,3,0xd0cbb3);}
  for(const x of [40,595]){hedge(x,270,40);flower(x+10,285)}
 }else if(theme==='volcano'){
  tile('water',0,35,640,273,0);cliff(55,139,535,146);cliff(92,95,480,75);
  tile('grass',60,143,525,134,4);road(110,184,440,31);road(281,209,48,70);
  // Texture-backed basalt mountain, not a flat placeholder triangle.
  const mountain=tile('stone',240,40,169,97,4);
  if(mountain){
   const shape=scene.make.graphics({x:0,y:0,add:false});
   shape.fillStyle(0xffffff).fillTriangle(240,137,325,40,409,137);
   const mask=shape.createGeometryMask();mountain.setMask(mask);
   mountain.once('destroy',()=>{mask.destroy();shape.destroy()});
  }
  g.fillStyle(0xb86249).fillTriangle(301,68,325,40,348,68);
  rect(319,67,9,62,0xf2a255);rect(326,99,22,7,0xc97045);
  addCityBoat(scene,38,287,65);
 }else if(theme==='forest'){
  road(65,167,510,29);road(285,191,70,112);pond(442,219,128,66);
  hedge(130,243,85);hedge(149,284,60);hedge(245,94,170);
  for(const x of [30,610])for(let y=100;y<300;y+=41)tree(x,y,55);
 }else{
  tile('stone',0,35,640,273,0);cliff(200,73,240,125);stairs(270,190,100,116);
  road(60,243,520,29);road(83,211,52,48);road(505,211,52,48);
  for(const x of [200,435]){rect(x,110,4,167,0xd9cc9d);rect(x+4,110,23,60,0x72588e);rect(x+9,119,12,39,0xd6c792);}
 }
 // Small residential blocks frame each service district without adding menus.
 const homes={
  stone:[[365,268,64],[520,266,61]],
  electric:[[205,120,62],[390,128,65]],
  garden:[[430,126,62],[75,263,59],[570,280,57]],
  poison:[[200,136,62],[440,136,62]],
  psychic:[[191,285,53],[421,285,53]],
  volcano:[[230,183,57],[407,260,62]],
  forest:[[210,139,64],[435,142,62],[110,275,63]],league:[]
 };
 const gardens={
  stone:[[168,105],[195,258],[315,213],[550,114]],
  electric:[[37,135],[247,104],[350,151],[585,144]],
  garden:[[172,111],[390,110],[119,252],[410,280]],
  poison:[[36,138],[238,105],[392,99],[596,146]],
  psychic:[[34,141],[245,134],[396,139],[599,141]],
  volcano:[[75,174],[192,258],[370,177],[550,257]],
  forest:[[157,111],[251,145],[394,147],[590,210]],
  league:[[63,165],[150,146],[484,150],[574,169]]
 };
 for(const [x,y,h]of homes[theme]){
  // Courtyards are real paving tiles under the individual houses.
  tile('paving',x-31,y-10,62,23,5);
  addCitySprite(scene,'house',x,y,h);flower(x+26,y+12);
 }
 for(const [x,y]of gardens[theme]){
  tree(x,y,39);tree(x+19,y-12,33);flower(x+4,y+12);
 }
 const lamps=theme==='electric'?[[62,207],[255,207],[465,207],[594,207]]:
 theme==='league'?[[249,239],[388,239],[249,290],[388,290]]:
 theme==='volcano'?[[188,214],[368,214],[551,215]]:
 [[73,195],[565,195],[265,286],[375,286]];
 const furniture=scene.add.graphics().setDepth(21);
 for(const [x,y]of lamps){
  furniture.fillStyle(0x253f4c).fillRect(x-2,y-23,4,24).fillRect(x-5,y-1,10,3);
  furniture.fillStyle(0x839d9d).fillRect(x-1,y-22,1,20);
  furniture.fillStyle(0x213c4b).fillRect(x-5,y-29,10,8).fillRect(x-3,y-32,6,3);
  furniture.fillStyle(0xffdfa0).fillRect(x-3,y-27,6,5);
 }
 // Shared vegetation and architecture, with each city's layout kept independent.
 for(const [x,y]of (theme==='volcano'?[[78,190],[560,143],[574,269]]:[[18,79],[48,70],[600,78],[629,85]]))tree(x,y,46);
 for(const p of profile.landmarks){
  if(p.id==='gym')addRegionalGym(scene,theme,p.x,p.y-5,theme==='league'?137:114);
  else addCitySprite(scene,p.id,p.x,p.y-4,80);
  flower(p.x-49,p.y+4);
 }
 if(water.length){
  const timer=scene.time.addEvent({delay:120,loop:true,callback:()=>water.forEach(o=>{if(o.active)o.tilePositionY+=.18})});
  timer.__torre2CityWaterTimer=true;
  g.once('destroy',()=>scene.time.removeEvent(timer));
 }
 return {version:'regional-cities-v1',theme,layers:6,landmarks:3};
}
