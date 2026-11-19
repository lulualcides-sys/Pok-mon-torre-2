import {scenicBackdrop,scenicDiorama,scenicIcon} from './premium-art.js';
/* Pokémon Torre 2 — seleção cinematográfica da campanha via cards.
 * Somente apresentação Phaser; jamais altera progressão, time, saves
 * ou a interface aprovada da Arena. Sprites reais FRLG e PMD.
 */
import {STAGES,TRAINERS_PER_GYM,currentOpponent,rematchOpponent,trainerSpeciesForLevel,rivalChampionTeam,campaignStarter,KANTO_DEX} from './campaign-core.js';
import {regionalTrainerPartySize,regionalTrainerParty} from './torre2-trainer-rosters.js';
import {trainerClass,drawTrainer} from './campaign-sprites.js';
import {addFireRedNPC} from './frlg-npc.js';
import {requestCardPortrait} from './card-portrait-cache.js';
import {ball,drawBadgeIcon} from './campaign-art.js';
// Native Poké Arena 2D UI kit: same panels, gold buttons, Cifras font, type
// pills and lock as the base client menus (League/Gyms). Presentation only.
import {UI,marco,aro,rectRedondo,candado,pastillaTipo,fondoMenu} from '../ui.js';
import {texto,estrechar,COLOR,caso,MOVIL} from '../config.js';
import {buscar} from '../datos.js';
import {ROOM_CROPS} from './frlg-interiors.js';

const PALETTE={
 navy:0x06172b,panel:0x0c2845,body:0x123755,edge:0x3b77a6,
 ocean:0x1e527a,light:0x8cc9ed,gold:0xf6c851,sun:0xffe6a2,
 cream:0xf7f4df,green:0x50cc84,lock:0x50677c,shadow:0x040d1d
};
const LEADERS=['brock','misty','surge','erika','koga','sabrina','blaine',
 'giovanni','lorelei','bruno','agatha','lance','rival'];
export const LEADER_DIALOGUE=Object.freeze([
 'As pedras não cedem facilmente. Mostre sua força!',
 'A água é minha aliada. Está pronto para o desafio?',
 'Minha eletricidade vai colocar sua equipe à prova!',
 'Vamos descobrir se você respeita a força da natureza.',
 'Um bom ninja vence antes mesmo de ser visto.',
 'A mente pode vencer a força. Vamos descobrir!',
 'Meu fogo não perdoa distrações. Está preparado?',
 'O verdadeiro poder exige estratégia e coragem.',
 'Não subestime o frio da Elite Four.',
 'A força precisa de disciplina. Venha me enfrentar.',
 'Os espíritos conhecem os segredos da batalha.',
 'Mostre que pode superar o poder dos dragões.',
 'Chegou até aqui? Agora enfrente o campeão!'
]);
// Native Cifras text (texto) keeps the base client font and its automatic
// mobile enlargement. `size` keeps the old pixel scale of callers.
// Native sentence case, keeping Kanto proper nouns capitalised.
const PROPER=['Kanto','Índigo','Pokémon','Pokédex','Elite','Four','Rocket',
 'Pewter','Cerulean','Vermilion','Celadon','Fuchsia','Saffron','Cinnabar','Viridian','Pallet','Lavender',
 'Brock','Misty','Surge','Erika','Koga','Sabrina','Blaine','Giovanni','Lorelei','Bruno','Agatha','Lance'];
const PROPER_RX=new RegExp('(^|[^\\p{L}])('+PROPER.join('|')+')(?![\\p{L}])','giu');
function pretty(value){
 const s=caso(String(value));
 return s.replace(PROPER_RX,(_m,pre,word)=>pre+PROPER.find(w=>w.toLowerCase()===word.toLowerCase()))
  // Portuguese one-letter articles/conjunctions stay lower case mid-sentence.
  .replace(/(\s)([OAE])(?=\s)/g,(_m,sp,l)=>sp+l.toLowerCase());
}
function text(scene,layer,x,y,value,size=11,color='#f5f4e9',props={}){
 const tam=Math.max(8,Math.round(size*.8));
 const t=texto(scene,x,y,pretty(value),{tam,color,borde:3,colorBorde:UI.bordeTexto,literal:true})
  .setOrigin(.5);
 if(props.wordWrap)t.setWordWrapWidth(props.wordWrap.width).setAlign(props.align||'center');
 layer.add(t);return t;
}
const NATIVE_GREEN=0x50cc84;
// Native marco "panel" frame (League/Gyms cards); a coloured edge only marks
// state that is ALSO written in text (gold = next, green = defeated).
function box(scene,layer,x,y,w,h,{edge=null,alpha=.9}={}){
 const g=scene.add.graphics();
 const borde=edge===PALETTE.gold||edge===UI.oro?UI.oro:edge===PALETTE.green||edge===NATIVE_GREEN?NATIVE_GREEN:null;
 marco(g,x,y,w,h,'panel',{alfa:alpha,...(borde&&{borde})});
 layer.add(g);return g;
}
// Crisp pixel-art icon set (12x12, drawn pixel by pixel; FRLG palette).
const ICON_PAL={k:0x101828,w:0xf8f8f8,r:0xe04848,R:0xa82830,g:0xc8d0d8,G:0x808890,
 b:0x78b8f0,B:0x2f68c0,y:0xf8d048,Y:0xb88a20,n:0xc08040,N:0x80502a,c:0xf2e8cc,d:0x3a64b0};
