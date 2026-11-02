/* Geometric shape-first art direction for Kanto. Script-free SVG output;
 * deterministic colors and coordinates; no use of third-party assets.
 * Decorative props and standalone scene modules (not auto-tiling terrain).
 * Visual review and Phaser/mobile integration still required.
 */
export const ART_SPRITES = Object.freeze({
  "viridian-oak": {
    "w": 96,
    "h": 112,
    "theme": "forest",
    "kind": "prop"
  },
  "pewter-ridge": {
    "w": 128,
    "h": 96,
    "theme": "rock",
    "kind": "prop"
  },
  "cerulean-canal-bridge": {
    "w": 128,
    "h": 96,
    "theme": "water",
    "kind": "scene-module"
  },
  "vermilion-pier": {
    "w": 128,
    "h": 96,
    "theme": "coast",
    "kind": "scene-module"
  },
  "celadon-botanic-bed": {
    "w": 112,
    "h": 88,
    "theme": "garden",
    "kind": "prop"
  },
  "fuchsia-wetland": {
    "w": 112,
    "h": 96,
    "theme": "marsh",
    "kind": "scene-module"
  }
});
export const PALETTES = Object.freeze({
  "forest": [
    "#163d3a",
    "#205c44",
    "#2d7b4a",
    "#3a9850",
    "#62b15c",
    "#9ac86b",
    "#c7d97b"
  ],
  "wood": [
    "#352a2e",
    "#523e31",
    "#7a5239",
    "#a67449",
    "#d6a766",
    "#f0cf8d"
  ],
  "stone": [
    "#253c4b",
    "#455969",
    "#637780",
    "#8d9b98",
    "#b9bdab",
    "#ded8c0",
    "#f0e8cd"
  ],
  "water": [
    "#144e82",
    "#146a99",
    "#1886ac",
    "#26abd0",
    "#5dd1e1",
    "#c1f4ef"
  ],
  "flower": [
    "#803f74",
    "#c56991",
    "#e59eba",
    "#f0cc7d",
    "#f9edd1"
  ],
  "marsh": [
    "#223f3a",
    "#345b44",
    "#46865a",
    "#77a96a",
    "#a6bf69"
  ],
  "sand": [
    "#745f52",
    "#9e826b",
    "#c1a385",
    "#dfc7a2"
  ]
});
function rng(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296)}

function canvas(w,h){
 let shapes=[],depth=0;
 const snap=n=>Math.round(n);
 const rect=(x,y,ww,hh,c,opacity)=>{
  x=snap(x);y=snap(y);ww=snap(ww);hh=snap(hh);
  if(ww<=0||hh<=0||x>=w||y>=h||x+ww<=0||y+hh<=0)return;
  const xx=Math.max(0,x),yy=Math.max(0,y);
  const W=Math.min(w,x+ww)-xx,H=Math.min(h,y+hh)-yy;
  if(W<=0||H<=0)return;
  shapes.push('<rect x="'+xx+'" y="'+yy+'" width="'+W+'" height="'+H+'" fill="'+c+'"'+(opacity===undefined?'':' opacity="'+opacity+'"')+'/>');depth++;
 };
 const poly=(points,c)=>{if(points.some(p=>!Number.isFinite(p[0])||!Number.isFinite(p[1])))throw Error("polygon");shapes.push('<polygon points="'+points.map(a=>snap(a[0])+','+snap(a[1])).join(' ')+'" fill="'+c+'"/>');depth++};
 const blob=(cx,cy,rx,ry,c,step=3)=>{
  for(let y=-ry;y<=ry;y+=step){
   const q=1-y*y/(ry*ry);if(q<=0)continue;
   const half=Math.floor(Math.sqrt(q)*rx/step)*step;
   if(half)rect(cx-half,cy+y,half*2,step,c);
  }
 };
 const scatter=(seed,count,range,palette,opt={})=>{
  const r=rng(seed);
  for(let i=0;i<count;i++){
    const x=Math.floor(range[0]+r()*range[2]),y=Math.floor(range[1]+r()*range[3]);
    if(opt.inside && !opt.inside(x,y))continue;
    rect(x,y,1+Math.floor(r()*(opt.maxW||3)),1+Math.floor(r()*(opt.maxH||2)),palette[Math.floor(r()*palette.length)]);
  }
 };
 return {rect,poly,blob,scatter,finish:()=>'<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" shape-rendering="crispEdges">'+shapes.join('')+'</svg>\n',shapeCount:()=>depth};
}

