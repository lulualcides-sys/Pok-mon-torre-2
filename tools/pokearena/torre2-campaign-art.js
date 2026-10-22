import {drawKantoTiles} from './kanto-tiles.js';
import {WORLD_SHEET,decorateWorldWithSprites} from './cc0-overworld.js';
import {renderLocationTiles} from './frlg-location.js';
/* Torre 2 — Kanto premium UI. Native Phaser Graphics/WebGL pixel art,
 * never a pasted mockup, CSS effects or Canvas 2D.
 */
const px=(g,x,y,w,h,c,a=1)=>{g.fillStyle(c,a);g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))};
const edge=(g,x,y,w,h,c)=>{g.lineStyle(1,c,1);g.strokeRect(x,y,w,h)};
const rand=(seed)=>{let x=seed>>>0;return ()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296)};
export function ball(g,x,y,r=9){
 g.fillStyle(0x05162a);g.fillCircle(x+1,y+2,r+2);
 g.fillStyle(0xffffff);g.fillCircle(x,y,r);
 // Render the red half as native pixel strips, preserving the black seam.
 for(let yy=-r;yy<0;yy++){
  const ww=Math.floor(Math.sqrt(r*r-yy*yy));
  px(g,x-ww,y+yy,ww*2,1,0xef514a);
 }
 px(g,x-r,y-1,r*2,3,0x14243b);
 g.fillStyle(0x14243b);g.fillCircle(x,y,Math.max(3,r*.4));
 g.fillStyle(0xffffff);g.fillCircle(x,y,Math.max(2,r*.23));
 px(g,x-4,y-r+3,3,2,0xffffff);
}
export function panel(g,x,y,w,h,gold=false){
 const trim=gold?0xeac16e:0x67b9e8;
 px(g,x+3,y+4,w,h,0x020b1b,.8);
 px(g,x,y,w,h,trim);px(g,x+2,y+2,w-4,h-4,0x061b33);
 px(g,x+5,y+5,w-10,h-10,gold?0x09423e:0x0b2543);
 px(g,x+7,y+6,w-14,2,gold?0xffec9b:0x8edcff);
 px(g,x+7,y+h-9,w-14,2,gold?0x936f3a:0x1a4d7b);
 for(const [a,b] of [[x,y],[x+w-4,y],[x,y+h-4],[x+w-4,y+h-4]]){
  px(g,a,b,4,4,gold?0xffdb80:0x9eddfc);
  px(g,a+1,b+1,2,2,gold?0xc8923d:0x286c9c);
 }
}
export function header(scene){
 const g=scene.add.graphics().setDepth(0),r=rand(19);
 px(g,0,0,640,53,0x06192e);
 for(let i=0;i<80;i++){
  const x=i*8,h=4+Math.floor(r()*21);
  px(g,x,46-h,9,h,0x13314d,.7);
  px(g,x,46-h,9,1,0x2a5884);
 }
 panel(g,8,5,380,42,false);
 ball(g,30,26,11);
 px(g,48,11,2,30,0x3672a3);
 px(g,0,49,640,4,0x1f5a95);
 px(g,0,51,640,1,0x70bee9);
}
export function backdrop(scene){
 const g=scene.add.graphics().setDepth(0),r=rand(98);
 px(g,0,52,640,308,0x08192f);
 for(let y=55;y<360;y+=12)for(let x=4;x<640;x+=12){
  const k=r();px(g,x,y,5,5,k<.4?0x16395f:0x0e2946,.45);
 }
 px(g,0,352,640,8,0x0e3157);
}
export function buttonFrame(g,x,y,w,h,tone='blue',hover=false){
 const opts=tone==='gold'?[0xefd06d,0xfff4aa,0xd48929,0xffcb52]:
  tone==='green'?[0x6ae0a2,0xc0ffd6,0x086b42,0x1a9f67]:
  [0x65bbf6,0xd8f6ff,0x103e86,0x2066b2];
 const [trim,hi,deep,base]=opts;
 px(g,x+2,y+4,w,h,0x020b17,.8);
 px(g,x,y,w,h,0x030b1e);
 px(g,x+1,y+1,w-2,h-2,trim);
 px(g,x+3,y+3,w-6,h-6,deep);
 px(g,x+4,y+4,w-8,h-9,base);
 px(g,x+4,y+4,w-8,4,hover?hi:trim);
 px(g,x+5,y+8,2,h-15,hi,.4);
 px(g,x+5,y+h-6,w-10,2,deep);
 for(const [cx,cy] of [[x+1,y+1],[x+w-5,y+1],[x+1,y+h-5],[x+w-5,y+h-5]])
  px(g,cx,cy,4,4,hi);
}
function tree(g,x,y,k=1){
 const p=(a,b,w,h,c)=>px(g,x+a*k,y+b*k,w*k,h*k,c);
 p(-2,8,5,8,0x6d5335);p(-8,4,17,7,0x1c613c);
 p(-7,-2,15,9,0x277d43);p(-5,-7,11,8,0x319a4d);
 p(-2,-9,5,3,0x73c76b);p(2,-3,4,3,0x9bdc7e);
 p(-8,9,16,2,0x194c39);
}
const grass=(g,x,y)=>{px(g,x,y,8,2,0x3e9852);px(g,x+2,y-3,2,5,0x51a953);px(g,x+6,y-4,2,6,0x6aba57)};
function house(g,x,y,red){
 px(g,x+2,y+11,42,33,0x685338);
 px(g,x+5,y+13,36,29,0xf7e4b6);
 px(g,x-2,y+4,50,10,0x20446c);
 px(g,x,y,46,10,red?0xd85155:0x3c91d5);
 px(g,x+2,y+1,42,2,red?0xff9988:0x91e5fb);
 px(g,x+9,y+19,10,10,0x88c7d8);px(g,x+30,y+19,10,10,0x88c7d8);
 px(g,x+21,y+27,8,16,0x684935);px(g,x+22,y+29,2,2,0xffdb9b);
 if(red)ball(g,x+23,y+5,6);
 else px(g,x+14,y+5,18,3,0xffffff);
}
function nearPath(x,y,pts){
 for(let i=1;i<pts.length;i++){
  const a=pts[i-1],b=pts[i],dx=b.x-a.x,dy=b.y-a.y;
  const z=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));
  if(Math.hypot(x-a.x-z*dx,y-a.y-z*dy)<27)return true;
 }
 return false;
}

