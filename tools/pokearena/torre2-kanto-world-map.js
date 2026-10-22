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
 ['viridian','forest','pewter'],
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
export function drawKantoWorldMap(scene,state,{trainerLimit=0,onBack=()=>{}}={}){
 const stage=state.stage??0,trainer=state.trainer??0;
 const position=mapVisitInfo(stage,trainer,trainerLimit);
 const g=scene.add.graphics().setDepth(1);
 // Outer navy frame and ocean
 floor(g,0,0,W,H,0x0a182c);
 floor(g,11,9,618,342,0x5f9c9a);
 floor(g,15,13,610,334,0x12324c);
 floor(g,21,56,455,281,0x3276a0);
 // Hand-constructed Kanto mainland silhouette (original tile art).
 const coast=[
  [108,319],[101,304],[104,274],[105,253],[92,236],[100,196],
  [108,177],[107,147],[117,131],[155,129],[172,144],[205,139],
  [218,114],[250,110],[253,136],[286,146],[330,144],[348,157],
  [350,194],[360,216],[352,260],[330,281],[325,320],[302,326],
  [255,318],[233,309],[213,319],[168,328],[124,328]
 ];
 g.fillStyle(0x163f50);g.fillPoints(coast.map(([x,y])=>({x:x+3,y:y+4})),true);
 g.fillStyle(0x91bd75);g.fillPoints(coast.map(([x,y])=>({x,y})),true);
 // Gold sand along the coast and light geographic patterns.
 g.lineStyle(3,0xe5d0a0);
 g.strokePoints(coast.map(([x,y])=>({x,y})),true);
 for(let y=74;y<333;y+=13)for(let x=27;x<469;x+=19){
  const t=(x*17+y*31)%13;
  if(x>360||x<100&&y>245) {
   if(t<5){floor(g,x+2,y+1,9,2,0x6fc4d8);floor(g,x+5,y+4,4,1,0xc3f9ff);}
  }else if(t<3){floor(g,x,y,6,3,0x72a766);}
 }
 // Blue sea routes, thin visible roads and city layout.
 for(const [a,b] of EDGES)line(g,a,b,5,
  ['seafoam','cinnabar','ssanne'].includes(a)||['seafoam','cinnabar','ssanne'].includes(b)?
  0x7dbfd6:0xd5bd7d);
 for(let i=0;i<24;i++){
  const x=158+(i*47)%180,y=165+(i*31)%145;
  if(Math.hypot(x-277,y-241)<35)continue;
  floor(g,x,y,8,7,0x3b8a5f);floor(g,x+2,y-4,4,6,0x54a877);
  floor(g,x+2,y+5,3,4,0x336e56);
 }
 // City and route nodes are touch targets with a detail viewer.
 let selected=position.id;
 const mark=()=>{
  for(const n of NODES){
   const m=n.id===position.id?'current':n.id===selected?'next':
    n.stage<stage?'done':'future';
   locationMarker(g,n,m);
  }
 };
 mark();
 // Keep labels sparse enough to read at 640x360 on mobile.
 const primary=new Set(['pallet','viridian','pewter','cerulean','vermilion',
  'lavender','celadon','fuchsia','saffron','cinnabar','indigo']);
 for(const n of NODES){
  if(primary.has(n.id)){
   const align=['lavender','fuchsia','indigo','cerulean'].includes(n.id)?1:0;
   label(scene,n.x+(align?-8:10),n.y-13,n.name,n.name.length>10?8:9,
    n.stage<=stage?'#fbf2ca':'#d9e6dd').setOrigin(align?1:0,0);
  }
  scene.add.zone(n.x,n.y,Math.max(29,n.small?29:37),32).setDepth(15)
   .setInteractive({useHandCursor:true}).on('pointerdown',()=>{
    selected=n.id;
    details.setText(n.name+' · '+(n.stage<=stage?'VISITADO':'À FRENTE'));
    objective.setText(n.id===position.id?'VOCÊ ESTÁ AQUI':
     n.stage>stage?'LOCAL FUTURO':'LOCAL DESBLOQUEADO');
    g.clear();
    redraw();
   });
 }
 // Right-hand FireRed-inspired town map information card.
 const sidebar=()=>{
  floor(g,482,56,149,281,0x041a2d);
  floor(g,484,59,145,275,0x16405a);
  floor(g,487,63,139,268,0x102a45);
  floor(g,489,90,135,3,0xe4c56b);
  floor(g,489,202,135,2,0x6bb5b2);
  floor(g,489,285,135,2,0xe4c56b);
 };
 const redraw=()=>{
  floor(g,21,56,455,281,0x3276a0);
  g.fillStyle(0x163f50);g.fillPoints(coast.map(([x,y])=>({x:x+3,y:y+4})),true);
  g.fillStyle(0x91bd75);g.fillPoints(coast.map(([x,y])=>({x,y})),true);
  g.lineStyle(3,0xe5d0a0);g.strokePoints(coast.map(([x,y])=>({x,y})),true);
  for(const [a,b]of EDGES)line(g,a,b,5);
  for(let i=0;i<24;i++){const x=158+(i*47)%180,y=165+(i*31)%145;
   floor(g,x,y,8,7,0x3b8a5f);floor(g,x+2,y-4,4,6,0x54a877);}
  mark();sidebar();
 };
 sidebar();
 label(scene,32,20,'MAPA DE KANTO',21,'#ffe5a4');
 label(scene,490,69,'LOCAL ATUAL',11,'#ffe4a1');
 label(scene,493,105,position.name,12,'#f0ffff');
 label(scene,493,134,'PRÓXIMO OBJETIVO',10,'#9fdcef');
 label(scene,493,154,position.objective,12,'#ffdb92');
 label(scene,493,182,'LIMITE NV. '+position.cap,11,'#b7f3c5');
 label(scene,493,219,'CIDADES E ROTAS',10,'#bceafa');
 label(scene,493,242,'Toque num local',10,'#e2f0f8');
 label(scene,493,259,'para conhecer.',10,'#e2f0f8');
 const details=label(scene,493,297,position.name,10,'#fff3c0');
 const objective=label(scene,493,314,'VOCÊ ESTÁ AQUI',9,'#9ee8bf');
 const back=scene.add.graphics().setDepth(6);
 floor(back,347,16,118,31,0x102b43);floor(back,349,18,114,27,0xc4a25c);
 floor(back,351,20,110,23,0x1d4157);
 label(scene,362,24,'◀ VOLTAR',13,'#fff4d2');
 scene.add.zone(406,31,120,35).setDepth(20).setInteractive({useHandCursor:true})
  .on('pointerdown',onBack);
 return {current:position.id,selected,locations:NODES.length};
}
