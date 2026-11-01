/* T34 Option C — native Phaser Graphics, Route 1 visual preview only.
 * Original pixel artwork. No campaign, combat, RNG, save or input modifications.
 * View: 640x360 logical px, map between y=35 and y=319.
 */
export const ROUTE1_ART_VERSION='option-c-route1-v1';
export const ROUTE1_EXITS=Object.freeze({south:'pallet',north:'viridian'});
const tile=(g,x,y,w,h,c,a=1)=>g.fillStyle(c,a).fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
const random=n=>{let s=n>>>0;return()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296)};
const choice=(r,colors)=>colors[Math.floor(r()*colors.length)];
export function route1Path(y){
 const center=321+Math.round(13*Math.sin((y-35)/50)+7*Math.sin((y-35)/19));
 const halfWidth=Math.max(39,Math.min(49,43+Math.round(4*Math.sin(y/31))));
 return {left:center-halfWidth,right:center+halfWidth,center};
}
export const route1IsClear=(x,y,margin=0)=>x<route1Path(y).left-margin||x>route1Path(y).right+margin;
export const ROUTE1_TREES=Object.freeze([
 [37,77,'oak'],[104,75,'oak'],[182,98,'oak'],[462,66,'oak'],[529,99,'pine'],[600,74,'oak'],
 [66,172,'oak'],[163,165,'pine'],[480,157,'oak'],[563,189,'oak'],[613,151,'pine'],
 [58,245,'oak'],[166,238,'oak'],[445,260,'oak'],[546,263,'pine'],[606,248,'oak']
].map(([x,y,kind])=>Object.freeze({x,y,kind})));
export const ROUTE1_GRASS_PATCHES=Object.freeze([
 [195,74,58,31],[84,117,87,36],[429,109,91,36],[503,151,79,36],
 [135,196,96,33],[424,208,94,38],[90,261,74,25],[514,271,66,23]
].map(([x,y,w,h])=>Object.freeze({x,y,w,h})));
function ground(g){
 tile(g,0,35,640,284,0x67aa50);
 const r=random(11701);
 for(let y=35;y<319;y+=8)for(let x=0;x<640;x+=8){
  tile(g,x,y,8,Math.min(8,319-y),choice(r,[0x66aa50,0x71b455,0x7bbc5d,0x70ad53,0x83c364]));
  if(r()>.5)tile(g,x+1+r()*4,y+2+r()*4,2,1,0x4b9645,.47);
  if(r()>.75)tile(g,x+2+r()*4,y+3+r()*4,2,1,0xb2d278,.48);
 }
 // Irregular raised border: rock joints, ledge highlight, grass lip.
 for(const [x,y,w,h] of [[0,35,36,129],[607,35,33,101],[0,226,29,90],[616,216,24,103]]){
  tile(g,x,y,w,h,0x806c51);
  for(let yy=y;yy<y+h;yy+=12){
   tile(g,x,yy,w,2,0xa48a61);tile(g,x+(yy%24?3:0),yy+4,w-4,2,0x604e43,.56);
   for(let xx=x+3;xx<x+w-3;xx+=13)tile(g,xx+(yy%24?4:0),yy+2,2,7,0xb29c6c,.75);
  }
  tile(g,x,y,w,7,0x4c8745);tile(g,x,y,w,3,0x9bc86a);
 }
}
function path(g){
 const r=random(11706);
 for(let y=35;y<319;y+=2){
  const {left,right}=route1Path(y),wiggle=Math.floor((r()-.5)*4);
  tile(g,left-5+wiggle,y,right-left+10,2,0x397b42);
  tile(g,left-3+wiggle,y,right-left+6,2,0xb1a577);
  tile(g,left+wiggle,y,right-left,2,choice(r,[0xdec197,0xe6c99b,0xe7cfa4,0xd9bb8e,0xebd1a6]));
  if(r()>.34)tile(g,left+4+r()*(right-left-11),y,2+r()*3,1,choice(r,[0xc0a37f,0xbfa17c,0xf5dbaf]));
 }
 for(let i=0;i<135;i++){
  const y=39+r()*276,p=route1Path(y),x=p.left+7+r()*(p.right-p.left-14);
  tile(g,x,y,1+r()*3,1+r()*2,choice(r,[0xd2b088,0xad9879,0xf5e0b6,0xc6b18d]),.8);
 }
}
function grassClump(g,x,y){
 for(let i=0;i<7;i++){
  const dx=(i-3)*2,h=7+(i%3)*3;
  tile(g,x+dx,y-h,2,h,[0x286e3b,0x348b42,0x54a452,0x94cc63][i%4]);
  tile(g,x+dx+1,y-h-2,1,3,0xa2d474);
 }
}
function meadow(g){
 const r=random(11709);
 for(const {x,y,w,h} of ROUTE1_GRASS_PATCHES){
  tile(g,x,y+5,w,h-5,0x398343,.35);
  for(let yy=y+10;yy<y+h;yy+=9)for(let xx=x+5;xx<x+w-6;xx+=10){
   const px=xx+Math.floor(r()*3-1),py=yy+Math.floor(r()*4);
   if(route1IsClear(px,py,12))grassClump(g,px,py);
  }
 }
}
function tree(g,x,y,r,kind='oak'){
 const pine=kind==='pine',cherry=kind==='blossom';
 const dark=cherry?0x994f7c:pine?0x194d49:0x225e3c;
 const mid=cherry?0xd582a3:pine?0x2c7960:0x388e46;
 const light=cherry?0xf3b6cb:pine?0x559c78:0x81bb4e;
 tile(g,x-18,y-1,40,7,0x264b38,.29);
 tile(g,x-4,y-20,9,23,0x654e38);tile(g,x-2,y-20,3,23,0x9b7650);
 if(pine){
  for(let k=0;k<3;k++){
   const yy=y-46+k*12,w=11+k*6;
   for(let dx=-w;dx<=w;dx+=4){
    const h=Math.round(4+(w-Math.abs(dx))*.63);
    tile(g,x+dx,yy+Math.round(Math.abs(dx)*.28),4,h,dark);
    tile(g,x+dx,yy+Math.round(Math.abs(dx)*.28),3,Math.max(2,h-3),mid);
    if((dx/4+k)%3===0)tile(g,x+dx,yy+2,2,2,light);
   }
  }
 }else{
  for(const [cx,cy,w,h] of [[-17,-31,16,19],[6,-37,17,20],[-7,-46,21,19],[18,-24,15,16],[-20,-19,13,13],[2,-17,20,14]]){
   for(let dy=-h/2;dy<h/2;dy+=3){
    const width=Math.round(Math.sqrt(Math.max(0,1-(dy/(h/2))**2))*w);
    tile(g,x+cx-width,y+cy+dy,width*2+1,3,dy<0?mid:dark);
   }
  }
  for(let i=0;i<100;i++){
   const dx=r()*44-22,dy=r()*30-43;
   if((dx/25)**2+((dy+28)/23)**2<1)
    tile(g,x+dx,y+dy,1+r()*3,1+r()*2,choice(r,[mid,light,cherry?0xffd7df:0xb0d66a]),.84);
  }
 }
}
function flowers(g,r,x,y){
 for(let i=0;i<8;i++){
  const xx=x+(r()-.5)*26,yy=y+(r()-.5)*12;
  tile(g,xx,yy+2,2,4,0x367a45);
  tile(g,xx-1,yy,3,2,choice(r,[0xf3f1cf,0xf8aec2,0xf5d27d,0xed9ab2]));
  tile(g,xx,yy,1,1,0xfaf0bc);
 }
}
function rock(g,x,y,s=1){
 const w=12*s,h=7*s;
 tile(g,x-w/2,y-h/2,w+2,h+3,0x36564b,.33);
 tile(g,x-w/2,y-h/2,w,h,0x646b61);tile(g,x-w/2+2,y-h/2-3,w-5,h-1,0xa3a99a);
 tile(g,x-w/2+3,y-h/2-2,w-8,1,0xd8d5b5);
}
function fence(g,x,y,w){
 tile(g,x,y+8,w,3,0xb89b6e);tile(g,x,y+15,w,3,0xc7a77d);
 for(let xx=x;xx<=x+w;xx+=11){
  tile(g,xx,y+2,5,23,0x7a6754);tile(g,xx+1,y,5,22,0xf3e9ce);tile(g,xx+2,y,3,3,0xffffff);
 }
}
function outskirts(g){
 // Pallet Town is the southern exit; never place a gate across the actual path.
 for(const [x,w] of [[16,105],[520,104]]){
  tile(g,x+3,292,w-6,30,0x725b48);tile(g,x+6,295,w-12,26,0xf0dbb4);
  tile(g,x-4,282,w+8,11,0x6b3d37);
  for(let yy=266;yy<286;yy+=4)tile(g,x+(yy-264)/2,yy,w-(yy-264),4,yy%8?0xb14743:0xd16454);
  tile(g,x+12,299,16,15,0x527887);tile(g,x+15,301,10,10,0x9bdbe3);
  tile(g,x+45,300,19,17,0x58473e);tile(g,x+47,302,15,15,0x987357);
 }
 fence(g,143,285,54);fence(g,443,285,54);
 for(const x of [242,391]){
  tile(g,x+2,293,8,24,0x66523d);tile(g,x,291,11,23,0xaf8654);
  tile(g,x-2,287,15,6,0x314e65);tile(g,x,280,11,9,0xe4ca83);tile(g,x+2,282,7,4,0xffeac1);
 }
}
function props(g){
 const r=random(11718);
 for(const [x,y] of [[75,104],[218,114],[483,98],[571,126],[108,197],[203,264],[461,192],[577,233],[66,274]])flowers(g,r,x,y);
 for(const [x,y,s] of [[215,58,1],[535,80,1.3],[100,226,1.4],[410,241,1],[583,303,.8]])rock(g,x,y,s);
 fence(g,43,122,45);fence(g,526,133,44);
 tile(g,483,207,37,5,0x6b4a34);tile(g,489,201,29,8,0x936844);tile(g,491,200,26,2,0xc99b66);
 tile(g,402,166,5,25,0x65442e);tile(g,404,168,2,23,0xb3824d);
 tile(g,394,153,58,19,0x5d4030);tile(g,396,155,54,15,0xb68b55);tile(g,399,157,48,1,0xe6c48b);
 // Two civilian decorations, NOT trainer encounters.
 for(const [x,y,shirt,hat] of [[206,160,0x567faf,0x295d94],[480,248,0xa45d70,0xe6ca92]]){
  tile(g,x-5,y+8,11,3,0x2d593d,.35);tile(g,x-4,y-8,8,6,0xf5caa1);
  tile(g,x-5,y-13,10,5,hat);tile(g,x-4,y-1,9,10,shirt);
  tile(g,x-3,y+9,3,5,0x364c61);tile(g,x+2,y+9,3,5,0x364c61);
 }
}
export function drawOptionCRoute1(scene,g){
 ground(g);path(g);meadow(g);
 const r=random(11721);
 for(const t of ROUTE1_TREES){
  if(!route1IsClear(t.x,t.y,29))throw Error('Route 1 tree obstructs clear corridor');
  tree(g,t.x,t.y,r,t.kind);
 }
 tree(g,578,178,r,'blossom');
 props(g);outskirts(g);
 scene.add.text(401,157,'ROTA 1',{fontFamily:'Pixelify Sans, monospace',fontSize:'9px',fontStyle:'bold',color:'#2c2e2a'}).setDepth(38);
 return Object.freeze({artVersion:ROUTE1_ART_VERSION,exits:ROUTE1_EXITS,trainers:0,
  pixelArt:true,previewOnly:true,trees:ROUTE1_TREES.length,grassPatches:ROUTE1_GRASS_PATCHES.length});
}