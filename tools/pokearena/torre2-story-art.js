/* Pokémon Torre 2 — original pixel art for the Rival / Team Rocket story
 * scenes. Every place is painted here pixel by pixel (no game art) on a
 * 214x120 canvas, shown at 3x with nearest filtering, like the leader's
 * rooms. Pure code: returns a pixel buffer; the campaign scene turns it into
 * a texture. Layout shared by all places:
 *  - back (sky / wall) above y 55, floor below it;
 *  - the two characters stand at x 67 and 147 with their feet on y 79;
 *  - the dialogue box covers y >= 85, the place title y < 11 (centre).
 */
export const STORY_ART=Object.freeze({w:214,h:120,scale:3});
const W=214,H=120;

function canvas(){
 const d=new Int32Array(W*H);
 const px=(x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<W&&y<H)d[y*W+x]=c};
 const rect=(x,y,w,h,c)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)px(x+i,y+j,c)};
 const hash=(x,y,s=0)=>{let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,1442695041);
  h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296};
 const dither=(x,y,w,h,c,phase=0)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)if((i+j+phase)%2===0)px(x+i,y+j,c)};
 const ellipse=(cx,cy,rx,ry,c)=>{for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++)
  if((x*x)/(rx*rx+.01)+(y*y)/(ry*ry+.01)<=1)px(cx+x,cy+y,c)};
 const spr=(rows,pal,x,y,flip=false)=>rows.forEach((r,j)=>{for(let i=0;i<r.length;i++){const ch=r[i];
  if(ch!=='.'&&pal[ch]!==undefined)px(flip?x+r.length-1-i:x+i,y+j,pal[ch])}});
 const speckle=(x,y,w,h,c,p,s)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(hash(x+i,y+j,s)<p)px(x+i,y+j,c)};
 return {d,px,rect,hash,dither,ellipse,spr,speckle};
}
// Sky: smooth vertical gradient in 3-pixel steps (top -> mid -> low).
const mixc=(a,b,t)=>{const r=(x,s)=>(x>>s)&255,m=s=>Math.round(r(a,s)+(r(b,s)-r(a,s))*t);return (m(16)<<16)|(m(8)<<8)|m(0)};
function sky(c,top,mid,low,y1=18,y2=36,end=55){
 for(let y=0;y<end;y+=3){const t=y/end,col=t<.5?mixc(top,mid,t*2):mixc(mid,low,(t-.5)*2);c.rect(0,y,W,3,col)}
}
function cloud(c,x,y,big=false){
 const w=big?26:18;
 c.ellipse(x+w*.35,y+3,w*.25,3,0xffffff);c.ellipse(x+w*.62,y+2,w*.28,4,0xffffff);c.rect(x,y+4,w,3,0xffffff);
 c.rect(x+1,y+7,w-2,1,0xd6ecf8);c.rect(x+3,y+1,3,1,0xffffff);
}
// Shaded pine: outline, dark body, light left edge, trunk.
function pine(c,x,y,h=24,s=0){
 const O=0x1d4a2e,D=0x2f7a46,M=0x3f9a54,L=0x6cc070;
 const tiers=3,th=Math.floor((h-4)/tiers);
 for(let t=0;t<tiers;t++){const top=y+t*th,half=3+t*2+2;
  for(let j=0;j<th+3;j++){const w=Math.min(half,1+Math.floor(j*half/(th+2)));
   for(let i=-w;i<=w;i++){const edge=i===-w||i===w||j===th+2;
    c.px(x+i,top+j,edge?O:i<-w/3?L:i>w/3?D:M)}}}
 c.rect(x-1,y+h-4,3,4,0x5a3a22);c.px(x-1,y+h-4,0x3a2414);
 if(c.hash(x,y,s)<.5)c.px(x-2,y+th+2,0xa8e08a);
}
function roundTree(c,x,y,r=9){
 const O=0x1d4a2e,D=0x2f7a46,M=0x45a052,L=0x78c868;
 c.rect(x-1,y+r-2,3,6,0x6a4426);c.px(x+1,y+r-2,0x4a2c16);
 c.ellipse(x,y,r+1,r,O);c.ellipse(x,y,r,r-1,D);c.ellipse(x-1,y-1,r-2,r-3,M);c.ellipse(x-3,y-3,r-5,r-6,L);
 for(let i=0;i<6;i++)c.px(x-r+3+i*3,y+r-3-(i%2),D);
}
function flower(c,x,y,col){c.px(x,y-1,col);c.px(x-1,y,col);c.px(x+1,y,col);c.px(x,y+1,col);c.px(x,y,0xfff2a0);c.px(x,y+2,0x3a8a3a)}
function grassField(c,y0,base=0x7cc85a,dark=0x5fae46,light=0xa4dc78,s=1){
 c.rect(0,y0,W,H-y0,base);
 for(let y=y0+2;y<H;y+=4)for(let x=(y*7)%9;x<W;x+=9){
  const r=c.hash(x,y,s);if(r<.55){c.px(x,y,dark);c.px(x+1,y-1,dark);c.px(x+2,y,dark)}else if(r<.7)c.px(x,y,light)}
}
// Tiny 3x5 pixel font for signs (only the letters used).
const FONT={S:['111','100','111','001','111'],I:['111','010','010','010','111'],L:['100','100','100','100','111'],
 P:['110','101','110','100','100'],H:['101','101','111','101','101'],C:['111','100','100','100','111'],
 O:['111','101','101','101','111'],M:['101','111','111','101','101'],A:['010','101','111','101','101'],
 R:['110','101','110','101','101'],T:['111','010','010','010','010'],'.':['000','000','000','000','010']};
