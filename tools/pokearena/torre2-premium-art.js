/* Original external-screen pixel motifs. No combat imports, timers or hit areas.
 * Each motif occupies a 32x32 cell. Integer pixels, transparent background.
 */
export const PREMIUM_PALETTE=Object.freeze([0x000000,0x183d3b,0x28604a,0x3c8751,0x65a552,0xa3c96a,0xe5e6b5,0x77654d,0xb39a70,0xefe0aa,0x537b8c,0x8fb9be,0x23495c,0x398dac,0x7ed4d7,0xe9ffff,0xc36b71,0xf3aaa0]);
export function premiumPixels(kind){
 const a=Array.from({length:32},()=>Array(32).fill(0));
 const r=(x,y,w,h,c)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(a[yy]&&xx>=0&&xx<32)a[yy][xx]=c};
 if(kind==='tree'){
  r(8,28,18,2,1);r(13,19,7,10,7);r(15,20,2,9,8);
  for(const [x,y,w,h,c]of [[4,14,24,10,1],[2,11,27,8,2],[5,5,23,14,3],[9,2,14,16,4],[7,7,11,6,5],[11,3,8,3,5],[3,12,8,4,4],[17,11,10,6,4],[11,17,9,4,3]])r(x,y,w,h,c);
  for(const [x,y]of [[9,8],[14,4],[18,7],[5,13],[22,12],[12,16],[19,18],[7,20]]){r(x,y,3,1,5);r(x+1,y-1,2,1,4)}
  r(11,10,3,2,6);r(20,14,2,1,5);r(8,22,4,1,3);
 }else if(kind==='planter'){
  r(2,24,28,4,1);r(3,19,26,7,10);r(2,18,28,3,11);r(5,22,22,1,12);
  for(let x=4;x<29;x+=5){r(x,11,4,7,2);r(x-1,12,6,3,3);r(x,11,3,1,5);r(x+1,8,1,5,4);r(x,7,3,3,x%2?16:9);r(x+1,8,1,1,6)}
 }else if(kind==='bench'){
  r(4,25,25,2,1);r(5,19,2,7,12);r(25,19,2,7,12);
  r(3,9,26,9,7);r(4,10,24,2,9);r(4,14,24,2,8);
  r(2,19,28,4,7);r(2,19,28,1,9);r(4,20,24,1,8);
  r(1,16,3,6,12);r(28,16,3,6,12);r(0,16,5,2,11);r(27,16,5,2,11);
 }else if(kind==='terminal'){
  r(4,2,24,21,12);r(5,2,22,2,11);r(7,5,18,14,10);r(8,6,16,11,13);
  r(9,7,14,1,14);r(10,9,6,1,15);r(10,11,10,1,14);r(10,13,8,1,14);
  r(6,20,20,2,11);r(23,20,2,1,5);r(14,23,4,3,10);
  r(5,26,22,4,12);r(6,26,20,1,11);for(let x=8;x<25;x+=3)r(x,28,2,1,11);
 }
 return a;
}
export function premiumSprite(scene,kind,x,y,scale=1){
 const key='torre2-premium-'+kind;
 if(!scene.textures.exists(key)){
  const g=scene.make.graphics({x:0,y:0,add:false});
  premiumPixels(kind).forEach((row,yy)=>row.forEach((c,xx)=>{if(c)g.fillStyle(PREMIUM_PALETTE[c],1).fillRect(xx,yy,1,1)}));
  g.generateTexture(key,32,32);g.destroy();
  scene.textures.get(key).setFilter(1);
 }
 return scene.add.image(Math.round(x),Math.round(y),key).setOrigin(0,0).setScale(scale);
}