/* Each rock, tree, fence, flower, trail and building is drawn as Phaser
 * Graphics on the WebGL renderer. No image, mockup or Canvas overlay. */
function stone(g,x,y,s=1){
 const q=(a,b,w,h,c)=>px(g,x+a*s,y+b*s,w*s,h*s,c);
 q(-6,0,12,6,0x4c5351);q(-5,-3,10,7,0x878c78);
 q(-3,-4,6,2,0xc8c7a4);q(3,0,2,3,0x585e5a);q(-4,4,11,2,0x435949);
}
function pine(g,x,y,s=1){
 const q=(a,b,w,h,c)=>px(g,x+a*s,y+b*s,w*s,h*s,c);
 q(-4,8,8,10,0x5c4835);q(-2,9,4,7,0x9a7950);
 q(-11,6,22,6,0x123a2c);q(-9,0,18,12,0x1b6238);
 q(-12,-1,24,7,0x237345);q(-8,-8,16,11,0x24874b);
 q(-6,-11,13,8,0x3eab59);q(-3,-14,7,6,0x78c56c);
 q(-10,5,5,3,0x439c56);q(3,-6,5,3,0x9ee786);
 q(4,0,7,3,0x2c9c56);q(-6,-3,3,2,0xa6ed89);
 q(-10,11,22,2,0x153d31);
}
function flower(g,x,y,pink=false){
 const c=pink?0xf78ba8:0xf8f5d1;
 px(g,x,y,2,2,c);px(g,x+4,y,2,2,c);
 px(g,x+2,y-2,2,2,c);px(g,x+2,y+2,2,2,c);
 px(g,x+2,y,2,2,0xf4c958);px(g,x+3,y+4,1,3,0x25874c);
}
function tallGrass(g,x,y){
 px(g,x-7,y+5,15,3,0x235f38);px(g,x-6,y,2,7,0x277d3e);
 px(g,x-4,y-4,3,11,0x2b9349);px(g,x,y-1,2,8,0x55b94f);
 px(g,x+3,y-5,3,12,0x207e41);px(g,x+6,y-2,2,8,0x72be55);
 px(g,x-3,y-1,2,2,0x9fe37c);
}
function fence(g,x,y){
 for(let k=0;k<3;k++){
  const a=x+11*k;
  px(g,a+1,y+3,7,13,0x513a2e);px(g,a,y,7,13,0xab7846);
  px(g,a+1,y,5,2,0xffd28b);px(g,a+5,y+3,1,8,0xe0a66a);
  px(g,a,y+12,8,3,0x483b2c);
 }
}
function routeBuilding(g,x,y,pc=false){
 const roof=pc?0xd94843:0x247ed6,light=pc?0xff9c8f:0x9edbff;
 // shadow, foundation, cream masonry and roof bevels
 px(g,x+3,y+36,58,5,0x244b3b);px(g,x+1,y+14,56,23,0x795c47);
 px(g,x+4,y+15,50,22,0xe5cb91);px(g,x+6,y+18,46,16,0xffebba);
 px(g,x,y+7,58,10,0x14293e);px(g,x+2,y+2,54,14,roof);
 px(g,x+5,y,48,7,light);px(g,x+4,y+8,50,3,pc?0xf16058:0x389ceb);
 px(g,x+7,y+15,13,13,0x254a69);px(g,x+9,y+17,9,9,0xa6e2ff);
 px(g,x+38,y+15,13,13,0x254a69);px(g,x+40,y+17,9,9,0xa6e2ff);
 px(g,x+24,y+23,10,14,0x5d433b);px(g,x+26,y+25,6,12,0x987254);
 px(g,x+30,y+31,1,2,0xffdc86);
 px(g,x+3,y+35,52,2,0x8b7551);
 if(pc)ball(g,x+29,y+9,6);
 else{
  px(g,x+20,y+5,20,8,0x104985);
  px(g,x+22,y+6,17,2,0xffffff);
 }
}
// Differentiated modular structures. Kept in Phaser Graphics — each tile can
// later be swapped for a licensed spritesheet without touching battle/UI data.
function landmark(g,scene,biome){
 const rect=(x,y,w,h,c)=>px(g,x,y,w,h,c);
 const label=(text,x,y,color='#fff3bd')=>scene.add.text(x,y,text,{
  fontFamily:'Pixelify Sans,monospace',fontSize:'9px',
  fontStyle:'bold',color,stroke:'#203442',strokeThickness:2
 }).setOrigin(.5).setDepth(2);
 if(['cave','cliff','victory','gate'].includes(biome)){
  for(let x=278;x<370;x+=11){
   rect(x,130+(x%3)*3,11,44,0x65706a);
   rect(x+1,131+(x%3)*3,7,4,0xa3ab99);
   rect(x,168,11,3,0x394b46);
  }
  rect(297,145,54,27,0x323e42);rect(301,145,46,27,0x172d36);
  rect(306,149,35,23,0x071923);
  for(let j=0;j<5;j++)rect(301-j*3,171+j*3,47+j*6,3,j%2?0x8c9185:0xadb098);
  label(biome==='victory'?'VICTORY ROAD':biome==='gate'?'LIGA':biome==='cliff'?'ROTA':'CAVERNA',324,137);
 }else if(['sea','river','ship','water-gym'].includes(biome)){
  // Tile strips form moving-water-looking terrain without an image texture.
  for(let y=110;y<261;y+=9)for(let x=285;x<386;x+=14){
   rect(x+((y/9)%2)*5,y,8,2,0x9eddeb);
   rect(x+2,y+3,4,1,0x267fc1);
  }
  if(biome==='ship'){
   rect(286,160,86,19,0x6e5040);rect(291,178,75,6,0x473b33);
   rect(298,139,58,22,0xf2dfb9);rect(312,132,31,9,0xffffff);
   for(let x=302;x<355;x+=16)rect(x,147,9,8,0x427ca1);
   rect(328,110,4,26,0x463a38);
   label('S.S. ANNE',326,126);
  }else if(biome==='water-gym'){
   rect(290,129,76,50,0xdddab3);
   rect(296,133,63,41,0x339ac6);
   rect(304,140,47,27,0x67c9ef);label('GYM',327,124);
  }else{
   rect(306,157,52,7,0xd3b174);
   for(let x=311;x<359;x+=7)rect(x,162,3,9,0x78573c);
   if(biome==='river')label('ROTA 4',333,136);
  }
 }else if(['city','pewter','mansion','tower','league','hall','dojo',
             'psychic-gym','grass-gym','poison-gym','fire-gym',
             'electric-gym','ground-gym'].includes(biome)){
  const high=['tower','league','hall','mansion'].includes(biome);
  const roof=biome==='fire-gym'?0xbe6548:biome==='grass-gym'?0x538b65:
   biome==='psychic-gym'?0x9171b2:biome==='electric-gym'?0xb79e46:
   biome==='league'||biome==='hall'?0xd4c078:0x717b82;
  rect(274,139-(high?20:0),89,37+(high?20:0),0x344a50);
  rect(278,143-(high?20:0),81,29+(high?20:0),0xc3bda5);
  rect(271,133-(high?20:0),94,10,roof);
  rect(277,126-(high?20:0),82,10,0xb6b9a3);
  rect(282,151,13,17,0x6ba0b5);rect(341,151,13,17,0x6ba0b5);
  rect(309,150,18,23,0x5c493c);rect(312,154,12,18,0x253b47);
  if(high)for(const x of [289,307,327,347])rect(x,126,8,8,0x7194a8);
  const title=biome==='pewter'?'BROCK':biome==='league'?'LIGA':
   biome==='hall'?'CAMPEÃO':biome==='mansion'?'MANSÃO':
   biome==='tower'?'SILPH CO.':biome==='city'?'CIDADE':
   biome==='dojo'?'DOJO':'GYM';
  label(title,320,136-(high?20:0));
 }else if(['forest','safari','grassland'].includes(biome)){
  for(const x of [278,298,326,350]){
   pine(g,x,137,.85);pine(g,x+8,167,.6);
  }
  for(let x=285;x<358;x+=14)tallGrass(g,x,163+(x%3)*4);
  rect(297,186,56,5,0x6b5034);
  for(const x of [301,348])rect(x,170,5,16,0xd6ab73);
  label(biome==='safari'?'SAFARI':'FLORESTA',329,153);
 }else if(['graveyard','hideout','dragon','ice','volcano','road'].includes(biome)){
  if(biome==='graveyard'){
   for(let x=282;x<366;x+=17){
    rect(x,145+(x%4)*4,12,22,0x98999c);
    rect(x+3,149+(x%4)*4,6,2,0xd8d1ba);
    rect(x+5,155+(x%4)*4,2,8,0x4f5b61);
   }
   label('TOWER',322,126);
  }else if(biome==='ice'){
   for(let x=278;x<366;x+=17){
    rect(x+4,138+(x%3)*4,8,35,0x68bce2);
    rect(x+6,131+(x%3)*4,4,8,0xe8faff);
    rect(x+5,143,3,21,0xb2ebfa);
   }
   label('ICE',327,127);
  }else if(biome==='volcano'){
   for(let x=285;x<367;x+=8)rect(x,163-(x%5)*4,8,17,0x72665c);
   rect(305,142,40,19,0xb84c37);
   rect(317,146,17,14,0xff9e48);rect(325,140,6,8,0xffd468);
   label('VULCÃO',329,130);
  }else if(biome==='dragon'){
   for(let x=285;x<362;x+=24){
    rect(x,137,13,36,0x4c527f);rect(x+2,134,9,4,0x8d8cbb);
   }label('DRAGÃO',322,132);
  }else if(biome==='hideout'){
   rect(287,135,77,41,0x434953);
   for(let x=293;x<361;x+=21)rect(x,145,12,21,0x9b626a);
   rect(310,148,30,16,0x742a35);label('ROCKET',325,130);
  }else {
   // Cycling road: long paved path with guard rails.
   rect(277,130,90,50,0x9b9b9b);
   for(let x=279;x<365;x+=17)rect(x,154,10,2,0xffefbc);
   rect(278,133,88,3,0x6c513d);rect(278,175,88,3,0x6c513d);
   label('CYCLING',326,122);
  }
 }
}
function panelMap(g){
 // Hand-pixeled metal-and-gold frame, each element drawn in game.
 px(g,8,55,391,260,0x031522);px(g,10,56,386,257,0xcba65a);
 px(g,13,59,380,251,0x093d49);px(g,16,61,374,247,0x0e2038);
 px(g,19,89,372,177,0x82bc67);
 px(g,13,57,376,3,0x9febc1);px(g,13,308,376,3,0x6b481f);
 for(const [x,y] of [[10,56],[385,56],[10,301],[385,301]]){
  px(g,x,y,11,11,0x5f4627);px(g,x+1,y+1,9,9,0xffe29a);
  px(g,x+3,y+3,7,3,0xfff4c2);
 }
}
function pathStroke(g,points){
 // One easy-to-follow serpentine trail over the actual map image.
 // Draw thin and partially translucent so buildings and trees remain visible.
 const route=[{x:56,y:251},...points,{x:334,y:107}];
 for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i];
  for(const [width,color,alpha] of [
   [11,0x354739,.86],[8,0xb78e58,.86],[5,0xf9db9e,.90]
  ]){
   g.lineStyle(width,color,alpha);
   g.lineBetween(a.x,a.y,b.x,b.y);
  }
 }
 // Small pixel checkpoints, not oversized circles or fake buildings.
 for(const p of points){
  px(g,p.x-5,p.y-5,10,10,0x243a40,.8);
  px(g,p.x-3,p.y-3,6,6,0xffdfa1,.85);
 }
}
function pathDistance(x,y,points){
 const p=[{x:82,y:243},...points,{x:333,y:149}];
 let d=999;
 for(let i=1;i<p.length;i++){
  const a=p[i-1],b=p[i],dx=b.x-a.x,dy=b.y-a.y;
  const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));
  d=Math.min(d,Math.hypot(x-a.x-t*dx,y-a.y-t*dy));
 }
 return d;
}
// Route shapes and palette reflect the Route 01, Route 02 / Viridian Forest,
 // and Pewter City reference sheets; no downloaded map sheet is overlaid.