function ballGrid(top,stripe=null){
 const rows=[];
 for(let j=0;j<12;j++){let row='';
  for(let i=0;i<12;i++){
   const d=Math.hypot(i-5.5,j-5.5);
   if(d>5.9){row+='.';continue}
   if(d>4.9){row+='k';continue}
   const bd=Math.hypot(i-5.5,j-5.5);
   if(j===5||j===6){row+=(Math.abs(i-5.5)<1.6?'w':'k');continue}
   if(bd<1.6){row+='w';continue}
   if(j<5)row+=(stripe&&(i===2||i===9)&&j>=2?stripe:(i===3&&j===2)||(i===2&&j===3)?'w':top);
   else row+=(j>=9&&i<=3)?'g':'w';
  }rows.push(row)}
 return rows;
}
const PIXEL_ICONS={
 team:ballGrid('r'),
 capture:ballGrid('B','r'),
 bag:['....kkkk....','...kn..nk...','..kkkkkkkk..','.knnnnnnnnk.','.knnnnnnnnk.','.kNNNyyNNNk.',
  '.knnnyynnnk.','.knnnnnnnnk.','.knnnnnnnnk.','.kNnnnnnnNk.','..kkkkkkkk..','............'],
 center:['..kkkkkkkk..','.krrrrrrrrk.','krrrrwwrrrrk','krrrwwwwrrrk','krrrrwwrrrrk','kkkkkkkkkkkk',
  '.kcbbccbbck.','.kcbbccbbck.','.kcccddccck.','.kcccddccck.','.kkkkkkkkkk.','............'],
 shop:['............','..kkkkkkkk..','.kBbBbBbBbk.','kBbBbBbBbBbk','kkkkkkkkkkkk','.kcccccccck.',
  '.kcbbccddck.','.kcbbccddck.','.kccccddcck.','.kkkkkkkkkk.','............','............'],
 more:['............','............','............','............','.kkk.kkk.kkk','.kwk.kwk.kwk',
  '.kkk.kkk.kkk','............','............','............','............','............'],
 train:['............','............','.kk......kk.','kggk....kggk','kggkkkkkkggk','kggGGGGGGggk',
  'kggkkkkkkggk','kggk....kggk','.kk......kk.','............','............','............'],
 seeker:['....kk......','...kgk......','..kkkkkkk...','.kyyyyyyyk..','.kyrrryyyk..','.kyrRryyyk..',
  '.kyrrryyyk..','.kyyyyyyyk..','.kYYkkYYYk..','.kyyyyyyyk..','..kkkkkkk...','............'],
 dex:['............','.kkkkkkkkkk.','.krrrrrrrRk.','.krkkkrrrRk.','.krkbbkrrRk.','.krkbwkrrRk.',
  '.krkkkrrrRk.','.krrrrrrrRk.','.krwwwwwrRk.','.krrrrrrrRk.','.kkkkkkkkkk.','............'],
 badges:['...kk..kk...','...kb..bk...','....kbbk....','...kkkkkk...','..kyyyyyyk..','.kyyywyyyyk.',
  '.kyywwwyyyk.','.kyyywyyyyk.','.kYyyyyyyYk.','..kYYYYYYk..','...kkkkkk...','............'],
 audio:['............','............','....kk......','...kgk..k...','kkkgGk...k..','kgggGk.k.k..',
  'kgggGk.k.k..','kkkgGk...k..','...kgk..k...','....kk......','............','............'],
 fullscreen:['kkkk....kkkk','kwwk....kwwk','kwk......kwk','kk........kk','............','............',
  '............','............','kk........kk','kwk......kwk','kwwk....kwwk','kkkk....kkkk']
};
export function pixelIcon(scene,layer,kind,x,y,scale=2){
 const grid=PIXEL_ICONS[kind];if(!grid)return null;
 const g=scene.add.graphics();layer.add(g);
 const ox=Math.round(x-6*scale),oy=Math.round(y-6*scale);
 grid.forEach((row,j)=>[...row].forEach((ch,i)=>{
  const c=ICON_PAL[ch];if(c===undefined)return;
  g.fillStyle(c,1).fillRect(ox+i*scale,oy+j*scale,scale,scale);
 }));
 g.setData('torre2-pixel-icon',kind);
 return g;
}
// Gym trainers and leaders stand inside their own FireRed gym interior.
// Each city's sheet is loaded on demand (one at a time), never at preload.
const GYM_CROPS=Object.freeze({
 pewter:[790,544,190,247],cerulean:[1033,24,258,317],vermilion:[1034,24,168,340],
 celadon:[1154,700,204,298],fuchsia:[1030,23,247,365],saffron:[1550,21,402,330],
 cinnabar:[712,22,484,395],viridian:[1030,24,320,385]
});
function gymCrop(stage){
 const loc=String(STAGES[stage]?.city||'').toLowerCase();
 return GYM_CROPS[loc]?{loc,rect:GYM_CROPS[loc]}:null;
}
// ---------------------------------------------------------------------------
// Hand-made pixel art (drawn in "art pixels", integer scale, nearest).
// A standard FireRed-style ROUTE scene for every route card, and one city
// landmark emblem per Kanto city. Presentation only.
function pixelCanvas(scene,layer,x,y,w,h,scale){
 const g=scene.add.graphics();layer.add(g);
 const W=Math.floor(w/scale),H=Math.floor(h/scale);
 const ox=Math.round(x+(w-W*scale)/2),oy=Math.round(y+(h-H*scale)/2);
 // Clipped to the canvas: art never spills over the card frame.
 const px=(c,i,j,ww=1,hh=1)=>{
  const i0=Math.max(0,i),j0=Math.max(0,j),i1=Math.min(W,i+ww),j1=Math.min(H,j+hh);
  if(i1>i0&&j1>j0)g.fillStyle(c,1).fillRect(ox+i0*scale,oy+j0*scale,(i1-i0)*scale,(j1-j0)*scale);
 };
 return {g,W,H,px};
}
const RT={sky:0x8cd0f8,skyLow:0xc4e8f8,cloud:0xf8f8f8,cloudShade:0xd2eaf8,hill:0x6cb46c,hillDark:0x559c5a,
 leaf:0x3a9c46,leafDark:0x22743a,leafLight:0x70cc60,trunk:0x7a5230,grass:0x80cc58,grassDark:0x64b440,
 tall:0x3c9a3c,tallDark:0x2a7430,tallTip:0x9ae070,path:0xe8d098,pathEdge:0xc8a868,pathDark:0xb8945c,
 wood:0xb07840,woodDark:0x6c4422,board:0xf0e0b0,fence:0xf4ecd8,fenceDark:0x8a6a48,red:0xe85858,white:0xf8f8f8,yellow:0xf8d848};
function routeScene(scene,layer,x,y,w,h,variant=0){
 const scale=w>150?4:2;
 const {W,H,px}=pixelCanvas(scene,layer,x,y,w,h,scale);
 const horizon=Math.round(H*.48);
 // Sky with two soft clouds.
 px(RT.sky,0,0,W,Math.round(horizon*.55));px(RT.skyLow,0,Math.round(horizon*.55),W,horizon);
 const cloud=(cx,cy)=>{px(RT.cloud,cx+1,cy,5,1);px(RT.cloud,cx,cy+1,8,2);px(RT.cloudShade,cx+1,cy+3,6,1)};
 cloud(3+(variant*5)%6,2);cloud(W-14-(variant*3)%5,5);
 // Rolling hills.
 for(let i=0;i<W;i++){const top=horizon-3-Math.round(2*Math.sin((i+variant*3)/6));
  px(RT.hill,i,top,1,horizon-top);px(RT.hillDark,i,horizon-1,1,1)}
 // Tree line on the horizon (round FRLG-like canopies).
 for(let t=-2;t<W;t+=7){
  const cx=t+3,cy=horizon+1;
  px(RT.leafDark,cx-3,cy-2,7,5);px(RT.leaf,cx-2,cy-3,5,6);px(RT.leaf,cx-3,cy-1,7,3);
  px(RT.leafLight,cx-1,cy-2,2,1);px(RT.leafLight,cx-2,cy-1,1,1);px(RT.trunk,cx,cy+3,1,2);
 }
 const ground=horizon+5;
 // Grass with a light checker texture.
 px(RT.grass,0,ground,W,H-ground);
 for(let j=ground;j<H;j++)for(let i=(j%2)*2;i<W;i+=4)if((i+j*3)%7===0)px(RT.grassDark,i,j,1,1);
 // Dirt path in perspective, centred (the trainer stands on it).
 for(let j=ground;j<H;j++){
  const half=2+Math.round((j-ground)*.45),c=Math.floor(W/2);
  px(RT.path,c-half,j,half*2,1);px(RT.pathEdge,c-half-1,j,1,1);px(RT.pathEdge,c+half,j,1,1);
  if((j+variant)%5===0)px(RT.pathDark,c-1+((j*7)%3),j,1,1);
 }
 // Tall grass patches on both sides.
 const tuft=(tx,ty)=>{px(RT.tallDark,tx,ty+2,4,1);px(RT.tall,tx,ty+1,1,1);px(RT.tall,tx+2,ty+1,1,1);
  px(RT.tall,tx+1,ty,1,2);px(RT.tall,tx+3,ty,1,2);px(RT.tallTip,tx+1,ty,1,1);px(RT.tallTip,tx+3,ty,1,1)};
 for(let j=ground+Math.round((H-ground)*.45);j<H-2;j+=3)
  for(let i=1;i<Math.floor(W/2)-7-Math.round((j-ground)*.45);i+=4){tuft(i,j);tuft(W-i-4,j)}
 // Route sign (left) and a short fence (right).
 const sx=2,sy=ground+1;
 px(RT.woodDark,sx+3,sy+4,1,4);px(RT.woodDark,sx,sy,8,5);px(RT.board,sx+1,sy+1,6,3);
 px(RT.woodDark,sx+2,sy+2,1,1);px(RT.woodDark,sx+4,sy+2,2,1);
 for(let i=W-12;i<W-1;i+=3){px(RT.fenceDark,i,ground+1,1,4);px(RT.fence,i,ground,1,4)}
 px(RT.fence,W-12,ground+1,11,1);px(RT.fenceDark,W-12,ground+2,11,1);
 // A few flowers (the only per-card variation).
 for(let k=0;k<4;k++){const fx=(variant*11+k*13)%(W-4)+2,fy=ground+2+((variant*5+k*7)%Math.max(1,H-ground-4));
  const c=Math.floor(W/2),half=2+Math.round((fy-ground)*.45);
  if(Math.abs(fx-c)<=half+1)continue;
  px(k%2?RT.red:RT.white,fx,fy,1,1);px(RT.yellow,fx,fy+1,1,1)}
 return true;
}
// City landmark emblems (FireRed references), 28x28 art pixels at 2x.
const LM={sky:0x90d0f8,skyLow:0xc8ecf8,sea:0x3a88d8,seaLight:0x78b8f0,ground:0x78c058,groundDark:0x58a040,
 rock:0x9c9c9c,rockDark:0x6c6c74,rockLight:0xc8c8c8,snow:0xf0f0f0,wood:0xa86c38,woodDark:0x6c4422,
 white:0xf8f8f8,red:0xd84848,redDark:0x983030,gold:0xf0c040,blue:0x4878c8,blueDark:0x2c4c88,
 glass:0x98d0f0,pink:0xf090b0,lava:0xf87830,lavaLight:0xf8d040,smoke:0xc8c8d0,leaf:0x3a9c46,leafDark:0x22743a,leafLight:0x70cc60,
 purple:0x8858c0,dark:0x283048};
