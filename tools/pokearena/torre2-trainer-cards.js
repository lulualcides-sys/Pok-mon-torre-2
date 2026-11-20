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
 const tam=Math.max(8,Math.round(size*.9));
 const t=texto(scene,x,y,pretty(value),{tam,color,borde:tam>=10?4:3,colorBorde:UI.bordeTexto,literal:true})
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
// Item icons use the original FireRed item sprites when they are loaded
// (bag frame 0 = items pocket, Poké Ball icon); the pixel grid is a fallback.
// [texture, frame, visible content height, optional frame rect to register]
const ITEM_SPRITES={
 team:['torre2-frlg-mart-pokeball',null,18],
 capture:['torre2-frlg-mart-greatball',null,18],
 bag:['torre2-frlg-bag',0,50],
 heal:['torre2-frlg-mart-potion',null,20],
 // FireRed Center / Mart buildings cut from the Viridian town sheet.
 center:['torre2-art-icon-center',null,96,null,true],
 shop:['torre2-art-icon-mart',null,78,null,true],
 badges:['torre2-frlg-badges',0,14]};
export function pixelIcon(scene,layer,kind,x,y,scale=2){
 const sprite=ITEM_SPRITES[kind];
 if(sprite&&scene.textures.exists(sprite[0])){
  const [key,frame,content,rect,smooth]=sprite;
  const tex=scene.textures.get(key);
  if(rect&&!tex.has(frame))tex.add(frame,0,...rect);
  const img=scene.add.image(x,y,key,frame??undefined).setScale(12*scale/content);
  tex.setFilter(smooth?Phaser.Textures.FilterMode.LINEAR:Phaser.Textures.FilterMode.NEAREST);
  layer.add(img);img.setData('torre2-pixel-icon',kind);
  return img;
 }
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
// City landmark art (FireRed references): layered landscape at 2x —
// sky + clouds, far hills, the landmark, grass/flowers and side trees.
const LM={sky:0x7cc4f4,skyLow:0xbfe6f8,cloud:0xf8f8f8,cloudShade:0xd4ecf8,far:0x86b8d8,farDark:0x6a9cc4,
 hill:0x5cac5c,hillDark:0x478c4c,sea:0x3a88d8,seaDark:0x2c68b0,seaLight:0x84c4f4,ground:0x78c858,groundDark:0x5aa840,
 rock:0x9c9ca4,rockDark:0x6c6c78,rockLight:0xc8c8d0,snow:0xf4f4f8,wood:0xb0743c,woodDark:0x6c4422,
 white:0xf8f8f8,wall:0xe8e4dc,wallDark:0xb8b0a8,red:0xe04848,redDark:0x9c2c30,gold:0xf0c040,
 blue:0x4c7ccc,blueDark:0x2c4c88,glass:0x9cd4f4,roofPurple:0x8c64c8,pink:0xf094b4,orange:0xe8783c,
 lava:0xf87830,lavaLight:0xf8d848,smoke:0xd0d0d8,smokeDark:0x9c9cac,leaf:0x3aa046,leafDark:0x22743a,
 leafLight:0x7cd068,trunk:0x7a5230,dark:0x283048,path:0xe8d098,flower:0xf8f0f0};
function cityLandmark(scene,layer,x,y,w,h,stage){
 if(h===undefined){h=w;}
 const city=stage>=8?'indigo':String(STAGES[stage]?.city||'').toLowerCase();
 const {W,H,px}=pixelCanvas(scene,layer,x,y,w,h,2);
 const gy=H-Math.max(5,Math.round(H*.2));
 // --- primitives
 const tri=(cx,top,height,slope,c,c2)=>{for(let j=0;j<height;j++){const hw=Math.round(j*slope);
  px(c,cx-hw,top+j,hw*2+1,1);if(c2)px(c2,cx-hw,top+j,Math.max(1,hw),1)}};
 const disc=(cx,cy,r,c)=>{for(let j=-r;j<=r;j++){const hw=Math.round(Math.sqrt(r*r-j*j));px(c,cx-hw,cy+j,hw*2+1,1)}};
 const roundTree=(cx,base,r)=>{px(LM.trunk,cx,base-2,1,3);disc(cx,base-r-2,r,LM.leafDark);disc(cx,base-r-3,r-1,LM.leaf);
  px(LM.leafLight,cx-r+2,base-2*r-1,2,1);px(LM.leafLight,cx-r+1,base-2*r,1,1)};
 const pine=(cx,base,hh)=>{px(LM.trunk,cx,base-1,1,2);tri(cx,base-hh,hh-1,.45,LM.leafDark,LM.leaf)};
 const cloud=(cx,cy)=>{px(LM.cloud,cx+1,cy,6,1);px(LM.cloud,cx,cy+1,9,2);px(LM.cloudShade,cx+1,cy+3,7,1)};
 const windows=(wx,wy,cols,rows,c=LM.glass,step=2)=>{for(let a=0;a<cols;a++)for(let b=0;b<rows;b++)px(c,wx+a*step,wy+b*step,1,1)};
 const grass=()=>{px(LM.ground,0,gy,W,H-gy);px(LM.groundDark,0,gy,W,1);
  for(let i=1;i<W;i+=5)px(LM.groundDark,i+(i%3),gy+2+(i%2),1,1)};
 const flowers=(y0)=>{for(let i=2;i<W-1;i+=6){px(i%4?LM.pink:LM.flower,i,y0,1,1);px(LM.gold,i,y0+1,1,1)}};
 // --- sky, clouds and far hills (shared, the "postcard" frame)
 px(LM.sky,0,0,W,Math.round(gy*.5));px(LM.skyLow,0,Math.round(gy*.5),W,gy);
 cloud(2,2);if(W>30)cloud(W-12,4);
 const farTop=gy-Math.round(H*.25);
 for(let i=0;i<W;i++){const t=farTop+Math.round(2*Math.sin(i/5)+1.5*Math.sin(i/2.3));px(LM.far,i,t,1,gy-t)}
 const mid=Math.floor(W/2);
 if(city==='pewter'){
  grass();tri(mid,gy-Math.round(H*.62),Math.round(H*.62),.85,LM.rockDark,LM.rock);
  tri(mid,gy-Math.round(H*.62),Math.round(H*.16),.85,LM.snow);px(LM.rockLight,mid-3,gy-Math.round(H*.3),2,2);
  pine(4,gy+1,10);pine(9,gy+2,8);pine(W-5,gy+1,10);pine(W-10,gy+2,8);
  px(LM.rockDark,mid+6,gy-1,4,2);px(LM.rock,mid+7,gy-2,2,1);
 }else if(city==='cerulean'){
  px(LM.sea,0,gy-3,W,H-gy+3);for(let i=1;i<W;i+=4)px(LM.seaLight,i,gy+(i%3),2,1);
  const by=gy-5;px(LM.woodDark,0,by,W,1);px(LM.wood,0,by+1,W,2);for(let i=1;i<W;i+=3)px(LM.woodDark,i,by+1,1,2);
  for(let i=3;i<W;i+=6){px(LM.woodDark,i,by-4,1,9);}px(LM.wood,0,by-3,W,1);
  roundTree(4,by,4);
  const hx=W-14,hy=by-11;px(LM.wall,hx,hy+4,11,7);px(LM.blue,hx-1,hy+1,13,3);px(LM.blueDark,hx-1,hy+3,13,1);
  px(LM.red,hx+4,hy+7,3,4);windows(hx+1,hy+5,1,1,LM.glass);windows(hx+8,hy+5,1,1,LM.glass);
 }else if(city==='vermilion'){
  px(LM.sea,0,gy-5,W,H-gy+5);for(let i=0;i<W;i+=5)px(LM.seaLight,i+1,gy-2+(i%2)*2,3,1);
  const sx=mid-13,sy=gy-11;
  px(LM.dark,sx,sy+8,27,1);px(LM.white,sx+1,sy+4,25,4);px(LM.red,sx+1,sy+8,25,2);px(LM.redDark,sx+2,sy+10,23,1);
  px(LM.white,sx+6,sy+1,15,3);windows(sx+7,sy+2,7,1,LM.blue);windows(sx+3,sy+5,11,1,LM.blue);
  px(LM.red,sx+16,sy-4,3,5);px(LM.dark,sx+16,sy-4,3,1);px(LM.smoke,sx+18,sy-7,3,2);px(LM.smoke,sx+20,sy-9,3,2);
  px(LM.wood,0,gy-4,7,2);px(LM.woodDark,1,gy-2,1,3);px(LM.woodDark,5,gy-2,1,3);
 }else if(city==='celadon'){
  grass();px(LM.path,mid-2,gy,5,H-gy);
  const bx=mid-10,by=gy-Math.round(H*.62);px(LM.dark,bx-1,by,22,gy-by);px(LM.wall,bx,by+3,20,gy-by-3);
  px(LM.roofPurple,bx-2,by,24,3);windows(bx+2,by+5,8,Math.max(2,Math.floor((gy-by-9)/2)),LM.glass);
  px(LM.blue,mid-2,gy-4,5,4);px(LM.white,mid-1,by+1,3,1);
  roundTree(4,gy,4);roundTree(W-5,gy,4);flowers(gy+2);
 }else if(city==='fuchsia'){
  grass();px(LM.path,mid-2,gy,5,H-gy);
  const palm=(cx,top,hgt)=>{for(let j=0;j<hgt;j++)px(j%2?LM.wood:LM.woodDark,cx+(j>hgt*.6?1:0),top+j,2,1);
   px(LM.leafDark,cx-5,top-1,12,2);px(LM.leaf,cx-4,top-2,10,2);px(LM.leafLight,cx-2,top-2,3,1);
   px(LM.leaf,cx-6,top+1,3,1);px(LM.leaf,cx+5,top+1,3,1);px(LM.leafDark,cx-1,top-4,4,2)};
  palm(5,gy-Math.round(H*.55),Math.round(H*.55));palm(W-7,gy-Math.round(H*.5),Math.round(H*.5));
  const hx=mid-8,hy=gy-10;px(LM.wall,hx,hy+3,17,7);px(LM.orange,hx-1,hy,19,3);px(LM.redDark,hx-1,hy+2,19,1);
  px(LM.woodDark,mid-1,hy+5,3,5);windows(hx+2,hy+5,2,1,LM.glass,11);px(LM.white,mid,hy+1,1,1);flowers(gy+2);
 }else if(city==='saffron'){
  grass();
  const tower=(tx,top,tw,c,cd)=>{px(cd,tx,top,tw,gy-top);px(c,tx+1,top+1,tw-2,gy-top-1);windows(tx+2,top+3,Math.floor((tw-3)/2),Math.floor((gy-top-5)/2))};
  tower(3,gy-Math.round(H*.4),8,LM.rock,LM.rockDark);tower(W-11,gy-Math.round(H*.45),8,LM.rock,LM.rockDark);
  tower(mid-6,gy-Math.round(H*.72),13,LM.blue,LM.blueDark);px(LM.dark,mid,gy-Math.round(H*.72)-3,1,3);px(LM.red,mid,gy-Math.round(H*.72)-4,1,1);
  px(LM.glass,mid-2,gy-4,5,4);
 }else if(city==='cinnabar'){
  px(LM.sea,0,gy,W,H-gy);for(let i=1;i<W;i+=6)px(LM.seaLight,i,gy+2+(i%2),3,1);
  const top=gy-Math.round(H*.58);tri(mid,top,gy-top,.9,LM.rockDark,LM.rock);
  px(LM.lava,mid-3,top,7,2);px(LM.lavaLight,mid-2,top,5,1);
  for(let j=0;j<gy-top-3;j++){px(LM.lava,mid-1+Math.round(Math.sin(j/2)),top+2+j,1,1);if(j>4)px(LM.lava,mid+3+Math.round(j*.3),top+2+j,1,1)}
  px(LM.smokeDark,mid-4,top-4,5,3);px(LM.smoke,mid-1,top-7,6,4);px(LM.smoke,mid+3,top-4,5,3);
 }else if(city==='viridian'){
  grass();roundTree(5,gy+1,5);roundTree(mid,gy,7);roundTree(W-6,gy+1,5);roundTree(mid-9,gy+2,4);roundTree(mid+9,gy+2,4);
 }else{ // Indigo Plateau
  grass();tri(5,farTop-6,gy-farTop+6,.9,LM.rockDark,LM.rock);tri(W-6,farTop-4,gy-farTop+4,.9,LM.rockDark,LM.rock);
  const bx=mid-10,by=gy-Math.round(H*.48);px(LM.wall,bx,by+4,21,gy-by-8);px(LM.blue,bx-2,by,25,4);px(LM.blueDark,bx-2,by+3,25,1);
  windows(bx+2,by+6,9,2,LM.glass);px(LM.blueDark,mid-2,gy-8,5,4);
  for(let k=0;k<4;k++)px(k%2?LM.wallDark:LM.wall,mid-4+k,gy-4+k,9-2*k,1);
  px(LM.dark,mid,by-5,1,5);px(LM.red,mid+1,by-5,3,2);
 }
 return true;
}
// Small pixel glyph for each type, shown inside the type pill.
const TYPE_GLYPH={ROCK:['.kk.','kggk','kgGk','.kk.'],WATER:['.k..','kbk.','kbbk','.kk.'],
 ELECTRIC:['..kk','.kk.','kkk.','.k..'],GRASS:['..kk','.kek','kek.','kk..'],POISON:['.kk.','kwwk','.kk.','k..k'],
 PSYCHIC:['.kk.','k..k','k.kk','.kk.'],FIRE:['.k..','.kk.','krrk','.kk.'],GROUND:['....','.kk.','kyyk','kkkk'],
 ICE:['k.k.','.k..','k.k.','....'],DRAGON:['k..k','.kk.','kkkk','.kk.'],MIXED:['.k..','kkk.','.k..','....']};
const cityOf=stage=>String(STAGES[stage]?.city||'').toLowerCase();
// Draws one window of an official FireRed location sheet (nearest filter).
// The sheet loads on demand; the approved diorama shows until it arrives.
// The campaign releases these textures on restart, so the live loader
// queue (not a remembered flag) decides whether to request it again.
// Owner-supplied illustrations (tools/pokearena/campaign-art, PROVENANCE.json):
// city thumbnails, emblems, route backdrops. Loaded lazily; the procedural
// pixel art stays as placeholder until the PNG arrives. Trainer sprites and
// Pokémon portraits are never replaced by these.
export const OWNER_ART_DIR='assets/ui/torre2-campaign/';
export function ownerArt(scene,layer,name,x,y,w,h,placeholder,pan=.5,panY=.5){
 const key='torre2-art-'+name;
 const slot=scene.add.container(0,0);layer.add(slot);
 const draw=()=>{
  if(!slot.active||!scene.textures.exists(key))return;
  const tex=scene.textures.get(key),src=tex.getSourceImage();
  const sw=src.width,sh=src.height,a=w/h;
  const cw=Math.min(sw,Math.round(sh*a)),ch=Math.min(sh,Math.round(cw/a));
  const ox=Math.round((sw-cw)*pan),oy=Math.round((sh-ch)*panY),frame='crop-'+cw+'x'+ch+'-'+ox+'-'+oy;
  if(!tex.has(frame))tex.add(frame,0,ox,oy,cw,ch);
  tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  slot.removeAll(true);
  slot.add(scene.add.image(x,y,key,frame).setOrigin(0).setDisplaySize(w,h));
 };
 if(scene.textures.exists(key)){draw();return true}
 placeholder?.(slot);
 scene.load.once('filecomplete-image-'+key,()=>draw());
 const queued=[scene.load.list,scene.load.inflight].some(set=>
  (set?.entries||[]).some(file=>file?.key===key));
 if(!queued){
  scene.load.image(key,OWNER_ART_DIR+name+'.png');
  if(!scene.load.isLoading())scene.load.start();
 }
 return true;
}
// Horizontal framing of the city illustration per card, so neighbours differ.
const CARD_PAN=[.5,.12,.88,.32,.68];
// Route cards alternate the destination city with the owner's two route
// landscapes, so neighbouring cards never repeat the same picture.
const ROUTE_ART_CYCLE=['city','route-card','city','route-detail'];
const routeArt=(stage,index)=>{const kind=ROUTE_ART_CYCLE[index%ROUTE_ART_CYCLE.length];
 return kind==='city'?'city-'+artCity(stage):kind};
const artCity=stage=>stage>=8?'indigo':String(STAGES[stage]?.city||'').toLowerCase();
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
export function gymInterior(scene,layer,x,y,w,h,stage,variant=0){
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
 id='',size=10,icon=null,center=false,wrap=false}={}){
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
 if(wrap){
  // Label in the free area right of the icon, up to two centred lines.
  const tx=x+(icon?32:6),tw=w-(icon?36:12);
  caption.setPosition(Math.round(tx+tw/2),Math.round(y+h/2));
  caption.setWordWrapWidth(tw,true).setAlign('center');caption.setLineSpacing?.(-3);
  if(caption.width>tw)estrechar(caption,tw);
 }else estrechar(caption,w-(icon?38:10));
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
 // Vivid outer rim (gold = next, teal = others), as in the approved mock.
 if(typeof aro==='function'){
  const rim=scene.add.graphics();layer.add(rim);
  aro(rim,x-2,y-2,w+4,h+4,entry.active?UI.oro:0x3fd4c4,8,entry.locked?.35:.85);
 }
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
export function leaderSpriteKind(stage){return LEADERS[stage]||'rival'}
export function trainerSpriteKind(stage,index){return npcKind(stage,index,false)}
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
function miniChip(scene,layer,id,x,y,{dim=false,gold=false,size=MINI}={}){
 const g=scene.add.graphics();layer.add(g);
 rectRedondo(g,x,y,size,size,UI.contorno,4);
 rectRedondo(g,x+1,y+1,size-2,size-2,gold?UI.oro:UI.panelBorde,3);
 rectRedondo(g,x+2,y+2,size-4,size-4,0x0c1844,2);
 ball(g,x+size/2,y+size/2,4);
 const key=portrait(scene,layer,id,x+size/2,y+size/2,size-4);
 if(dim&&key)layer.list.filter(o=>o.getData?.('torre2-opponent-sprite')===id).forEach(o=>o.setTint(0x6f7f9a));
 return g;
}
// Always every real opponent (1–6): one row up to four, else two rows of 3.
export const OPPONENT_CHIP_SPRITE_SIZE=MINI-4;
function compactRoster(scene,layer,entry,x,y){
 const list=entry.species.slice(0,6),perRow=list.length>4?3:Math.max(1,list.length);
 const size=list.length<=3?26:MINI,step=size+2;
 list.forEach((id,i)=>{
  const row=Math.floor(i/perRow),inRow=Math.min(perRow,list.length-row*perRow);
  const x0=Math.round(x-(inRow*step-2)/2);
  miniChip(scene,layer,id,x0+(i%perRow)*step,y+row*step,{dim:entry.locked,size});
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
 const w=types.length>1?47:56,gap=2,x0=Math.round(cx-(types.length*w+(types.length-1)*gap)/2);
 const g=scene.add.graphics();layer.add(g);
 types.forEach((t,i)=>{
  pastillaTipo(g,x0+i*(w+gap),y,t,w,14);
  text(scene,layer,x0+i*(w+gap)+w/2,y+7,t,10,UI.texto);
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
 actions.push(['MAPA DE KANTO',()=>journeyPage(scene,state,handlers),'team']);
 actions.push(['CARTÃO DO TREINADOR',handlers.trainerCard,'badges']);
 // Save backup outside the browser (download / restore a JSON copy).
 actions.push(['SALVAR CÓPIA',handlers.saveExport,'bag']);
 actions.push(['RESTAURAR CÓPIA',handlers.saveImport,'bag']);
 actions.push(['RANKING',handlers.ranking,'badges']);
 actions.push(['LENDÁRIOS',handlers.legendaries,'capture']);
 actions.push(['TORRE',handlers.tower,'badges']);
 actions.push(['SILPH CO.',handlers.silph,'bag']);
 actions.push([handlers.lightLabel?.()||'MODO LEVE',handlers.lightMode,'fullscreen']);
 actions.push(['MISSÕES',handlers.missions,'badges']);
 actions.push(['TROCA',handlers.trade,'team']);
 actions.push(['INSTALAR APP',handlers.installApp,'fullscreen']);
 // Four columns, five rows: every option fits above VOLTAR.
 actions.forEach(([name,fn,icon],i)=>{
  const x=104+(i%4)*110,y=82+Math.floor(i/4)*40;
  const keepOpen=name==='TELA CHEIA'||name==='MAPA DE KANTO'||name==='SALVAR CÓPIA';
  control(scene,layer,x,y,104,34,name,keepOpen?(()=>{if(name!=='SALVAR CÓPIA')layer.destroy(true);fn?.()}):close(fn),
   {id:'cards-extras-'+i,size:9,icon,wrap:true});
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
function cityPanel(scene,layer,state,all,handlers={}){
 const spec=STAGES[state.stage]||{},x=8,y=34,w=150,h=266;
 box(scene,layer,x,y,w,h);
 // City emblem: a pixel-art landmark of the city in a gold frame.
 const plate=scene.add.graphics();layer.add(plate);
 rectRedondo(plate,x+6,y+6,60,60,UI.contorno,8);
 rectRedondo(plate,x+7,y+7,58,58,UI.oroBorde,7);
 rectRedondo(plate,x+8,y+8,56,56,UI.oro,6);
 ownerArt(scene,layer,'emblem-'+artCity(state.stage),x+10,y+10,52,52,
  slot=>cityLandmark(scene,slot,x+10,y+10,52,52,state.stage));
 const shine=scene.add.graphics();layer.add(shine);
 shine.fillStyle(UI.oroLuz,1).fillRect(x+14,y+8,44,1);
 const mapZone=scene.add.zone(x+36,y+36,60,60).setInteractive({useHandCursor:true})
  .setData('torre2-card-control','cards-journey');
 mapZone.on('pointerdown',(_p,_x,_y,e)=>{e?.stopPropagation?.();journeyPage(scene,state,handlers)});
 layer.add(mapZone);
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
 let trainerName=null;try{trainerName=localStorage.getItem('torre2-trainer-name')}catch{}
 estrechar(text(scene,layer,x+8,y+108,trainerName?'Equipe de '+trainerName:'SUA EQUIPE',9,UI.texto),w-74).setOrigin(0,.5)
  .setData('torre2-trainer-name',trainerName||'');
 text(scene,layer,x+w-8,y+108,'₽ '+Number(state.money||0).toLocaleString('pt-BR'),9,UI.amarillo).setOrigin(1,.5);
 const team=state.team||[];
 for(let i=0;i<6;i++){
  const ry=y+118+i*24,m=team[i],active=i===(state.active||0)&&m;
  const g=scene.add.graphics();layer.add(g);
  if(active){rectRedondo(g,x+5,ry-1,w-10,23,UI.oro,4,.28);aro(g,x+5,ry-1,w-10,23,UI.oro,4,.9);}
  rectRedondo(g,x+8,ry,21,21,UI.contorno,4);rectRedondo(g,x+9,ry+1,19,19,0x0c1844,3);
  if(!m){ball(g,x+18,ry+10,4);g.setAlpha(.45);continue;}
  ball(g,x+18,ry+10,4);
  portrait(scene,layer,m.id,x+18,ry+10,21,'team');
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
  const icon=drawBadgeIcon(scene,i,478+i*20,15,got,1.2);layer.add(icon);
 }
}
// Type pill with its pixel glyph and English name (League/Gyms look).
function typeBadge(scene,layer,type,cx,cy,w=74,h=16){
 const g=scene.add.graphics();layer.add(g);
 const x=Math.round(cx-w/2),y=Math.round(cy-h/2);
 pastillaTipo(g,x,y,type,w,h);
 const glyph=TYPE_GLYPH[type];
 if(glyph)glyph.forEach((row,j)=>[...row].forEach((ch,i)=>{
  const c=ch==='k'?0x101828:ICON_PAL[ch];if(c===undefined)return;
  g.fillStyle(c,1).fillRect(x+6+i*2,y+Math.round(h/2)-4+j*2,2,2);
 }));
 text(scene,layer,cx+(glyph?6:0),cy,type,10,UI.texto);
}
// Toast in the native style (no actions behind it).
function toast(scene,layer,msg){
 const t=scene.add.container(0,0).setDepth(500);layer.add(t);
 const g=scene.add.graphics();t.add(g);marco(g,170,160,300,40,'panel',{borde:UI.oro});
 text(scene,t,320,180,msg,11,UI.texto);
 scene.time.delayedCall(1400,()=>t.active&&t.destroy(true));
}
// "Jornada de Kanto": the nine stops of the campaign as illustrated city
// cards (current = gold, done = green check, next ones = lock). Read-only:
// it never changes progress; the current city returns to its trainer cards.
export function journeyPage(scene,state,handlers){
 const layer=scene.add.container(0,0).setDepth(420);
 layer.setData('torre2-journey',true);
 ownerArt(scene,layer,'journey-bg',0,0,640,360,slot=>routeScene(scene,slot,0,0,640,360,7));
 const shade=scene.add.graphics();layer.add(shade);shade.fillStyle(0x061230,.1).fillRect(0,0,640,360);
 layer.add(scene.add.zone(320,180,640,360).setInteractive());
 const banner=(cy,w,label,size)=>{
  const g=scene.add.graphics();layer.add(g);
  marco(g,320-w/2,cy-15,w,30,'panel',{borde:UI.panelLuz});
  pixelIcon(scene,layer,'team',320-w/2+18,cy,1.5);pixelIcon(scene,layer,'team',320+w/2-18,cy,1.5);
  text(scene,layer,320,cy,label,size,UI.texto);
 };
 banner(22,300,'JORNADA DE KANTO',17);
 control(scene,layer,6,6,74,22,'< VOLTAR',()=>layer.destroy(true),{id:'journey-back',size:9});
 const here=Math.min(8,state.stage),CW=196,CH=84;
 for(let i=0;i<9;i++){
  const x=18+(i%3)*(CW+8),y=46+Math.floor(i/3)*(CH+6);
  const stage=i<8?i:Math.max(8,Math.min(12,state.stage));
  const spec=STAGES[stage]||{},done=i<here||state.champion,current=i===here&&!state.champion,locked=i>here;
  const g=scene.add.graphics();layer.add(g);
  marco(g,x,y,CW,CH,'panel',{alfa:.96,...(current?{borde:UI.oro}:done?{borde:NATIVE_GREEN}:{})});
  if(current){aro(g,x-2,y-2,CW+4,CH+4,UI.oro,8,.9);
   const m=scene.add.graphics();layer.add(m);m.fillStyle(UI.oro,1);
   m.fillTriangle(x+8,y-6,x+20,y-6,x+14,y+2);m.fillTriangle(x+8,y+CH+6,x+20,y+CH+6,x+14,y+CH-2);}
  ownerArt(scene,layer,'city-'+artCity(i<8?i:8),x+6,y+6,96,72,slot=>cityLandmark(scene,slot,x+6,y+6,96,72,i<8?i:8));
  const ring=scene.add.graphics();layer.add(ring);aro(ring,x+5,y+5,98,74,current?UI.oro:UI.panelBorde,5);
  const cityName=i<8?spec.city:'Liga Índigo';
  estrechar(text(scene,layer,x+150,y+20,cityName,15,UI.amarillo),86);
  estrechar(text(scene,layer,x+150,y+40,i<8?'Líder '+spec.leader:(spec.leader||'Elite Four'),10,UI.texto),86);
  if(spec.type)typeBadge(scene,layer,spec.type,x+150,y+62,76,16);
  if(locked){const v=scene.add.graphics();layer.add(v);rectRedondo(v,x+6,y+6,96,72,0x06102a,5,.5);candado(v,x+42,y+30,24);}
  if(done){const c=scene.add.graphics();layer.add(c);marco(c,x+8,y+8,20,18,'panel',{borde:NATIVE_GREEN});
   text(scene,layer,x+18,y+17,'✓',11,'#9ff0bf');}
  const z=scene.add.zone(x+CW/2,y+CH/2,CW,CH).setInteractive({useHandCursor:true})
   .setData('torre2-journey-city',i);
  z.on('pointerdown',(_p,_x,_y,e)=>{e?.stopPropagation?.();
   if(current)layer.destroy(true);
   // Completed city: go back to its tall grass to hunt its Pokémon.
   else if(done&&i<8&&handlers.capture){layer.destroy(true);handlers.capture(i)}
   else toast(scene,layer,done?'Cidade concluída!':'Vença os líderes anteriores');
  });layer.add(z);
 }
 banner(338,560,'Cidade atual: continuar · Cidade concluída: caçar Pokémon de lá',10);
 scene.__torre2Journey={stage:state.stage,current:here};
 return layer;
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
 // Cards slide in gently when a page is drawn (presentation only).
 if(scene.tweens){layer.setY(6);scene.tweens.add({targets:layer,y:0,duration:180,ease:'Quad.easeOut'});}
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
 const title=estrechar(text(scene,layer,300,15,area,17,UI.amarillo),300);
 const half=title.displayWidth/2+14;
 pixelIcon(scene,layer,'team',300-half,15,1);pixelIcon(scene,layer,'team',300+half,15,1);
 badgeStrip(scene,layer,state);
 cityPanel(scene,layer,state,all,handlers);
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
   // Works for 1 to 3 free slots: everything is sized from the panel width.
   const narrow=pw<180,iw=pw-16,ih=narrow?Math.round(iw*156/184):120;
   const gymView=kind==='gym'&&gymInterior(scene,layer,x+8,y+28,iw,ih,state.stage,0);
   if(!gymView)ownerArt(scene,layer,'city-'+artCity(state.stage),x+8,y+28,iw,ih,
    slot=>scenicDiorama(scene,slot,x+8,y+28,iw,ih,state.stage,page));
   const rg=scene.add.graphics();layer.add(rg);aro(rg,x+7,y+27,iw+2,ih+2,gymView?UI.oro:UI.panelBorde,6);
   const title=state.stage>=12?'DESAFIO FINAL':gymView?'GINÁSIO DE '+city.toUpperCase():
    narrow?(state.stage>=8?'LIGA ÍNDIGO':city.toUpperCase()):'JORNADA EM KANTO';
   estrechar(text(scene,layer,x+pw/2,y+14,title,11,UI.amarillo),pw-12);
   if(!gymView){
    const open=scene.add.zone(x+8+iw/2,y+28+ih/2,iw,ih).setInteractive({useHandCursor:true})
     .setData('torre2-card-control','cards-journey-panel');
    open.on('pointerdown',(_p,_x,_y,e)=>{e?.stopPropagation?.();journeyPage(scene,state,handlers)});
    layer.add(open);
   }
   const got=(state.badges||[]).length,by=y+28+ih;
   text(scene,layer,x+pw/2,by+16,got+' / 8 INSÍGNIAS',10,UI.texto);
   // Badges: one row when wide, 4×2 when the panel is a single slot.
   const perRow=narrow?4:8,step=narrow?Math.min(20,Math.floor((pw-12)/4)):20;
   for(let i=0;i<8;i++){
    const col=i%perRow,row=Math.floor(i/perRow);
    const icon=drawBadgeIcon(scene,i,x+pw/2-(perRow-1)*step/2+col*step,by+36+row*20,i<got,1);layer.add(icon);
   }
   const hint=state.stage>=12?'VENÇA O CAMPEÃO':state.stage>=8?'VENÇA A ELITE FOUR':
    narrow?'VENÇA O LÍDER':'VENÇA O LÍDER PARA SEGUIR VIAGEM';
   estrechar(text(scene,layer,x+pw/2,by+(narrow?78:58),hint,8,UI.tenue),pw-12);
   if(!gymView&&!narrow)text(scene,layer,x+pw/2,by+(narrow?92:72),'TOQUE NA IMAGEM PARA VER O MAPA',7,UI.tenue);
   continue;
  }
  trainerCardFrame(scene,layer,x,y,w,h,entry);
  const glyph=entry.leader?(state.stage>=12?'CAMPEÃO':state.stage>=8?'ELITE FOUR':'LÍDER'):entry.foe?.kind==='rival'?'RIVAL':
   entry.foe?.kind==='rocket'?'ROCKET':'TREINADOR';
  text(scene,layer,x+w/2,y+12,String(entry.index+1).padStart(2,'0')+' · '+glyph,9,
   entry.leader?UI.amarillo:entry.locked?UI.tenue:UI.texto);
  // Regional diorama in a native ring; the FRLG trainer stands in front.
  const SH=104;
  const sceneryOk=kind==='gym'?gymInterior(scene,layer,x+7,y+22,w-14,SH,state.stage,entry.leader?0:entry.index+1):
   ownerArt(scene,layer,routeArt(state.stage,entry.index),x+7,y+22,w-14,SH,
    slot=>routeScene(scene,slot,x+7,y+22,w-14,SH,entry.index),CARD_PAN[entry.index%CARD_PAN.length]);
  if(!sceneryOk)scenicDiorama(scene,layer,x+7,y+22,w-14,SH,state.stage,entry.index);
  const ring=scene.add.graphics();layer.add(ring);
  aro(ring,x+6,y+21,w-12,SH+2,entry.active||entry.leader?UI.oro:UI.panelBorde,6);
  npc(scene,layer,npcKind(state.stage,entry.index,entry.leader),x+w/2,y+118,
   entry.leader?2.9:2.7);
  if(entry.locked){
   const veil=scene.add.graphics();layer.add(veil);
   rectRedondo(veil,x+7,y+22,w-14,SH,0x06102a,5,.45);
   candado(veil,x+w-31,y+25,24);
  }
  if(entry.leader&&state.stage<8){
   const badge=drawBadgeIcon(scene,state.stage,x+18,y+34,entry.completed,1.5);layer.add(badge);
  }
  const name=text(scene,layer,x+w/2,y+139,
   (entry.foe?.name||(entry.leader?'LÍDER':'TREINADOR')).toUpperCase(),10,
   entry.leader?UI.amarillo:UI.texto);
  estrechar(name,w-10);
  const level=entry.leader?STAGES[state.stage]?.leaderLevels?.at(-1)??entry.foe?.level:entry.foe?.level;
  text(scene,layer,x+w/2,y+155,'NV '+(level??'?')+' · '+entry.species.length+' POKÉMON',9,UI.suave);
  // Real opponents with native chips; lead Pokémon types as native pills.
  const rows=compactRoster(scene,layer,entry,x+w/2,y+165);
  if(rows<2)typePills(scene,layer,typesOf(entry.species[0]),x+w/2,y+196);
  // State: native pill, written and coloured (never colour alone).
  const sg=scene.add.graphics();layer.add(sg);
  const sx=x+8,sy=y+h-26,sw=w-16,sh=20;
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
  ownerArt(scene,layer,'city-'+artCity(state.stage),14,48,222,212,
   slot=>routeScene(scene,slot,14,48,222,212,entry.index),CARD_PAN[entry.index%CARD_PAN.length]);
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
