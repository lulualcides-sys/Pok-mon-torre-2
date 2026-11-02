/* Shape-first pixel-art reference engine for Kanto.
 * Converts manually reviewed normalized vector guides into exact integer pixel
 * grids. This does NOT automatically trace photographs or copy third-party IP.
 * No game/runtime imports, accounts, external services, or dependencies.
 */
export const VECTOR_REFERENCE_VERSION = 'kanto-reference-v1';
const HEX = /^#[0-9a-fA-F]{6}$/;
const isNumber = x => typeof x === 'number' && Number.isFinite(x);
const unit = x => isNumber(x) && x >= 0 && x <= 1;
function invariant(condition, message){ if(!condition) throw new Error('Kanto vector reference: '+message); }
function pointInPolygon(x,y,pts){
 let inside=false;
 for(let i=0,j=pts.length-1;i<pts.length;j=i++){
  const a=pts[i],b=pts[j];
  if((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
 } return inside;
}
function covers(shape,x,y){
 if(shape.type==='rect')return x>=shape.x&&x<shape.x+shape.w&&y>=shape.y&&y<shape.y+shape.h;
 if(shape.type==='ellipse'){
  const dx=(x-shape.cx)/shape.rx,dy=(y-shape.cy)/shape.ry;
  return dx*dx+dy*dy<=1;
 }
 return pointInPolygon(x,y,shape.points);
}
export function validateVectorGuide(guide){
 invariant(guide&&typeof guide==='object'&&!Array.isArray(guide),'guide must be an object');
 invariant(guide.schema===VECTOR_REFERENCE_VERSION,'schema must be '+VECTOR_REFERENCE_VERSION);
 invariant(typeof guide.name==='string'&&/^[a-z0-9][a-z0-9_-]{1,55}$/.test(guide.name),'safe slug name required');
 const n=guide.size;
 invariant(Number.isInteger(n)&&n>=16&&n<=128&&n%8===0,'size must be multiple of 8, 16..128');
 invariant(guide.kind==='terrain'||guide.kind==='prop','kind must be terrain or prop');
 const pal=guide.palette;
 invariant(pal&&typeof pal==='object'&&!Array.isArray(pal),'palette required');
 const colors=Object.entries(pal);
 invariant(colors.length>=2&&colors.length<=16,'2..16 colors');
 for(const [role,color]of colors){
  invariant(/^[a-z][a-z0-9_]{0,24}$/.test(role),'unsafe palette role');
  invariant(typeof color==='string'&&HEX.test(color),'palette values must be hex RGB');
 }
 invariant(typeof guide.background==='string'&&
  (guide.background==='transparent'||Object.hasOwn(pal,guide.background)),'invalid background');
 invariant(Array.isArray(guide.shapes)&&guide.shapes.length>=2&&guide.shapes.length<=120,'2..120 shapes');
 for(const [index,s]of guide.shapes.entries()){
  invariant(s&&typeof s==='object'&&Object.hasOwn(pal,s.color),'shape '+index+' color must use palette');
  invariant(['rect','ellipse','polygon'].includes(s.type),'unsupported shape type');
  if(s.type==='rect'){
   invariant([s.x,s.y,s.w,s.h].every(unit)&&s.w>0&&s.h>0 &&
    s.x+s.w<=1.000001&&s.y+s.h<=1.000001,'rect outside guide');
  } else if(s.type==='ellipse'){
   invariant([s.cx,s.cy,s.rx,s.ry].every(unit)&&s.rx>0&&s.ry>0 &&
    s.cx-s.rx>=0&&s.cy-s.ry>=0&&s.cx+s.rx<=1&&s.cy+s.ry<=1,'ellipse outside guide');
  } else {
   invariant(Array.isArray(s.points)&&s.points.length>=3&&s.points.length<=48 &&
    s.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(unit)),'invalid polygon');
  }
 }
 if(guide.tileable!==undefined)invariant(typeof guide.tileable==='boolean','tileable must be boolean');
 return true;
}
function blankGrid(n,color){return Array.from({length:n},()=>Array(n).fill(color));}
function rgbLum(hex){
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 return Math.round((rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722)*1000)/1000;
}
export function analyzePixelGrid(grid,{background=null}={}){
 invariant(Array.isArray(grid)&&grid.length>0&&grid.every(row=>Array.isArray(row)&&row.length===grid[0].length),'rectangular pixel grid required');
 const h=grid.length,w=grid[0].length;let count=0,sumX=0,sumY=0,minX=w,minY=h,maxX=-1,maxY=-1,edges=0;
 const colors=new Map();
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const color=grid[y][x]; if(color===null)continue;
  colors.set(color,(colors.get(color)||0)+1);
  if(background!==null&&color===background)continue;
  count++;sumX+=x+.5;sumY+=y+.5;
  minX=Math.min(x,minX);minY=Math.min(y,minY);maxX=Math.max(x,maxX);maxY=Math.max(y,maxY);
 }
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  if(x+1<w&&grid[y][x]!==grid[y][x+1])edges++;
  if(y+1<h&&grid[y][x]!==grid[y+1][x])edges++;
 }
 let vertical=0,horizontal=0;
 for(let y=0;y<h;y++)if(grid[y][0]!==grid[y][w-1])horizontal++;
 for(let x=0;x<w;x++)if(grid[0][x]!==grid[h-1][x])vertical++;
 return {
  width:w,height:h,paletteCount:colors.size,pixelColors:Object.fromEntries([...colors.entries()].sort()),
  foregroundCoverage:Math.round(count*10000/(w*h))/10000,
  foregroundCentroid:count?[Math.round(sumX/count/w*1000)/1000,Math.round(sumY/count/h*1000)/1000]:null,
  foregroundBounds:count?[minX,minY,maxX+1,maxY+1]:null,
  edgeTransitions:edges,seamMismatches:{horizontal,vertical,total:horizontal+vertical},
  luminanceRange:colors.size?Math.round((Math.max(...[...colors.keys()].map(rgbLum))-Math.min(...[...colors.keys()].map(rgbLum)))*1000)/1000:0
 };
}
function svgFromGrid(grid){
 const n=grid.length;
 const runs=[];
 for(let y=0;y<n;y++){
  for(let x=0;x<n;){
   const color=grid[y][x];let last=x+1;
   while(last<n&&grid[y][last]===color)last++;
   if(color!==null)runs.push('<rect x="'+x+'" y="'+y+'" width="'+(last-x)+'" height="1" fill="'+color+'"/>');
   x=last;
  }
 }
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+n+'" height="'+n+'" viewBox="0 0 '+n+' '+n+'" shape-rendering="crispEdges">'+runs.join('')+'</svg>\n';
}
export function renderVectorGuide(guide){
 validateVectorGuide(guide);
 const n=guide.size,pal=guide.palette;
 const background=guide.background==='transparent'?null:pal[guide.background].toLowerCase();
 const grid=blankGrid(n,background);
 for(const s of guide.shapes){
  const color=pal[s.color].toLowerCase();
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(covers(s,(x+.5)/n,(y+.5)/n))grid[y][x]=color;
 }
 const metrics=analyzePixelGrid(grid,{background});
 const warnings=[];
 if(guide.tileable&&metrics.seamMismatches.total)warnings.push('tile seam mismatches: '+metrics.seamMismatches.total);
 if(metrics.paletteCount>12)warnings.push('large palette for small pixel sprite');
 if(!metrics.foregroundBounds)warnings.push('no visible foreground after composition');
 return {svg:svgFromGrid(grid),grid,metrics,warnings};
}
// Convert the existing 32px SVG rectangle library into color grids without
// browser DOM, remote calls or executing SVG scripts.
export function inspectRectOnlySvg(svg){
 invariant(typeof svg==='string'&&svg.length<350000,'SVG must be small text');
 invariant(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"\b/.test(svg),'SVG opening tag not allowed');
 invariant(!/<(?:script|image|use|foreignObject|style|path|circle|ellipse|polygon|polyline)|\bon[a-z]+\s*=|href\s*=/i.test(svg),'unsafe SVG elements or attributes');
 const view=svg.match(/viewBox="0 0 (\d+) (\d+)"/);
 invariant(view&&view[1]===view[2],'square viewBox required');
 const n=Number(view[1]);invariant(n>=16&&n<=128,'invalid SVG dimension');
 const grid=blankGrid(n,null),rects=[...svg.matchAll(/<rect\s+([^>]*?)\s*\/>/g)];
 invariant(rects.length>0&&rects.length<=2000,'rectangle-only SVG expected');
 for(const m of rects){
  const attrs=Object.fromEntries([...m[1].matchAll(/([a-z]+)="([^"]+)"/g)].map(a=>[a[1],a[2]]));
  invariant(['x','y','width','height','fill'].every(k=>Object.hasOwn(attrs,k)),'rect missing fields');
  const [x,y,w,h]=['x','y','width','height'].map(k=>Number(attrs[k]));
  invariant([x,y,w,h].every(Number.isInteger)&&x>=0&&y>=0&&w>0&&h>0,'rect pixel geometry invalid');
  invariant(HEX.test(attrs.fill),'invalid fill RGB');
  const c=attrs.fill.toLowerCase();
  for(let iy=Math.max(0,y);iy<Math.min(n,y+h);iy++)
   for(let ix=Math.max(0,x);ix<Math.min(n,x+w);ix++)grid[iy][ix]=c;
 }
 return {grid,metrics:analyzePixelGrid(grid,{background:grid[0][0]})};
}
export function compareReferenceGeometry(reference,candidate){
 invariant(reference&&candidate,'reference and candidate required');
 const r=reference.metrics||reference,c=candidate.metrics||candidate;
 invariant(r.width===c.width&&r.height===c.height,'reference and candidate sizes differ');
 const rr=r.foregroundCentroid,cc=c.foregroundCentroid;
 const centroidDrift=rr&&cc?Math.round(Math.hypot(rr[0]-cc[0],rr[1]-cc[1])*1000)/1000:null;
 const coverageDrift=Math.round(Math.abs(r.foregroundCoverage-c.foregroundCoverage)*1000)/1000;
 const ratio=r.edgeTransitions?c.edgeTransitions/r.edgeTransitions:1;
 const report={centroidDrift,coverageDrift,edgeComplexityRatio:Math.round(ratio*1000)/1000,
  candidateSeamErrors:c.seamMismatches.total,
  pass:centroidDrift!==null&&centroidDrift<=.16&&coverageDrift<=.24&&ratio>=.4&&ratio<=2.5};
 return report;
}
