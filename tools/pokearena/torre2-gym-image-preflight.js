/* T38 — deterministic AABB preflight for ALL eight raster gym overlays.
 * Geometry is checked before Phaser creates a single visual or hitbox.
 * No gameplay, RNG, save, texture or battle dependency belongs here.
 */
export const GYM_IMAGE_PREFLIGHT_VERSION='t38-eight-gym-aabb-v1';
const LOGICAL=Object.freeze({width:640,height:360});
const DEFAULT_SCREENS=Object.freeze([
 Object.freeze({width:640,height:360}),
 Object.freeze({width:854,height:480}),
 Object.freeze({width:390,height:844})
]);
const rect=(x,y,w,h)=>Object.freeze({x,y,w,h});
const finiteRect=r=>r&&[r.x,r.y,r.w,r.h].every(Number.isFinite)&&r.w>0&&r.h>0;
const contains=(outer,inner)=>inner.x>=outer.x&&inner.y>=outer.y&&
 inner.x+inner.w<=outer.x+outer.w&&inner.y+inner.h<=outer.y+outer.h;
const intersects=(a,b,gap=0)=>a.x<a.x+a.w&&
 a.x+a.w+gap>b.x&&b.x+b.w+gap>a.x&&
 a.y+a.h+gap>b.y&&b.y+b.h+gap>a.y;
function assertSeparated(a,b,gap,label){
 if(intersects(a,b,gap))throw Error('T38 gym overlay AABB overlap: '+label);
}
function assertInside(container,item,label){
 if(!finiteRect(item)||!contains(container,item))
  throw Error('T38 gym overlay out of bounds: '+label);
}
export function preflightGymImageOverlay(layout,{screens=DEFAULT_SCREENS}={}){
 if(!layout||!Number.isInteger(layout.stage)||layout.stage<0||layout.stage>7||
  layout.cameraZoom!==1||!Array.isArray(layout.slots)||
  layout.slots.length!==(layout.stage===0?3:4)||
  !Number.isFinite(layout.margin)||layout.margin<0||
  layout.uiTop<274)throw Error('T38 invalid gym overlay plan');
 const room=rect(layout.room.x,layout.room.y,layout.room.width,layout.room.height);
 const logical=rect(0,0,LOGICAL.width,LOGICAL.height);
 assertInside(logical,room,'room');
 const margin=layout.margin;
 const leader=rect(layout.leader.x-14,layout.leader.y-42,28,42);
 // Onix/Arcanine may occupy 58 px; reserve the largest ace footprint.
 const ace=rect(layout.ace.x-29,layout.ace.y-46,58,46);
 const corridor=rect(294,138,52,116);
 const exit=rect(294,254,52,14);
 const cta=rect(181,294,278,34);
 for(const [name,box] of [['leader',leader],['ace',ace],
  ['corridor',corridor],['exit',exit]])assertInside(room,box,name);
 assertInside(logical,cta,'challenge CTA');
 if(cta.y<layout.uiTop)throw Error('T38 gym CTA intrudes into scenery');
 assertSeparated(leader,ace,margin,'leader / ace');
 assertSeparated(leader,corridor,margin,'leader / corridor');
 assertSeparated(ace,corridor,margin,'ace / corridor');
 const hotspots=layout.slots.map((point,i)=>{
  if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y))
   throw Error('T38 invalid trainer anchor: '+i);
  // Exact native Phaser zone is 53x40, centred at (x,y-17).
  // Reserve a slightly larger 54x42 AABB for pixel snap.
  const box=rect(point.x-27,point.y-38,54,42);
  assertInside(room,box,'trainer '+i);
  for(const [name,avoid] of [['leader',leader],['ace',ace],
   ['corridor',corridor],['exit',exit],['CTA',cta]])
   assertSeparated(box,avoid,margin,'trainer '+i+' / '+name);
  for(let j=0;j<i;j++)assertSeparated(box,hotspots[j],margin,
   'trainer '+i+' / trainer '+j);
  return box;
 });
 if(!Array.isArray(screens)||!screens.length)throw Error('T38 no viewports');
 const responsive=screens.map(({width,height})=>{
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)
   throw Error('T38 invalid viewport');
  const scale=Math.min(width/LOGICAL.width,height/LOGICAL.height);
  const offsetX=(width-LOGICAL.width*scale)/2;
  const offsetY=(height-LOGICAL.height*scale)/2;
  const transform=r=>rect(offsetX+r.x*scale,offsetY+r.y*scale,
   r.w*scale,r.h*scale);
  const screen=rect(0,0,width,height);
  for(const [name,box] of [['room',room],['leader',leader],
   ['ace',ace],['CTA',cta],...hotspots.map((r,i)=>['trainer '+i,r])])
   assertInside(screen,transform(box),name+' on '+width+'x'+height);
  return Object.freeze({width,height,scale,offsetX,offsetY,
   minimumTouchWidth:53*scale});
 });
 return Object.freeze({version:GYM_IMAGE_PREFLIGHT_VERSION,
  verified:true,stage:layout.stage,margin,room,leader,ace,corridor,exit,cta,
  hotspots:Object.freeze(hotspots),responsive:Object.freeze(responsive)});
}
