import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {rankSources,normalize} from "../tools/dev/vfx-source-search.mjs";
const root="reference-library/vfx-sources/";
const catalog=JSON.parse(readFileSync(root+"catalog.json","utf8"));
test("10 fontes distintas, fichas e licenças com procedência",()=>{
 assert.equal(catalog.total,10);
 assert.equal(catalog.sources.length,10);
 assert.equal(new Set(catalog.sources.map(s=>s.id)).size,10);
 for(const s of catalog.sources){
  assert.ok(existsSync(root+s.id+"/README.md"),s.id+" sem ficha");
  assert.ok(s.url.startsWith("https://")&&s.license&&s.copyState&&s.licenseState);
  if(s.copyState==="selected-samples-local"){
   assert.ok(s.pin&&s.repository&&s.localSamples.length>0,s.id);
   assert.ok(existsSync(root+s.id+"/vendor/LICENSE"),s.id+" sem licença local");
   for(const file of s.localSamples)assert.ok(existsSync(root+s.id+"/"+file),s.id+": "+file);
  }else assert.equal(s.localSamples.length,0,"Não alegar código local não copiado: "+s.id);
 }
});
test("nenhuma licença ambígua gera cópia reutilizável",()=>{
 const byId=Object.fromEntries(catalog.sources.map(s=>[s.id,s]));
 assert.equal(byId.pixeldust.copyState,"blocked-no-license");
 assert.equal(byId["codemanu-free-pixel-effects"].copyState,"blocked-license-review");
 for(const id of ["foozle-pixel-magic","devwizard-pixel-art-spells","cs5475-free-pixel-effects"])
  assert.equal(byId[id].copyState,"download-required",id);
 assert.equal(byId["sprite-fusion"].copyState,"links-only");
});
test("consultas por golpe buscam melhor fonte de forma reproduzível",()=>{
 assert.equal(normalize("Elétrico!"),"eletrico");
 for(const move of ["Fire Blast","Ice Beam","Zap Cannon","Shadow Ball","Protect"]){
  const results=rankSources(move);
  assert.ok(results.length>0,move+" sem candidatos");
  assert.ok(results.some(x=>x.localSamples.length>0),move+" sem nenhuma referência local");
 }
 assert.ok(rankSources("asdfasdfxyz").length===0);
});
test("política obriga consulta ao acervo sem revogar quatro fontes e preservações",()=>{
 const agents=readFileSync("AGENTS.md","utf8");
 assert.match(agents,/reference-library\/vfx-sources/);
 assert.match(agents,/vfx-source-search\.mjs/);
 assert.match(agents,/POLITICA-GOLPES-INTEGRAL/);
 const lib=readFileSync(root+"README.md","utf8");
 assert.match(lib,/quatro fontes originais/);
 assert.match(lib,/Powder Snow, Whirlpool e Zap Cannon/);
});