function drawForest(p){
 const c=canvas(96,112),r=c.rect,b=c.blob,poly=c.poly;
 b(47,104,30,6,"#142f32",3);
 poly([[40,65],[49,55],[59,65],[59,90],[72,100],[68,107],[58,99],[57,109],[41,109],[40,99],[25,106],[22,100],[37,90]],PALETTES.wood[1]);
 poly([[44,68],[50,60],[54,69],[54,99],[50,108],[46,107],[45,83]],PALETTES.wood[3]);
 poly([[37,84],[26,72],[22,62],[29,65],[45,79]],PALETTES.wood[2]);
 poly([[59,85],[70,67],[76,65],[72,75],[59,93]],PALETTES.wood[2]);
 for(const v of [[47,68,3,17],[51,87,2,14],[41,91,3,11],[55,72,2,9]])r(...v,PALETTES.wood[4]);
 for(const v of [[38,16,30,20,0],[62,20,30,23,0],[27,42,24,23,0],[72,40,24,23,0],[50,44,34,24,0],
 [32,25,26,22,1],[63,28,26,22,1],[49,17,24,18,2],[21,40,18,15,1],[75,41,19,15,1],[52,37,30,24,2],
 [32,21,21,15,3],[57,19,27,17,3],[42,37,24,20,3],[70,32,18,15,2],
 [33,16,17,12,4],[56,16,19,12,4],[41,29,19,14,4],[66,25,17,13,4],[53,10,16,12,4]]){
  b(v[0],v[1]+15,v[2],v[3],PALETTES.forest[v[4]],3);
 }
 c.scatter(778,160,[12,13,75,59],[PALETTES.forest[3],PALETTES.forest[4],PALETTES.forest[5],PALETTES.forest[1]],{maxW:4,maxH:3,
 inside:(x,y)=>(((x-49)/44)**2+((y-42)/34)**2)<1});
 c.scatter(813,20,[19,21,65,31],[PALETTES.forest[6]],{maxW:2,maxH:2,inside:(x,y)=>y<45&&(((x-47)/40)**2+((y-43)/30)**2)<.65});
 for(let i=0;i<11;i++){const x=25+i*4;r(x,105+(i%2),2,1,PALETTES.wood[4]);}
 return c;
}