function word(c,text,x,y,col){for(const ch of text){const g=FONT[ch];if(g)g.forEach((row,j)=>[...row].forEach((b,i)=>{if(b==='1')c.px(x+i,y+j,col)}));x+=4}}

const PAINT={
 // Rota 22: pines on a hillside, dirt path, wooden sign, flowers.
 route22(c){
  sky(c,0x6cbcec,0x8ccdf2,0xb4e0f8);cloud(c,24,8,true);cloud(c,150,14);cloud(c,96,4);
  for(let x=0;x<W;x++){const h=Math.round(6+4*Math.sin(x/17)+3*Math.sin(x/7));c.rect(x,47-h,1,h+8,0x86b8a0);c.px(x,47-h,0xa6d0b8)}
  for(let x=0;x<W;x++){const h=Math.round(4+3*Math.sin(x/11+1));c.rect(x,52-h,1,h+4,0x68a86a)}
  grassField(c,55);
  for(let i=0;i<12;i++)pine(c,4+i*19+(i%2)*4,27+(i%3)*2,24,i);
  c.rect(0,63,W,1,0xb89a62);c.rect(0,64,W,16,0xd8be86);c.rect(0,80,W,1,0xb89a62);
  c.speckle(0,64,W,16,0xc4a670,.08,3);c.speckle(0,64,W,16,0xeed8a8,.05,4);
  for(let x=6;x<W;x+=31){c.rect(x,72,3,2,0xa88a58);c.px(x+1,71,0xc8ac78)}
  c.rect(188,50,2,13,0x6a4426);c.rect(181,44,16,9,0x8a5a30);c.rect(182,45,14,7,0xd8b070);c.rect(184,47,10,1,0x8a5a30);c.rect(184,49,7,1,0x8a5a30);
  for(const [x,y,k] of [[10,58,0],[22,60,1],[40,57,2],[100,59,1],[176,58,0],[200,60,2],[120,57,0]])flower(c,x,y,[0xe84a5a,0xf8d84a,0xf0f0f0][k]);
 },
 // Ponte Pepita: wooden bridge over the river, posts with rope, grass banks.
 bridge(c){
  sky(c,0x6cbcec,0x8ccdf2,0xb4e0f8,16,30,42);cloud(c,30,6,true);cloud(c,160,10);
  for(let x=0;x<W;x++){const h=Math.round(5+4*Math.sin(x/13));c.rect(x,40-h,1,h+2,0x7aae90)}
  grassField(c,40);for(let i=0;i<8;i++)roundTree(c,8+i*29,35+(i%2)*2,7);
  for(const x of [6,30,180,204])flower(c,x,47,0xe84a5a);
  c.rect(0,50,W,H-50,0x3a7ed4);
  for(let y=52;y<H;y+=3)for(let x=(y*5)%14;x<W;x+=14)c.rect(x,y,5,1,0x78b4f0);
  c.rect(0,50,W,1,0x2c62b0);
  c.rect(0,59,W,1,0x6a4426);c.rect(0,60,W,22,0xc89a58);
  for(let x=0;x<W;x+=12){c.rect(x,60,1,22,0x9a7038);c.rect(x+1,60,1,22,0xdcb070)}
  for(let y=63;y<82;y+=5)c.speckle(0,y,W,1,0xa87c40,.25,y);
  c.rect(0,82,W,2,0x7a5428);c.rect(0,84,W,2,0x1a3a6a);
  for(let x=4;x<W;x+=26){c.rect(x,49,3,12,0x7a5428);c.rect(x,48,3,1,0xe0c090);c.px(x+2,52,0x5a3a1a)}
  for(let x=0;x<W;x++){c.px(x,51+Math.round(Math.sin((x%26)/26*Math.PI)*2),0xd8c8a0)}
 },
 // S.S. Anne deck: sea horizon, white railing, wooden deck, lifebuoy, chairs.
 ship(c){
  sky(c,0x5aaee8,0x7cc0f0,0xa0d4f6,14,26,34);cloud(c,40,6,true);cloud(c,128,10);
  c.rect(0,34,W,12,0x2e6cc0);for(let y=35;y<46;y+=2)for(let x=(y*11)%17;x<W;x+=17)c.rect(x,y,4,1,0x5a96dc);
  c.px(60,36,0xffffff);c.px(61,36,0xffffff);c.px(150,40,0xffffff);
  c.rect(168,0,46,55,0xeef0f4);c.rect(168,0,2,55,0xc8ccd6);
  for(let y=10;y<46;y+=14)for(let x=176;x<212;x+=12){c.ellipse(x+3,y+3,3,3,0x3a5aa8);c.ellipse(x+3,y+3,2,2,0x9ad0f4);c.px(x+2,y+2,0xffffff)}
  c.rect(186,0,16,8,0xd84a3a);c.rect(186,0,16,2,0x2a2a2a);
  c.rect(0,46,168,9,0x2a5aa8);c.rect(0,44,168,2,0x3a5aa8);c.rect(0,46,168,1,0x7a9ad8);
  for(let x=2;x<168;x+=7){c.rect(x,47,2,8,0xf4f4f4);c.px(x+1,47,0xc8ccd6)}
  c.rect(0,54,168,1,0xd0d4dc);
  c.ellipse(20,49,5,5,0xe84a4a);c.ellipse(20,49,3,3,0xf4f4f4);c.ellipse(20,49,1,1,0x2e6cc0);c.px(17,46,0xf4f4f4);c.px(23,52,0xf4f4f4);
  c.rect(0,55,W,H-55,0xc8965a);
  for(let y=55;y<H;y+=4){c.rect(0,y,W,1,0xa87a40);for(let x=((y/4)%3)*23;x<W;x+=46)c.rect(x,y+1,1,3,0xa87a40)}
  c.speckle(0,56,W,30,0xd8aa6a,.05,9);
  const chair=(x,y)=>{c.rect(x,y,12,2,0xf0f0f0);c.rect(x,y+2,12,1,0xb0b4bc);c.rect(x+1,y-6,2,6,0xf0f0f0);c.rect(x+1,y+3,1,4,0x9a9ea8);c.rect(x+10,y+3,1,4,0x9a9ea8)};
  chair(8,64);chair(190,64);
  c.ellipse(108,60,7,2,0xffffff);c.rect(107,62,2,6,0xb0b4bc);c.rect(104,68,8,1,0x8a8e98);
  for(const x of [176,200]){c.rect(x,72,9,10,0x9a6a38);c.rect(x,72,9,1,0xd8a868);c.rect(x,76,9,1,0x6a4420);c.rect(x,80,9,1,0x6a4420)}
 },
 // Pokémon Tower: dark purple hall, arched windows, candles, graves, mist.
 tower(c){
  c.rect(0,0,W,55,0x2a1f3e);
  for(let x=0;x<W;x+=26){c.rect(x,0,4,55,0x3a2c56);c.rect(x+1,0,1,55,0x4a3a6e)}
  for(let x=8;x<W;x+=26){c.rect(x,8,14,30,0x1a1228);c.ellipse(x+7,9,7,5,0x1a1228);
   c.rect(x+2,10,10,26,0x46408a);c.ellipse(x+7,11,5,4,0x46408a);c.rect(x+6,8,2,28,0x1a1228);c.rect(x+2,22,10,1,0x1a1228);
   c.px(x+4,13,0xc8c8f8);c.px(x+9,26,0x8a8ad8)}
  for(let x=17;x<W;x+=26){c.rect(x,42,3,6,0xf0e6c8);c.px(x+1,40,0xffd060);c.px(x+1,39,0xfff6c0);c.rect(x-1,48,5,1,0x8a7a6a);
   c.dither(x-3,36,9,8,0x5a4a3a,1)}
  c.rect(0,52,W,3,0x16101f);
  c.rect(0,55,W,H-55,0x46604e);
  for(let y=55;y<H;y+=8)for(let x=((y-55)/8%2)*8;x<W;x+=16){c.rect(x,y,8,8,0x52705a);c.px(x+3,y+3,0x6a8a70)}
  const grave=(x,y)=>{c.rect(x,y+2,10,12,0x4a4a5c);c.rect(x+1,y,8,2,0x4a4a5c);c.rect(x+1,y+2,8,11,0x8a8aa0);c.rect(x+2,y+1,6,1,0x8a8aa0);
   c.rect(x+2,y+2,2,10,0xb0b0c4);c.rect(x+4,y+5,3,1,0x5a5a70);c.rect(x+5,y+4,1,4,0x5a5a70);c.rect(x-1,y+13,12,2,0x2e2e3c)};
  for(const [x,y] of [[2,54],[16,57],[30,55],[176,55],[190,57],[202,54],[4,70],[198,70],[88,52],[112,52]])grave(x,y);
  for(let i=0;i<9;i++){const x=Math.floor(c.hash(i,9)*190),y=60+Math.floor(c.hash(i,10)*24);
   for(let k=0;k<14;k++)if(c.hash(x+k,y,11)<.55)c.px(x+k,y+(k%3===0?1:0),0x8aa49a)}
 },
 // Silph Co. lobby: windows, SILPH sign, reception desk, plants, tiles.
 silph(c){
  c.rect(0,0,W,55,0xc6d2de);for(let x=0;x<W;x+=30)c.rect(x,0,1,55,0xa8b6c6);
  for(const x of [6,150]){c.rect(x,6,58,30,0x5a6a7c);c.rect(x+2,8,54,26,0x8cc6ec);
   for(let i=1;i<4;i++)c.rect(x+2+i*14,8,1,26,0x5a6a7c);c.rect(x+2,20,54,1,0x5a6a7c);
   for(let i=0;i<4;i++){c.rect(x+4+i*14,10,3,1,0xe6f6ff);c.px(x+4+i*14,11,0xe6f6ff)}
   c.rect(x,36,58,2,0x8a98a8)}
  c.rect(78,6,58,20,0x2a3242);c.rect(80,8,54,16,0x3a4658);word(c,'SILPH CO.',88,13,0xe8eef6);
  c.rect(0,46,W,3,0xb4566a);c.rect(0,49,W,6,0x8e96a6);
  c.rect(84,34,46,14,0xe8d8a8);c.rect(84,34,46,2,0xf8ecc8);c.rect(84,46,46,2,0xb8a878);c.rect(100,30,14,4,0x6a7488);c.rect(102,31,10,2,0x9ad0f4);
  c.rect(0,55,W,H-55,0x9ecfd8);
  for(let y=55;y<H;y+=10)for(let x=0;x<W;x+=10){c.rect(x,y,10,1,0x86bcc6);c.rect(x,y,1,10,0x86bcc6);c.px(x+3,y+3,0xc4e8ee)}
  const plant=(x,y)=>{c.rect(x+1,y+8,8,7,0xb0603a);c.rect(x+1,y+8,8,1,0xd8885a);c.rect(x+2,y+14,6,1,0x7a3a1a);
   c.ellipse(x+5,y+4,5,4,0x2e8a3e);c.ellipse(x+4,y+3,3,2,0x5cbc5a);c.px(x+1,y,0x5cbc5a);c.px(x+9,y+1,0x2e8a3e)};
  plant(2,42);plant(30,42);plant(176,42);plant(202,42);
  for(let i=0;i<3;i++)c.dither(40+i*60,58,20,6,0xc8ecf2,i);
 },
 // Indigo Plateau: sunset, League hall with columns and flags, plaza.
 indigo(c){
  sky(c,0xf09858,0xf6b878,0xfad4a0,14,28,55);cloud(c,8,8,true);cloud(c,176,6);
  c.ellipse(186,30,8,8,0xfff0c0);c.ellipse(186,30,6,6,0xffe080);
  c.rect(26,10,162,6,0x5a7a5a);c.rect(22,16,170,4,0x48684a);c.rect(26,10,162,1,0x86a886);
  c.rect(30,20,154,35,0xece2cc);for(let x=34;x<184;x+=16){c.rect(x,20,5,35,0xd6c8a8);c.rect(x+1,20,1,35,0xfaf4e6)}
  c.rect(30,20,154,2,0xb8a888);
  c.rect(93,26,28,29,0x34405e);c.rect(95,28,24,27,0x4a5a8a);c.rect(106,28,2,27,0x34405e);c.ellipse(107,22,5,5,0xe84a4a);c.rect(102,22,11,1,0x222222);c.ellipse(107,22,1,1,0xffffff);
  for(const x of [20,190]){c.rect(x,2,1,22,0x6a4a2a);c.rect(x+1,2,9,6,0xd84a4a);c.rect(x+1,5,9,1,0xffffff)}
  c.rect(0,55,W,H-55,0xd6cebc);
  for(let y=55;y<H;y+=8)for(let x=((y-55)/8%2)*10;x<W;x+=20){c.rect(x,y,20,1,0xbcb29c);c.rect(x,y,1,8,0xbcb29c)}
  c.rect(90,55,34,H-55,0xc8bea8);for(let y=57;y<H;y+=6)c.rect(91,y,32,1,0xb0a68e);
  const statue=(x)=>{c.rect(x,48,12,8,0x8a8a98);c.rect(x,48,12,1,0xb4b4c4);c.rect(x+2,36,8,12,0x9a9aa8);c.ellipse(x+6,35,4,4,0x9a9aa8);c.px(x+4,33,0xc8c8d8);c.rect(x+3,38,2,8,0xc0c0d0)};
  statue(4);statue(198);
  for(const x of [16,186]){c.ellipse(x+4,58,5,3,0x3a8a3a);c.ellipse(x+3,57,3,2,0x6ac25a)}
 },
 // Mt. Moon: rock wall, stalactites, glowing Moon Stone, gravel, fossils.
 cave(c){
  c.rect(0,0,W,55,0x3a2c24);
  for(let i=0;i<70;i++){const x=Math.floor(c.hash(i,21)*W),y=4+Math.floor(c.hash(i,22)*46),rx=4+Math.floor(c.hash(i,23)*7),ry=2+Math.floor(c.hash(i,24)*3);
   c.ellipse(x,y,rx,ry,0x2a1e18);c.ellipse(x,y-1,rx-1,ry-1,0x4c3a2e);c.rect(x-rx+2,y-ry,rx,1,0x64503e)}
  for(let x=4;x<W;x+=15){const h=4+Math.floor(c.hash(x,1)*7);for(let j=0;j<h;j++){const w=Math.max(0,2-Math.floor(j/3));c.rect(x-w,j,2*w+1,1,j===h-1?0x2a1e18:0x6a5646)}}
  c.ellipse(108,30,5,4,0x2a3a5a);c.ellipse(108,30,3,3,0x9ad8f8);c.px(107,29,0xffffff);c.dither(100,24,17,13,0x6aa8d8,0);
  c.rect(0,50,W,5,0x2a1e18);
  c.rect(0,55,W,H-55,0xb49c76);c.speckle(0,55,W,H-55,0x9a8462,.12,5);c.speckle(0,55,W,H-55,0xccb690,.06,6);
  const rock=(x,y,w,h)=>{c.ellipse(x,y,w,h,0x5a4a3c);c.ellipse(x,y-1,w-1,h-1,0x8a7660);c.ellipse(x-w/3,y-h/2,w/3,h/3,0xa89478)};
  rock(10,58,9,6);rock(204,60,8,6);rock(30,70,5,3);rock(186,72,5,3);
  c.ellipse(20,74,4,4,0xd8c8a0);for(let i=0;i<3;i++)c.px(20-i,74-i+1,0x8a7a58);c.px(21,74,0x8a7a58);
  c.ellipse(196,58,4,3,0xd8c8a0);c.rect(193,58,7,1,0x8a7a58);c.px(196,56,0x8a7a58);
 },
 // Rocket Hideout: steel wall with the red R, pipes, terminals, spinner tiles.
 hideout(c){
  c.rect(0,0,W,55,0x2e3238);
  for(let x=0;x<W;x+=24){c.rect(x,0,1,55,0x22262c);for(let y=6;y<55;y+=12){c.px(x+3,y,0x6a7078);c.px(x+20,y,0x6a7078)}}
  c.rect(0,8,W,3,0x4a5058);c.rect(0,9,W,1,0x6a7280);c.rect(0,40,W,2,0x4a5058);
  c.rect(84,12,46,30,0x1a1c20);c.rect(86,14,42,26,0xc4363a);c.rect(86,14,42,1,0xe85a5e);
  const R=['1111110','1100011','1100011','1111110','1101100','1100110','1100011'];
  R.forEach((row,j)=>[...row].forEach((b,i)=>{if(b==='1'){c.rect(94+i*3,17+j*3,3,3,0xffffff)}}));
  for(const x of [10,190]){c.ellipse(x+4,18,4,4,0x7a1a1a);c.ellipse(x+4,18,3,3,0xff5a4a);c.px(x+3,17,0xffd0c0)}
  const term=(x)=>{c.rect(x,32,20,20,0x4a5260);c.rect(x+2,34,16,9,0x0a2a1a);c.rect(x+3,36,8,1,0x3ae07a);c.rect(x+3,39,12,1,0x3ae07a);
   for(let i=0;i<4;i++)c.px(x+3+i*4,46,[0xff5a4a,0xf8d84a,0x3ae07a,0x5ab4ff][i])};
  term(4);term(190);
  c.rect(0,52,W,3,0x1a1c20);
  c.rect(0,55,W,H-55,0x5a6068);
  for(let y=55;y<H;y+=8)for(let x=0;x<W;x+=8){c.rect(x,y,8,1,0x4a5058);c.rect(x,y,1,8,0x4a5058);c.px(x+2,y+2,0x7a8088)}
  const spin=(x,y,dir)=>{c.rect(x,y,12,12,0x2e7a4e);c.rect(x+1,y+1,10,10,0x3a9a5e);
   for(let i=0;i<4;i++)c.rect(dir>0?x+3+i:x+8-i,y+3+i,1,6-2*i,0xb0f0c8)};
  spin(14,64,1);spin(188,64,-1);spin(30,78,1);spin(172,78,-1);
 },
 // Silph Co. upper floor: night skyline window, wood panels, carpet, sofa.
 office(c){
  c.rect(0,0,W,55,0x4a3a34);for(let x=0;x<W;x+=12){c.rect(x,0,1,55,0x3a2c26);c.rect(x+1,0,1,55,0x5a4840)}
  c.rect(20,6,174,32,0x2a2e3a);c.rect(22,8,170,28,0x14203c);
  c.dither(22,8,170,6,0x1c2a4c,0);
  for(let i=0;i<14;i++){const bx=24+i*12,bh=8+Math.floor(c.hash(i,3)*16);c.rect(bx,36-bh,10,bh,0x26324e);
   for(let y=38-bh;y<35;y+=3)for(let x=bx+1;x<bx+9;x+=3)if(c.hash(x,y,7)<.45)c.px(x,y,0xf4d878)}
  c.ellipse(170,14,3,3,0xf8f4dc);for(let i=0;i<5;i++)c.px(30+i*31,10+(i%3)*2,0xffffff);
  for(let x=22;x<194;x+=34)c.rect(x,8,2,28,0x2a2e3a);
  c.rect(0,46,W,9,0x6a5244);c.rect(0,46,W,1,0x8a6a58);
  c.rect(0,55,W,H-55,0x7e2e3c);c.rect(8,60,198,H-60,0x8e3a48);c.rect(8,60,198,1,0xb85a64);
  for(let y=64;y<H;y+=8)for(let x=14;x<200;x+=12)c.rect(x,y,4,2,0x7a2a38);
  c.rect(84,40,46,14,0xc8743a);c.rect(84,40,46,2,0xe89a5a);c.rect(84,48,46,6,0xa85a2a);c.rect(82,42,3,12,0xa85a2a);c.rect(129,42,3,12,0xa85a2a);
  const plant=(x,y)=>{c.rect(x+1,y+8,8,7,0x8a8a98);c.rect(x+2,y+14,6,1,0x5a5a68);c.ellipse(x+5,y+4,5,4,0x2e8a3e);c.ellipse(x+4,y+3,3,2,0x5cbc5a)};
  plant(4,40);plant(200,40);
 },
 // Viridian: Pokémon Center and Mart, trees, flower beds, sidewalk.
 town(c){
  sky(c,0x6cbcec,0x8ccdf2,0xb4e0f8,14,26,40);cloud(c,96,4,true);cloud(c,160,12);
  c.rect(0,38,W,17,0x5aa850);c.speckle(0,38,W,17,0x3f8a40,.25,12);
  for(let i=0;i<10;i++)roundTree(c,6+i*23,34,8);
  const bld=(x,w,roof,roofD,label)=>{
   c.rect(x-3,14,w+6,12,roof);c.rect(x-3,14,w+6,2,roofD);for(let i=x-2;i<x+w+3;i+=4)c.rect(i,18,2,8,roofD);c.rect(x-3,25,w+6,1,0x222222);
   c.rect(x,26,w,29,0xf4f0e6);c.rect(x,26,w,1,0xffffff);c.rect(x,53,w,2,0xc8c0b0);
   for(let wx=x+3;wx<x+w-8;wx+=12){c.rect(wx,32,8,7,0x4a6aa8);c.rect(wx+1,33,6,5,0x9ad0f4);c.px(wx+1,33,0xffffff)}
   c.rect(x+w/2-5,40,10,15,0x4a5a7a);c.rect(x+w/2-4,41,8,13,0x8ab8e0);c.rect(x+w/2,41,1,13,0x4a5a7a);
   c.rect(x+w/2-9,27,18,7,label==='MART'?0x3a6ad8:0xd84a4a);word(c,label,x+w/2-(label.length*4-1)/2,28,0xffffff)};
  bld(6,64,0xd8484a,0xa83034,'P.C');bld(144,62,0x3a6ad8,0x2a4aa8,'MART');
  c.rect(0,55,W,H-55,0xdcd6c8);
  for(let y=55;y<H;y+=8)for(let x=((y-55)/8%2)*8;x<W;x+=16){c.rect(x,y,8,8,0xd0c8b8);c.px(x+2,y+2,0xeae6dc)}
  c.rect(0,55,W,1,0xb0a890);
  for(const x of [80,112]){c.rect(x,48,24,7,0x6a4a2a);c.rect(x+1,48,22,5,0x3a8a3a);for(let i=0;i<5;i++)flower(c,x+3+i*4,49,i%2?0xe84a6a:0xf8d84a)}
 }
};
// Pixel buffer (0xRRGGBB per pixel, row-major) for one place, or null.
export function paintStoryPlace(kind){
 const paint=PAINT[kind];if(!paint)return null;
 const c=canvas();paint(c);
 return {w:W,h:H,data:c.d};
}
export const STORY_ART_PLACES=Object.freeze(Object.keys(PAINT));