export function map(scene,stage,points,page=0,region=null){
 const g=scene.add.graphics().setDepth(1);
 const r=rand(301+(stage*7381)+page*5127);panelMap(g);
 const biome=region?.biome||(stage===0?['route','forest','pewter'][Math.min(2,page)]:'route');
 const preBrock=stage===0,forest=biome==='forest'||biome==='safari',
  pewter=['pewter','ground-gym','victory','cliff','cave'].includes(biome);
 const water=['sea','ship','river','water-gym'].includes(biome);
 const rocky=['cliff','cave','victory','ground-gym','pewter','volcano'].includes(biome);
 const urban=['city','tower','league','hall','mansion','psychic-gym','electric-gym','dojo'].includes(biome);
 const ash=['graveyard','hideout','dragon','poison-gym'].includes(biome);
 const meadow=forest?[0x407d52,0x4c8f4f,0x38814e,0x5b9b5b]:
  water?[0x80c8d5,0x6cb7cc,0x8cd6d9,0x4e9eb9]:
  rocky?[0xa9a58a,0x8f968a,0xbdb39a,0x929880]:
  urban?[0xc2ba94,0xd2c3a0,0xa4b3a8,0xb8b09e]:
  ash?[0x727b7a,0x8b8f8b,0x657d7b,0x96958c]:
  [0x8dcb66,0x80be58,0x97d36c,0x79b958];
 // Clean 16-pixel terrain replaces the former busy 6-pixel random confetti.
 // Keep paths and trainer markers visually dominant at mobile 640x360.
 drawKantoTiles(g,biome,stage*27+page);
 // Route 01 and Viridian Forest are inland; the shoreline belongs to later
 // Kanto stages. Use the 16-bit vegetation border in the early screenshots.
 if(water)for(let y=90;y<266;y+=2){
  const coast=375+Math.floor(Math.sin((y+stage*11)*.085)*5);
  px(g,coast-4,y,7,2,0xefdda2);
  px(g,coast,y,391-coast,2,0x399ad8);
  px(g,coast+5,y+1,10,1,0x1972c4);
  if(Math.floor(y/2)%4===0){
   px(g,coast+1,y,5,1,0xe8ffff);px(g,coast+8,y,4,1,0x9fe7f4);
  }
 }
 else for(let y=100;y<265;y+=20){
  pine(g,387,y,1);pine(g,20,y,.65);
 }
 // Cliff field only on the Pewter approach or Mt. Moon; the first
 // two route pages are wooded and grassy as in the GBA reference.
 if(rocky)for(let x=19;x<155;x+=10){
  const span=26+Math.floor(11*Math.sin((x-19)*.067))+(x<90?8:0);
  for(let y=90;y<90+span;y+=8){
   const dark=r()<.5?0x666e64:0x8b8774;
   px(g,x,y,10,9,dark);px(g,x+1,y+1,7,3,0xb0a993);
   px(g,x+7,y+4,2,4,0x4b6252);
   px(g,x+1,y+7,9,2,0x505c50);
  }
  px(g,x,89+span,10,4,0x344f3d);
 }
 if(rocky){
  px(g,59,111,29,18,0x283c36);px(g,64,113,20,16,0x0c2429);
  px(g,68,114,11,16,0x040e1c);
  for(let j=0;j<4;j++){
   px(g,63-j*2,130+j*4,32+j*4,3,0xa9a08b);
   px(g,65-j*2,131+j*4,27+j*4,1,0xe4d0a8);
  }
 }
 // FireRed source map is tiled as 16x16 Phaser sprites on top of the
 // native base scene; gameplay nodes render at higher depths.
 const hasFRLG=renderLocationTiles(scene,region);
 // Draw exactly one trail on top of whichever map texture is available.
 const hasWorldSprites=!hasFRLG&&scene.textures.exists(WORLD_SHEET);
 if(hasWorldSprites){
  // True PNG tile textures at depth 1.05, native road path above at 1.20,
  // then trees/buildings at depth 1.4. Trainer nodes stay clickable on top.
  decorateWorldWithSprites(scene,region,points);
  // Route overlay is shared with FireRed source maps and CC0 fallback.
 }
 if(!hasWorldSprites&&!hasFRLG){
 // Procedural art is only a FALLBACK when neither real location tiles nor
 // the optional CC0 sheet are available. Never place fake PC/MART labels
 // or fake buildings over the authentic FireRed map.
 for(let k=0;k<(forest?190:urban?48:rocky?75:128);k++){
  const x=25+Math.floor(r()*350),y=109+Math.floor(r()*149);
  if(x>366||pathDistance(x,y,points)<15||Math.hypot(x-76,y-229)<41
    ||Math.hypot(x-331,y-153)<37||x<135&&y<139)continue;
  const p=r();
  if(p<(forest?.4:.18))tallGrass(g,x,y);
  else if(p<.43)px(g,x,y,2,2,0x5baf51);
  else if(p<.57)flower(g,x,y,r()<.52);
  else if(p<.72){px(g,x,y,4,2,0x4a8b44);px(g,x+4,y-1,2,3,0x6cbb62)}
  else if(p<.80)stone(g,x,y,.45);
 }
 // Deterministic arbor sprites built from layered pixel cells.
 const trees=[];
 for(let i=0;i<(forest?130:urban?28:rocky?43:90);i++){
  const x=27+Math.floor(r()*346),y=109+Math.floor(r()*144);
  if(pathDistance(x,y,points)<29||Math.hypot(x-76,y-228)<43
    ||Math.hypot(x-331,y-145)<44||x<145&&y<145||x>364)continue;
  if(r()>(forest?.3:urban?.85:rocky?.79:.56))continue;
  trees.push({x,y,s:r()<.25?.48:.58+r()*.2});
 }
 trees.sort((a,b)=>a.y-b.y);
 for(const t of trees)pine(g,t.x,t.y,t.s);
 // Foreground props and buildings overlay foliage, with functional UI zones
 // supplied by the campaign scene separately.
 fence(g,22,224);fence(g,116,244);fence(g,279,196);
 if(biome==='route'||biome==='city'){
  routeBuilding(g,43,208,true);
  routeBuilding(g,297,131,false);
  scene.add.text(67,229,'PC',{fontFamily:'Pixelify Sans,monospace',
   fontSize:'11px',fontStyle:'bold',color:'#d83c3e',stroke:'#ffefc6',strokeThickness:2})
   .setOrigin(.5).setDepth(2);
  scene.add.text(325,138,'MART',{fontFamily:'Pixelify Sans,monospace',
   fontSize:'9px',fontStyle:'bold',color:'#f2faff',stroke:'#174469',strokeThickness:2})
   .setOrigin(.5).setDepth(2);
 }else if(forest)landmark(g,scene,biome);
 else landmark(g,scene,biome);
 }
 if(hasWorldSprites&&['route','city'].includes(biome)){
  // Native labels remain interactive Phaser text, not pixels in a screenshot.
  scene.add.text(74,215,'CENTRO',{fontFamily:'Pixelify Sans,monospace',
   fontSize:'8px',fontStyle:'bold',color:'#fff4d3',stroke:'#242a4a',
   strokeThickness:2}).setOrigin(.5).setDepth(2);
  scene.add.text(330,137,'MART',{fontFamily:'Pixelify Sans,monospace',
   fontSize:'9px',fontStyle:'bold',color:'#ffffff',stroke:'#203c56',
   strokeThickness:2}).setOrigin(.5).setDepth(2);
 }
 // Route always remains visible ABOVE the FireRed tiles, never hidden below them.
 const routeOverlay=scene.add.graphics().setDepth(2.25);
 pathStroke(routeOverlay,points);
 // Keep the map art separate from interactive Phaser nodes / information.
 px(g,17,62,376,27,0x054553);
 px(g,19,64,372,23,0x064558);
 px(g,19,86,372,2,0x60c5bc);
 px(g,19,267,373,41,0x073c38);
 px(g,19,268,373,2,0x51bc9c);
 px(g,19,307,373,1,0xf1ca6e);
 for(const x of [29,36,382])pine(g,x,300,.37);
 return g;
}

