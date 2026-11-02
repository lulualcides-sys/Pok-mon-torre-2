/* Torre 2 — independent, original 2D kinematics for an opt-in lab preview.
 * Fractions below describe frame ORDINALS from public REA metadata, never
 * real measured hit timing, frame durations or copying another game's assets.
 * Do not import into approved moves automatically.
 */
export const REA_FRAME_REFERENCES=Object.freeze({
 Attack:Object.freeze({sample:236,medianFrames:12,hitOrdinal:.33333}),
 Shoot:Object.freeze({sample:229,medianFrames:12,hitOrdinal:.18182}),
 Swing:Object.freeze({sample:232,medianFrames:9,hitOrdinal:.625}),
 Charge:Object.freeze({sample:235,medianFrames:10,hitOrdinal:.55556})
});
const finitePoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
export const u01=t=>Number.isFinite(t)?Math.max(0,Math.min(1,t)):0;
export function vectorSmoothstep(t){const u=u01(t);return u*u*(3-2*u);}
export function vectorLerp(a,b,t){
 if(!finitePoint(a)||!finitePoint(b))throw new TypeError('Invalid 2D point');
 const u=u01(t);return {x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u};
}
export function vectorBezier(p0,p1,p2,p3,t){
 if(![p0,p1,p2,p3].every(finitePoint))throw new TypeError('Invalid Bezier points');
 const u=u01(t),v=1-u;
 return {x:v*v*v*p0.x+3*v*v*u*p1.x+3*v*u*u*p2.x+u*u*u*p3.x,
  y:v*v*v*p0.y+3*v*v*u*p1.y+3*v*u*u*p2.y+u*u*u*p3.y};
}
/** Continuous two-moving-disc hit test. Returns first time of overlap in [0,1].
 * The relative center path is linear WITHIN the sampled step. Curves require
 * bounded subdivision; never claim exact swept hits along an unsampled arc.
 */
export function sweptVectorHit(a0,a1,aRadius,b0,b1,bRadius){
 if(![a0,a1,b0,b1].every(finitePoint)||![aRadius,bRadius].every(v=>Number.isFinite(v)&&v>=0))
  throw new TypeError('Invalid hitboxes');
 const rx=a0.x-b0.x,ry=a0.y-b0.y;
 const vx=(a1.x-a0.x)-(b1.x-b0.x),vy=(a1.y-a0.y)-(b1.y-b0.y);
 const rr=aRadius+bRadius,c=rx*rx+ry*ry-rr*rr;
 if(c<=0)return {hit:true,firstFraction:0,closestFraction:0};
 const a=vx*vx+vy*vy;
 if(a===0)return {hit:false,firstFraction:null,closestFraction:0};
 const nearest=u01(-(rx*vx+ry*vy)/a);
 const closeX=rx+vx*nearest,closeY=ry+vy*nearest;
 const hit=closeX*closeX+closeY*closeY<=rr*rr+1e-9;
 if(!hit)return {hit:false,firstFraction:null,closestFraction:nearest};
 const b=2*(rx*vx+ry*vy),disc=Math.max(0,b*b-4*a*c);
 const enter=(-b-Math.sqrt(disc))/(2*a);
 return {hit:true,firstFraction:u01(enter),closestFraction:nearest};
}
export const frameOrdinal=(hitIndex,totalFrames)=>Number.isInteger(hitIndex)&&Number.isInteger(totalFrames)&&
 totalFrames>0&&hitIndex>=0&&hitIndex<totalFrames?
 totalFrames===1?0:hitIndex/(totalFrames-1):null;
export function movePrototypePoint(mode,t){
 const u=u01(t),start={x:110,y:202},end={x:500,y:202};
 if(mode==='dash')return vectorLerp(start,end,vectorSmoothstep(u));
 if(mode==='arc'){
  // Original, schematic throw curve; production uses approved ballArc and sprites.
  return {x:110+390*u,y:202-48*4*u*(1-u)};
 }
 if(mode==='beam')return vectorBezier(start,{x:190,y:178},{x:402,y:226},end,u);
 throw new RangeError('Unknown preview mode');
}
