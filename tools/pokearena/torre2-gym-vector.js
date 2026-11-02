/* T36 — deterministic vector plan for native Phaser Kanto gym interiors.
 * Every rendered platform, bridge, actor and ornamental cluster is derived
 * from a bounded geometry plan BEFORE display objects are created.
 * Coordinates are 640x360 logical pixels; no camera zoom or game-state IO.
 */
export const GYM_VECTOR_VERSION='t36-geometry-checked-v1';
export const GYM_GRID=2;
const ROOM=Object.freeze({x:66,y:68,w:508,h:200});
const SPINE=Object.freeze({x:304,y:122,w:32,h:146});
const FINAL=Object.freeze({x:244,y:87,w:152,h:55});
const ENTRY=Object.freeze({x:294,y:252,w:52,h:16});
const NORMALIZED=Object.freeze({
 rock:Object.freeze([[.185,.475],[.795,.580],[.240,.785]]),
 water:Object.freeze([[.185,.475],[.795,.515],[.276,.780],[.854,.780]])
});
export const snap=(n,grid=GYM_GRID)=>Math.round(n/grid)*grid;
export const rect=(x,y,w,h)=>Object.freeze({x,y,w,h});
export function intersects(a,b,pad=0){
 return a.x<b.x+b.w+pad&&a.x+a.w>b.x-pad&&
  a.y<b.y+b.h+pad&&a.y+a.h>b.y-pad;
}
export function contains(r,p){
 return p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
}
function hash(x,y,stage){
 // Stable integer mix, never random; reproducible decorations in screenshots.
 let n=(Math.imul(x+11,374761393)^Math.imul(y+7,668265263)^
  Math.imul(stage+5,1442695041))|0;
 n=Math.imul(n^(n>>>13),1274126177);
 return (n^(n>>>16))>>>0;
}
function reachableWalk(walk){
 const visited=new Set([0]),queue=[0];
 while(queue.length){
  const a=queue.shift();
  for(let i=0;i<walk.length;i++)
   if(!visited.has(i)&&intersects(walk[a],walk[i])){
    visited.add(i);queue.push(i);
   }
 }
 return visited.size===walk.length;
}
function stagePlan(stage){
 const water=stage===1,theme=water?'water':'rock';
 const slots=NORMALIZED[theme].map(([u,v])=>Object.freeze({
  x:snap(ROOM.x+ROOM.w*u),y:snap(ROOM.y+ROOM.h*v)
 }));
 const platforms=slots.map(p=>rect(snap(p.x-41),snap(p.y-22),82,44));
 const bridges=platforms.map((p,i)=>{
  const left=slots[i].x<320,near=left?p.x+p.w: p.x;
  const x=left?near-4:SPINE.x+SPINE.w-4;
  const end=left?SPINE.x+4:near+4;
  return rect(x,snap(slots[i].y-8),end-x,16);
 });
 // The final stage, center spine, branch corridors and entrance are a
 // complete geometric graph; never add a disconnected platform.
 const walk=Object.freeze([ENTRY,SPINE,FINAL,...bridges,...platforms]);
 const leader=Object.freeze({x:290,y:126});
 const ace=Object.freeze({x:342,y:126});
 const touch=slots.map(p=>rect(p.x-26,p.y-37,52,40));
 const heroReserved=[rect(leader.x-15,leader.y-41,30,43),
  rect(ace.x-25,ace.y-49,50,51)];
 const reserved=[...walk,...touch,...heroReserved];
 const ornaments=[];
 // Position quantization + deterministic hash determine pixel-art details.
 // No decoration is accepted without clearance to ANY bridge, platform,
 // actor, interactive touch target or the final leader+ace platform.
 for(let y=101;y<=246;y+=18)for(let x=87;x<=551;x+=22){
  const h=hash(x,y,stage);
  if(h%4===0){
   const w=water?10+(h%3)*2:12+(h%3)*2;
   const height=water?7+(h%2)*2:10+(h%3)*2;
   const candidate=rect(snap(x+(h%7)-3),snap(y+((h>>>3)%7)-3),w,height);
   if(candidate.x<ROOM.x+14||candidate.y<ROOM.y+18||
    candidate.x+candidate.w>ROOM.x+ROOM.w-14||
    candidate.y+candidate.h>ROOM.y+ROOM.h-13)continue;
   if(reserved.some(r=>intersects(candidate,r,7)))continue;
   if(ornaments.some(r=>intersects(candidate,r,7)))continue;
   ornaments.push(candidate);
  }
 }
 const pathLengths=slots.map(p=>Math.abs(ENTRY.y+ENTRY.h/2-p.y)+
  Math.abs(320-p.x));
 const centerGap=Math.abs(ace.x-leader.x)-(50+30)/2;
 const checks={
  walkConnected:reachableWalk(walk),
  everyTrainerOnPlatform:slots.every((p,i)=>contains(platforms[i],p)),
  touchZonesSeparated:touch.every((r,i)=>touch.every((other,j)=>
   i===j||!intersects(r,other,4))),
  clearCentralAisle:touch.every(r=>!intersects(r,SPINE)),
  allElementsWithinRoom:[...walk,...ornaments].every(r=>r.x>=ROOM.x&&
   r.y>=ROOM.y&&r.x+r.w<=ROOM.x+ROOM.w&&
   r.y+r.h<=ROOM.y+ROOM.h),
  noOrnamentCollision:ornaments.every((r,i)=>
   reserved.every(k=>!intersects(r,k,7))&&
   ornaments.every((o,j)=>i===j||!intersects(r,o,7))),
  noUiIntrusion:[...walk,...ornaments,...touch].every(r=>r.y+r.h<=270),
  leaderAceClear:centerGap>=12,
  adequateDetail:ornaments.length>=8,
  reachableStages:pathLengths.every(d=>d<=440)
 };
 const audit=Object.freeze({
  ...checks,
  ornamentCount:ornaments.length,
  routeDistance: Object.freeze(pathLengths),
  minAceGap:centerGap,
  grid:GYM_GRID,
  valid:Object.values(checks).every(Boolean)
 });
 return Object.freeze({
  stage,theme,cameraZoom:1,
  room:Object.freeze({x:ROOM.x,y:ROOM.y,width:ROOM.w,height:ROOM.h}),
  leader,ace,entrance:Object.freeze({x:320,y:266}),
  slots:Object.freeze(slots),interactiveFloorBottom:268,
  geometry:Object.freeze({spine:SPINE,final:FINAL,entry:ENTRY,
   platforms:Object.freeze(platforms),bridges:Object.freeze(bridges),
   ornaments:Object.freeze(ornaments),walk,touch:Object.freeze(touch)}),
  audit
 });
}
const PLAN_CACHE=new Map();
export function calculateGymVector(stage){
 if(stage!==0&&stage!==1)return null;
 if(PLAN_CACHE.has(stage))return PLAN_CACHE.get(stage);
 const plan=stagePlan(stage);
 // Fail closed BEFORE a single image/graphics/touch zone is placed.
 if(!plan.audit.valid)throw new Error('Unsafe gym vector geometry: '+
  Object.keys(plan.audit).filter(k=>plan.audit[k]===false).join(','));
 PLAN_CACHE.set(stage,plan);
 return plan;
}
