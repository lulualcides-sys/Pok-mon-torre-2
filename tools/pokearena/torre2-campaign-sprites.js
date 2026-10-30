/* Native Phaser/WebGL pixel stencils for Kanto trainers and shop items.
 * No external trainer-sprite rip, canvas, CSS image, or screenshot backdrop.
 */
import {drawBallSprite} from './ball-sprites.js';
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
  P:0x496568,B:0x38312b},
 sailor:{H:0xf2f3ed,S:0xf3ca98,N:0xbc9473,U:0xd1e9f5,A:0x478ac2,P:0x304e7d,B:0x222f52},
 scientist:{H:0x533e37,S:0xe7bd96,N:0xb58f69,U:0xe6f3f2,A:0x5ca4b9,P:0x3b6870,B:0x283a48},
 swimmer:{H:0x564334,S:0xefa978,N:0xbe845b,U:0x67bad6,A:0xc1f9ff,P:0x398cae,B:0x2b6585},
 cyclist:{H:0x394956,S:0xeac19b,N:0xb78e79,U:0xbd5d55,A:0xf4dd7a,P:0x4b4568,B:0x242e45},
 psychic:{H:0x633e7d,S:0xe2bf99,N:0x957197,U:0x866bd0,A:0xd2b7fb,P:0x58547f,B:0x303458},
 blackbelt:{H:0x37363f,S:0xe2b088,N:0xb78568,U:0xe2d5bc,A:0x85514a,P:0x59544f,B:0x393438},
 channeler:{H:0x5f5472,S:0xd9b7a5,N:0x826c8d,U:0x965c93,A:0xdabedb,P:0x685a8c,B:0x464061},
 ace:{H:0x533b2a,S:0xf0c29b,N:0xa76b4e,U:0xd69a46,A:0xf2d38b,P:0x3b5375,B:0x24364e}
};
export function trainerClass(stage,index,type='trainer',biome='route'){
 if(type==='leader'&&stage>=12)return 'rival';
 if(type==='leader')return stage===0?'brock':
  ['water-gym','electric-gym','grass-gym','poison-gym','psychic-gym',
   'fire-gym'].includes(biome)?({
   'water-gym':'swimmer','electric-gym':'scientist','grass-gym':'lass',
   'poison-gym':'channeler','psychic-gym':'psychic','fire-gym':'scientist'
  })[biome]:'hiker';
 if(type==='rocket')return 'rocket';
 if(type==='rival')return 'rival';
 const themed={
  route:['youngster','lass','bugcatcher','ace'],forest:['bugcatcher','lass','youngster'],
  pewter:['hiker','youngster'],cliff:['hiker','ace','bugcatcher'],cave:['hiker','rocket','ace'],
  river:['swimmer','lass','ace'],sea:['swimmer','sailor','ace'],bridge:['ace','youngster'],
  ship:['sailor','gentleman','ace'],road:['cyclist','ace'],
  'water-gym':['swimmer','sailor'],'electric-gym':['scientist','ace'],
  'grass-gym':['lass','ace'],'poison-gym':['channeler','ace'],
  'psychic-gym':['psychic','ace'],'fire-gym':['scientist','ace'],
  'ground-gym':['hiker','rocket'],safari:['ace','hiker'],hideout:['rocket','scientist'],
  tower:['scientist','rocket'],graveyard:['channeler','psychic'],
  dojo:['blackbelt','ace'],mansion:['scientist','ace'],
  ice:['swimmer','ace'],volcano:['scientist','hiker'],dragon:['ace','psychic'],
  victory:['ace','hiker'],gate:['ace'],league:['ace']
 };
 const choices=themed[biome]||themed.route;
 return choices[(index+stage)%choices.length];
}
export function trainerClassName(kind){
 return ({youngster:'JOVEM',bugcatcher:'CAÇA-INSETOS',lass:'GAROTA',
 hiker:'MONTANHISTA',rival:'RIVAL',rocket:'EQUIPE ROCKET',brock:'BROCK',
 sailor:'MARINHEIRO',scientist:'CIENTISTA',swimmer:'NADADOR',
 cyclist:'CICLISTA',psychic:'PSÍQUICO',blackbelt:'LUTADOR',
 channeler:'MÉDIUM',ace:'TREINADOR ELITE',gentleman:'CAVALHEIRO'})[kind]||'TREINADOR';
}