function drawRidge(){
 const c=canvas(128,96),r=c.rect,poly=c.poly,scatter=c.scatter,stone=PALETTES.stone;
 poly([[0,48],[8,35],[18,39],[30,20],[41,26],[53,10],[70,18],[87,13],[101,27],[110,23],[123,38],[128,43],[128,89],[0,89]],stone[0]);
 poly([[0,42],[10,32],[20,39],[31,20],[42,29],[55,11],[70,23],[88,15],[102,31],[112,27],[128,42],[128,78],[115,86],[102,80],[89,89],[68,85],[45,91],[29,83],[12,86],[0,77]],stone[2]);
 poly([[11,35],[21,40],[31,24],[41,32],[52,13],[64,22],[56,38],[45,47],[38,65],[23,68],[7,57]],stone[3]);
 poly([[66,23],[88,16],[99,29],[109,29],[127,43],[119,58],[98,67],[86,62],[76,42]],stone[3]);
 poly([[55,15],[65,22],[60,29],[53,25],[46,37],[32,29],[40,26]],stone[5]);
 poly([[88,17],[99,29],[110,31],[103,38],[95,29],[76,32]],stone[5]);
 poly([[3,48],[11,43],[20,56],[16,78],[4,72]],stone[1]);
 poly([[39,42],[54,28],[64,35],[63,73],[51,81],[35,78]],stone[1]);
 poly([[79,45],[98,37],[107,47],[105,75],[84,82],[74,65]],stone[1]);
 for(const v of [[21,61,5,23],[26,62,3,15],[60,50,5,30],[63,55,3,17],[108,57,4,20],[111,62,2,12]])r(...v,stone[0]);
 for(const v of [[6,43,12,3],[28,24,10,3],[47,18,12,3],[83,21,11,3],[102,32,11,3],[118,44,9,3]])r(...v,stone[5]);
 // Foreground rock strata and stair niches.
 r(4,78,120,7,stone[0]);r(6,78,116,3,stone[3]);r(10,84,111,5,stone[1]);r(13,86,108,2,stone[4]);
 for(let x=14;x<114;x+=22){r(x,84,13,2,stone[4]);r(x+4,89,9,2,stone[0]);}
 r(54,61,19,22,stone[0]);r(57,62,13,18,stone[1]);
 for(let y=65;y<84;y+=5){r(57,y,13,3,stone[4]);r(59,y+3,10,1,stone[5]);}
 scatter(332,34,[3,32,120,52],[stone[4],stone[5],stone[0]],{maxW:3,maxH:2,inside:(x,y)=>y>36&&y<79});
 for(const [x,y] of [[4,79],[15,81],[88,80],[104,83]]){r(x,y-2,9,3,PALETTES.forest[1]);r(x+3,y-4,4,3,PALETTES.forest[4]);}
 return c;
}

function sea(c,w,h,seed=441){
 const r=c.rect,sc=c.scatter,sea=PALETTES.water;
 r(0,0,w,h,sea[0]);
 for(let yy=0;yy<h;yy+=6){r(0,yy,w,2,yy%12?sea[1]:sea[2]);r(0,yy+3,w,1,sea[1]);}
 sc(seed,165,[0,0,w,h],[sea[3],sea[4],sea[1]],{maxW:7,maxH:2});
 for(let i=0;i<9;i++){const x=((i*43)+7)%w,y=(((i*29)+11)%h);r(x,y,8,1,sea[5]);r(x+3,y+1,5,1,sea[3]);}
}

function stonePaving(c,x,y,w,h){
 const r=c.rect,stone=PALETTES.stone;
 r(x,y,w,h,stone[4]);r(x,y,w,2,stone[6]);r(x,y+h-3,w,3,stone[1]);
 for(let yy=y+4;yy<y+h-3;yy+=6){
  r(x,yy,w,1,stone[3]);
  for(let xx=x+(Math.floor(yy/6)%2?5:0);xx<x+w-1;xx+=15)r(xx,yy,1,5,stone[3]);
 }
}