function cityLandmark(scene,layer,x,y,size,stage){
 const city=String(STAGES[stage]?.city||'').toLowerCase();
 const {W,H,px}=pixelCanvas(scene,layer,x,y,size,size,2);
 px(LM.sky,0,0,W,Math.round(H*.5));px(LM.skyLow,0,Math.round(H*.5),W,H);
 const ground=(c=LM.ground,top=H-6)=>{px(c,0,top,W,H-top);px(LM.groundDark,0,top,W,1)};
 const tree=(cx,cy,r=4)=>{px(LM.leafDark,cx-r,cy-r+1,r*2+1,r*2);px(LM.leaf,cx-r+1,cy-r,r*2-1,r*2);
  px(LM.leafLight,cx-r+2,cy-r+1,2,1);px(LM.woodDark,cx,cy+r,1,3)};
 const window=(wx,wy,cols,rows,c=LM.glass)=>{for(let a=0;a<cols;a++)for(let b=0;b<rows;b++)px(c,wx+a*2,wy+b*2,1,1)};
 if(city==='pewter'){ // grey boulder mountain (Mt. Moon / Pewter stone)
  ground();for(let j=0;j<16;j++){const half=Math.round(j*.85);px(LM.rockDark,14-half,6+j,half*2+1,1);px(LM.rock,14-half+1,6+j,Math.max(1,half*2-2),1)}
  px(LM.snow,13,6,3,1);px(LM.snow,12,7,5,1);px(LM.rockLight,10,13,2,2);px(LM.rockLight,17,16,2,2);
  px(LM.rockDark,3,H-9,6,3);px(LM.rock,4,H-10,4,2);px(LM.rockDark,20,H-8,5,2);
 }else if(city==='cerulean'){ // Nugget Bridge over the river
  px(LM.sea,0,15,W,H-15);for(let i=1;i<W;i+=4)px(LM.seaLight,i,18+(i%3),2,1);
  px(LM.woodDark,0,12,W,1);px(LM.wood,0,13,W,2);for(let i=1;i<W;i+=3)px(LM.woodDark,i,13,1,2);
  for(let i=2;i<W;i+=6){px(LM.woodDark,i,8,1,5);px(LM.wood,i,8,1,1)}px(LM.wood,0,9,W,1);
  tree(4,6,3);
 }else if(city==='vermilion'){ // S.S. Anne at the harbour
  px(LM.sea,0,18,W,H-18);for(let i=0;i<W;i+=5)px(LM.seaLight,i+1,20+(i%2)*2,3,1);
  px(LM.dark,3,15,22,1);px(LM.white,4,12,20,3);px(LM.red,4,15,20,2);px(LM.white,8,9,12,3);
  window(9,10,6,1,LM.blue);px(LM.red,16,4,3,5);px(LM.dark,16,4,3,1);px(LM.smoke,18,1,3,2);
 }else if(city==='celadon'){ // department store and flowers
  ground();px(LM.dark,6,3,16,H-9);px(LM.white,7,4,14,H-11);window(9,6,6,6);
  px(LM.blue,12,H-9,4,3);px(LM.red,6,2,16,2);
  for(let i=1;i<W;i+=3)px(i%2?LM.pink:LM.red,i,H-4,1,1);
 }else if(city==='fuchsia'){ // Safari Zone: gate hut, palm trees and pond
  ground();px(LM.sea,15,H-8,10,3);px(LM.seaLight,17,H-7,4,1);
  const palm=(cx,top,hgt)=>{
   for(let j=0;j<hgt;j++)px(j%2?LM.wood:LM.woodDark,cx+(j>hgt*.6?1:0),top+j,2,1);
   px(LM.leafDark,cx-5,top-1,12,2);px(LM.leaf,cx-4,top-2,10,2);px(LM.leafLight,cx-2,top-2,3,1);
   px(LM.leaf,cx-6,top+1,3,1);px(LM.leaf,cx+5,top+1,3,1);px(LM.leafDark,cx-1,top-4,4,2);
   px(LM.gold,cx,top,2,1);
  };
  palm(6,8,H-14);palm(21,5,H-17);
  px(LM.woodDark,10,H-11,9,5);px(LM.gold,10,H-12,9,2);px(LM.white,11,H-10,7,3);px(LM.woodDark,13,H-9,3,3);
 }else if(city==='saffron'){ // Silph Co. tower
  ground();px(LM.dark,9,2,10,H-8);px(LM.blueDark,10,3,8,H-10);window(11,4,4,9);
  px(LM.dark,13,0,2,2);px(LM.red,13,0,2,1);px(LM.blue,12,H-9,4,3);
  px(LM.rockDark,2,H-14,5,8);window(3,H-12,2,3);px(LM.rockDark,21,H-12,5,6);window(22,H-10,2,2);
 }else if(city==='cinnabar'){ // volcano with lava
  px(LM.sea,0,H-6,W,6);px(LM.seaLight,2,H-4,4,1);px(LM.seaLight,18,H-3,5,1);
  for(let j=0;j<15;j++){const half=4+Math.round(j*.75);px(LM.rockDark,14-half,7+j,half*2,1);px(LM.rock,14-half+1,7+j,Math.max(1,half-1),1)}
  px(LM.lava,11,7,6,2);px(LM.lavaLight,12,7,4,1);px(LM.lava,13,9,2,4);px(LM.lava,15,12,1,3);
  px(LM.smoke,10,3,3,2);px(LM.smoke,14,1,4,2);px(LM.smoke,17,3,3,2);
 }else if(city==='viridian'){ // Viridian Forest
  ground();tree(6,10,5);tree(20,9,5);tree(13,14,4);
 }else{ // Indigo Plateau
  ground();px(LM.dark,4,9,20,H-15);px(LM.white,5,10,18,H-17);px(LM.red,3,7,22,3);
  px(LM.redDark,3,9,22,1);window(7,12,6,2);px(LM.blue,12,H-9,4,3);
  px(LM.dark,13,1,1,6);px(LM.gold,14,1,4,3);
 }
 return true;
}
const cityOf=stage=>String(STAGES[stage]?.city||'').toLowerCase();
// Draws one window of an official FireRed location sheet (nearest filter).
// The sheet loads on demand; the approved diorama shows until it arrives.
// The campaign releases these textures on restart, so the live loader
// queue (not a remembered flag) decides whether to request it again.
function frlgWindow(scene,layer,x,y,w,h,loc,[fx,fy,fw,fh],stage,variant){
 const key='frlg-location-'+loc,frame='torre2-win-'+loc+'-'+fx+'-'+fy+'-'+fw+'-'+fh;
 const slot=scene.add.container(0,0);layer.add(slot);
 const draw=()=>{
  if(!slot.active||!scene.textures.exists(key))return;
  const tex=scene.textures.get(key);
  if(!tex.has(frame))tex.add(frame,0,fx,fy,fw,fh);
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  slot.removeAll(true);
  slot.add(scene.add.image(x,y,key,frame).setOrigin(0).setDisplaySize(w,h));
 };
 if(scene.textures.exists(key)){draw();return true}
 scenicDiorama(scene,slot,x,y,w,h,stage,variant);
 scene.load.once('filecomplete-image-'+key,()=>draw());
 const queued=[scene.load.list,scene.load.inflight].some(set=>
  (set?.entries||[]).some(file=>file?.key===key));
 if(!queued){
  scene.load.image(key,'assets/ui/frlg/'+loc+'.png');
  if(!scene.load.isLoading())scene.load.start();
 }
 return true;
}
function gymInterior(scene,layer,x,y,w,h,stage,variant=0){
 const info=gymCrop(stage);
 if(!info)return false;
 const [cx,cy,cw,ch]=info.rect;
 // Leader podium at the top of the room; trainers further down the room.
 const aspect=w/h,fw=Math.min(cw,Math.round(ch*aspect)),fh=Math.min(ch,Math.round(fw/aspect));
 const lanes=Math.max(1,Math.floor((ch-fh)/Math.max(1,fh*.45)));
 const fy=cy+Math.min(ch-fh,Math.round((variant%(lanes+1))*fh*.45));
 const fx=cx+Math.round((cw-fw)/2);
 return frlgWindow(scene,layer,x,y,w,h,info.loc,[fx,fy,fw,fh],stage,variant);
}
// Town region of a FireRed location sheet: the city map is always at the
// top-left; rooms sit to its right (top row) or below it.
function townRegion(loc){
 const rooms=Object.values(ROOM_CROPS[loc]||{});
 if(!rooms.length)return null;
 const right=Math.min(...rooms.filter(r=>r[1]<100&&r[0]>200).map(r=>r[0]))-6;
 if(!Number.isFinite(right)||right<200)return null;
 const below=rooms.filter(r=>r[0]<right).map(r=>r[1]);
 return {x:4,y:18,w:right-4,h:(below.length?Math.min(...below):9999)-24};
}
// Route cards: a real 1:1 slice of the destination city's FireRed map.
function townView(scene,layer,x,y,w,h,stage,variant=0){
 const loc=cityOf(stage),r=townRegion(loc);
 if(!r)return false;
 const ww=Math.round(w),wh=Math.round(h);
 const spanX=Math.max(1,r.w-ww),spanY=Math.max(1,Math.min(r.h,660)-wh);
 const fx=r.x+((variant*173+41)%spanX),fy=r.y+((variant*97+67)%spanY);
 return frlgWindow(scene,layer,x,y,w,h,loc,[fx,fy,ww,wh],stage,variant);
}
function control(scene,layer,x,y,w,h,label,fn,{gold=false,muted=false,
 id='',size=10,icon=null,center=false}={}){
 const g=scene.add.graphics();layer.add(g);
 const paint=(hover=false)=>{
  g.clear();
  marco(g,x,y,w,h,muted?'apagado':gold?'oro':'azul');
  if(hover&&!muted)aro(g,x-2,y-2,w+4,h+4,UI.anillo,6,.7);
 };
 paint();
 if(icon)pixelIcon(scene,layer,icon,x+17,y+h/2,h>=34?2:h>=26?2:1);
 const caption=text(scene,layer,x+w/2+(icon&&!center?12:0),y+h/2,label,size,
  muted?UI.apagadoTexto:gold?UI.textoOscuro:UI.texto);
 if(gold)caption.setStroke(UI.oroLuz,0);
 estrechar(caption,w-(icon?38:10));
 // Hover ring is paint only: no additional interactive surface or larger target.
 const focus=scene.add.graphics();layer.add(focus);
 const zone=scene.add.zone(x+w/2,y+h/2,w,h)
  .setInteractive({useHandCursor:!muted}).setData('torre2-card-control',id||label);
 layer.add(zone);
 let lastPress=-Infinity;
 if(!muted){
  zone.on('pointerover',()=>paint(true)).on('pointerout',()=>paint(false));
  zone.on('pointerdown',(_p,_x,_y,event)=>{
   event?.stopPropagation?.();
   const now=Date.now();
   if(now-lastPress<190)return;
   lastPress=now;
   fn?.();
  });
 }
 return zone;
}
// Trainer-card frame: native marco "panel" (as the League cards). Gold edge =
// next challenge, green = defeated, plain = locked; the state is also written.
function trainerCardFrame(scene,layer,x,y,w,h,entry){
 const edge=entry.active?PALETTE.gold:entry.completed?PALETTE.green:0x587790;
 box(scene,layer,x,y,w,h,{edge,alpha:entry.locked?.6:.92});
 return edge;
}
function npc(scene,layer,kind,x,y,scale=2.3){
 const image=addFireRedNPC(scene,kind,x,y,{scale,depth:0});
 if(image){
  // Most FRLG sheets are 16x32 cells; the biker sheet uses 32x32 cells
  // (10 frames in 320px). A 16px crop showed only half the cyclist.
  const tex=image.texture,src=tex?.source?.[0];
  if(src&&src.height===32&&src.width===320){
   if(!tex.has('torre2-front-32x32'))tex.add('torre2-front-32x32',0,0,0,32,32);
   image.setFrame('torre2-front-32x32');
  }
  layer.add(image);return image;
 }
 const g=scene.add.graphics();drawTrainer(g,x,y-16,kind,1.3);layer.add(g);
 return g;
}
function npcKind(stage,index,leader=false){
 if(leader)return LEADERS[stage]||'rival';
 const n=STAGES[stage];
 if(!n)return 'youngster';
 const opponent=currentOpponent({stage,trainer:index,team:[],champion:false,starter:'bulbasaur'});
 if(opponent?.kind==='rival'||opponent?.kind==='rocket')return opponent.kind;
 return opponent?.spriteKind||trainerClass(stage,index,opponent?.kind||'trainer',stage===0?'forest':'route');
}
const dexKey=name=>String(name||'').toLowerCase().replace('♀','-f').replace('♂','-m').replace(/[^a-z0-9]/g,'');
const nationalDex=new Map(KANTO_DEX.map((name,i)=>[dexKey(name),String(i+1).padStart(4,'0')]));
export function enemyPortraitDex(scene,id){
 const known=nationalDex.get(dexKey(id));if(known)return known;
 try{
  const m=scene.__torre2PathData?.buscar?.(id);
  const dex=m&&(m.etapa>0?m.def.evoluciones?.[m.etapa-1]?.dex:m.def.dex);
  return dex?String(dex).padStart(4,'0'):null;
 }catch{return null}
}
function portraitDex(scene,id){return enemyPortraitDex(scene,id)}
function portrait(scene,layer,id,x,y,size=43,role='opponent'){
 const dex=portraitDex(scene,id);
 if(!dex)return null;
 const key='torre2-portrait-'+dex;
 const show=()=>{
  if(!layer.active||!scene.textures.exists(key))return;
  const image=scene.add.image(x,y,key).setDisplaySize(size,size)
   .setData(role==='team'?'torre2-team-preview-sprite':'torre2-opponent-sprite',id)
   .setData(role==='team'?'torre2-team-preview-size':'torre2-opponent-size',size);
  layer.add(image);
 };
 if(scene.textures.exists(key)){show();return key;}
 // Native on-demand PMD portraits with bounded callbacks and one
 // request per species; unavailable art cannot retry infinitely.
 requestCardPortrait(scene,key,'assets/pmd/'+dex+'/portrait.png',show);
 return key;
}
export function trainerCardEntries(state){
 const stage=state.stage,total=TRAINERS_PER_GYM(stage);
 const progress=Math.max(0,Math.min(total,state.trainer||0));
 return Array.from({length:total+1},(_,index)=>{
  const leader=index===total;
  // currentOpponent is a pure roster projection; it does not save or start.
  const foe=currentOpponent({...state,trainer:index,champion:false});
  const leaderSpecies=stage===12?rivalChampionTeam(campaignStarter(state)):
   (STAGES[stage]?.leaderTeam?.length?STAGES[stage].leaderTeam:[foe?.id]);
  const party=leader?leaderSpecies:
   regionalTrainerParty(stage,index,foe?.id,
    regionalTrainerPartySize(stage,index),foe?.kind)
   .map(id=>trainerSpeciesForLevel(id,foe?.level));
  return {index,leader,foe,completed:index<progress,
   active:index===progress,locked:index>progress,
   species:party.filter(Boolean)};
 });
}
function status(entry){
 return entry.completed?'VENCIDO':entry.active?'DISPONÍVEL':'BLOQUEADO';
}
// The previous list preview was 22px; detail portrait was 53px.
export const OPPONENT_SPRITE_SCALE=0.5;
export const OPPONENT_LIST_SPRITE_SIZE=22*OPPONENT_SPRITE_SCALE;
export const OPPONENT_DETAIL_SPRITE_SIZE=53*OPPONENT_SPRITE_SCALE;
const MINI=22,MINI_STEP=24;
function miniChip(scene,layer,id,x,y,{dim=false,gold=false}={}){
 const g=scene.add.graphics();layer.add(g);
 rectRedondo(g,x,y,MINI,MINI,UI.contorno,4);
 rectRedondo(g,x+1,y+1,MINI-2,MINI-2,gold?UI.oro:UI.panelBorde,3);
 rectRedondo(g,x+2,y+2,MINI-4,MINI-4,0x0c1844,2);
 ball(g,x+MINI/2,y+MINI/2,4);
 const key=portrait(scene,layer,id,x+MINI/2,y+MINI/2,MINI-4);
 if(dim&&key)layer.list.filter(o=>o.getData?.('torre2-opponent-sprite')===id).forEach(o=>o.setTint(0x6f7f9a));
 return g;
}
// Always every real opponent (1–6): one row up to four, else two rows of 3.
export const OPPONENT_CHIP_SPRITE_SIZE=MINI-4;
function compactRoster(scene,layer,entry,x,y){
 const list=entry.species.slice(0,6),perRow=list.length>4?3:Math.max(1,list.length);
 list.forEach((id,i)=>{
  const row=Math.floor(i/perRow),inRow=Math.min(perRow,list.length-row*perRow);
  const x0=Math.round(x-(inRow*MINI_STEP-2)/2);
  miniChip(scene,layer,id,x0+(i%perRow)*MINI_STEP,y+row*MINI_STEP,{dim:entry.locked});
 });
 return Math.ceil(list.length/perRow);
}
function typesOf(id){
 try{
  const m=buscar(id);if(!m?.def)return [];
  const stage=m.etapa>0?m.def.evoluciones?.[m.etapa-1]:null;
  return (stage?.tipos||m.def.tipos||[]).slice(0,2);
 }catch{return []}
}
// Native type pills of the opponent's lead Pokémon, with readable labels.
function typePills(scene,layer,types,cx,y){
 if(!types.length)return;
 const w=46,gap=3,x0=Math.round(cx-(types.length*w+(types.length-1)*gap)/2);
 const g=scene.add.graphics();layer.add(g);
 types.forEach((t,i)=>{
  pastillaTipo(g,x0+i*(w+gap),y,t,w,10);
  text(scene,layer,x0+i*(w+gap)+w/2,y+5,t,8,UI.texto);
 });
}
function extrasPage(scene,state,handlers){
 const layer=scene.add.container(0,0).setDepth(410);
 layer.setData('torre2-cards-extras',true);
 const shade=scene.add.graphics();
 shade.fillStyle(0x020a1c,.78);shade.fillRect(0,0,640,360);
 marco(shade,96,30,448,300,'panel');
 layer.add(shade);
 layer.add(scene.add.zone(320,180,640,360).setInteractive());
 text(scene,layer,320,52,'MAIS OPÇÕES',20,UI.amarillo);
 text(scene,layer,320,74,'CAMPANHA DE KANTO',10,UI.suave);
 const close=fn=>()=>{layer.destroy(true);fn?.()};
 const actions=[
  ['CAPTURA',handlers.capture,'capture'],['TREINO',handlers.training,'train'],
  ['VS SEEKER',handlers.rematchAtlas,'seeker'],['POKÉDEX',handlers.dex,'dex'],
  ['INSÍGNIAS',handlers.badges,'badges'],['ÁUDIO',handlers.audio,'audio'],
  ['TELA CHEIA',()=>{if(scene.scale.isFullscreen)scene.scale.stopFullscreen();
   else scene.scale.startFullscreen({navigationUI:'hide'})},'fullscreen'],
  ['REINICIAR JORNADA',handlers.reset,null]
 ];
 actions.forEach(([name,fn,icon],i)=>{
  const x=118+(i%2)*208,y=92+Math.floor(i/2)*46;
  control(scene,layer,x,y,196,36,name,name==='TELA CHEIA'?fn:close(fn),
   {id:'cards-extras-'+i,size:11,icon,center:true});
 });
 control(scene,layer,236,290,168,28,'VOLTAR',()=>layer.destroy(true),
  {id:'cards-extras-close',size:10});
 const credits=text(scene,layer,320,322,'ARTE DOS CENÁRIOS · CRÉDITOS',8,UI.tenue);
 const z=scene.add.zone(320,322,240,14).setInteractive({useHandCursor:true});
 z.on('pointerdown',()=>window.open('assets/ui/scenic/CREDITS.txt','_blank','noopener'));
 layer.add(z);credits.setData('torre2-credits',true);
 return layer;
}
// Four native cards per page (League width), legible on phones.
export const CARDS_PER_PAGE=4;
// Pure presentation: routes and gym leaders occupy distinct pages.
// Encounter indices, save keys, click targets and original battles are untouched.
export function trainerCardSections(stage,total){
 if(!Number.isInteger(stage)||stage<0||!Number.isInteger(total)||total<0)
  throw Error('Invalid campaign stage/card total');
 const routeCount=stage<8?Math.max(0,total-(stage===0?3:4)):stage===8?total:0;
 const sections=[];
 const pageGroup=(start,count,kind)=>{
  if(count<=0)return;
  const pages=Math.ceil(count/4),base=Math.floor(count/pages),extra=count%pages; // 4 = CARDS_PER_PAGE
  let cursor=start;
  for(let i=0;i<pages;i++){
   const size=base+(i<extra?1:0);
   sections.push({kind,indices:Array.from({length:size},(_,j)=>cursor+j)});
   cursor+=size;
  }
 };
 pageGroup(0,routeCount,stage===8?'victory':'route');
 pageGroup(routeCount,total-routeCount+1,stage<8?'gym':'league');
 return sections;
}
// Left column: city identity, progress to the leader and the live team.
function cityPanel(scene,layer,state,all){
 const spec=STAGES[state.stage]||{},x=8,y=34,w=150,h=266;
 box(scene,layer,x,y,w,h);
 // City emblem: a pixel-art landmark of the city in a gold frame.
 const plate=scene.add.graphics();layer.add(plate);
 rectRedondo(plate,x+6,y+6,60,60,UI.contorno,8);
 rectRedondo(plate,x+7,y+7,58,58,UI.oroBorde,7);
 rectRedondo(plate,x+8,y+8,56,56,UI.oro,6);
 cityLandmark(scene,layer,x+10,y+10,52,state.stage);
 const shine=scene.add.graphics();layer.add(shine);
 shine.fillStyle(UI.oroLuz,1).fillRect(x+14,y+8,44,1);
 const league=state.stage>=8;
 text(scene,layer,x+108,y+18,(league?'LIGA ÍNDIGO':(spec.city||'KANTO')).toUpperCase(),12,UI.amarillo);
 text(scene,layer,x+108,y+34,(league?(spec.leader||'ELITE'):'LÍDER '+(spec.leader||'')).toUpperCase(),9,UI.suave);
 if(spec.type){
  const g=scene.add.graphics();layer.add(g);pastillaTipo(g,x+82,y+44,spec.type,52,11);
  text(scene,layer,x+108,y+50,spec.type,8,UI.texto);
 }
 // Progress to the leader: native track + gold fill, also written as n/total.
 const total=Math.max(1,all.length-1),done=Math.min(total,state.trainer||0);
 text(scene,layer,x+8,y+80,league?'ATÉ O DESAFIO':'ATÉ O LÍDER',8,UI.suave).setOrigin(0,.5);
 text(scene,layer,x+w-8,y+80,done+' / '+total,9,UI.amarillo).setOrigin(1,.5);
 const bar=scene.add.graphics();layer.add(bar);
 rectRedondo(bar,x+8,y+88,w-16,8,UI.contorno,3);
 rectRedondo(bar,x+9,y+89,w-18,6,UI.apagado,2);
 if(done>0)rectRedondo(bar,x+9,y+89,Math.max(4,Math.round((w-18)*done/total)),6,UI.oro,2);
 // Team: always visible, real portraits, level and HP; opens the team screen.
 text(scene,layer,x+8,y+108,'SUA EQUIPE',9,UI.texto).setOrigin(0,.5);
 text(scene,layer,x+w-8,y+108,'₽ '+Number(state.money||0).toLocaleString('pt-BR'),9,UI.amarillo).setOrigin(1,.5);
 const team=state.team||[];
 for(let i=0;i<6;i++){
  const ry=y+118+i*24,m=team[i],active=i===(state.active||0)&&m;
  const g=scene.add.graphics();layer.add(g);
  if(active){rectRedondo(g,x+5,ry-1,w-10,23,UI.oro,4,.28);aro(g,x+5,ry-1,w-10,23,UI.oro,4,.9);}
  rectRedondo(g,x+8,ry,21,21,UI.contorno,4);rectRedondo(g,x+9,ry+1,19,19,0x0c1844,3);
  if(!m){ball(g,x+18,ry+10,4);g.setAlpha(.45);continue;}
  ball(g,x+18,ry+10,4);
  portrait(scene,layer,m.id,x+18,ry+10,19,'team');
  const lv=m.progression?.level??m.level??'?';
  text(scene,layer,x+34,ry+6,String(m.id).replace(/-/g,' ').toUpperCase(),8,UI.texto).setOrigin(0,.5);
  text(scene,layer,x+w-9,ry+6,'NV '+lv,8,UI.suave).setOrigin(1,.5);
  const hp=Math.max(0,Math.min(100,Number(m.hp??100)));
  rectRedondo(g,x+34,ry+14,w-44,5,UI.contorno,2);
  if(hp>0)g.fillStyle(hp>50?COLOR.vida:hp>20?COLOR.vidaMedia:COLOR.vidaBaja,1)
   .fillRect(x+35,ry+15,Math.max(1,Math.round((w-46)*hp/100)),3);
 }
 const teamZone=scene.add.zone(x+w/2,y+190,w,148).setInteractive({useHandCursor:true})
  .setData('torre2-card-control','cards-team-panel');
 teamZone.on('pointerdown',(_p,_x,_y,e)=>{e?.stopPropagation?.();handlers.pokemon?.()});
 layer.add(teamZone);
}
function badgeStrip(scene,layer,state){
 const earned=new Set(state.badges||[]);
 for(let i=0;i<8;i++){
  const got=earned.has(STAGES[i]?.badge)||(state.badges||[]).length>i&&!STAGES[i]?.badge;
  const icon=drawBadgeIcon(scene,i,486+i*19,14,got,1);layer.add(icon);
 }
}
function cardsPage(scene,state,handlers){
 const all=trainerCardEntries(state);
 const current=all.find(e=>e.active)||all.at(-1);
 const sections=trainerCardSections(state.stage,all.length-1);
 const maxPage=sections.length-1;
 const desired=Math.max(0,sections.findIndex(x=>x.indices.includes(state.trainer||0)));
 const progressKey=state.stage+':'+(state.trainer||0);
 if(scene.__torre2CardProgressKey!==progressKey){
  scene.__torre2CardPage=desired;
  scene.__torre2CardProgressKey=progressKey;
 }
 const page=Math.min(maxPage,Math.max(0,scene.__torre2CardPage??desired));
 scene.__torre2CardPage=page;
 const visibleEntries=sections[page].indices.map(index=>all[index]);
 const layer=scene.add.container(0,0).setDepth(200);
 layer.setData('torre2-trainer-cards-root',true);
 // Native checkered menu background (same as League/Gyms), behind the layer.
 // Native checkered menu background, moved INTO this layer so it covers the
 // campaign scene's own lower layers (they stay intact underneath).
 fondoMenu(scene,28);
 [...(scene.fondoMenu||[])].reverse().forEach(o=>layer.addAt(o,0));
 scene.fondoMenu=null;
 // City identity: the approved regional backdrop as a light wash over the
 // native background (each city keeps its own scenery and colours).
 scenicBackdrop(scene,layer,state.stage).setAlpha(.28);
 const blocker=scene.add.zone(320,180,640,360).setInteractive();
 layer.add(blocker);
 const city=STAGES[state.stage]?.city||'KANTO';
 const kind=sections[page].kind;
 const area=kind==='route'?'CAMINHO PARA '+city.toUpperCase():
  kind==='victory'?'ESTRADA DA VITÓRIA':
  kind==='league'?(state.stage>=12?'CAMPEÃO':'LIGA ÍNDIGO'):
  'GINÁSIO DE '+city.toUpperCase();
 // Header exactly like native cabecera: back at left, gold title, info right.
 control(scene,layer,6,4,74,20,'< MENU',handlers.menu,{id:'menu',size:9});
 const title=text(scene,layer,320,15,area,18,UI.amarillo);
 const half=title.displayWidth/2+14;
 pixelIcon(scene,layer,'team',320-half,15,1);pixelIcon(scene,layer,'team',320+half,15,1);
 badgeStrip(scene,layer,state);
 cityPanel(scene,layer,state,all);
 // Section line + pager.
 const heading=visibleEntries[0].index+1,last=visibleEntries.at(-1).index+1;
 text(scene,layer,174,44,(heading===last?'DESAFIO '+heading:'DESAFIOS '+heading+'–'+last)+' DE '+(all.length),9,UI.suave).setOrigin(0,.5);
 text(scene,layer,560,44,'PÁGINA '+(page+1)+' / '+(maxPage+1),9,UI.tenue).setOrigin(1,.5);
 control(scene,layer,568,35,30,18,'◀',()=>{
  scene.__torre2CardPage=Math.max(0,page-1);
  layer.destroy(true);cardsPage(scene,state,handlers);
 },{muted:page===0,id:'cards-prev',size:10});
 control(scene,layer,602,35,30,18,'▶',()=>{
  scene.__torre2CardPage=Math.min(maxPage,page+1);
  layer.destroy(true);cardsPage(scene,state,handlers);
 },{muted:page===maxPage,id:'cards-next',size:10});
 const CW=110,GAP=8,X0=166,CY=56,CH=244;
 for(let c=0;c<CARDS_PER_PAGE;c++){
  const entry=visibleEntries[c];
  const x=X0+c*(CW+GAP),y=CY,w=CW,h=CH;
  if(!entry){
   // Empty slots of the last page become ONE quiet journey panel (no actions).
   if(c!==visibleEntries.length)continue;
   const pw=(CARDS_PER_PAGE-c)*(CW+GAP)-GAP;
   box(scene,layer,x,y,pw,h,{alpha:.55});
   const gymView=kind==='gym'&&gymInterior(scene,layer,x+8,y+28,pw-16,120,state.stage,0);
   if(!gymView)scenicDiorama(scene,layer,x+8,y+28,pw-16,120,state.stage,page);
   const rg=scene.add.graphics();layer.add(rg);aro(rg,x+7,y+27,pw-14,122,gymView?UI.oro:UI.panelBorde,6);
   text(scene,layer,x+pw/2,y+14,state.stage>=12?'DESAFIO FINAL':
    gymView?'GINÁSIO DE '+city.toUpperCase():'JORNADA EM KANTO',11,UI.amarillo);
   const got=(state.badges||[]).length;
   text(scene,layer,x+pw/2,y+168,got+' / 8 INSÍGNIAS',10,UI.texto);
   for(let i=0;i<8;i++){const icon=drawBadgeIcon(scene,i,x+pw/2-70+i*20,y+192,i<got,1);layer.add(icon);}
   text(scene,layer,x+pw/2,y+220,state.stage>=12?'VENÇA O CAMPEÃO DE KANTO':
    state.stage>=8?'VENÇA A ELITE FOUR':'VENÇA O LÍDER PARA SEGUIR VIAGEM',8,UI.tenue);
   continue;
  }
  trainerCardFrame(scene,layer,x,y,w,h,entry);
  const glyph=entry.leader?(state.stage>=12?'CAMPEÃO':state.stage>=8?'ELITE FOUR':'LÍDER'):entry.foe?.kind==='rival'?'RIVAL':
   entry.foe?.kind==='rocket'?'ROCKET':'TREINADOR';
  text(scene,layer,x+w/2,y+12,String(entry.index+1).padStart(2,'0')+' · '+glyph,9,
   entry.leader?UI.amarillo:entry.locked?UI.tenue:UI.texto);
  // Regional diorama in a native ring; the FRLG trainer stands in front.
  const sceneryOk=kind==='gym'?gymInterior(scene,layer,x+7,y+22,w-14,92,state.stage,entry.leader?0:entry.index+1):
   routeScene(scene,layer,x+7,y+22,w-14,92,entry.index);
  if(!sceneryOk)scenicDiorama(scene,layer,x+7,y+22,w-14,92,state.stage,entry.index);
  const ring=scene.add.graphics();layer.add(ring);
  aro(ring,x+6,y+21,w-12,94,entry.active||entry.leader?UI.oro:UI.panelBorde,6);
  npc(scene,layer,npcKind(state.stage,entry.index,entry.leader),x+w/2,y+100,
   entry.leader?2.45:2.25);
  if(entry.locked){
   const veil=scene.add.graphics();layer.add(veil);
   rectRedondo(veil,x+7,y+22,w-14,92,0x06102a,5,.45);
   candado(veil,x+w-31,y+25,24);
  }
  if(entry.leader&&state.stage<8){
   const badge=drawBadgeIcon(scene,state.stage,x+18,y+34,entry.completed,1.5);layer.add(badge);
  }
  const name=text(scene,layer,x+w/2,y+126,
   (entry.foe?.name||(entry.leader?'LÍDER':'TREINADOR')).toUpperCase(),10,
   entry.leader?UI.amarillo:UI.texto);
  estrechar(name,w-10);
  const level=entry.leader?STAGES[state.stage]?.leaderLevels?.at(-1)??entry.foe?.level:entry.foe?.level;
  text(scene,layer,x+w/2,y+142,'NV '+(level??'?')+' · '+entry.species.length+(entry.species.length===1?' POKÉMON':' POKÉMON'),8,UI.suave);
  // Real opponents with native chips; lead Pokémon types as native pills.
  const rows=compactRoster(scene,layer,entry,x+w/2,y+152);
  typePills(scene,layer,typesOf(entry.species[0]),x+w/2,y+(rows>1?201:182));
  // State: native pill, written and coloured (never colour alone).
  const sg=scene.add.graphics();layer.add(sg);
  const sx=x+8,sy=y+h-30,sw=w-16,sh=20;
  marco(sg,sx,sy,sw,sh,entry.active?'oro':entry.completed?'panel':'apagado',
   entry.completed?{borde:NATIVE_GREEN}:{});
  text(scene,layer,x+w/2,sy+sh/2,entry.active?'▶ PRÓXIMO':entry.completed?'✓ VENCIDO':'BLOQUEADO',9,
   entry.active?UI.textoOscuro:entry.completed?'#9ff0bf':UI.apagadoTexto).setStroke(entry.active?UI.oroLuz:UI.bordeTexto,entry.active?0:3);
  const zone=scene.add.zone(x+w/2,y+h/2,w,h)
   .setInteractive({useHandCursor:true})
   .setData('torre2-trainer-card-index',entry.index);
  zone.on('pointerdown',(_p,_x,_y,event)=>{
   event?.stopPropagation?.();
   detailPage(scene,state,handlers,entry);
  });layer.add(zone);
 }
 const visible=visibleEntries.length;
 // Bottom bar (native): info line, four core actions + MAIS, gold primary.
 const foe=current.foe;
 const leaderGoal=state.stage>=12?'DESAFIO FINAL':state.stage>=8?'LIGA POKÉMON':'BATALHA PELA INSÍGNIA';
 text(scene,layer,174,312,current.leader?'PRÓXIMO: '+(foe?.name||'LÍDER').toUpperCase()+' · '+leaderGoal:
  'PRÓXIMO: '+(foe?.name||'TREINADOR').toUpperCase()+' · NV '+(foe?.level??'?')+' · '+current.species.length+' POKÉMON',9,UI.suave).setOrigin(0,.5);
 const bottom=[
  ['EQUIPE',handlers.pokemon,'team'],['BOLSA',handlers.bag,'bag'],
  ['CENTRO',handlers.center,'center'],['LOJA',handlers.mart,'shop']
 ];
 bottom.forEach(([label,fn,icon],i)=>control(scene,layer,8+i*84,324,80,30,label,fn,
  {size:10,id:'cards-'+i,icon}));
 control(scene,layer,344,324,70,30,'MAIS',()=>extrasPage(scene,state,handlers),
  {id:'cards-more',size:10,icon:'more'});
 const cta=current.leader?(state.stage>=8?'▶ DESAFIAR':'▶ DESAFIAR LÍDER'):'▶ BATALHAR';
 // Regular trainers: one tap to fight. Leaders: preview with their line first.
 const primary=control(scene,layer,422,320,210,36,cta,
  current.leader?()=>detailPage(scene,state,handlers,current):()=>handlers.battle?.(),
  {gold:true,id:'cards-open-current',size:14});
 primary.setData('torre2-card-primary',current.index);
 scene.__torre2CardUI={stage:state.stage,mode:'cards',total:all.length,
  page,section:sections[page].kind,active:current.index,
  visible:visibleEntries.map(e=>e.index),visibleCount:visible};
 return scene.__torre2CardUI;
}
function detailPage(scene,state,handlers,entry){
 const old=scene.children.list.find(o=>o.getData?.('torre2-trainer-cards-root')&&o.active);
 old?.destroy(true);
 const layer=scene.add.container(0,0).setDepth(200);
 layer.setData('torre2-trainer-cards-root',true);
 // Native menu background and two marco panels (opponent / their team).
 fondoMenu(scene,28);
 [...(scene.fondoMenu||[])].reverse().forEach(o=>layer.addAt(o,0));
 scene.fondoMenu=null;
 const g=scene.add.graphics();
 marco(g,8,40,236,298,'panel',entry.leader?{borde:UI.oro}:{});
 marco(g,252,52,380,234,'panel');
 aro(g,13,47,226,214,entry.leader?UI.oro:UI.panelBorde,6);
 layer.add(g);
 const inGym=trainerCardSections(state.stage,TRAINERS_PER_GYM(state.stage))
  .find(sec=>sec.indices.includes(entry.index))?.kind==='gym';
 const viewOk=inGym?gymInterior(scene,layer,14,48,222,212,state.stage,0):
  routeScene(scene,layer,14,48,222,212,entry.index);
 if(!viewOk)scenicDiorama(scene,layer,14,48,222,212,state.stage,entry.index);
 const shield=scene.add.zone(320,180,640,360).setInteractive();
 layer.add(shield);
 control(scene,layer,570,12,53,32,'X',()=>{
  layer.destroy(true);cardsPage(scene,state,handlers);
 },{id:'cards-close'});
 const leader=entry.leader,name=leader?(entry.foe?.name||'LÍDER'):
  (entry.foe?.name||'TREINADOR '+(entry.index+1));
 text(scene,layer,126,28,leader?(state.stage>=12?'CAMPEÃO':state.stage>=8?'ELITE FOUR':'LÍDER DE GINÁSIO'):'DESAFIO '+(entry.index+1),
  14,'#ffe29b');
 npc(scene,layer,npcKind(state.stage,entry.index,leader),126,238,
  leader?3.2:3.0);
 box(scene,layer,20,273,213,57,{fill:0x0b2949,edge:PALETTE.gold});
 text(scene,layer,126,285,name.toUpperCase(),14,'#ffe8ad');
 text(scene,layer,126,310,leader?(state.stage>=12?'DESAFIO FINAL':state.stage>=8?'LIGA POKÉMON':'BATALHA PELA INSÍGNIA'):
  ({trainer:'TREINADOR',rival:'RIVAL',rocket:'EQUIPE ROCKET',leader:'LÍDER'}[entry.foe?.kind]||entry.foe?.kind||'TREINADOR').toUpperCase(),9,'#bde1ef');
 text(scene,layer,410,36,'TIME DO ADVERSÁRIO',17,'#ffe0a2');
 text(scene,layer,408,65,'DESAFIO '+(entry.index+1)+' / '+
  (TRAINERS_PER_GYM(state.stage)+1),10,'#b5d6ec');
 const species=entry.species.slice(0,6);
 if(species.length){
  const cols=Math.min(3,species.length),stepX=118;
  const firstX=444-(cols-1)*stepX/2,rows=Math.ceil(species.length/3);
  for(let k=0;k<species.length;k++){
   const cx=firstX+(k%3)*stepX;
   // Two rows are compacted so they never run under the leader's dialogue.
   const cy=rows===1?150:108+Math.floor(k/3)*62,bh=rows===1?74:58;
   box(scene,layer,cx-52,cy-bh/2,104,bh);
   const pdy=rows===1?-15:-10;
   const placeholder=scene.add.graphics();ball(placeholder,cx,cy+pdy,10);layer.add(placeholder);
   portrait(scene,layer,species[k],cx,cy+pdy,OPPONENT_DETAIL_SPRITE_SIZE);
   text(scene,layer,cx,cy+(rows===1?9:10),species[k].toUpperCase().slice(0,13),9,UI.texto);
   const level=leader?STAGES[state.stage]?.leaderLevels?.[k]??entry.foe?.level:entry.foe?.level;
   text(scene,layer,cx,cy+(rows===1?25:22),'NV. '+(level??'?'),9,UI.amarillo);
  }
 }else text(scene,layer,445,144,'EQUIPE INDISPONÍVEL',12,'#a7bcd0');

 if(leader){
  const sentence=LEADER_DIALOGUE[state.stage]||'Prepare-se para a batalha!';
  box(scene,layer,269,231,351,64,{fill:0x112c45,edge:0x6c9aba,
   accent:PALETTE.gold});
  text(scene,layer,444,245,name.toUpperCase()+' DIZ:',9,'#ffe0aa');
  text(scene,layer,445,266,sentence,10,'#eef4fb',
   {align:'center',wordWrap:{width:330}});
 }else{
  box(scene,layer,270,244,350,46,{fill:0x112c45,edge:0x426d90});
  text(scene,layer,445,262,entry.locked?'VENÇA OS DESAFIOS ANTERIORES':
   entry.completed?'TREINADOR DERROTADO':'PREPARE SUA EQUIPE PARA O COMBATE',
   10,'#d4ecf8');
 }
 control(scene,layer,270,309,115,38,'VOLTAR',()=>{
  layer.destroy(true);cardsPage(scene,state,handlers);
 },{id:'cards-detail-back'});
 let action='BATALHAR',fn=handlers.battle,disabled=entry.locked;
 if(entry.completed){
  const rematch=Boolean(rematchOpponent(state,entry.index));
  action=rematch?'REVANCHE':'VENCIDO';
  disabled=!rematch;fn=()=>handlers.rematch?.(entry.index);
 }else if(leader){action='INICIAR VS';}
 const fight=control(scene,layer,397,309,223,38,action,fn,
  {id:'cards-fight',gold:!disabled,muted:disabled,size:14});
 fight.setData('torre2-card-fight-index',entry.index);
 scene.__torre2CardUI={stage:state.stage,mode:'detail',total:TRAINERS_PER_GYM(state.stage)+1,
  active:state.trainer,selected:entry.index,leader,roster:species,
  canBattle:!disabled};
 return scene.__torre2CardUI;
}
export function renderTrainerCardHub(scene,state,handlers){
 if(!STAGES[state.stage]||state.champion)return null;
 if(scene.__torre2CardStage!==state.stage||
    scene.__torre2CardProgress!==state.trainer){
  scene.__torre2CardStage=state.stage;
  scene.__torre2CardProgress=state.trainer;
  scene.__torre2CardPage=Math.floor((state.trainer||0)/5);
 }
 return cardsPage(scene,state,handlers);
}
export function renderTrainerCardMapTab(scene,onClick){
 const layer=scene.add.container(0,0).setDepth(180);
 control(scene,layer,510,308,120,33,'TREINADORES',onClick,
  {gold:true,id:'cards-from-map'});
 return layer;
}
