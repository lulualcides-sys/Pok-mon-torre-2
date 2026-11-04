/* Zap Cannon: heavy Electro Ball evolution.
 * Based on the base client's own 40x40 Electro Ball spritesheet, not on
 * the old 32-particle line. Presentation only; damage/save rules stay native.
 * Source client: vfx-electroball (row 0: 6 frames flight, row 1: 6 impact).
 */
export const ZAP_ELECTRO_BALL_TEXTURE='vfx-electroball';
export const ZAP_ELECTRO_BALL_FRAMES=Object.freeze({flight:[0,1,2,3,4,5],impact:[6,7,8,9,10,11]});
export const ZAP_ELECTRO_BALL_REFERENCE=Object.freeze({
 atlas:'electroball',frameWidth:40,frameHeight:40,columns:6,
 flightAnimation:'vfx-electroball',impactAnimation:'vfx-electroball-fin',
 raichuScale:2.2,flightSpeed:240
});
const clamp=n=>Math.max(0,Math.min(1,n));
const snap=n=>Math.round(n||0);
function frameAt(t,frames){return frames[Math.min(frames.length-1,Math.floor(clamp(t)*frames.length))]}
export function zapCannonMotion(source,target,phase,tick=0){
 const p=clamp(phase),a={x:snap(source?.x),y:snap(source?.y)},
  b={x:snap(target?.x),y:snap(target?.y)};
 const dx=b.x-a.x,dy=b.y-a.y;
 const charge=clamp(p/.22),flight=clamp((p-.22)/.47);
 const firing=p>=.22&&p<.69,contact=p>=.69;
 // The main object is a single readable Electro Ball, NOT a long neon ray.
 const x=firing?snap(a.x+dx*flight):contact?b.x:a.x;
 const y=firing?snap(a.y+dy*flight):contact?b.y:a.y;
 const pulse=(tick%4===0?.06:tick%2===0?.025:0);
 const ball={
  x,y,frame:frameAt(p<.22?charge:flight,ZAP_ELECTRO_BALL_FRAMES.flight),
  scale:p<.22?.52+charge*.78:1.82+pulse,
  alpha:contact?0:1
 };
 const impactT=clamp((p-.69)/.27);
 const impact={x:b.x,y:b.y,
  frame:frameAt(impactT,ZAP_ELECTRO_BALL_FRAMES.impact),
  scale:1.58+Math.min(.33,impactT*.33),
  alpha:contact?Math.min(1,(1-p)/.18):0};
 const sparks=[];
 const angle=Math.atan2(dy,dx);
 // Sparse native p-electro accents. Six moving chips maximum, never a beam.
 if(p<.22&&p>.03){
  for(let i=0;i<4;i++){
   const ang=i*Math.PI/2+tick*.26,radius=20-9*charge+(i%2)*3;
   sparks.push({x:snap(a.x+Math.cos(ang)*radius),
    y:snap(a.y+Math.sin(ang)*radius),size:8+i%2*2,
    alpha:.38+.4*charge});
  }
 }else if(firing){
  const dist=Math.hypot(dx,dy);
  const ux=dist?dx/dist:1,uy=dist?dy/dist:0;
  for(let i=0;i<4;i++){
   const drift=12+i*11,flutter=Math.sin((tick+i)*1.7)*4;
   sparks.push({x:snap(x-ux*drift-uy*flutter),
    y:snap(y-uy*drift+ux*flutter),size:i%2?8:11,
    alpha:.72-i*.14});
  }
 }else if(contact&&p<.98){
  const rad=10+impactT*17;
  for(let i=0;i<6;i++){
   const ang=angle+i*Math.PI/3+tick*.18;
   sparks.push({x:snap(b.x+Math.cos(ang)*rad),
    y:snap(b.y+Math.sin(ang)*rad),size:i%2?9:12,
    alpha:Math.min(.86,(1-p)/.22)*(.95-i*.065)});
  }
 }
 return {phase:p,stage:p<.22?'charge':p<.69?'flight':'impact',
  ball,impact,sparks};
}
