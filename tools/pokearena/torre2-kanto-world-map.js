/* KANTO TOWN MAP — Game Boy Advance inspired interactive geography.
 * Original Phaser graphics (not a screenshot and not an external bitmap).
 * Pokémon portraits, battle sprites, move effects remain Arena 2D originals.
 */
import {campaignRegion} from './kanto-regions.js';
import {currentLevelCap,KANTO_ACE_NAMES} from './kanto-levels.js';
const W=640,H=360;
const NODES=Object.freeze([
 {id:'pallet',name:'PALLET',x:124,y:292,stage:0},
 {id:'viridian',name:'VIRIDIAN',x:124,y:245,stage:0},
 {id:'forest',name:'FLORESTA',x:124,y:203,stage:0,small:true},
 {id:'pewter',name:'PEWTER',x:124,y:171,stage:0},
 {id:'moon',name:'MT. MOON',x:186,y:168,stage:1,small:true},
 {id:'cerulean',name:'CERULEAN',x:228,y:163,stage:1},
 {id:'nugget',name:'ROTA 24',x:228,y:123,stage:2,small:true},
 {id:'vermilion',name:'VERMILION',x:250,y:278,stage:2},
 {id:'ssanne',name:'S.S. ANNE',x:294,y:283,stage:2,small:true},
 {id:'rock',name:'ROCK TUNNEL',x:324,y:168,stage:3,small:true},
 {id:'lavender',name:'LAVENDER',x:337,y:218,stage:3},
 {id:'celadon',name:'CELADON',x:226,y:218,stage:3},
 {id:'fuchsia',name:'FUCHSIA',x:310,y:309,stage:4},
 {id:'saffron',name:'SAFFRON',x:277,y:229,stage:5},
 {id:'silph',name:'SILPH CO.',x:284,y:206,stage:5,small:true},
 {id:'seafoam',name:'SEAFOAM',x:204,y:309,stage:6,small:true},
 {id:'cinnabar',name:'CINNABAR',x:124,y:320,stage:6},
 {id:'victory',name:'VICTORY ROAD',x:74,y:174,stage:8,small:true},
 {id:'indigo',name:'INDIGO PLATEAU',x:74,y:113,stage:8}
]);
const EDGES=Object.freeze([
 ['pallet','viridian'],['viridian','forest'],['forest','pewter'],
 ['pewter','moon'],['moon','cerulean'],['cerulean','nugget'],
 ['cerulean','rock'],['rock','lavender'],['cerulean','saffron'],
 ['saffron','vermilion'],['saffron','celadon'],['saffron','lavender'],
 ['celadon','lavender'],['lavender','fuchsia'],['celadon','fuchsia'],
 ['vermilion','ssanne'],['vermilion','fuchsia'],
 ['fuchsia','seafoam'],['seafoam','cinnabar'],['cinnabar','pallet'],
 ['viridian','victory'],['victory','indigo']
]);
const PROGRESSION=Object.freeze([
 ['pallet','viridian','forest','pewter'],
 ['moon','moon','cerulean','cerulean'],
 ['nugget','saffron','ssanne','vermilion'],
 ['rock','rock','lavender','celadon'],
 ['celadon','fuchsia','fuchsia','fuchsia','fuchsia'],
 ['saffron','saffron','silph','silph','saffron'],
 ['seafoam','seafoam','seafoam','cinnabar','cinnabar','cinnabar'],
 ['pallet','viridian','viridian','viridian'],
 ['victory','victory','indigo','indigo'],
 ['indigo'],['indigo'],['indigo'],['indigo']
]);
function floor(g,x,y,w,h,c){g.fillStyle(c,1);g.fillRect(x,y,w,h)}
function label(scene,x,y,str,size=10,col='#f5f0dc'){
 return scene.add.text(x,y,str,{
  fontFamily:'Pixelify Sans, monospace',fontSize:size+'px',fontStyle:'bold',
  color:col,stroke:'#07152a',strokeThickness:3}).setDepth(6);
}
function line(g,from,to,w=4,col=0xd4b16f){
 const a=NODES.find(n=>n.id===from),b=NODES.find(n=>n.id===to);
 if(!a||!b)return;
 const bend=from==='viridian'&&to==='victory'?{x:75,y:245}:null;
 g.lineStyle(w+3,0x3d564a);
 if(bend){g.lineBetween(a.x,a.y,bend.x,bend.y);g.lineBetween(bend.x,bend.y,b.x,b.y);}
 else{g.lineBetween(a.x,a.y,b.x,b.y);}
 g.lineStyle(w,col);
 if(bend){g.lineBetween(a.x,a.y,bend.x,bend.y);g.lineBetween(bend.x,bend.y,b.x,b.y);}
 else g.lineBetween(a.x,a.y,b.x,b.y);
}
function locationMarker(g,n,mode){
 const {x,y}=n,r=n.small?4:7;
 const colors={done:0x77d4a4,current:0xffd56b,next:0x67c7f3,future:0x728d9b};
 const color=colors[mode];
 floor(g,x-r-2,y-r-1,r*2+5,r*2+5,0x15283c);
 floor(g,x-r,y-r+1,r*2+1,r*2+1,color);
 floor(g,x-r+2,y-r+2,r*2-3,2,0xffffff);
 if(mode==='current'){
  g.lineStyle(2,0xffeeab);
  g.strokeRect(x-r-5,y-r-4,r*2+11,r*2+11);
  // FRLG-style flashing player pointer, visible even in static snapshots.
  floor(g,x-3,y-19,7,8,0xf1be4a);
  floor(g,x-2,y-20,5,4,0xffefbc);
  floor(g,x-1,y-11,3,4,0x2e5d83);
 }
}
export function worldPosition(stage,trainer,totalTrainers){
 if(stage>=13)return 'indigo';
 const sequence=PROGRESSION[Math.max(0,Math.min(12,stage))];
 const page=Math.min(sequence.length-1,Math.floor(
  Math.max(0,trainer)/Math.max(1,(totalTrainers+1)/sequence.length)));
 return sequence[Math.max(0,page)]||'pallet';
}
export function mapVisitInfo(stage,trainer,limit){
 const id=worldPosition(stage,trainer,limit);
 const region=campaignRegion(stage,
  Math.floor(Math.max(0,trainer)/5),Math.max(1,Math.ceil((limit+1)/5)),stage>=13);
 const node=NODES.find(n=>n.id===id)||NODES[0];
 const next=stage>=12?'SALÃO DO CAMPEÃO':stage>=8?'LIGA POKÉMON':
  ['BROCK','MISTY','LT. SURGE','ERIKA','KOGA','SABRINA','BLAINE','GIOVANNI'][stage];
 return {id,name:node.name,region,objective:next,cap:currentLevelCap(stage)};
}
// Original 16-bit styled map for WebGL: locations and the coastline are
// generated as individually-drawn tiles; no screenshot or single map texture.
const COAST=[
 [114,320],[105,306],[110,275],[111,252],[99,235],[104,190],
 [111,168],[114,138],[128,123],[152,126],[177,137],[205,136],
 [218,111],[254,110],[260,131],[294,141],[333,140],
 [346,158],[350,201],[365,224],[358,268],[339,291],
 [332,318],[301,323],[267,314],[240,308],[204,318],
 [175,318],[151,323],[129,326]
];
function inside(x,y,poly=COAST){
 let yes=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j],hit=((a[1]>y)!==(b[1]>y))&&
   (x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]);
  if(hit)yes=!yes;
 }
 return yes;
}
function tile(g,x,y,c){floor(g,x,y,8,8,c);}
function pine(g,x,y,k=1){
 const w=7*k;
 floor(g,x-w-2,y+7*k,2*w+5,3*k,0x235343);
 floor(g,x-2*k,y+3*k,4*k,8*k,0x6e5837);
 floor(g,x-w,y,2*w,6*k,0x176b4c);
 floor(g,x-(w-2*k),y-5*k,2*w-4*k,8*k,0x2f9a60);
 floor(g,x-3*k,y-8*k,6*k,4*k,0x7bc978);
 floor(g,x-w+2*k,y+2*k,5*k,2*k,0x52b773);
}
function mountain(g,x,y,k=1){
 // Staggered shaded stepped peaks, almost tile-for-tile GBA palette density.
 floor(g,x-11*k,y+7*k,23*k,7*k,0x536e62);
 floor(g,x-9*k,y+1*k,19*k,10*k,0x819688);
 floor(g,x-6*k,y-5*k,13*k,12*k,0x9fac9c);
 floor(g,x-3*k,y-9*k,7*k,8*k,0xe6ddbd);
 floor(g,x+3*k,y-2*k,3*k,11*k,0x62786d);
 floor(g,x-11*k,y+12*k,24*k,2*k,0x3f5d57);
}
function route(g,a,b,surf=false){
 const s=NODES.find(n=>n.id===a),t=NODES.find(n=>n.id===b);
 if(!s||!t)return;
 const elbow=a==='viridian'&&b==='victory'?{x:74,y:245}:null;
 const pts=elbow?[s,elbow,t]:[s,t];
 const col=surf?0x9deaf0:0xf7df9d;
 for(let i=1;i<pts.length;i++){
  const p=pts[i-1],q=pts[i];
  const segments=[{x:p.x,y:p.y},{x:q.x,y:p.y},{x:q.x,y:q.y}];
  // Map roads in FRLG meet at right angles.
  for(let j=1;j<segments.length;j++){
   const u=segments[j-1],v=segments[j];
   g.lineStyle(11,0x34685c,1);g.lineBetween(u.x,u.y,v.x,v.y);
   g.lineStyle(7,surf?0x328ec3:0xbd9b62,1);g.lineBetween(u.x,u.y,v.x,v.y);
   g.lineStyle(4,col,1);g.lineBetween(u.x,u.y,v.x,v.y);
  }
 }
}
function statusAt(node,stage,current){
 return node.id===current?'VOCÊ ESTÁ AQUI':
  node.stage<stage?'VISITADO':node.stage===stage?'ÁREA ATUAL':'AINDA NÃO VISITADO';
}
function pin(g,n,kind){
 const {x,y}=n,r=n.small?4:6;
 const colors={past:0x71d1a0,here:0xffd05a,now:0x75d5ee,locked:0x7d94a8};
 floor(g,x-r-2,y-r-2,r*2+5,r*2+5,0x0e263a);
 floor(g,x-r,y-r,r*2+1,r*2+1,colors[kind]??colors.locked);
 floor(g,x-r+1,y-r+1,r*2-1,2,0xecfff6);
 floor(g,x-r+2,y+r-2,r*2-4,2,0x426b7c);
 if(kind==='here'){
  g.lineStyle(2,0xffecc0);g.strokeRect(x-r-5,y-r-5,r*2+11,r*2+11);
  floor(g,x-4,y-20,9,7,0x102a46);
  floor(g,x-3,y-18,7,5,0xffcc4a);
  floor(g,x-1,y-12,3,3,0xffffff);
 }
}
function tileRelief(g){
 // Crisp two-layer water grid with readable sea routes and coast.
 for(let y=62;y<334;y+=8)for(let x=22;x<473;x+=8){
  const n=(x*47+y*37)%17,land=inside(x+4,y+4);
  const c=land?(n<4?0x93c77a:n<11?0x80b76e:0xa4d287):
   (n<7?0x3c98c4:n<12?0x4aaed4:0x2e89bd);
  tile(g,x,y,c);
  if(land){
   if(n%5===0)floor(g,x+1,y+5,4,1,0xc6e5a0);
   else if(n%4===0)floor(g,x+3,y+2,2,2,0x5eaa66);
  }else{
   if(n<5)floor(g,x+1,y+2,6,1,0xace9e6);
   if(n===8)floor(g,x+3,y+6,4,1,0x87d2eb);
  }
 }
 // Hand-built coastline, rocky Kanto northern ridges and forest belts.
 const coastPoly=COAST.map(([x,y])=>({x,y}));
 g.lineStyle(3,0xe9d79e);g.strokePoints(coastPoly,true);
 const hills=[[126,140],[145,143],[169,153],[201,140],[239,136],
  [301,151],[332,160],[110,180],[324,192]];
 for(const [x,y]of hills)mountain(g,x,y,.65);
 for(const [x,y]of [
  [157,177],[160,194],[180,193],[204,190],[304,177],
  [315,184],[326,251],[320,268],[268,282],[234,291],
  [161,257],[155,242],[119,214],[188,245],[337,235]
 ])pine(g,x,y,1);
}
function font(scene,x,y,text,size=10,color='#faf5db',align='left'){
 return label(scene,x,y,text,size,color).setOrigin(
  align==='right'?1:align==='center'?.5:0,0);
}
function uiPanel(g,x,y,w,h,bright=false){
 floor(g,x+3,y+4,w,h,0x07172a);
 floor(g,x,y,w,h,bright?0xe9c579:0x8bd0e9);
 floor(g,x+2,y+2,w-4,h-4,0x0a223a);
 floor(g,x+5,y+5,w-10,h-10,0x13425a);
 floor(g,x+6,y+5,w-12,2,bright?0xffedb1:0xb5eef4);
 for(const [a,b]of [[x,y],[x+w-4,y],[x,y+h-4],[x+w-4,y+h-4]])
  floor(g,a+1,b+1,3,3,0xffe5a5);
}
export function drawKantoWorldMap(scene,state,{trainerLimit=0,onBack=()=>{}}={}){
 const stage=state.stage??0,trainer=state.trainer??0;
 const position=mapVisitInfo(stage,trainer,trainerLimit);
 let selectedId=position.id;
 const background=scene.add.graphics().setDepth(1);
 floor(background,0,0,640,360,0x07152b);
 floor(background,7,6,626,348,0x153b64);
 floor(background,10,9,620,342,0x9ad9dc);
 floor(background,13,12,614,336,0x0c2945);
 // Large iconic FRLG Town Map board: header, sea and routes, sidebar.
 uiPanel(background,18,15,453,38,true);
 floor(background,18,56,454,281,0x2b80b6);
 tileRelief(background);
 const waterways=new Set(['seafoam','cinnabar','ssanne','pallet']);
 for(const [a,b]of EDGES)route(background,a,b,waterways.has(a)&&waterways.has(b)||
  waterways.has(a)&&['fuchsia','vermilion'].includes(b)||
  waterways.has(b)&&['fuchsia','vermilion'].includes(a));
 // Optional buildings, no need for missing / remote sprite assets.
 for(const n of NODES){
  if(n.small)continue;
  const urban=['saffron','celadon','vermilion','viridian','pewter','cerulean','fuchsia'].includes(n.id);
  const x=n.x+8,y=n.y+7;
  floor(background,x-5,y-8,12,10,0x315b61);
  floor(background,x-4,y-7,10,4,urban?0xd95b51:0x4d82b4);
  floor(background,x-3,y-3,8,7,0xffebbb);
  floor(background,x,y,3,4,0x64503f);
 }
 uiPanel(background,482,57,145,280,false);
 const heading=font(scene,36,25,'MAPA DE KANTO',18,'#ffedb7');
 font(scene,488,73,'LOCAL ATUAL',10,'#ffdd93');
 const currentText=font(scene,489,93,position.name,12,'#f8ffff');
 font(scene,490,120,'PRÓXIMO OBJETIVO',10,'#9cdde9');
 const objective=font(scene,490,141,position.objective,12,'#ffdf83');
 floor(background,489,166,130,2,0x59a3b5);
 font(scene,489,174,'LIMITE DO GINÁSIO',10,'#b5e7d9');
 font(scene,489,192,'NV. '+position.cap,17,'#f9df82');
 floor(background,489,221,130,2,0x59a3b5);
 font(scene,489,229,'LOCAL SELECIONADO',10,'#acd5eb');
 const detail=font(scene,489,250,position.name,11,'#fff0c6');
 const status=font(scene,489,267,'VOCÊ ESTÁ AQUI',9,'#b6fac8');
 floor(background,489,291,129,2,0xa9c9bc);
 font(scene,489,299,'■ Atual  ◆ Rota',9,'#dbf2ea');
 font(scene,489,314,'Toque para explorar',9,'#a9c8e0');
 // Static labels intentionally avoid the busiest node clusters.
 const sparseLabels=[
  ['INDIGO',74,91,'center'],['PEWTER',135,160,'left'],
  ['VIRIDIAN',135,231,'left'],['PALLET',134,281,'left'],
  ['CERULEAN',232,150,'left'],['CELADON',212,200,'right'],
  ['SAFFRON',275,240,'center'],['VERMILION',250,296,'center'],
  ['LAVENDER',360,208,'left'],['FUCHSIA',313,320,'left'],
  ['CINNABAR',111,327,'left']
 ];
 for(const [name,x,y,align]of sparseLabels){
  font(scene,x,y,name,8,'#fff5d9',align);
 }
 const symbols=scene.add.graphics().setDepth(8);
 const focus=scene.add.graphics().setDepth(10);
 const repaint=()=>{
  symbols.clear();focus.clear();
  for(const n of NODES)pin(symbols,n,
   n.id===position.id?'here':n.stage<stage?'past':
   n.stage===stage?'now':'locked');
  const selected=NODES.find(n=>n.id===selectedId)||NODES[0];
  focus.lineStyle(2,0xfff4bd);
  focus.strokeRect(selected.x-11,selected.y-11,22,22);
  focus.lineStyle(1,0x164659);
  focus.strokeRect(selected.x-13,selected.y-13,26,26);
 };
 repaint();
 for(const n of NODES){
  scene.add.zone(n.x,n.y,n.small?27:30,30).setDepth(15)
   .setInteractive({useHandCursor:true}).on('pointerdown',()=>{
    selectedId=n.id;
    detail.setText(n.name);
    status.setText(statusAt(n,stage,position.id));
    status.setColor(n.id===position.id?'#b6fac8':
      n.stage>stage?'#c6cee1':'#ffdd8c');
    repaint();
   });
 }
 const back=scene.add.graphics().setDepth(11);
 uiPanel(back,352,17,114,34,true);
 font(scene,364,25,'◀ VOLTAR',12,'#fff1c1');
 scene.add.zone(408,33,122,39).setDepth(16)
  .setInteractive({useHandCursor:true}).on('pointerdown',onBack);
 // Simple accessible legend and progress ribbon.
 font(scene,34,61,'R',8,'#e7f1e5');
 return {current:position.id,selected:selectedId,locations:NODES.length};
}
