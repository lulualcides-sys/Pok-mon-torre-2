/* Native Phaser/WebGL pixel stencils for Kanto trainers and shop items.
 * No external trainer-sprite rip, canvas, CSS image, or screenshot backdrop.
 */
const SHAPE=[
 '....HHHH....',
 '...HHHHHH...',
 '...HSSSSH...',
 '..HHSSSSHH..',
 '..HSSSSSSH..',
 '...SSSSSS...',
 '....NNNN....',
 '..UUUUUUUU..',
 '.UUUUUUUUUU.',
 '.UUAUUAAUU.',
 '.UUUUUUUUUU.',
 '...UUUUUU...',
 '...PPPPPP...',
 '...PPPPPP...',
 '...PP..PP...',
 '...PP..PP...',
 '...BB..BB...',
 '..BBB..BBB..'
];
const PAL={
 youngster:{H:0x67452b,S:0xffcb92,N:0x9f6b4c,U:0x50a4e8,A:0xe7f4ff,
  P:0x38497b,B:0x352b3f},
 bugcatcher:{H:0x577e48,S:0xfbd59f,N:0xb38e64,U:0x77b45c,A:0xe6d45b,
  P:0x7a6941,B:0x423b31},
 lass:{H:0x974b41,S:0xffcba5,N:0xd09c74,U:0xea799b,A:0xffd8ef,
  P:0x434e7d,B:0x4e305d},
 hiker:{H:0x50382f,S:0xdba06e,N:0x8b513c,U:0xc08f4e,A:0xe6dbab,
  P:0x5d6152,B:0x41372f},
 rival:{H:0x6c4b38,S:0xf5c49b,N:0xb2774a,U:0x5b91d7,A:0xf0ae4c,
  P:0x3e485e,B:0x302f44},
 rocket:{H:0x292d38,S:0xe6c7b0,N:0xb39387,U:0xe0e2e8,A:0xcb444b,
  P:0x282c3b,B:0x151a28},
 brock:{H:0x282f30,S:0xc18e69,N:0x835c48,U:0x9c7862,A:0xd2b293,
  P:0x496568,B:0x38312b}
};
export function trainerClass(stage,index,type='trainer'){
 if(type==='leader')return stage===0?'brock':'hiker';
 if(type==='rocket')return 'rocket';
 if(type==='rival')return 'rival';
 return ['youngster','bugcatcher','lass','hiker','youngster','bugcatcher',
  'lass','youngster','hiker','bugcatcher','lass','youngster','hiker'][index%13];
}
export function trainerClassName(kind){
 return ({youngster:'JOVEM',bugcatcher:'CAÇA-INSETOS',lass:'GAROTA',
 hiker:'MONTANHISTA',rival:'RIVAL',rocket:'EQUIPE ROCKET',brock:'BROCK'})[kind]||'TREINADOR';
}
export function drawTrainer(g,cx,cy,kind='youngster',scale=1){
 const p=PAL[kind]||PAL.youngster;
 const x=Math.round(cx-6*scale),y=Math.round(cy-10*scale);
 for(let row=0;row<SHAPE.length;row++)for(let col=0;col<12;col++){
  let ch=SHAPE[row][col];if(ch==='.')continue;
  // Variation in hats, clothing and faces inspired by FRLG trainer classes.
  if(kind==='bugcatcher'&&row<3)ch='U';
  if(kind==='lass'&&row>12&&col>=2&&col<=9)ch='U';
  if(kind==='rocket'&&row===8&&(col===5||col===6))ch='A';
  if(kind==='brock'&&row>=1&&row<=4&&col>=4&&col<=7)ch='H';
  const c=p[ch]||0x182738;
  g.fillStyle(c,1);g.fillRect(x+col*scale,y+row*scale,scale,scale);
 }
 // Face expression and outline, headband/hair variation.
 g.fillStyle(0x202b39,1);
 g.fillRect(x+4*scale,y+4*scale,scale,scale);
 g.fillRect(x+7*scale,y+4*scale,scale,scale);
 if(kind==='rival'||kind==='youngster'){
  g.fillStyle(kind==='rival'?0xd54b43:0x4c7fb5);
  g.fillRect(x+2*scale,y+1*scale,8*scale,scale);
 }
}
function px(g,x,y,w,h,c){g.fillStyle(c,1);g.fillRect(Math.round(x),Math.round(y),w,h)}
export function drawShopItem(g,cx,cy,item,scale=2){
 const kind=typeof item==='string'?item:item?.kind||'ball';
 const type=typeof item==='string'?item:item?.id||'pokeball';
 const x=Math.round(cx-9*scale),y=Math.round(cy-9*scale);
 if(kind==='ball'||/ball/.test(type)){
  const tone=type==='ultraball'?0xefc342:type==='greatball'?0x3399d7:0xe85251;
  px(g,x+5*scale,y+2*scale,8*scale,2*scale,0x1a263b);
  px(g,x+3*scale,y+4*scale,12*scale,4*scale,tone);
  px(g,x+2*scale,y+7*scale,14*scale,4*scale,0x1a263b);
  px(g,x+3*scale,y+11*scale,12*scale,4*scale,0xf2f5f2);
  px(g,x+5*scale,y+15*scale,8*scale,2*scale,0x14233a);
  px(g,x+7*scale,y+8*scale,4*scale,4*scale,0xffffff);
  px(g,x+8*scale,y+9*scale,2*scale,2*scale,0x283b57);
  if(type==='ultraball'){
   px(g,x+4*scale,y+5*scale,3*scale,2*scale,0x1b2c43);
   px(g,x+11*scale,y+5*scale,3*scale,2*scale,0x1b2c43);
  }
 }else if(kind==='tm'){
  px(g,x+2*scale,y+2*scale,14*scale,14*scale,0x202b4a);
  px(g,x+3*scale,y+3*scale,12*scale,12*scale,0x6eafce);
  px(g,x+5*scale,y+5*scale,8*scale,8*scale,0xcde9f5);
  px(g,x+8*scale,y+8*scale,2*scale,2*scale,0x1f4874);
  px(g,x+3*scale,y+3*scale,4*scale,3*scale,0xa78dd6);
  px(g,x+12*scale,y+11*scale,3*scale,4*scale,0x5184ba);
 }else{
  // Potion, Super Potion: small glass vial with cork and colored fluid.
  const fluid=type==='superpotion'?0xeed75b:0xbd72f1;
  px(g,x+7*scale,y+1*scale,4*scale,3*scale,0xe9dba8);
  px(g,x+5*scale,y+4*scale,8*scale,3*scale,0x283d61);
  px(g,x+4*scale,y+7*scale,10*scale,9*scale,0x96cce1);
  px(g,x+6*scale,y+9*scale,6*scale,5*scale,fluid);
  px(g,x+5*scale,y+8*scale,2*scale,6*scale,0xd8f4ff);
  px(g,x+4*scale,y+15*scale,10*scale,2*scale,0x315e81);
 }
}
