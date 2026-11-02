/* Cerulean's landscape is an irregular garden network, not repeated lawns.
 * All coordinates are in the established 640x360 campaign canvas.
 * Only Phaser Graphics and a single bounded tileSprite are used; this module
 * does not register input/collision, mutate saves, or alter scene navigation.
 */
export const CERULEAN_GARDEN_BEDS=Object.freeze([
 Object.freeze({id:'west-canal-walk',points:[[169,135],[191,130],[205,138],[204,161],[192,169],[171,163]]}),
 Object.freeze({id:'upper-west-grove',points:[[167,91],[184,87],[199,92],[201,114],[186,119],[166,111]]}),
 Object.freeze({id:'north-river-overlook',points:[[293,92],[314,87],[328,96],[326,115],[305,119],[289,107]]}),
 Object.freeze({id:'riverbank-garden',points:[[283,189],[303,184],[327,189],[329,213],[313,231],[293,225],[282,211]]}),
 Object.freeze({id:'central-flower-park',points:[[208,225],[226,216],[255,221],[277,219],[307,229],[307,245],[289,252],[257,247],[230,257],[206,248]]}),
 Object.freeze({id:'lower-west-terrace',points:[[210,255],[233,250],[259,254],[268,261],[266,275],[238,275],[209,272]]}),
 Object.freeze({id:'east-canal-edge',points:[[411,181],[433,173],[453,183],[458,199],[449,216],[422,216],[410,203]]}),
 Object.freeze({id:'east-square-botanical',points:[[445,224],[461,216],[484,219],[506,217],[530,225],[547,239],[537,251],[508,246],[484,251],[458,247],[446,241]]}),
 Object.freeze({id:'east-boat-bank',points:[[411,235],[429,228],[447,233],[451,248],[438,258],[413,261],[406,248]]}),
 Object.freeze({id:'south-east-cluster',points:[[546,220],[557,217],[565,221],[564,239],[548,245],[540,237]]})
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
const light=(x,y)=>((Math.imul(x+23,7919)^Math.imul(y+57,104729))>>>0);
const rect=(g,x,y,w,h,c)=>g.fillStyle(c).fillRect(x,y,w,h);
function inPolygon(x,y,p){
 let yes=false;
 for(let i=0,j=p.length-1;i<p.length;j=i++){
  const a=p[i],b=p[j];
  if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;
 }
 return yes;
}
const pointOnSegment=(x,y,a,b)=>
 Math.abs((x-a[0])*(b[1]-a[1])-(y-a[1])*(b[0]-a[0]))<.001&&
 x>=Math.min(a[0],b[0])&&x<=Math.max(a[0],b[0])&&
 y>=Math.min(a[1],b[1])&&y<=Math.max(a[1],b[1]);
function polygonInside(p,x,y){
 return inPolygon(x,y,p)||p.some((a,i)=>pointOnSegment(x,y,a,p[(i+1)%p.length]));
}
function collision(bed,route){
 // Pixel-center overlap check: deliberately conservative for gameplay paths.
 const xs=bed.points.map(p=>p[0]),ys=bed.points.map(p=>p[1]);
 const x0=Math.max(route.x1,Math.min(...xs)),x1=Math.min(route.x2,Math.max(...xs));
 const y0=Math.max(route.y1,Math.min(...ys)),y1=Math.min(route.y2,Math.max(...ys));
 if(x0>=x1||y0>=y1)return false;
 for(let y=y0+.5;y<y1;y+=1)for(let x=x0+.5;x<x1;x+=1)
  if(inPolygon(x,y,bed.points))return true;
 return false;
}
export function ceruleanLandscapeReport(beds=CERULEAN_GARDEN_BEDS){
 const ids=new Set(),violations=[];
 for(const bed of beds){
  if(ids.has(bed.id))violations.push(bed.id+':duplicate-id');
  ids.add(bed.id);
  if(!Array.isArray(bed.points)||bed.points.length<6)violations.push(bed.id+':invalid-shape');
  for(const [x,y] of bed.points)if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<35||x>640||y>285)
   violations.push(bed.id+':outside-city');
  for(const route of CERULEAN_CLEAR_ROUTES)if(collision(bed,route))violations.push(bed.id+':blocks-'+route.id);
 }
 return {beds:beds.length,uniqueZones:ids.size,blocked:violations,pass:violations.length===0};
}
function grassTexture(scene){
 const key='torre2-city-surfaces-v1';
 if(!scene.textures.exists(key))return null;
 const texture=scene.textures.get(key);
 if(!texture.has('grass'))return null;
 return scene.add.tileSprite(0,35,640,250,key,'grass').setOrigin(0).setDepth(4.08)
  .setTileScale(.24).setData('torre2-cerulean-garden','grass-atlas');
}
function pixelflowers(g,bed,i){
 const points=bed.points,xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 const x0=Math.min(...xs)+2,x1=Math.max(...xs)-2,y0=Math.min(...ys)+2,y1=Math.max(...ys)-2;
 const warm=[0xecc89b,0xf4e4bb,0xe6a7b0,0xd8afd4,0xf8f4d8];
 const greens=[0x3b8545,0x5da44c,0x8ebf58,0xa9cd65];
 for(let y=y0;y<y1;y+=3)for(let x=x0;x<x1;x+=3){
  if(!polygonInside(points,x,y))continue;
  const r=light(x+i*13,y+i*29)%97;
  if(r<17){rect(g,x,y,2,2,greens[r%greens.length]);if(r%4===0)rect(g,x+1,y-1,2,1,0xa8d26b)}
  if((r===25||r===26||r===27)&&(x-x0>3)){
   rect(g,x,y,3,2,0x427f41);
   rect(g,x+1,y-2,2,3,warm[(x+y+i)%warm.length]);
   rect(g,x+1,y-2,1,1,0xfff4c6);
  }
 }
}
function stoneRim(g,points){
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length];
  const d=Math.hypot(b[0]-a[0],b[1]-a[1]),count=Math.max(1,Math.ceil(d/4));
  for(let j=0;j<count;j++){
   const x=Math.round(a[0]+(b[0]-a[0])*j/count),y=Math.round(a[1]+(b[1]-a[1])*j/count);
   const idx=light(x,y)%3;
   rect(g,x,y,idx===0?4:3,idx===2?1:2,[0x8a9b8b,0xa7af97,0xd4c7a0][idx]);
  }
 }
}
export function renderCeruleanLandscape(scene){
 const bg=scene.add.graphics().setDepth(3.9).setData('torre2-cerulean-garden','earth');
 const maskShape=scene.make.graphics({x:0,y:0,add:false});
 const highlights=scene.add.graphics().setDepth(4.15).setData('torre2-cerulean-garden','plant-details');
 for(const [i,bed] of CERULEAN_GARDEN_BEDS.entries()){
  const points=bed.points.map(([x,y])=>({x,y}));
  bg.fillStyle(0x60794c).fillPoints(points,true);
  maskShape.fillStyle(0xffffff).fillPoints(points,true);
  stoneRim(highlights,bed.points);
  pixelflowers(highlights,bed,i);
 }
 // Only one bounded, masked TileSprite. This retains the illustrated grass
 // surface, rather than drawing flat placeholder green rectangles.
 const ground=grassTexture(scene);
 let mask;
 if(ground){
  mask=maskShape.createGeometryMask();
  ground.setMask(mask);
  ground.once('destroy',()=>{
   mask?.destroy();
   maskShape.destroy();
  });
 }else maskShape.destroy();
 // Garden lanterns, low stone edging and wooden seats are scenery only.
 const props=scene.add.graphics().setDepth(5.9).setData('torre2-cerulean-garden','furniture');
 for(const [x,y]of [[230,241],[486,240]]){
  rect(props,x-9,y+4,19,2,0x344d53);rect(props,x-8,y-1,17,5,0x916a46);
  rect(props,x-7,y-2,15,2,0xd9b37a);rect(props,x-6,y+6,2,5,0x594737);
  rect(props,x+6,y+6,2,5,0x594737);
 }
 return {version:'organic-garden-network-v1',beds:CERULEAN_GARDEN_BEDS.length,
  protectedRoutes:CERULEAN_CLEAR_ROUTES.length,usesAtlas:!!ground};
}
