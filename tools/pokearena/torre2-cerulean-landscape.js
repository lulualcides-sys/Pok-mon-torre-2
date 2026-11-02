/* Cerulean landscape v2: restrained, walkable gardens, not bright-green
 * geometry blotches. Geometry remains declarative/testable and only scenic.
 * Retains the previously approved image atlas, camera and city services.
 */
export const CERULEAN_GARDEN_BEDS=Object.freeze([
 Object.freeze({id:'north-west-patio',kind:'flower',points:[[170,96],[181,91],[194,94],[199,103],[195,117],[177,117],[167,109]]}),
 Object.freeze({id:'north-canal-rim',kind:'river',points:[[291,97],[300,89],[314,89],[325,99],[323,113],[308,119],[294,113]]}),
 Object.freeze({id:'west-waterfront',kind:'wild',points:[[283,191],[295,185],[314,187],[325,195],[325,214],[313,225],[292,222],[283,211]]}),
 Object.freeze({id:'west-botanical',kind:'formal',points:[[209,229],[223,218],[243,221],[261,221],[270,231],[267,247],[250,251],[236,247],[215,254],[206,246]]}),
 Object.freeze({id:'lower-west-verge',kind:'river',points:[[210,260],[227,256],[242,257],[258,264],[261,273],[212,273],[205,268]]}),
 Object.freeze({id:'east-waterfront',kind:'wild',points:[[412,183],[427,176],[439,181],[447,193],[444,209],[431,214],[414,207]]}),
 Object.freeze({id:'east-botanical',kind:'formal',points:[[453,224],[468,219],[489,221],[506,220],[518,224],[534,226],[541,235],[533,246],[509,245],[486,250],[464,245],[451,239]]}),
 Object.freeze({id:'east-upper-flowers',kind:'flower',points:[[578,97],[594,91],[610,94],[619,105],[616,118],[593,118],[579,111]]})
]);
export const CERULEAN_CLEAR_ROUTES=Object.freeze([
 Object.freeze({id:'gym-access',x1:469,y1:169,x2:560,y2:214}),
 Object.freeze({id:'center-access',x1:85,y1:141,x2:164,y2:179}),
 Object.freeze({id:'mart-access',x1:64,y1:236,x2:145,y2:270}),
 Object.freeze({id:'main-plaza',x1:210,y1:149,x2:280,y2:215}),
 Object.freeze({id:'south-stairway',x1:270,y1:265,x2:310,y2:307}),
 Object.freeze({id:'bridge',x1:327,y1:115,x2:411,y2:164}),
 Object.freeze({id:'boat-and-quay',x1:453,y1:258,x2:558,y2:308}),
 Object.freeze({id:'large-river',x1:335,y1:35,x2:402,y2:288}),
 Object.freeze({id:'small-river',x1:154,y1:196,x2:198,y2:276})
]);
const seed=(x,y,s=0)=>((Math.imul(x+19,1777)^Math.imul(y+37,104729)^Math.imul(s+11,17497))>>>0);
const drawRect=(g,x,y,w,h,c,a=1)=>g.fillStyle(c,a).fillRect(x,y,w,h);
function onSegment(x,y,a,b){
 return Math.abs((x-a[0])*(b[1]-a[1])-(y-a[1])*(b[0]-a[0]))<.001&&
 x>=Math.min(a[0],b[0])&&x<=Math.max(a[0],b[0])&&y>=Math.min(a[1],b[1])&&y<=Math.max(a[1],b[1]);
}
function inside(p,x,y){
 let flag=false;
 for(let i=0,j=p.length-1;i<p.length;j=i++){
  const a=p[i],b=p[j];
  if(onSegment(x,y,a,b))return true;
  if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])flag=!flag;
 }
 return flag;
}
function intersects(bed,box){
 const xs=bed.points.map(p=>p[0]),ys=bed.points.map(p=>p[1]);
 const x0=Math.max(box.x1,Math.min(...xs)),x1=Math.min(box.x2,Math.max(...xs));
 const y0=Math.max(box.y1,Math.min(...ys)),y1=Math.min(box.y2,Math.max(...ys));
 if(x0>=x1||y0>=y1)return false;
 for(let y=y0+.5;y<y1;y++)for(let x=x0+.5;x<x1;x++)
  if(inside(bed.points,x,y))return true;
 return false;
}
export function ceruleanLandscapeReport(beds=CERULEAN_GARDEN_BEDS){
 const ids=new Set(),blocked=[];
 for(const bed of beds){
  if(ids.has(bed.id))blocked.push(bed.id+':duplicate-id');
  ids.add(bed.id);
  if(!Array.isArray(bed.points)||bed.points.length<6||!['river','wild','formal','flower'].includes(bed.kind))
   blocked.push(bed.id+':invalid-garden');
  for(const p of bed.points)if(!Number.isInteger(p[0])||!Number.isInteger(p[1])||
   p[0]<0||p[0]>640||p[1]<35||p[1]>284)blocked.push(bed.id+':outside-city');
  for(const box of CERULEAN_CLEAR_ROUTES)if(intersects(bed,box))blocked.push(bed.id+':blocks-'+box.id);
 }
 return {beds:beds.length,uniqueZones:ids.size,blocked,pass:blocked.length===0};
}
function outline(g,pts,shade){
 for(let i=0;i<pts.length;i++){
  const a=pts[i],b=pts[(i+1)%pts.length],len=Math.hypot(a[0]-b[0],a[1]-b[1]);
  for(let n=0;n<=Math.ceil(len/2);n++){
   const f=n/Math.ceil(len/2),x=Math.round(a[0]+(b[0]-a[0])*f),y=Math.round(a[1]+(b[1]-a[1])*f);
   const k=seed(x,y)%4;
   drawRect(g,x,y,k===0?3:2,k===2?1:2,shade[k]);
  }
 }
}
function grassLights(g,bed,index){
 const pts=bed.points,xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
 let flowers=0,pebbles=0;
 for(let y=Math.min(...ys)+3;y<Math.max(...ys)-3;y+=3)
 for(let x=Math.min(...xs)+3;x<Math.max(...xs)-3;x+=3){
  if(!inside(pts,x,y))continue;
  const r=seed(x,y,index)%113;
  if(r<12){ // low-contrast undergrowth, not neon green dots
   drawRect(g,x,y,2,2,r%3?0x668b51:0x819e63,.8);
  }else if(r===24||r===25||r===26){
   const c=bed.kind==='wild'?0xe8b5d2:bed.kind==='river'?0xf4e2b0:
    bed.kind==='formal'?0xf4c7aa:0xf6ccd5;
   drawRect(g,x,y,3,2,0x3d6c48);
   drawRect(g,x+1,y-2,2,2,c);
   drawRect(g,x+1,y-2,1,1,0xffe7cd);
   flowers++;
  }else if(r===34&&bed.kind==='river'){
   drawRect(g,x,y,3,1,0xbab99d);pebbles++;
  }
 }
 return {flowers,pebbles};
}
function tile(scene){
 const key='torre2-city-surfaces-v1';
 if(!scene.textures.exists(key)||!scene.textures.get(key).has('grass'))return null;
 return scene.add.tileSprite(0,35,640,250,key,'grass').setOrigin(0).setDepth(4.08)
  .setTileScale(.25).setAlpha(.78).setData('torre2-cerulean-garden','tiled-grass');
}
function bench(g,x,y){
 drawRect(g,x-8,y+5,17,2,0x405252);
 drawRect(g,x-8,y,17,5,0x946e4b);
 drawRect(g,x-7,y-2,15,2,0xd5b17a);
 drawRect(g,x-6,y+5,2,5,0x584b3f);
 drawRect(g,x+6,y+5,2,5,0x584b3f);
}
function walkway(g,x,y,w){
 // Small intra-park limestone pavers: breaks up large green masses.
 for(let i=0;i<w;i+=7){
  const z=seed(x+i,y)%3;
  drawRect(g,x+i,y+(z===0?1:0),6,3,0xabb2a1);
  drawRect(g,x+i,y+(z===0?1:0),6,1,0xe3d7b7);
  drawRect(g,x+i,y+3,5,1,0x778e88);
 }
}
function borderFurniture(g){
 // Human-scaled individual pieces, on planted strips only.
 bench(g,233,240);
 bench(g,489,240);
 walkway(g,459,238,21);
 walkway(g,497,239,25);
 // Canal-side low dry-stone blocks provide a believable ground boundary.
 for(const [x,y]of [[285,210],[299,224],[418,201],[435,214]]){
  drawRect(g,x,y,8,3,0x637d73);
  drawRect(g,x,y,8,1,0xc5c9ac);
  drawRect(g,x+2,y+2,2,1,0x9ba69c);
 }
}
export function renderCeruleanLandscape(scene){
 const base=scene.add.graphics().setDepth(3.92).setData('torre2-cerulean-garden','earth');
 const maskShape=scene.make.graphics({x:0,y:0,add:false});
 const trims=scene.add.graphics().setDepth(4.18).setData('torre2-cerulean-garden','natural-edging');
 for(const [i,bed]of CERULEAN_GARDEN_BEDS.entries()){
  const verts=bed.points.map(([x,y])=>({x,y}));
  base.fillStyle(bed.kind==='river'?0x82966d:0x7e915f).fillPoints(verts,true);
  maskShape.fillStyle(0xffffff).fillPoints(verts,true);
  // Delicate pale stone edging rather than square exposed artificial green masks.
  outline(trims,bed.points,[0x8c9e8c,0xb1b9a0,0xd8ceaa,0xa8b29b]);
  grassLights(trims,bed,i);
 }
 const grass=tile(scene);
 if(grass){
  const mask=maskShape.createGeometryMask();
  grass.setMask(mask);
  grass.once('destroy',()=>{mask.destroy();maskShape.destroy()});
 }else maskShape.destroy();
 const props=scene.add.graphics().setDepth(6).setData('torre2-cerulean-garden','seats');
 borderFurniture(props);
 return {version:'cerulean-botanical-terraces-v2',beds:CERULEAN_GARDEN_BEDS.length,
  protectedRoutes:CERULEAN_CLEAR_ROUTES.length,usesAtlas:!!grass};
}