function drawCanal(){
 const c=canvas(128,96),r=c.rect,poly=c.poly;
 sea(c,128,96,991);
 // two banks and their walls
 for(const side of [0,104]){
  stonePaving(c,side,0,24,96);
  r(side===0?20:104,0,4,96,PALETTES.stone[1]);
  r(side===0?21:105,0,2,96,PALETTES.stone[6]);
 }
 // Perspective bridge arches / deck / handrail
 r(25,44,79,19,PALETTES.stone[0]);
 poly([[26,49],[40,48],[46,56],[48,68],[25,68]],PALETTES.stone[2]);
 poly([[104,49],[91,48],[86,56],[84,68],[104,68]],PALETTES.stone[2]);
 poly([[41,63],[49,56],[80,56],[87,63],[83,69],[45,69]],PALETTES.water[0]);
 r(21,33,86,19,PALETTES.stone[4]);
 stonePaving(c,20,33,88,19);
 r(20,30,88,4,PALETTES.stone[5]);
 r(20,30,88,2,PALETTES.stone[6]);
 r(19,49,91,4,PALETTES.stone[2]);
 r(19,49,91,2,PALETTES.stone[5]);
 for(let x=22;x<108;x+=12){r(x,22,4,10,PALETTES.stone[2]);r(x-1,21,6,3,PALETTES.stone[6]);r(x,49,4,7,PALETTES.stone[2]);r(x-1,48,6,3,PALETTES.stone[6]);}
 r(21,25,86,2,PALETTES.stone[6]);r(22,55,84,1,PALETTES.stone[5]);
 for(let i=0;i<9;i++){const x=31+i*8;r(x,42+(i%2),5,1,PALETTES.stone[6]);r(x+2,44,2,1,PALETTES.stone[3]);}
 for(let y=6;y<96;y+=14){r(29+(y%12),y,9,2,PALETTES.water[5]);r(76+(y%12),y+4,6,1,PALETTES.water[4]);}
 return c;
}

function drawPier(){
 const c=canvas(128,96),r=c.rect,poly=c.poly;
 sea(c,128,96,415);
 // seawall left
 r(0,0,24,96,PALETTES.stone[2]);stonePaving(c,0,0,22,96);
 r(22,0,3,96,PALETTES.stone[0]);r(23,0,2,96,PALETTES.stone[5]);
 // timber deck from left to center
 const wood=PALETTES.wood;
 r(17,27,94,39,wood[0]);r(19,26,90,38,wood[3]);
 for(let y=28;y<64;y+=6){r(20,y,88,4,wood[4]);r(20,y+4,88,1,wood[1]);}
 for(let x=20;x<111;x+=17){r(x,28,2,34,wood[2]);r(x+2,29,1,31,wood[5]);}
 for(const x of [22,46,72,102]){
  r(x,18,6,14,wood[0]);r(x+1,15,4,18,wood[2]);r(x,14,6,3,wood[5]);
  r(x,60,6,24,wood[0]);r(x+1,61,4,20,wood[2]);r(x,61,6,3,wood[5]);
 }
 r(27,20,70,1,wood[5]);r(28,76,69,1,wood[4]);
 // nautical bollard, rope, supply crates
 r(83,32,9,7,PALETTES.stone[1]);r(85,28,5,10,PALETTES.stone[5]);
 r(84,29,7,2,PALETTES.stone[6]);
 for(const [x,y,s] of [[40,41,12],[58,44,10]]){
  r(x,y,s,s,wood[2]);r(x+2,y+2,s-4,s-4,wood[4]);
  r(x+1,y+1,s-2,1,wood[5]);r(x+s/2,y,2,s,wood[1]);
  r(x+2,y+2,2,2,wood[5]);
 }
 for(let i=0;i<7;i++){const y=(i*13+5)%96;r(113,y,8,1,PALETTES.water[5]);r(115,y+2,5,1,PALETTES.water[4]);}
 return c;
}

function drawGarden(){
 const c=canvas(112,88),r=c.rect,b=c.blob,wood=PALETTES.wood,stone=PALETTES.stone;
 b(56,82,51,5,stone[0],3);
 r(4,46,104,31,stone[1]);r(7,43,98,29,stone[3]);
 for(let y=48;y<70;y+=6){r(8,y,96,1,stone[4]);for(let x=12+(y%12);x<100;x+=19)r(x,y,1,5,stone[1]);}
 r(7,40,98,7,stone[5]);r(7,40,98,2,stone[6]);r(4,46,4,23,stone[1]);r(104,46,4,23,stone[1]);
 r(11,38,90,7,PALETTES.forest[0]);
 for(let x=12;x<102;x+=9)b(x,36+(x%3),7,8,PALETTES.forest[(x%3)+2],3);
 for(let x=19;x<99;x+=12)b(x,29+(x%2)*3,7,9,PALETTES.forest[3],3);
 c.scatter(138,88,[12,18,90,26],[PALETTES.flower[1],PALETTES.flower[2],PALETTES.flower[3],PALETTES.flower[4]],{
  maxW:4,maxH:3,inside:(x,y)=>y>16&&y<42&&x>12&&x<101
 });
 // raised centerpiece: fountain basin
 r(46,17,21,22,stone[2]);r(45,16,23,4,stone[5]);r(49,12,15,9,PALETTES.water[2]);r(52,5,8,9,PALETTES.water[4]);
 r(48,32,18,6,PALETTES.water[1]);r(46,34,21,3,stone[6]);
 for(let x=14;x<99;x+=16){r(x,49,4,3,stone[6]);r(x+5,54,7,2,stone[2]);}
 return c;
}

