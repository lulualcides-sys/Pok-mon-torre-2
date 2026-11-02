/* Kanto regional identity: foreground accents are purely decorative.
 * Scene-owned Phaser Graphics, no texture downloads, events, colliders,
 * save mutations or changes to gym/route navigation.
 * Each town gets a unique landform/land-use silhouette, not only recolors.
 */
export const REGIONAL_SIGNATURES=Object.freeze({
 stone:Object.freeze({name:'Pewter rocky terraces',feature:'quarry-cut ledges'}),
 electric:Object.freeze({name:'Vermilion working port',feature:'cargo pier and moorings'}),
 garden:Object.freeze({name:'Celadon botanic quarter',feature:'glasshouse and garden beds'}),
 poison:Object.freeze({name:'Fuchsia nature reserve',feature:'bamboo garden and gate'}),
 psychic:Object.freeze({name:'Saffron metropolitan plaza',feature:'crosswalks and transit square'}),
 volcano:Object.freeze({name:'Cinnabar volcanic coast',feature:'basalt shelves and fumaroles'}),
 forest:Object.freeze({name:'Viridian wooded settlement',feature:'fallen timber and forest trail'}),
 league:Object.freeze({name:'Indigo ceremonial approach',feature:'stone plinths and banners'})
});
const rect=(g,x,y,w,h,color,alpha=1)=>g.fillStyle(color,alpha).fillRect(x,y,w,h);
function rock(g,x,y,w,h){
 rect(g,x+2,y+3,w,h,0x405c60,.5);
 rect(g,x+1,y+1,w-2,h-2,0x697c79);
 rect(g,x+3,y+1,w-6,3,0xb6b9a2);
 rect(g,x+3,y+5,3,h-8,0x94a398);
 rect(g,x+w-5,y+4,3,h-5,0x3e555b);
 rect(g,x+5,y+h-4,w-10,2,0x455d5f);
}
function timber(g,x,y,w,h){
 rect(g,x+1,y+2,w,h,0x433d34);
 rect(g,x,y,w,h,0x966c47);
 for(let dy=2;dy<h-1;dy+=5)rect(g,x+2,y+dy,w-4,1,0xc39462);
 rect(g,x+3,y+2,2,2,0xe1bd86);rect(g,x+w-5,y+h-4,2,2,0xe1bd86);
}
function flowerBed(g,x,y,w,h,pink=0xe89aae){
 rect(g,x,y,w,h,0x315b40);rect(g,x,y,w,2,0xd2bd8e);
 rect(g,x,y+h-2,w,2,0xb29a73);
 for(let yy=y+5;yy<y+h-2;yy+=9)for(let xx=x+5;xx<x+w-2;xx+=11){
  rect(g,xx-2,yy,5,3,0x47975b);rect(g,xx,yy-2,3,3,pink);
  rect(g,xx+1,yy-2,1,1,0xffeed1);
 }
}
function pennant(g,x,y,color){
 rect(g,x,y-43,3,48,0x405b69);
 rect(g,x-2,y-45,7,3,0xd9c799);
 rect(g,x+3,y-38,16,29,color);
 rect(g,x+4,y-37,2,23,0xb5d4d4,.8);
 rect(g,x+3,y-9,16,3,0xd8caa2);
 rect(g,x+9,y-26,4,11,0xe5d6a2);
}
export function renderRegionalIdentity(scene,theme){
 if(!REGIONAL_SIGNATURES[theme])return null;
 const g=scene.add.graphics().setDepth(6).setData('torre2-region-identity',theme);
 const details=scene.add.graphics().setDepth(19).setData('torre2-region-identity-detail',theme);
 if(theme==='stone'){
  // Rocky irregular horizon, tiered stone slabs and a small former quarry.
  for(const [x,y,w,h] of [[338,85,115,12],[350,97,92,10],[366,107,65,8],[74,94,62,15],[510,91,44,11]])
   rock(g,x,y,w,h);
  for(const [x,y,w,h] of [[304,236,25,15],[338,246,32,19],[382,252,17,10],[542,228,30,17],[56,229,25,12]])
   rock(details,x,y,w,h);
  for(let i=0;i<9;i++)rect(g,337+i*13,117+(i%3)*2,8,2,0xc8c4a5);
 }else if(theme==='electric'){
  // Vermilion: visible commercial harbor rather than a second inland city.
  for(let y=227;y<294;y+=8)timber(g,382,y,49,7);
  for(const x of [379,430])for(const y of [230,261,290]){
   rect(details,x,y,5,13,0x4b493d);rect(details,x+1,y,2,9,0xcda873);
  }
  for(const [x,y] of [[443,252],[455,263],[465,254]]){
   rect(details,x,y,14,11,0x8d613f);rect(details,x,y,14,2,0xd4a66e);
   rect(details,x+3,y+4,8,1,0xc5a278);
  }
  // Square stone lighthouse marker at the end of the harbor.
  rect(details,565,240,13,36,0xede3c4);
  rect(details,563,238,17,5,0xba4f45);
  rect(details,566,244,11,4,0x6c9cba);
  rect(details,568,227,7,11,0xf4efe0);
  rect(details,565,226,13,3,0xbb4e45);
 }else if(theme==='garden'){
  // Celadon: botanical district with its own greenhouse landmark.
  rect(g,369,80,135,65,0x46734f);
  flowerBed(g,376,88,37,48,0xe99db3);
  flowerBed(g,462,88,35,48,0xf4c971);
  rect(details,416,88,43,54,0xeee7c7);
  rect(details,419,91,37,44,0x82b9ba);
  for(let i=0;i<4;i++)rect(details,421+i*9,91,2,44,0xe4e4c7);
  rect(details,420,111,35,3,0xe9eee0);
  rect(details,432,119,11,17,0x366e79);
  rect(details,432,78,11,10,0x8fb5ad);
  rect(details,416,140,43,4,0x9d8d66);
 }else if(theme==='poison'){
  // Fuchsia: marsh preserve, quiet timber gate and bamboo enclosure.
  for(const [x,y] of [[232,83],[244,85],[257,81],[378,92],[391,95],[405,89],[418,91]]){
   rect(details,x,y-26,3,32,0x477b52);
   for(let yy=y-23;yy<y+3;yy+=7)rect(details,x,yy,3,1,0xb1c879);
   rect(details,x-4,y-18,9,2,0x3c8c55);
  }
  for(const x of [450,511]){
   timber(details,x,100,7,44);
   rect(details,x-2,100,11,3,0xb88b63);
  }
  timber(details,450,100,68,7);
  rect(details,474,111,14,20,0x604c49);
  rect(details,476,114,10,9,0xb9a56b);
  flowerBed(g,72,227,65,18,0xd8addf);
 }else if(theme==='psychic'){
  // Saffron: urban hierarchy with pedestrian crossings and tram track.
  for(const x of [150,370,517])for(let i=0;i<5;i++)
   rect(details,x+i*6,175,4,17,0xe4e7d8);
  for(const y of [246,261]){
   rect(g,36,y,567,3,0x526b74);
   rect(g,36,y+3,567,1,0xe5cf93);
  }
  for(let x=44;x<593;x+=20)rect(g,x,248,8,12,0x6c858b);
  rect(details,241,93,158,30,0x718e99);
  rect(details,246,97,148,22,0x2b506a);
  for(let x=252;x<394;x+=15)rect(details,x,101,8,11,0x82c4d1);
  rect(details,240,120,161,4,0xd2ccb2);
 }else if(theme==='volcano'){
  // Cinnabar: weathered basalt and visible geothermal vents.
  for(const [x,y,w,h] of [[94,226,66,20],[166,239,44,14],[393,236,60,15],[493,257,65,14]])
   rock(g,x,y,w,h);
  for(const [x,y] of [[147,245],[416,248],[522,245]]){
   rect(details,x,y-15,3,15,0x6b746a);
   rect(details,x-5,y-20,11,3,0xd4bcb0,.55);
   rect(details,x-8,y-27,13,3,0xc4b5ad,.38);
   rect(details,x-5,y-34,10,2,0xc5bfad,.24);
  }
  for(const [x,y] of [[120,216],[470,229],[540,277]]){
   rect(details,x,y,15,2,0x392f32);
   rect(details,x+5,y+2,3,9,0xc96c47);
  }
 }else if(theme==='forest'){
  // Viridian: thick woodland and a crooked timber path rather than plazas.
  const trail=[[387,90,34,17],[397,106,38,17],[408,123,28,18],
   [385,142,36,17],[367,159,29,20],[377,180,26,20]];
  for(const [x,y,w,h] of trail){
   rect(g,x,y,w,h,0x8d8765);
   for(let k=0;k<7;k++)rect(g,x+4+k*4,y+3+(k%3)*4,2,2,0xc0aa79);
  }
  timber(details,463,115,77,11);
  rect(details,471,110,4,19,0x6d7547);
  rect(details,524,111,4,19,0x6d7547);
  for(const [x,y] of [[81,106],[103,114],[120,111],[504,94],[530,105]]){
   rect(details,x,y-16,4,16,0x69513a);
   rect(details,x-8,y-21,19,9,0x286d47);
   rect(details,x-5,y-26,14,8,0x3e9350);
  }
 }else if(theme==='league'){
  // Indigo: broad ceremonial rise with individually pitched flags.
  for(let i=0;i<4;i++){
   const x=244-i*12,y=126+i*23,w=152+i*24;
   rect(g,x,y,w,5,0xd3d1bd);
   rect(g,x,y+5,w,4,0x6d807f);
  }
  for(const [x,y] of [[196,185],[434,185],[165,253],[465,253]]){
   rock(details,x,y,18,28);
   rect(details,x+6,y-3,6,5,0xe5d6a9);
  }
  pennant(details,205,170,0x8666ac);
  pennant(details,434,170,0xa66c91);
  pennant(details,175,250,0x587ca6);
  pennant(details,462,250,0x587ca6);
 }
 return {theme,signature:REGIONAL_SIGNATURES[theme].feature,decorative:true};
}
