#!/usr/bin/env node
/* Pesquisa local de fontes VFX. NÃO instala nem carrega os módulos no jogo.
 * Origem dos dados: reference-library/vfx-sources/catalog.json
 */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url));
const catalogue=JSON.parse(fs.readFileSync(path.resolve(here,"../../reference-library/vfx-sources/catalog.json"),"utf8"));
const aliases={
 "fogo":["fire","explosion"],"chama":["fire"],"fire blast":["fire","explosion"],
 "flamethrower":["fire","beam"],"raio":["electric","beam"],"trovao":["electric"],
 "thunderbolt":["electric","projectile"],"zap cannon":["electric","projectile"],
 "gelo":["ice"],"neve":["ice","weather"],"ice beam":["ice","beam"],
 "agua":["water"],"tornado":["wind"],"redemoinho":["water","whirlpool"],
 "whirlpool":["water"],"sombra":["dark","shadow"],"psiquico":["psychic","magic"],
 "veneno":["poison"],"soco":["impact"],"impacto":["impact"],"escudo":["shield"],
 "cura":["heal"],"clima":["weather"],"chuva":["weather","water"],
 "corte":["slash","impact"],"espada":["slash"],"golpe":["impact"],
 "solar beam":["beam","magic"],"powder snow":["ice","weather"]
};
export function normalize(text){
 return String(text||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
 .toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
}
export function rankSources(query,limit=10){
 const input=normalize(query),terms=new Set(input.split(" ").filter(Boolean));
 for(const [word,extra] of Object.entries(aliases))if(input.includes(normalize(word)))
  extra.forEach(t=>terms.add(normalize(t)));
 return catalogue.sources.map(s=>{
  const tags=s.tags.map(normalize),mov=s.moves.map(normalize),name=normalize(s.name);
  let score=0;
  for(const term of terms){
   if(tags.includes(term))score+=5;
   if(mov.some(x=>x.split(" ").includes(term)))score+=4;
   if(name.split(" ").includes(term))score+=3;
  }
  if(mov.includes(input))score+=12;
  if(name.includes(input))score+=12;
  if(s.copyState==="selected-samples-local")score+=1;
  if(s.licenseState==="conflict"||s.licenseState==="missing")score-=10;
  return {...s,score};
 }).filter(s=>input? s.score>0:true)
 .sort((a,b)=>b.score-a.score||a.priority-b.priority||a.name.localeCompare(b.name))
 .slice(0,Math.max(1,limit));
}
const args=process.argv.slice(2);
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const json=args.includes("--json"),all=args.includes("--all");
 const q=args.filter(x=>!x.startsWith("--")).join(" ");
 if(!q&&!all){console.error('Uso: node tools/dev/vfx-source-search.mjs "Fire Blast" [--json] ou --all');process.exitCode=2;}
 else{
  const found=all?catalogue.sources:rankSources(q,10);
  if(json)console.log(JSON.stringify(found,null,2));
  else if(!found.length)console.log("Nenhuma fonte correspondente. Confira aliases ou use --all.");
  else for(const [i,s] of found.entries())console.log(
   (i+1)+". "+s.name+" | score="+(s.score??"-")+" | "+s.copyState+
   " | "+s.license+"\n   "+s.url+"\n   "+
   (s.localSamples?.length?s.localSamples.map(p=>"reference-library/vfx-sources/"+s.id+"/"+p).join(", "):
     "sem arquivos locais, consultar URL da ficha"));
 }
}
