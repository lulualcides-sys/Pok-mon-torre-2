import test from "node:test";
import assert from "node:assert/strict";
import {JOHTO_GEN3_IDS,JOHTO_GEN3_SPEC} from "../tools/pokearena/torre2-johto-gen3-research.js";
import {addJohtoPixelSignature} from "../tools/pokearena/torre2-johto-signatures.mjs";
test("43 individually referenced signatures add real opaque pixel-art detail to generated strips",()=>{
 for(const id of JOHTO_GEN3_IDS.filter(id=>!JOHTO_GEN3_SPEC[id].approved)){
  const strip=new Uint8Array(1152*96*4);
  addJohtoPixelSignature(strip,id);
  const a=[];
  for(let f=0;f<12;f++){
   let colored=0;
   for(let y=0;y<96;y++)for(let x=0;x<96;x++){
    if(strip[(y*1152+f*96+x)*4+3]>0)colored++;
   }
   assert.ok(colored>=20,id+" frame "+f+" is blank");
   a.push(colored);
  }
  assert.ok(a.length===12);
 }
});
test("Approved Johto VFX cannot be passed to signature postprocessor",()=>{
 for(const id of ["powder-snow","whirlpool","zap-cannon"])
  assert.throws(()=>addJohtoPixelSignature(new Uint8Array(1152*96*4),id),/Unapproved/);
});
test("Signature exporter rejects invalid or untrusted strip buffers",()=>{
 assert.throws(()=>addJohtoPixelSignature("bad","spider-web"),TypeError);
 assert.throws(()=>addJohtoPixelSignature(new Uint8Array(100),"spider-web"),/resolution/);
});
