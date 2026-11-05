/* Built-client contract: independent Johto test lab, not campaign move pool. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const dir=path.resolve(process.env.PREVIEW_ROOT||"_site","arena2d");
const {modules}=JSON.parse(fs.readFileSync(path.join(dir,"version.json"),"utf8"));
const read=(name)=>fs.readFileSync(path.join(dir,modules,name),"utf8");
for(const p of ["torre2/johto-lab-catalog.js","torre2/johto-lab-runtime.js",
 "torre2/johto-lab-combat.js","torre2/torre2-johto-lab-cooldown.js","torre2/torre2-johto-motion.js","torre2/torre2-johto-gen3-research.js","torre2/johto-lab-scene.js"]){
 assert.ok(fs.existsSync(path.join(dir,modules,p)),p);
}
assert.match(read("main.js"),/JohtoLab/);
assert.match(read("escenas/titulo.js"),/MEWTWO TEST LAB/);
assert.match(read("torre2/signature-fx.js"),/TORRE2_JOHTO_LAB_FORMS/);
assert.match(read("torre2/johto-lab-runtime.js"),/stampJohto/);
assert.match(read("torre2/johto-lab-runtime.js"),/nativeP2/);
assert.doesNotMatch(read("torre2/johto-lab-runtime.js"),/strokeCircle|strokeEllipse|lineBetween|fillCircle/);
assert.match(read("torre2/johto-lab-pixelart.js"),/JOHTO_P2_TEXTURES/);

assert.match(read("luchador.js"),/this\.escena\.datos\.johtoLab\.kit/);
assert.match(read("escenas/combate.js"),/installJohtoLabCombat/);
assert.doesNotMatch(read("torre2/move-pool.js"),/JOHTO_18|johto-lab/);
assert.doesNotMatch(read("torre2/campanha.js"),/JOHTO_18|johto-lab/);
const manifest=JSON.parse(fs.readFileSync(path.join(dir,"assets/torre2/johto-pixelfx/manifest.json"),"utf8"));
assert.equal(manifest.files.length,39);
assert.equal(manifest.files.filter(x=>["triple-kick","thief","snore","octazooka"].includes(x.id)).length,0,
 "No rejected rectangle sprites may ship for the four new P2 effects");
assert.match(read("torre2/johto-lab-runtime.js"),/makeJohtoFourNative/);
assert.ok(fs.existsSync(path.join(dir,modules,"torre2/torre2-johto-four-native.js")));
for(const id of ["powder-snow","whirlpool","zap-cannon"])
 assert.ok(!manifest.files.some(x=>x.id===id),"Approved original VFX not regenerated");
console.log("PASS 4 visible Johto moves, 24 animated frames, 3 approved untouched",modules);