export function node(g,x,y,kind='future'){
 // FRLG-sized unobtrusive marker: keep source map tiles visible.
 const r=6;
 g.fillStyle(0x0b2535,.8);g.fillCircle(x+1,y+3,r+3);
 g.fillStyle(0xf9efd8);g.fillCircle(x,y,r+2);
 g.fillStyle(0x1d3548);g.fillCircle(x,y,r+1);
 g.fillStyle(kind==='done'?0x237c56:kind==='current'?0xe3ac3e:0x7d8f98);
 g.fillCircle(x,y,r-1);
 g.lineStyle(1,kind==='current'?0xfff0b4:0xc5ddd1);
 g.strokeCircle(x,y,r+1);
 if(kind==='current'){
  g.lineStyle(2,0xffdb74);g.strokeCircle(x,y,r+3);
 }
 g.fillStyle(0xffffff,.3);g.fillRect(x-3,y-5,6,2);
}
export function team(scene){
 const g=scene.add.graphics().setDepth(1);
 panel(g,407,56,225,238);
 px(g,413,62,213,35,0x852c36);
 px(g,414,63,211,29,0xc54d49);
 px(g,414,63,211,5,0xee8163);
 px(g,414,94,211,2,0xf4ba82);
 ball(g,425,78,9);
 px(g,414,98,210,34,0x071e39);
 px(g,415,131,208,1,0x3c7694);
}
export function teamCard(scene,x,y,member,chosen){
 const g=scene.add.graphics().setDepth(2);
 const trim=chosen?0xffd66f:member?0x5be0ad:0x315f85;
 const face=member?(chosen?0x252e55:0x0c483f):0x132d4c;
 px(g,x+2,y+4,100,62,0x030e20,.75);
 px(g,x,y,100,62,0x05162c);
 px(g,x+1,y+1,98,60,trim);
 px(g,x+3,y+3,94,56,0x071d35);
 px(g,x+4,y+4,92,54,face);
 px(g,x+5,y+5,90,2,chosen?0xffedb2:0x5aac9d);
 for(const [cx,cy] of [[x+1,y+1],[x+95,y+1],[x+1,y+57],[x+95,y+57]]){
  px(g,cx,cy,4,4,0x102541);
  px(g,cx+1,cy+1,2,2,trim);
 }
 if(member){
  px(g,x+4,y+8,30,34,chosen?0x5a4476:0x2d8764);
  px(g,x+5,y+9,28,32,chosen?0x7f6fa0:0x75bf93);
  px(g,x+35,y+49,59,8,0x071624);
  const hp=Math.max(0,Math.min(100,Number(member.hp??100)));
  px(g,x+37,y+51,55,4,0x1a4651);
  px(g,x+37,y+51,55*hp/100,4,hp>50?0x55ed90:hp>20?0xe8ce65:0xe66c60);
  px(g,x+37,y+51,55*hp/100,1,0xb2ffb2,.75);
 }else{
  g.fillStyle(0x2b5075);g.fillCircle(x+50,y+28,13);
  px(g,x+37,y+27,26,3,0x0f2c4b);
  g.fillStyle(0x112e4d);g.fillCircle(x+50,y+28,5);
  g.fillStyle(0x54789c);g.fillCircle(x+50,y+28,2);
 }
}

export function progress(g,x,y,active,num=6){
 for(let i=0;i<num;i++){
  const xx=x+i*16;
  g.fillStyle(0x071e35);g.fillCircle(xx,y,5);
  g.lineStyle(1,0x9ad5ec);g.strokeCircle(xx,y,5);
  g.fillStyle(i===active?0xffdf65:i<active?0x45c58a:0x325878);
  g.fillCircle(xx,y,3);
 }
}
