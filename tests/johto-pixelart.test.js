import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {JOHTO_18} from "../tools/pokearena/torre2-johto-lab-catalog.js";
import {JOHTO_P2_TEXTURES,JOHTO_PIXEL_MASKS,JOHTO_PIXEL_PALETTES,JOHTO_PIXEL_FRAMES,stampJohto}
 from "../tools/pokearena/torre2-johto-lab-pixelart.js";

test("all 18 skills have distinct inked pixel sprites and native P2 texture pairs",()=>{
 assert.equal(Object.keys(JOHTO_PIXEL_MASKS).length,18);
 assert.equal(Object.keys(JOHTO_P2_TEXTURES).length,18);
 assert.equal(JOHTO_PIXEL_FRAMES,12);
 const unique=new Set();
 for(const move of JOHTO_18){
  const mask=JOHTO_PIXEL_MASKS[move.id],pal=JOHTO_PIXEL_PALETTES[move.id],native=JOHTO_P2_TEXTURES[move.id];
  assert.ok(mask?.length>=10,move.id+": missing hand-authored 10+ pixel rows");
  assert.ok(mask.join("").includes("0")&&mask.join("").includes("4"),
   move.id+": no ink outline or highlights");
  assert.equal(pal.length,5,move.id+": palette needs outline/shadow/body/light/specular");
  assert.equal(native.length,2,move.id+": requires at least two original P2 pixel sprites");
  assert.ok(native.every(x=>x.startsWith("p-")),move.id+": not a client texture");
  const colors=new Set(mask.join("").replace(/\./g,""));
  assert.ok(colors.size>=4,move.id+": not enough distinct shades");
  const normalized=mask.join("\n");
  assert.ok(!unique.has(normalized),move.id+": generic duplicate mask");
  unique.add(normalized);
 }
});
test("pixel renderer paints sharp integer cells with no antialiased geometry",()=>{
 const ops=[];
 const g={fillStyle(...args){ops.push(["fillStyle",...args]);return this},
  fillRect(...args){ops.push(["fillRect",...args]);return this}};
 for(const move of JOHTO_18){
  ops.length=0;
  const count=stampJohto(g,move.id,122.4,99.7,5,2,1);
  assert.ok(count>=35,move.id+": detail falls below pixel sprite threshold");
  const cells=ops.filter(x=>x[0]==="fillRect");
  assert.equal(cells.length,count);
  for(const cell of cells)assert.ok(cell.slice(1).every(Number.isInteger),
   move.id+": subpixel or antialiased rectangle");
 }
 const runtime=readFileSync("tools/pokearena/torre2-johto-lab-runtime.js","utf8");
 assert.doesNotMatch(runtime,/strokeCircle|strokeEllipse|strokeArc|lineBetween|lineStyle|fillCircle|fillEllipse/);
 assert.match(runtime,/nativeP2\(e,h\.id\)/);
 assert.match(runtime,/stampJohto\(g,id/);
});

// Regression: each prototype's P2 texture choreography is individually authored,
// rather than reusing the same orbit/squash effect for 18 different move names.
test("eighteen distinct native P2 poses preserve crisp sprites and hit semantics",()=>{
 const runtime=readFileSync("tools/pokearena/torre2-johto-lab-runtime.js","utf8");
 assert.match(runtime,/const NATIVE_POSES=Object\.freeze/);
 assert.match(runtime,/setBlendMode\?\.\(Phaser\.BlendModes\.NORMAL\)/);
 assert.match(runtime,/function paintNativeSprites/);
 for(const move of JOHTO_18){
  assert.ok(runtime.includes("'"+move.id+"':["),move.id+" missing bespoke pixel scale");
  assert.ok(runtime.includes("case '"+move.id+"':"),move.id+" missing authored pose");
 }
 assert.match(runtime,/Math\.round\(anchor\.x/);
 assert.match(runtime,/Math\.round\(anchor\.y/);
});