function drawWetland(){
 const c=canvas(112,96),r=c.rect,b=c.blob,poly=c.poly;
 const marsh=PALETTES.marsh,water=PALETTES.water;
 // ground peninsula with watery cove
 b(56,65,52,29,marsh[0],4);b(54,62,51,26,marsh[2],4);
 poly([[10,50],[21,34],[39,36],[50,45],[71,35],[94,40],[103,52],[103,84],[81,90],[61,84],[43,94],[20,86]],water[0]);
 poly([[16,54],[27,42],[43,43],[51,52],[70,43],[90,48],[97,56],[97,82],[78,85],[62,78],[41,88],[24,81]],water[2]);
 c.scatter(867,90,[17,46,80,39],[water[3],water[4],water[5]],{maxW:5,maxH:2,inside:(x,y)=>(x>20&&x<97&&y>52&&y<83)});
 // stepping roots/logs
 for(const [x,y,w] of [[23,70,23],[45,65,18],[64,60,23]]){
  r(x,y,w,7,PALETTES.wood[1]);r(x,y,w,3,PALETTES.wood[3]);r(x+2,y+2,w-4,1,PALETTES.wood[4]);
  r(x+3,y+6,w-5,2,PALETTES.wood[0]);
 }
 for(const [x,y] of [[14,50],[22,33],[83,37],[97,67]]){
  for(let j=0;j<4;j++){r(x+j*3,y-20-(j%2)*4,2,23,marsh[1]);r(x+j*3-2,y-18,5,2,marsh[3]);}
  r(x+3,y-23,2,5,PALETTES.wood[4]);
 }
 // fern clumps and lilypads
 for(const [x,y] of [[16,83],[38,89],[95,87],[78,88]]){
  for(const dx of [-6,-3,0,3,6]){
   r(x+dx,y-5+Math.abs(dx)%3,3,5,marsh[3]);r(x+dx,y-8+Math.abs(dx)%3,2,3,marsh[4]);
  }
 }
 for(const [x,y] of [[36,52],[77,76]]){
  b(x,y,9,4,marsh[2],2);r(x,y-2,5,2,marsh[4]);r(x+2,y-3,2,2,PALETTES.flower[2]);
 }
 for(const [x,y] of [[11,79],[101,84]]){b(x,y,9,5,PALETTES.stone[1],2);r(x-4,y-2,5,2,PALETTES.stone[4]);}
 return c;
}

function makePixelSprite(name){
 if(!Object.prototype.hasOwnProperty.call(ART_SPRITES,name))throw Error("Unknown art asset "+name);
 const c=({
 "viridian-oak":drawForest,"pewter-ridge":drawRidge,"cerulean-canal-bridge":drawCanal,
 "vermilion-pier":drawPier,"celadon-botanic-bed":drawGarden,"fuchsia-wetland":drawWetland
 })[name]();
 return {svg:c.finish(),meta:{...ART_SPRITES[name],shapes:c.shapeCount(),name,format:"SVG integer-pixel art",status:"art-review"}};
}
export {makePixelSprite};
