/* Verify exact 100 Gen II species, actual SpriteCollab PMD payloads and
 * FRLG move metadata. Built assets are NOT a substitute for battle tests. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {JOHTO_100_ROWS} from "../tools/pokearena/torre2-johto-100-data.js";
const site=path.resolve(process.env.PREVIEW_ROOT||"_site","arena2d");
const pmddir=path.join(site,"assets/pmd");
const manifest=JSON.parse(fs.readFileSync(path.join(pmddir,"manifest.json"),"utf8"));
assert.equal(JOHTO_100_ROWS.length,100);
assert.equal(new Set(JOHTO_100_ROWS.map(x=>x[0])).size,100);
let total=0;
for(const p of JOHTO_100_ROWS){
 const [id,name,types,hp,atk,def,spa,spd,speed,parent,moves]=p,dex=String(id).padStart(4,"0");
 assert.equal(id,152+total++);assert.ok(name&&types.length>=1&&types.length<=2);
 for(const n of [hp,atk,def,spa,spd,speed])assert.ok(n>=1&&n<=255,name+" invalid base stat");
 // Later-generation baby Pokémon (e.g. Azurill #298 -> Marill #183)
 // are legitimate Pokédex parents, but are outside the Johto 100 roster.
 if(parent)assert.ok(Number.isInteger(parent)&&parent>=1&&parent<=11000,
  name+" invalid evolution parent ID");
 assert.ok(moves.length>=1,"Missing legal FireRed/LeafGreen moves: "+name);
 assert.equal(new Set(moves.map(([m])=>m)).size,moves.length,"duplicate FRLG "+name);
 assert.ok(moves.every(([m,l])=>m&&Number.isInteger(l)&&l>=-1),"illegal move metadata: "+name);
 assert.ok(manifest[dex]?.anims?.Idle,"Missing Idle sprite for "+name);
 const idle=path.join(pmddir,manifest[dex].anims.Idle.file);
 assert.ok(fs.existsSync(idle),"Missing Idle file "+idle);
 assert.ok(fs.statSync(idle).size>=100,"Empty Idle file "+idle);
 const portrait=path.join(pmddir,dex,"portrait.png");
 assert.ok(fs.existsSync(portrait),"Missing portrait "+name);
}
const {modules}=JSON.parse(fs.readFileSync(path.join(site,"version.json"),"utf8"));
const output=path.join(site,modules);
const builtDatos=fs.readFileSync(path.join(output,"datos.js"),"utf8");
const builtPokedex=fs.readFileSync(path.join(output,"escenas/pokedex.js"),"utf8");
assert.match(builtPokedex,/Pokedex\\.prototype\\.movimientos=function/,
 "Built Pokédex must guard missing executable Johto moves before dereferencing h.tipo");
for(const file of ["torre2/johto-100-data.js","torre2/johto-100-species.js"])
 assert.ok(fs.existsSync(path.join(output,file)),"Missing executable Johto module: "+file);
assert.ok(builtDatos.includes("addAllJohtoSpecies"),"Built roster must import Johto integration");
assert.ok(builtDatos.includes("TODOS.push(...addAllJohtoSpecies(TODOS))"),
 "Built ROSTER must actually include Johto species, not just import its module");
const campaign=fs.readFileSync(path.join(output,"torre2/campanha.js"),"utf8");
assert.doesNotMatch(campaign,/johto-100-species|addAllJohtoSpecies|JOHTO_100_ROWS/,
 "Campaign must remain Kanto-only");
console.log("JOHTO_100_PMD_BUILT_VERIFIED",JSON.stringify({species:100,animated:100,portraits:100,legalMoves:JOHTO_100_ROWS.reduce((a,x)=>a+x[10].length,0)}));