// Presentation-only regional scenery. LPC Trees Mega-Pack, CC-BY-SA-3.0.
// Full authors/source/license: assets/ui/scenic/CREDITS.txt. Private texture.
export const SCENIC_ATLAS='torre2-scenic-lpc-v2';
export function scenicTheme(stage){
 const families=['stone','water','harbor','garden','garden','night','ember','stone','ice','stone','night','league','league'];
 const kind=families[stage]||'garden';
 const colors={
  stone:[0xb2c7bc,0x748a78,0xb4a784,0x686b56,0x344f48],
  water:[0xa5d5cc,0x559b9c,0xd5c996,0x628779,0x245c65],
  harbor:[0xc3d8cf,0x408597,0xc4b28a,0x7c8b69,0x294f60],
  garden:[0xc5d7a5,0x7aab73,0xcebc89,0x6e935e,0x305446],
  night:[0x8894b2,0x5c6a91,0xa4a0a7,0x65658b,0x343d64],
  ember:[0xd8ba91,0xa27864,0xc8ac89,0x7a665b,0x493f49],
  ice:[0xc9e4e2,0x80b8ca,0xd6ddc8,0x779aa0,0x385b73],
  league:[0xb1bdcb,0x7884a3,0xd3c5a2,0x8b8992,0x3b4a66]
 };
 return {kind,sky:colors[kind][0],far:colors[kind][1],path:colors[kind][2],ground:colors[kind][3],shade:colors[kind][4]};
}
// Each card owns its listeners; navigating away removes them, including when
// a network request finishes late. The loader deduplicates by a private key.
export function withScenicAtlas(scene,owner,paint){
 if(scene.textures.exists(SCENIC_ATLAS)){paint();return}
 const event='filecomplete-image-'+SCENIC_ATLAS;
 const cleanup=()=>{scene.load.off(event,ready);scene.load.off('loaderror',failed)};
 const ready=()=>{cleanup();owner.off('destroy',cleanup);if(owner.active)paint()};
 const failed=file=>{if(file.key===SCENIC_ATLAS){cleanup();owner.off('destroy',cleanup)}};
 owner.once('destroy',cleanup);scene.load.once(event,ready);scene.load.on('loaderror',failed);
 const queued=[...(scene.load.list?.entries||[]),...(scene.load.inflight?.entries||[])].some(file=>file.key===SCENIC_ATLAS);
 if(!queued){
  scene.load.image(SCENIC_ATLAS,'assets/ui/scenic/trees-green.png');
  if(!scene.load.isLoading())scene.load.start();
 }
}
function scenicTrees(scene,owner,x,y,w,h,variant,kind){
 if(kind==='ice')return;
 withScenicAtlas(scene,owner,()=>{
  const texture=scene.textures.get(SCENIC_ATLAS);texture.setFilter(1);
  if(!texture.has('grove-v2'))texture.add('grove-v2',0,0,0,64,64);
  const scale=w>150?2:1;
  const positions=[[x-8,y+h-64*scale],[x+w-56*scale,y+h-68*scale]];
  if(['stone','night','ember'].includes(kind))positions.pop();
  for(const [xx,yy] of positions){
   const tree=scene.add.image(xx,yy,SCENIC_ATLAS,'grove-v2').setOrigin(0).setScale(scale);
   // The art occupies only scenery and cannot intercept any pointer event.
   owner.add(tree);
  }
 });
}
export function scenicDiorama(scene,layer,x,y,w,h,stage,variant=0){
 const owner=scene.add.container(0,0);layer.add(owner);
 const t=scenicTheme(stage),g=scene.add.graphics();owner.add(g);
 const r=(c,xx,yy,ww,hh)=>{g.fillStyle(c);g.fillRect(Math.round(xx),Math.round(yy),Math.round(ww),Math.round(hh))};
 r(t.sky,x,y,w,h);r(t.far,x,y+Math.floor(h*.28),w,h*.72);
 // Cloud clusters and receding roofline have irregular pixel silhouettes.
 for(let i=0;i<3;i++){
  const cx=x+9+(i*29+variant*11)%Math.max(16,w-30),cy=y+7+(i%2)*6;
  r(0xe3e7cd,cx,cy,17,3);r(0xe3e7cd,cx+4,cy-2,8,2);
 }
 for(let i=0;i<4;i++){
  const bx=x+i*w/4,roof=y+24+(i%2)*6;
  r(t.shade,bx,roof,w/4,4);r(t.ground,bx+3,roof+4,w/4-5,14);
  r(t.path,bx+7,roof+8,3,5);
 }
 const floor=y+Math.floor(h*.58);
 r(t.ground,x,floor,w,y+h-floor);
 if(['water','harbor','ice'].includes(t.kind)){
  r(t.shade,x,floor-9,w,15);r(t.far,x,floor-7,w,11);
  for(let i=0;i<7;i++)r(t.sky,x+3+(i*17+variant*7)%(w-12),floor-5+(i%3)*3,9,1);
  r(t.path,x,floor+6,w,3);r(t.shade,x,floor+9,w,2);
 }
 // Perspective path, two stone steps and varied stone joints.
 const middle=x+w/2;
 for(let row=0;row<5;row++){
  const yy=floor+8+row*6,span=22+row*9;
  if(yy>=y+h)break;
  r(t.shade,middle-span/2,yy,span,6);r(t.path,middle-span/2+1,yy,span-2,4);
  r(t.ground,middle+(row%2?5:-8),yy,1,4);
 }
 for(let i=0;i<16;i++){
  const xx=x+3+(i*31+variant*13)%(w-6),yy=floor+13+(i*7)%Math.max(1,h-(floor-y)-15);
  if(Math.abs(xx-middle)>22){r(t.shade,xx,yy,3,1);r(t.path,xx,yy-2,1,2)}
 }
 // Distinct regional landmarks, not just a recolour of the same garden.
 if(['stone','ember'].includes(t.kind)){
  for(let side=0;side<2;side++)for(let row=0;row<3;row++){
   const xx=side?x+w-17-row*2:x+row*2,yy=y+25+row*9;
   r(t.shade,xx,yy,17,10);r(t.path,xx+2,yy,13,2);
   r(t.ground,xx+3,yy+3,11,5);r(t.far,xx+4,yy+4,3,2);
  }
 }
 if(t.kind==='garden'){
  for(let i=0;i<8;i++){
   const xx=x+6+(i*19+variant*7)%(w-12),yy=y+h-8-(i%3)*5;
   if(Math.abs(xx-middle)>20){r(0x36513d,xx,yy,1,4);r(i%2?0xeeb2ac:0xe7d687,xx-1,yy-2,3,3);r(0xffe8be,xx,yy-1,1,1)}
  }
 }
 if(['harbor','water'].includes(t.kind)){
  for(const xx of [x+5,x+w-8]){
   r(0x365b60,xx,floor-8,4,17);r(0xe8ddae,xx,floor-9,4,3);
   r(0x97b8ac,xx+1,floor-5,1,10);
  }
  r(0xc8b78e,x+8,floor+2,w-16,2);
 }
 if(['night','league','ice'].includes(t.kind)){
  const ax=Math.round(middle-16),ay=y+26;
  r(t.shade,ax,ay,32,38);r(t.path,ax,ay+4,5,34);r(t.path,ax+27,ay+4,5,34);
  r(t.path,ax+5,ay,22,5);r(t.sky,ax+8,ay-2,16,2);
  for(const xx of [ax-3,ax+27]){r(t.sky,xx,ay+35,8,2);r(t.ground,xx,ay+37,8,3)}
  r(t.far,ax+6,ay+6,20,30);
  if(t.kind==='night'){
   r(t.sky,x+w-22,y+5,8,8);r(t.sky,x+w-24,y+7,12,4);r(t.far,x+w-19,y+4,8,8);
   for(let j=0;j<7;j++)r(0xe9dfbc,x+7+(j*29)%(w-14),y+7+(j%3)*5,1,1);
  }
 }
 scenicTrees(scene,owner,x,y,w,h,variant,t.kind);
 return owner;
}
export function scenicBackdrop(scene,layer,stage){
 const g=scene.add.graphics(),t=scenicTheme(stage);layer.add(g);
 g.fillStyle(t.shade);g.fillRect(0,0,640,360);
 // A continuous regional vista sits behind the cards, rather than metal bars.
 g.fillStyle(t.far);g.fillRect(0,58,640,224);
 for(let y=67;y<283;y+=9)for(let x=(y%2)*8;x<640;x+=23){
  g.fillStyle((x+y)%3?t.ground:t.sky,.22);g.fillRect(x,y,12,1);
 }
 g.fillStyle(0x142d36,.96);g.fillRect(0,0,640,56);
 g.fillStyle(0x101f2b,.97);g.fillRect(0,278,640,82);
 g.fillStyle(0xd9c49a);g.fillRect(0,54,640,1);
 g.fillStyle(0x9aa990,.6);g.fillRect(0,277,640,1);
 for(let i=0;i<26;i++){
  const x=i*25;
  g.fillStyle(t.shade,.65);g.fillRect(x,58+(i%3)*2,14,6);
  g.fillStyle(t.path,.3);g.fillRect(x+3,60+(i%3)*2,5,1);
 }
 return g;
}
export function scenicIcon(scene,layer,kind,x,y){
 const g=scene.add.graphics();layer.add(g);
 const r=(c,xx,yy,w,h)=>{g.fillStyle(c);g.fillRect(x+xx,y+yy,w,h)};
 const cream=0xffe0a0,dark=0x153841,teal=0x67b7ac;
 if(kind==='bag'){
  r(dark,-6,-5,12,12);r(cream,-5,-4,10,10);r(0xc78c55,-4,-2,8,6);r(cream,-3,-7,6,2);r(dark,-1,0,2,2);
 }else if(kind==='center'){
  r(dark,-7,-5,14,12);r(0xe4d9bf,-6,-4,12,10);r(0xd87570,-7,-7,14,4);r(0xb74752,-1,-2,2,6);r(0xb74752,-3,0,6,2);
 }else if(kind==='shop'){
  r(cream,-6,-3,12,9);r(teal,-7,-7,14,5);for(let i=-5;i<7;i+=4)r(cream,i,-7,2,5);r(dark,-2,1,4,5);
 }else if(kind==='team'||kind==='capture'){
  r(dark,-6,-4,12,9);r(cream,-4,-6,8,13);r(0xd87962,-5,-4,10,4);r(dark,-6,0,12,2);r(cream,-1,-1,3,3);
 }else if(kind==='train'){
  r(cream,-6,-4,4,10);r(cream,3,-4,4,10);r(teal,-3,-1,7,3);r(teal,-7,-2,2,6);r(teal,7,-2,2,6);
 }else if(kind==='seeker'){
  r(dark,-5,-6,10,13);r(teal,-4,-5,8,11);r(cream,-2,-3,4,4);r(cream,-2,3,1,1);r(cream,1,3,1,1);r(teal,-5,-8,2,3);
 }else{
  r(cream,-5,-6,10,12);r(dark,-3,-4,6,8);r(teal,-1,-2,4,1);r(teal,-1,1,4,1);
 }
 return g;
}
