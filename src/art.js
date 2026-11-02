/* Pokémon Torre 2 — WebGL/PixiJS pixel-art renderer.
 * Temporary ORIGINAL proof-of-concept art, independent of Poké Arena assets.
 * All attacks are PixiJS/WebGL sprites, never CSS effects or Canvas2D.
 */
const DRAGON=[
'....................',
'........kk..........',
'.......kooook.......',
'.....kkooooook......',
'....koyyyyyook......',
'....koywoowook......',
'.....kooooook.......',
'..kkkkoooooookkk....',
'.kkoookooroookoook..',
'kooooookooroookoook.',
'kooddokooookkkk....',
'koddodkoooook.......',
'.kddddkoooook.......',
'..kkkkkooook........',
'......koooook.......',
'.....kookkook.......',
'....kkok..kok.......',
'....kk....kk........',
'....................'
];
const ROCK=[
'...................',
'.......kkkk........',
'.....kkggggkk......',
'....kgggllllgk.....',
'...kgggllgggggk....',
'...kglgggglggggk...',
'..kggggllggllggk...',
'.kgggkgggggkggggk..',
'.kgllkwwggwwkgggk..',
'.kgggkwwggwwkgggk..',
'.kggggggggggggggk..',
'..kgggkggggkgggk...',
'..kggggkkkkgggk....',
'...kggggggggggk....',
'....kkggggggkk.....',
'......kkkkkk.......',
'...................'
];
const ONIX=[
'......................',
'........kkkkkk........',
'.......kggllggk.......',
'.......kglggggk.......',
'......kggwwwggk.......',
'.......kggggggk.......',
'......kggkkgggk.......',
'......kggkkggk........',
'.....kkglggkk.........',
'....kgggllggk.........',
'...kgggggggggk........',
'....kkgggggkk.........',
'.....kggglggk.........',
'....kgggggggk.........',
'.....kkkkkkk..........',
'.........kkkkkk.......',
'.........kgggggk......',
'..........kkkkkk......'
];
const colors={'.':null,k:0x10151b,o:0xf27835,y:0xffba45,w:0xf7f4d9,
 r:0xe95638,d:0x5d2b69,g:0x7f837b,l:0xb0aaa0};
