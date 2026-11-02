'use strict';
/*
 * PB Ranked reference mathematics (offline-only).
 * Inputs are derived, already audited public METADATA snapshots.
 * Outputs are our own statistical summaries and pixel-art motion
 * prototypes, NOT original source graphics or gameplay reproduction.
 *
 * Important: durationSum is an unknown source unit. A frame-index
 * fraction is NOT measured time; no assumption of seconds or fps.
 */
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve('reference-library/pb-ranked');
const norm=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const round=(x,d=5)=>x===null||!Number.isFinite(x)?null:Number(x.toFixed(d));
const clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
const percentile=(items,p)=>{
 const arr=items.filter(Number.isFinite).sort((a,b)=>a-b);
 if(!arr.length)return null;
 const idx=clamp(p)*(arr.length-1),lo=Math.floor(idx),hi=Math.ceil(idx);
 return arr[lo]+(arr[hi]-arr[lo])*(idx-lo);
};
const summary=items=>{
 const x=items.filter(Number.isFinite);
 return {count:x.length,min:x.length?Math.min(...x):null,q1:round(percentile(x,.25)),
  median:round(percentile(x,.5)),q3:round(percentile(x,.75)),
  max:x.length?Math.max(...x):null,mean:round(x.length?x.reduce((s,n)=>s+n,0)/x.length:null)};
};
const frameMarker=(index,frames,duration)=>{
 if(!Number.isInteger(index)||index<0||index>=frames)return null;
 return {frameIndex:index,ordinalFraction01:frames>1?round(index/(frames-1)):0,
  uniformDurationEstimate:duration>0&&frames>0?round(duration*(index+.5)/frames):null};
};
const sourceAnimation=(spriteId,row)=>{
 const n=row.frames,valid=Number.isInteger(n)&&n>0;
 if(!valid)throw Error('Invalid frame count '+spriteId+':'+row.state);
 if(!Number.isFinite(row.durationSum)||row.durationSum<0)throw Error('Invalid duration units '+spriteId+':'+row.state);
 const markers={hit:frameMarker(row.hitFrame,n,row.durationSum),
  return:frameMarker(row.returnFrame,n,row.durationSum),
  rush:frameMarker(row.rushFrame,n,row.durationSum)};
 for(const [kind,value] of Object.entries({hit:row.hitFrame,return:row.returnFrame,rush:row.rushFrame})){
  if(value!==null&&value!==undefined&&!markers[kind])throw Error('Marker outside frame count '+spriteId+':'+row.state+':'+kind);
 }
 return {spriteId:String(spriteId),state:row.state,n,sourceDurationUnits:row.durationSum,
  averageUnitsPerFrame:round(row.durationSum/n),markers,
  markerOrdering:markers.rush&&markers.hit&&markers.return?
   (markers.rush.frameIndex<=markers.hit.frameIndex&&markers.hit.frameIndex<=markers.return.frameIndex?
    'rush_hit_return':'other'):'incomplete',
  aliasesAnotherState:Boolean(row.copyOf)};
};
// Normalized 2D vector geometry for new, original motion effects.
const point=(x,y)=>{if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('nonfinite point');return {x,y}};
const lerp=(a,b,t)=>a+(b-a)*clamp(t);
const quadraticBezier=(p0,p1,p2,t)=>{
 const u=clamp(t),v=1-u;
 return point(v*v*p0.x+2*v*u*p1.x+u*u*p2.x,v*v*p0.y+2*v*u*p1.y+u*u*p2.y);
};
const cubicBezier=(p0,p1,p2,p3,t)=>{
 const u=clamp(t),v=1-u;
 return point(v*v*v*p0.x+3*v*v*u*p1.x+3*v*u*u*p2.x+u*u*u*p3.x,
  v*v*v*p0.y+3*v*v*u*p1.y+3*v*u*u*p2.y+u*u*u*p3.y);
};
// Negative y is upward on screen. Peak offset is 'height' at t=.5.
const parabolicArc=(start,end,height,t)=>{
 const u=clamp(t);
 if(!Number.isFinite(height)||height<0)throw Error('invalid arc height');
 return point(lerp(start.x,end.x,u),lerp(start.y,end.y,u)-4*height*u*(1-u));
};
const smoothstep=t=>{const p=clamp(t);return p*p*(3-2*p)};
const dashMotion=(start,end,t)=>point(lerp(start.x,end.x,smoothstep(t)),lerp(start.y,end.y,smoothstep(t)));
// Continuous collision of two moving circular hitboxes on an entire time interval.
// Handles motion between frames, so no teleport/tunneling false-negative.
const sweptCircleCollision=(a0,a1,ra,b0,b1,rb)=>{
 if(![ra,rb].every(n=>Number.isFinite(n)&&n>=0))throw Error('negative/nonfinite radius');
 const rx=a0.x-b0.x,ry=a0.y-b0.y;
 const vx=(a1.x-a0.x)-(b1.x-b0.x),vy=(a1.y-a0.y)-(b1.y-b0.y);
 const vv=vx*vx+vy*vy,t=vv>0?clamp(-(rx*vx+ry*vy)/vv):0;
 const closest=Math.hypot(rx+vx*t,ry+vy*t);
 const limit=ra+rb;
 // First time-of-impact for entering a circle over the normalized segment.
 const c=rx*rx+ry*ry-limit*limit;
 let firstHitFraction01=null;
 if(c<=0)firstHitFraction01=0;
 else if(vv>0){
  const b=2*(rx*vx+ry*vy),disc=b*b-4*vv*c;
  if(disc>=0){
   const root=(-b-Math.sqrt(disc))/(2*vv);
   if(root>=0&&root<=1)firstHitFraction01=round(root);
  }
 }
 return {hit:closest<=limit+1e-9,closestFraction01:round(t),
  minCenterDistance:round(closest),firstHitFraction01};
};
const read=n=>JSON.parse(fs.readFileSync(path.join(ROOT,n),'utf8'));
const model=({animations,families,progress,delta})=>{
 const animationRows=animations.perSprite.flatMap(p=>p.states.map(s=>sourceAnimation(p.id,s)));
 const rowsByState=new Map();
 for(const r of animationRows){if(!rowsByState.has(r.state))rowsByState.set(r.state,[]);rowsByState.get(r.state).push(r);}
 const stateStatistics=Object.fromEntries([...rowsByState.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([state,rows])=>[state,{
  sampleSize:rows.length,frames:summary(rows.map(r=>r.n)),
  sourceDurationUnits:summary(rows.map(r=>r.sourceDurationUnits)),
  averageUnitsPerFrame:summary(rows.map(r=>r.averageUnitsPerFrame)),
  markers:Object.fromEntries(['hit','rush','return'].map(m=>[m,{
   count:rows.filter(r=>r.markers[m]).length,
   medianOrdinalFraction01:round(percentile(rows.map(r=>r.markers[m]?.ordinalFraction01),.5)),
   q1OrdinalFraction01:round(percentile(rows.map(r=>r.markers[m]?.ordinalFraction01),.25)),
   q3OrdinalFraction01:round(percentile(rows.map(r=>r.markers[m]?.ordinalFraction01),.75))
  }])),
  orderedRushHitReturn:rows.filter(r=>r.markerOrdering==='rush_hit_return').length,
  otherMarkerOrder:rows.filter(r=>r.markerOrdering==='other').length
 }]));
 const byMove=new Map(progress.rows.map(p=>[norm(p.name),p]));
 const added=new Set(delta.publicRosterAdded.map(norm));
 const moves=families.items.map(f=>{
  const p=byMove.get(norm(f.name));
  if(!p)throw Error('Missing progress entry '+f.name);
  const updatedAvailable=p.inPublicRoster||added.has(norm(f.name));
  const gaps=!p.browserAgentUseReported&&updatedAvailable;
  const defaultReady=p.availableAsDefault&&p.inPublicRoster;
  const protectedApproved=Boolean(p.protectedByTorre2BaselineOrApprovedPolicy);
  // Heuristic only. A higher value is an opportunity for investigating a cast,
  // not a measured quality/effect probability or copy recommendation.
  const priority=round(100*(.45*Number(gaps)+.25*Number(defaultReady)+
   .20*Number(!protectedApproved)+.10*Math.min(1,Math.max(0,(f.variants||0)/5))),2);
  return {name:f.name,type:f.type||p.type,familyHypothesis:f.family,
   variantDeclarations:f.variants,sourceStatus:added.has(norm(f.name))?
    'NEW_PUBLIC_ROSTER_ASSOCIATION_UNVERIFIED':'2026_10_31_BASELINE',
   publicRoster:updatedAvailable,reportedUse:!!p.browserAgentUseReported,
   exactVisualFramesArchived:!!p.rawFramesCaptured,
   protectedApproved,defaultReady:added.has(norm(f.name))?null:defaultReady,
   ownerSpeciesForNewMove:added.has(norm(f.name))?null:undefined,
   staticIdentifiersCount:Array.isArray(f.staticIdentifiers)?f.staticIdentifiers.length:0,
   investigationPriorityScore:priority,
   animationParametersProven:false};
 });
 const reported=moves.filter(m=>m.publicRoster&&m.reportedUse).length;
 const ready=moves.filter(m=>m.publicRoster&&!m.reportedUse).length;
 if(moves.length!==283||animationRows.length!==3815||reported!==70||ready!==176)
  throw Error('Unexpected snapshot coverage: '+[moves.length,animationRows.length,reported,ready]);
 return {
  schemaVersion:1,
  derivation:'Original mathematics from source-declared metadata; no sprites, videos, raw source, licensed assets or battle code',
  researchSnapshot:'2026-10-31 + independently observed roster delta 2026-11-01',
  evidence:{durationUnits:'source units, seconds NOT established',
   markerIndexAssumption:'zero-based frame ordinal; index/(n-1) = sequence position, NOT timing',
   averageUnitsPerFrame:'sourceDurationUnits/n; does NOT identify individual durations',
   uniformDurationEstimate:'(index+0.5)/n * sourceDurationUnits; hypothetical equal frame durations ONLY, not real measured timing',
   visualVfxCaptured:0,
   familyHypothesis:'static AST heuristic, not a visual classification',
   priority:'heuristic only, not output of training or accuracy benchmark'},
  coverage:{spriteIds:animations.perSprite.length,animationStateEntries:animationRows.length,
   staticMoves:moves.length,rosterMoves:moves.filter(m=>m.publicRoster).length,
   rosterMovesWithReportedUse:reported,rosterMovesPendingBattleUse:ready,
   protectedMoveNames:moves.filter(m=>m.protectedApproved).length},
  formulas:{
   projectileArc:'x(u)=x0+(x1-x0)*u; y(u)=y0+(y1-y0)*u-4*h*u*(1-u), 0<=u<=1',
   quadraticPath:'B(u)=(1-u)^2 P0 + 2(1-u)u P1 + u^2 P2',
   cubicPath:'B(u)=(1-u)^3 P0 + 3(1-u)^2*u P1 + 3(1-u)*u^2 P2 + u^3 P3',
   dashEasing:'s(u)=3u^2-2u^3; P(u)=P0+(P1-P0)*s(u)',
   continuousHit:'r(u)=(A0-B0)+u*((A1-A0)-(B1-B0)); minDistance=min_u ||r(u)||; hit when minDistance<=rA+rB',
   markerOrdinal:'q=k/(n-1) for n>1; NOT exact elapsed time',
   averageFrameUnits:'sum(frameDurations)/n; individual frame durations unavailable'
  },
  stateStatistics,
  animationMathRows:animationRows,
  moveResearchMath:moves
 };
};
const write=()=>{
 const atlas=model({animations:read('animacoes-marcadores-estados.json'),
  families:read('FAMILIAS-ESTRUTURAIS-283-GOLPES.json'),
  progress:read('PROGRESSO-GOLPES-283-2026-10-31.json'),
  delta:read('DELTA-REAL-2026-11-01.json')});
 const output=path.join(ROOT,'ATLAS-MATEMATICO-REA-2026-11-01.json');
 fs.writeFileSync(output,JSON.stringify(atlas,null,2)+'\n');
 console.log(JSON.stringify({output,coverage:atlas.coverage,
  attack:atlas.stateStatistics.Attack,shoot:atlas.stateStatistics.Shoot},null,2));
 return atlas;
};
if(require.main===module)write();
module.exports={norm,round,clamp,percentile,summary,frameMarker,sourceAnimation,
 point,lerp,quadraticBezier,cubicBezier,parabolicArc,smoothstep,dashMotion,
 sweptCircleCollision,model,write};
