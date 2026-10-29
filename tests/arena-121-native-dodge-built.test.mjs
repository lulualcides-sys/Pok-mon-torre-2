/* Audit the REAL generated Phaser move library, all 121 added species and
 * original P2 roster. Never claim unseen renderers are playable.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const load=p=>import(pathToFileURL(path.join(root,modules,p)).href);
const [
 {ROSTER},{KANTO_151},{ARENA_APPROVED_121,ARENA_APPROVED_121_COUNT},
 {selectArenaSpeciesKit,selectApprovedArenaKit},
 {ARENA_NATIVE_DODGE_FORMS},{BATCH24_MOVES},{SURGE3_MOVES},
 {FINALE_13_MOVES,POISON_PUNCH_MOVES}
]=await Promise.all([
 load('datos.js'),load('torre2/all-kanto-species.js'),
 load('torre2/arena-approved-121.js'),load('torre2/arena-move-policy.js'),
 load('torre2/arena-native-dodges.js'),load('torre2/batch24/catalog.js'),
 load('torre2/surge3/catalog.js'),load('torre2/torre2-finale13-catalog.js')
]);
const id=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const kanto=new Set(KANTO_151.map(p=>p.id));
const originals=ROSTER.filter(def=>!def.torre2ArenaAdded);
const added=ROSTER.filter(def=>def.torre2ArenaAdded);
const frozen=JSON.stringify(originals.map(def=>[def.id,def.kit,def.evoluciones]));
const library=new Map(),nativeDodges=new Map();
const register=kit=>{for(const move of Object.values(kit||{})){
 if(move?.forma&&move?.nombre&&!library.has(id(move.nombre)))library.set(id(move.nombre),move);
}};
const registerDodge=move=>{
 if(move?.nombre&&ARENA_NATIVE_DODGE_FORMS.includes(move.forma)&&
  !nativeDodges.has(id(move.nombre)))nativeDodges.set(id(move.nombre),move);
};
for(const def of ROSTER){
 register(def.kit);
 for(const evo of def.evoluciones||[]){register(evo.kit);register(evo.mega?.kit);}
 if(def.torre2ArenaAdded)continue;
 registerDodge(def.kit.esp);
 for(const evo of def.evoluciones||[])registerDodge({...def.kit?.esp,...evo.kit?.esp});
}
for(const move of [...BATCH24_MOVES,...SURGE3_MOVES,...FINALE_13_MOVES,...POISON_PUNCH_MOVES])
 if(move?.nombre&&move?.forma&&move.approved!==false&&!library.has(id(move.nombre)))
  library.set(id(move.nombre),move);
const actualAdded=[],nativeIds=[],fail=[],unavailable=[],examples={};
for(const def of ROSTER){
 const stages=[{name:def.id,kit:def.kit,types:def.tipos},
  ...(def.evoluciones||[]).map(e=>({
    name:id(e.nombre),types:e.tipos||def.tipos,
    kit:Object.fromEntries([...new Set([...Object.keys(def.kit||{}),...Object.keys(e.kit||{})])]
      .map(slot=>[slot,{...def.kit?.[slot],...e.kit?.[slot]}]))
  }))];
 for(const form of stages){
  if(!kanto.has(form.name))continue;
  if(!def.torre2ArenaAdded){
   nativeIds.push(form.name);
   if(ARENA_APPROVED_121[form.name])
    fail.push([form.name,'native P2 was included in added kit list']);
   continue;
  }
  actualAdded.push(form.name);
  const expected=ARENA_APPROVED_121[form.name];
  if(!expected){fail.push([form.name,'added species missing approval']);continue}
  const auto=selectArenaSpeciesKit(form.kit,form.name,form.types,library);
  const loaded=selectApprovedArenaKit(auto,form.name,library,nativeDodges);
  const slots=['lmb','rmb','q','e'];
  const observed=slots.map(s=>loaded[s]?.nombre||null);
  const missing=expected.flatMap((name,i)=>
   name&&id(name)!==id(observed[i])?[{slot:slots[i],requested:name,used:observed[i]}]:[]);
  if(missing.length)unavailable.push({id:form.name,missing});
  const names=observed.filter(Boolean).map(id);
  if(new Set(names).size!==names.length)
   fail.push([form.name,'same attack in multiple equipped slots',observed]);
  for(const slot of slots){
   const h=loaded[slot];
   if(!h?.forma||h.pendiente)fail.push([form.name,slot,'missing or pending renderer',h?.nombre]);
  }
  const esp=loaded.esp;
  if(!esp?.forma||!['dash','vuelo'].includes(esp.forma)||
     esp.torre2ArenaNativeEvasion!==true)
   fail.push([form.name,'native ESP skill not reused',esp]);
  if(['primeape','poliwrath','hitmonlee','hitmonchan','lapras','starmie','vaporeon','scyther','dugtrio','alakazam','ditto','caterpie','weedle'].includes(form.name))
   examples[form.name]={slots:observed,dodge:esp?.nombre||null,
     method:esp?.forma,unavailable:missing};
 }
}
fs.mkdirSync('test-evidence',{recursive:true});
const summary={
 expected:ARENA_APPROVED_121_COUNT,actualAdded:actualAdded.length,nativeCount:nativeIds.length,
 installedMoves:library.size,nativeDodgeMoves:nativeDodges.size,
 exactSpecies:actualAdded.length-unavailable.length,
 partial:unavailable.length,unavailable,errors:fail,examples
};
fs.writeFileSync('test-evidence/arena-121-approved-native-move-dodges.json',
 JSON.stringify(summary,null,2));
console.log('ARENA_121_NATIVE_DODGE_AUDIT',JSON.stringify(summary));
assert.equal(ARENA_APPROVED_121_COUNT,121);
assert.equal(actualAdded.length,121,'Not all 121 added Kanto stages were checked');
assert.equal(new Set(actualAdded).size,121);
assert.equal(new Set(nativeIds).size,30,'Original Poké Arena clients were misclassified');
assert.equal(JSON.stringify(originals.map(def=>[def.id,def.kit,def.evoluciones])),frozen,
 'Original native P2 client definitions mutated');
assert.deepEqual(fail,[],'Unsafe Phaser Arena casts or wrong ESP moves');
assert.equal(examples.primeape.slots[2],'Seismic Toss');
assert.equal(examples.poliwrath.slots[2],'Seismic Toss');
assert.ok(['lmb','rmb','q','e'].some((_,i)=>examples.lapras.slots[i]==='Surf'));
assert.ok(actualAdded.length-unavailable.length>=75,
 'Too many agreed skills not yet installed in the original renderer library');
console.log('PASS_ARENA_121_NATIVE_ESP_ROSTER');