function pixelArt(P,grid,size){
 const gfx=new P.Graphics();
 for(let y=0;y<grid.length;y++)for(let x=0;x<grid[y].length;x++){
  const c=colors[grid[y][x]];if(c==null)continue;
  gfx.beginFill(c,1);gfx.drawRect(x*size,y*size,size,size);gfx.endFill();
 }
 return gfx;
}
export function makeArena(P){
 const root=new P.Container();
 const floor=new P.Graphics();
 floor.beginFill(0x14212a).drawRect(0,0,960,540).endFill();
 floor.beginFill(0x304149).drawRoundedRect(29,24,902,493,24).endFill();
 floor.beginFill(0x626760).drawRoundedRect(39,32,882,476,18).endFill();
 // Original tiled stony floor: layered irregular block pattern, not flat CSS.
 for(let row=0;row<8;row++)for(let col=0;col<16;col++){
  const x=42+col*55+(row%2)*19,y=39+row*58;
  const tone=[0x767c73,0x68736f,0x5a6665,0x82877b][(row*7+col*11)%4];
  floor.beginFill(tone,.41).drawRect(x,y,51,53).endFill();
  if((row+col)%3===0){
   floor.beginFill(0x3c4c51,.24).drawRect(x+7,y+40,22,5).endFill();
  }
 }
 floor.lineStyle(3,0x282f31,.76).drawRoundedRect(42,34,876,473,15);
 floor.lineStyle(2,0xbac2a6,.50).drawEllipse(505,280,220,142);
 floor.lineStyle(1,0x202c2e,.4).drawEllipse(505,280,231,153);
 for(let i=0;i<6;i++){
  const x=110+i*140;
  floor.lineStyle(2,0xb8bda4,.19).moveTo(x,60).lineTo(x,490);
 }
 for(let i=0;i<5;i++){
  const y=105+i*83;
  floor.lineStyle(2,0xe0dac0,.10).moveTo(65,y).lineTo(900,y);
 }
 // Pewter Gym boulders and textured stone props.
 const boulders=[[96,107,18],[876,132,26],[96,460,14],[866,454,19],[462,62,11],[482,481,10]];
 for(const [x,y,r] of boulders){
  floor.beginFill(0x283438).drawPolygon([x-r,y+6,x-r*.5,y-r,x+r*.55,y-r*.9,x+r,y+3,x,y+r]).endFill();
  floor.beginFill(0x838e85).drawPolygon([x-r*.7,y+1,x-r*.35,y-r*.73,x+r*.38,y-r*.62,x+r*.5,y,x,y+r*.43]).endFill();
  floor.lineStyle(2,0x2c393c,1).moveTo(x-r*.7,y).lineTo(x+r*.4,y+r*.2);
 }
 root.addChild(floor);
 const shadow=new P.Graphics().beginFill(0x131b21,.36).drawEllipse(0,0,48,13).endFill();
 const player=pixelArt(P,DRAGON,3);
 player.pivot.set(30,28);
 const enemyRock=pixelArt(P,ROCK,3.1);
 enemyRock.pivot.set(30,26);
 const enemyOnix=pixelArt(P,ONIX,3.5);
 enemyOnix.pivot.set(38,31);
 root.addChild(shadow,enemyRock,enemyOnix,player);
 const vfx=new P.Container();root.addChild(vfx);
 return {root,player,enemyRock,enemyOnix,shadow,vfx};
}
function palette(g,x,y,fill,size=4){
 g.beginFill(fill).drawRect(Math.round(x),Math.round(y),size,size).endFill();
}
function littleDiamond(g,x,y,size,color){
 g.beginFill(color).drawPolygon([x,y-size,x+size,y,x,y+size,x-size,y]).endFill();
}
function makeFlameFrame(P,frame){
 const gfx=new P.Graphics(),w=136,h=46,t=frame%12;
 const upper=[0,-2,0,3,1,-1,4,2,-2,3,-3,1,2,0,-4,1];
 const lower=[2,0,-2,1,-3,2,0,4,-1,2,0,1,-2,3,0,-1];
 // A single overlapping stream from the nozzle all the way to the impact;
 // border remains dark and orange tongues share a yellow core.
 for(let x=0;x<w;x+=4){
  const i=Math.floor(x/8),tip=Math.max(0,Math.min(1,(w-x)/19));
  const amplitude=(7+11*Math.sin(Math.PI*x/w))*tip;
  const yShift=upper[(i+t)%upper.length]*.45;
  const top=Math.round(h/2-amplitude+yShift),bottom=Math.round(h/2+amplitude+lower[(i+t)%lower.length]*.45);
  if(bottom<=top)continue;
  palette(gfx,x,top,0x151015,4);
  for(let y=top+3;y<bottom-2;y+=4){
   const edge=Math.min(y-top,bottom-y);
   const jag=(i*7+t*3+Math.floor(y/4))%11;
   const color=edge<5?0xaa2a18:edge<9?0xf05b1c:edge<13?0xff9b20:
    jag<7?0xffe46c:0xfffaab;
   palette(gfx,x,y,color,4);
  }
  palette(gfx,x,bottom-2,0x121016,4);
 }
 // Deliberate detached flame tips (few large tongues, not a dotted projectile).
 for(let i=0;i<4;i++){
  const x=74+i*16+((t+i*3)%4)*2,y=6+(i%2)*32+((t+i)%3)*2;
  littleDiamond(gfx,x,y,4+i%2,0xf86f22);
 }
 return gfx;
}
function makeBurstFrame(P,frame){
 const g=new P.Graphics(),phase=frame%16;
 const size=phase<3?23+phase*4:37+(phase%3)*2;
 const center={x:64,y:64};
 // Fire Blast is a fiery 大 glyph, not a generic circular fireball.
 const segments=[[0,-size*.92,0,0],[-size*.70,-size*.10,size*.70,-size*.10],
                 [0,0,-size*.64,size*.83],[0,0,size*.64,size*.83]];
 for(const [x1,y1,x2,y2] of segments){
  for(let s=0;s<=12;s++){
   const x=center.x+x1+(x2-x1)*s/12;
   const y=center.y+y1+(y2-y1)*s/12;
   const wobble=2*Math.sin(phase*.67+s*1.65);
   palette(g,x-8+wobble,y-8,0x131014,16);
   palette(g,x-6+wobble,y-6,0xc22e18,12);
   palette(g,x-4+wobble,y-4,0xf47320,9);
   palette(g,x-2+wobble,y-2,0xffd349,5);
  }
 }
 for(let i=0;i<8;i++){
  const x=22+(i*17+phase*11)%87,y=20+(i*27+phase*7)%85;
  palette(g,x,y,i%2?0xf07326:0xffe27b,3);
 }
 return g;
}
function makeEmberFrame(P,frame){
 const g=new P.Graphics(),off=frame%12,center=20;
 for(let y=-16;y<=16;y+=4)for(let x=-16;x<=16;x+=4){
  if(x*x+y*y>270)continue;
  const edge=x*x+y*y>190;
  palette(g,center+x,center+y,edge?0x161116:
   (x+y+off)%3===0?0xfff0a0:(x+off)%2?0xffa029:0xf66e25,4);
 }
 return g;
}
function makeSpinFrame(P,frame){
 const g=new P.Graphics(),phase=frame/12*Math.PI*2;
 for(let n=0;n<48;n++){
  const a=n/48*Math.PI*2+phase;
  const r=27+Math.sin(n*.9+phase)*7;
  const x=50+Math.cos(a)*r,y=50+Math.sin(a)*r;
  const tone=[0x1b1118,0xba301b,0xfa7c1e,0xffd34b][n%4];
  palette(g,x,y,tone,n%5===0?8:5);
 }
 return g;
}
export function buildAtlases(P,app){
 const atlases={};
 const builders={flamethrower:makeFlameFrame,fireblast:makeBurstFrame,ember:makeEmberFrame,firespin:makeSpinFrame};
 for(const [id,builder] of Object.entries(builders)){
  const frames=[];
  for(let i=0;i<(id==='fireblast'?16:12);i++){
   const g=builder(P,i);
   frames.push(app.renderer.generateTexture(g,{resolution:1,scaleMode:P.SCALE_MODES.NEAREST}));
   g.destroy();
  }
  atlases[id]=frames;
 }
 return atlases;
}
export function makeParticle(P){
 const g=new P.Graphics();
 g.beginFill(0x151018).drawRect(0,0,12,12).endFill();
 g.beginFill(0xffdb6b).drawRect(3,3,6,6).endFill();
 return g;
}