// Character classes use unique pixel shapes: Rocket beret, bug net,
// sailor cap, long coats, backpacks, colored belts, and leader silhouettes.
const CLASS_SHAPES=Object.freeze({
 youngster:[
 '..HHHHHH....','.HHHHHHHH...','..HSSSSH....','..HSSSSH....',
 '..SSSSSS....','...NNNN.....','.UUUUUUUU...','UUUUUUUUUU..',
 'UUUUAAUUUU..','UUUUUUUUUU..','..UUUUUU....','...PPPP.....',
 '..PPPPPP....','..PP..PP....','..PP..PP....','.BBB..BBB...'
 ],
 bugcatcher:[
 '...HHHH.....','..HHHHHH....','.HHHHHHHH...','..HSSSSH....',
 '..SSSSSS....','...NNNN.....','..UUUUUU....','.UUUUUUUU... ',
 '.UUUAAUUU...','..UUUUUU....','...UUUU.....','...PPPP.....',
 '..PPPPPP....','..PP..PP....','..PP..PP....','.BBB..BBB...'
 ],
 lass:[
 '..HHHHHH....','.HHHHHHHH...','..HSSSSH....','..SSSSSS....',
 '..SSSSSS....','...NNNN.....','..UUUUUU....','.UUUUUUUU...',
 '.UUUA AUUU...','.UUUUUUUU...','.UUUUUUUU...','UUUUUUUUUU..',
 'UUUUUUUUUU..','..PP..PP....','..PP..PP....','.BBB..BBB...'
 ],
 hiker:[
 '..HHHHHH....','.HHHHHHHH...','..SSSSSS....','..SSSSSS....',
 '.SSSSSSSS...','..NNNNNN....','..UUUUUU....','UUUUUUUUUU..',
 'UUUUA AUUU..','UUUUUUUUUU..','..UUUUUU....','...PPPP.....',
 '..PPPPPP....','.PPP..PPP...','.PPP..PPP...','BBBB..BBBB..'
 ],
 rival:[
 '..HHHHHH....','.HHHHHHHH...','..SSSSSS....','..SSSSSS....',
 '...SSSS.....','..NNNNNN....','..UUUUUU....','.UUUUUUUU...',
 '.UUAAAAUU...','UUUUUUUUUU..','..UUUUUU....','...PPPP.....',
 '..PPPPPP....','..PP..PP....','..PP..PP....','.BBB..BBB...'
 ],
 rocket:[
 '..HHHHHH....','.HHHHHHHH...','..SSSSSS....','..SSSSSS....',
 '...SSSS.....','...NNNN.....','..UUUUUU....','.UUUUUUUU...',
 '.UUUAAUUU...','.UUUUUUUU...','..UUUUUU....','...PPPP.....',
 '..PPPPPP....','..PP..PP....','..PP..PP....','.BBB..BBB...'
 ],
 sailor:[
 '...HHHH.....','..HHHHHH....','.HHHHHHHH...','..SSSSSS....',
 '..SSSSSS....','...NNNN.....','..UUUUUU....','.UUUUUUUU...',
 '.UUAAA AUU..','.UUUUUUUU...','..UUUUUU....','...PPPP.....',
 '..PPPPPP....','..PP..PP....','..PP..PP....','.BBB..BBB...'
 ],
 psychic:[
 '..HHHHHH....','.HHHHHHHH...','..SSSSSS....','..SSSSSS....',
 '...SSSS.....','...NNNN.....','..UUUUUU....','.UUUUUUUU...',
 '.UUUAAUUU...','..UUUUUU....','.UUUUUUUU...','UUUUUUUUUU..',
 '..PPPPPP....','..PP..PP....','..PP..PP....','.BBB..BBB...'
 ]
});
export function drawTrainer(g,cx,cy,kind='youngster',scale=1){
 const p=PAL[kind]||PAL.ace;
 const shape=CLASS_SHAPES[kind]||CLASS_SHAPES[
  ['scientist','ace','channeler','swimmer','cyclist'].includes(kind)?'psychic':
  ['gentleman','blackbelt','brock'].includes(kind)?'hiker':'youngster'];
 const x=Math.round(cx-6*scale),y=Math.round(cy-10*scale);
 // One-pixel shadow gives readable contact with grassy map tiles.
 px(g,x+3*scale,y+17*scale,8*scale,2*scale,0x1b493c);
 for(let row=0;row<shape.length;row++){
  for(let col=0;col<12;col++){
   let ch=shape[row][col]||'.';
   if(ch===' '||ch==='.')continue;
   const color=p[ch]||0x17253d;
   px(g,x+col*scale,y+row*scale,scale,scale,color);
  }
 }
 // Each outfit has a recognizable iconography at its tiny GBA scale.
 const accent=(a,b,w,h,color)=>px(g,x+a*scale,y+b*scale,w*scale,h*scale,color);
 accent(4,3,1,1,0x242839);accent(7,3,1,1,0x242839);
 if(kind==='bugcatcher'){
  accent(1,0,10,2,0x9fca6e);
  // Butterfly net carried over the shoulder, two-tone mesh
  accent(11,-5,1,16,0xe5bc76);
  accent(9,-7,6,1,0xf2e2ac);accent(9,-6,1,6,0xe7d19c);
  accent(14,-6,1,6,0xe7d19c);accent(9,0,6,1,0xf2e2ac);
  accent(10,-4,4,1,0x77b3a6);
 }else if(kind==='rocket'){
  accent(2,1,8,2,0x333745);accent(4,8,4,2,0xd7535a);
  accent(5,8,2,3,0xffffff);
 }else if(kind==='rival'||kind==='youngster'){
  accent(2,1,8,2,kind==='rival'?0xea5650:0x2f82cd);
  accent(8,1,3,1,0xfbf2d3);
  accent(8,10,2,2,0xe8cf75);
 }else if(kind==='sailor'){
  accent(1,0,10,2,0xffffff);
  accent(4,-1,4,2,0x427fbb);accent(6,7,2,2,0x5c86c8);
 }else if(kind==='hiker'||kind==='brock'){
  accent(-2,6,4,9,0x685446);
  accent(-1,6,2,7,0xb9a16f);
  accent(4,7,4,2,0xefddaf);
 }else if(kind==='lass'||kind==='channeler'){
  accent(1,2,2,6,p.H);accent(9,2,2,6,p.H);
  accent(5,10,2,2,0xffecb9);
 }else if(kind==='scientist'){
  accent(2,8,3,5,0xe8eeed);accent(8,8,3,5,0xe8eeed);
  accent(5,5,2,1,0x496d7b);
 }else if(kind==='psychic'){
  accent(3,1,7,2,0x634393);accent(3,9,6,2,0xf5d2e3);
 }
}
function px(g,x,y,w,h,c){g.fillStyle(c,1);g.fillRect(Math.round(x),Math.round(y),w,h)}
export function drawShopItem(g,cx,cy,item,scale=2){
 const kind=typeof item==='string'?item:item?.kind||'ball';
 const type=typeof item==='string'?item:item?.id||'pokeball';
 const x=Math.round(cx-9*scale),y=Math.round(cy-9*scale);
 if(kind==='ball'||/ball/.test(type)){
  // Inventory and shop use the SAME pixel-cell ball art as wild capture,
  // party HUD and red recall beams (never a generic WebGL circle).
  drawBallSprite(g,cx,cy,type,scale,0,false);
 }else if(kind==='tm'){
  // Colored cartridge/disc sprite: each TM has a stable distinct palette.
  const palette=[0x6eafce,0xe7b25e,0x81c393,0xbe91d8,0xc6d86e,0xd38e86];
  const hash=[...type].reduce((n,c)=>n+c.charCodeAt(0),0);
  const face=palette[hash%palette.length];
  px(g,x+2*scale,y+2*scale,14*scale,14*scale,0x202b4a);
  px(g,x+3*scale,y+3*scale,12*scale,12*scale,face);
  px(g,x+5*scale,y+5*scale,8*scale,8*scale,0xcde9f5);
  px(g,x+8*scale,y+8*scale,2*scale,2*scale,0x1f4874);
  px(g,x+3*scale,y+3*scale,4*scale,3*scale,0xf0f4ff);
  px(g,x+12*scale,y+11*scale,3*scale,4*scale,0x5184ba);
 }else{
  // Actual individually rasterized 18px pixel item art, not text glyphs.
  const fluid=type==='superpotion'?0xeed75b:
   type==='potion'?0xbd72f1:type==='fullheal'?0xf5e5a3:
   type==='antidote'?0xa7f19a:type==='paralyzeheal'?0xeccd68:
   type==='awakening'?0xf3a0c5:type==='burnheal'?0xf29a71:0x8fe0ef;
  px(g,x+7*scale,y+1*scale,4*scale,3*scale,0xe9dba8);
  px(g,x+5*scale,y+4*scale,8*scale,3*scale,0x283d61);
  px(g,x+4*scale,y+7*scale,10*scale,9*scale,0x96cce1);
  px(g,x+6*scale,y+9*scale,6*scale,5*scale,fluid);
  px(g,x+5*scale,y+8*scale,2*scale,6*scale,0xd8f4ff);
  px(g,x+4*scale,y+15*scale,10*scale,2*scale,0x315e81);
  if(kind==='status'){
   px(g,x+8*scale,y+10*scale,2*scale,4*scale,0xffffff);
   px(g,x+7*scale,y+11*scale,4*scale,2*scale,0xffffff);
  }
 }
}
// Rasterize existing approved Phaser pixel stencils to reusable texture sprites.
// No Canvas2D gameplay fallback, no external asset or cross-mode VFX changes.
export function shopItemSprite(scene,item){
 const key='torre2-mart-item-'+item.id;
 if(!scene.textures.exists(key)){
  const g=scene.make.graphics({x:0,y:0,add:false});
  drawShopItem(g,12,12,item,1);
  g.generateTexture(key,24,24);
  g.destroy();
 }
 return key;
}
