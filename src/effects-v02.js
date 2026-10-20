/* V0.2 handcrafted 12/16-frame fire sprites rendered once into PixiJS GPU textures.
 * Inspired by game combat rhythms; not copied from Poké Arena's assets. */
const INK=0x160f22,RED=0xad302a,ORANGE=0xf77525,GOLD=0xffb02d,YELLOW=0xffde69,WHITE=0xfff5ae;
function px(g,x,y,w,h,c){g.beginFill(c).drawRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h))).endFill()}
function puff(g,x,y,r,col){px(g,x-r+2,y-r,r*2-4,r*2,col);px(g,x-r,y-r+3,r*2,r*2-6,col)}
function ember(P,f){
 const g=new P.Graphics(),cx=28+(f%4)-2,cy=31;
 for(const [r,c] of [[23,INK],[20,RED],[16,ORANGE],[11,GOLD],[6,WHITE]])puff(g,cx,cy,r,c);
 for(let i=0;i<5;i++){
  const x=14+(i*11+f*4)%37,y=3+((i*7+f*9)%13);
  px(g,x,y,4+i%2,6,RED);px(g,x+1,y+2,2,3,GOLD);
 }
 return g;
}
function flamethrower(P,f){
 const g=new P.Graphics(),length=198,cy=29;
 // One continuous, irregular tongue from mouth to tip; not a stretched
 // yellow block and not a row of generic independent fireball sprites.
 for(let x=0;x<length;x+=3){
  const t=x/length,taper=Math.min(1,(x+7)/22,(length-x+8)/28);
  const ribbon=(8.7+4.6*Math.sin(Math.PI*t)+2.4*Math.sin(x*.077+f*.7))*taper;
  if(ribbon<1.5)continue;
  const jitter=Math.sin(x*.13-f*.66)*1.9+Math.sin(x*.045+f*.9)*2.0;
  const top=Math.round(cy-ribbon+jitter),bottom=Math.round(cy+ribbon+jitter);
  // Dark outline + rust red edge surround a mostly orange flame.
  px(g,x,top-2,3,bottom-top+5,INK);
  px(g,x,top,3,bottom-top+1,RED);
  if(bottom-top>5)px(g,x+1,top+2,2,bottom-top-3,ORANGE);
  // Hot yellow appears in separated surges, leaving orange negative space.
  if(bottom-top>10&&(Math.floor(x/13)+f)%4!==0){
   const hot=cy+jitter+Math.sin(x*.11+f)*2;
   px(g,x+1,hot-3,2,6,GOLD);
   if((Math.floor(x/21)+f)%3===0)px(g,x+1,hot-1,2,3,YELLOW);
  }
 }
 // A few sharp fire tongues grow from the connected stream surface.
 for(let i=0;i<7;i++){
  const x=18+i*23+(f%4)*2,sg=i%2?1:-1;
  const y=cy+sg*(11+(i+f)%4);
  const len=6+(i*3+f)%7;
  px(g,x-1,y-2,12,5,INK);
  px(g,x,y,10,3,RED);
  px(g,x+3,y+sg*3,7,len,ORANGE);
  px(g,x+4,y+sg*5,4,3,GOLD);
 }
 // Muzzle joins seamlessly with the flame and stays bright.
 px(g,0,cy-5,9,10,INK);px(g,1,cy-4,9,8,ORANGE);
 px(g,4,cy-2,9,5,GOLD);
 return g;
}
function drawStroke(g,x1,y1,x2,y2,w,col){
 const count=Math.max(1,Math.ceil(Math.hypot(x2-x1,y2-y1)/3));
 for(let j=0;j<=count;j++){const x=x1+(x2-x1)*j/count,y=y1+(y2-y1)*j/count;px(g,x-w/2,y-w/2,w,w,col)}
}
function fireblast(P,f){
 const g=new P.Graphics(),size=41+Math.sin(f*Math.PI/8)*3,cx=70,cy=68;
 // Signature 大 shape is actually formed from connected limbs, never a generic ball.
 const segments=[
  [cx,cy-size*.78,cx,cy+size*.10],
  [cx-size*.80,cy-size*.20,cx+size*.79,cy-size*.20],
  [cx,cy-size*.08,cx-size*.66,cy+size*.78],
  [cx,cy-size*.08,cx+size*.66,cy+size*.78]
 ];
 for(const [x,y,u,v] of segments)for(const [w,c] of [[18,INK],[13,RED],[9,ORANGE],[5,YELLOW]])
  drawStroke(g,x,y,u,v,w,c);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4+f*.19,x=cx+Math.cos(a)*size*.47,y=cy+Math.sin(a)*size*.47;
  px(g,x,y,7,10,INK);px(g,x+1,y+1,5,8,ORANGE);px(g,x+2,y+3,2,4,WHITE);
 }
 if(f>10)for(let i=0;i<8;i++){const a=i*Math.PI/4+f*.15;px(g,cx+Math.cos(a)*62,cy+Math.sin(a)*62,6,6,i%2?ORANGE:YELLOW)}
 return g;
}
function firespin(P,f){
 const g=new P.Graphics(),a=f*Math.PI/6;
 for(let ring=0;ring<3;ring++)for(let n=0;n<36;n++){
  const angle=n*Math.PI/18+a*(ring%2?-1:1),rad=23+ring*13+Math.sin(angle*4+a)*3;
  const x=68+Math.cos(angle)*rad,y=68+Math.sin(angle)*rad*.69-(ring%2?8:0);
  const c=[RED,ORANGE,GOLD,YELLOW][(n+ring+f)%4];
  if(n%8===0)px(g,x-2,y-2,11,11,INK);
  px(g,x,y,7,7,c);
 }
 for(let i=0;i<10;i++){const x=24+((i*19+f*7)%97),y=40+((i*13+f*4)%50);
  if(i%3===0){px(g,x,y,5,9,RED);px(g,x+1,y+2,3,5,YELLOW)}}
 return g;
}
export function buildAtlases(P,app){
 const generators={ember,flamethrower,firespin,fireblast},frames={ember:12,flamethrower:12,firespin:12,fireblast:16};
 const result={};
 for(const [id,f] of Object.entries(generators)){
  result[id]=[];
  for(let n=0;n<frames[id];n++){
   const gfx=f(P,n);
   result[id].push(app.renderer.generateTexture(gfx,{resolution:1,scaleMode:P.SCALE_MODES.NEAREST}));
   gfx.destroy();
  }
 }
 return result;
}
export function makeParticle(P){
 const g=new P.Graphics();
 px(g,0,0,18,18,INK);px(g,2,2,14,14,RED);px(g,4,4,10,10,YELLOW);px(g,6,6,5,5,WHITE);
 return g;
}
