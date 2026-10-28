/* Audit all Kanto species against the ACTUAL captured client library.
 * Synthetic levels are eligibility fixtures, NOT a played campaign.
 * No new move, VFX or save format is created in this audit. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const modules=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const load=p=>import(pathToFileURL(path.join(root,modules,p)));
const [{KANTO_151},
 {TEST_LIBRARY,availableMoves,resolveLoadout,campaignLearnset,moveUnlockLevel,CHARACTERISTIC_KANTO_ROLES},
 {GEN7_LETSGO_LEVEL_UP}, {frlgEvolutionLevel}]
 =await Promise.all([load('torre2/all-kanto-species.js'),
  load('torre2/move-pool.js'),load('torre2/gen7-letsgo-learnsets.js'),load('torre2/frlg-learnsets.js')]);
const member=(id,level)=>({id,progression:{species:id,level},tmMoves:[]});
const ids=new Set(TEST_LIBRARY.map(m=>m.id));
assert.equal(ids.size,TEST_LIBRARY.length,'Library may not duplicate effects');
assert.ok(TEST_LIBRARY.length>=240,
 'Unexpectedly few installed moves: inspect captured base library');
const bySource={};
for(const move of TEST_LIBRARY){
 assert.ok(move.forma,'Move without battle renderer: '+move.id);
 bySource[move.source]=(bySource[move.source]||0)+1;
}
const report=[];
for(const p of KANTO_151){
 const id=p.id;
 const lv5=availableMoves(member(id,5));
 const lv8=availableMoves(member(id,8));
 const lv25=availableMoves(member(id,25));
 const lv50=availableMoves(member(id,50));
 const moves=campaignLearnset(id).filter(m=>m.method==='LEVEL');
 assert.ok(Object.keys(GEN7_LETSGO_LEVEL_UP[id]||{}).length>0,
  'Missing Gen7 legal level-up source: '+id);
 assert.ok(moves.length>=1,'No selectable moves for '+id);
 for(const m of [...lv5,...lv8,...lv25,...lv50]){
  assert.ok(m.forma,'Missing original/approved renderer '+id+' '+m.id);
  if(!m.torre2IntroPractice)assert.ok(ids.has(m.id),
    'Species has an invented effect: '+id+' '+m.id);
 }
 // If a move appears at one level it must persist at higher levels.
 for(const [before,after] of [[lv5,lv8],[lv8,lv25],[lv25,lv50]]){
  const later=new Set(after.map(m=>m.id));
  for(const m of before)assert.ok(later.has(m.id),
   'Lost move during natural level-up '+id+' '+m.id);
 }
 if(id!=='mewtwo'&&frlgEvolutionLevel(id)<=5){
  const kit5=resolveLoadout(member(id,5)),kit8=resolveLoadout(member(id,8));
  assert.ok(!kit5.e||kit5.e.pendiente===true||kit5.e.nombre==='LOCKED',
   id+' strong ULT incorrectly ready at Lv5');
  assert.ok(kit8.e?.id&&kit8.e.ulti===true,
   id+' requires weak Lv8 finisher');
  assert.ok(Object.keys(kit8).filter(k=>['lmb','rmb','q','e'].includes(k)).length<=4);
 }
 report.push({species:id,level5:lv5.length,level25:lv25.length,
  level50:lv50.length,legalInstalled:moves.length});
}
const move=(id,level,key)=>availableMoves(member(id,level)).find(m=>m.id===key);
for(const [id,at] of [['ponyta',21],['rapidash',40]]){
 assert.ok(move(id,at,'flame-charge'),'Flame Charge from original client unavailable '+id);
 assert.ok(!move(id,at-1,'flame-charge')||id==='rapidash',
  'Flame Charge unlocked too early '+id);
}
for(const [id,at] of [['ponyta',49],['rapidash',49]]){
 assert.ok(move(id,at,'flare-blitz'),'Flare Blitz original VFX unavailable '+id);
 assert.ok(!move(id,at-1,'flare-blitz'),
  'Flare Blitz unlocked before authentic Gen V level '+id);
 assert.equal(moveUnlockLevel(member(id,at),'flare-blitz'),49);
}
assert.ok(CHARACTERISTIC_KANTO_ROLES.ponyta.some(x=>x[1]==='flare-blitz'));
assert.equal(resolveLoadout(member('ponyta',49)).q?.id,'flare-blitz',
 'Ponyta Lv49 must automatically equip native Flare Blitz');
assert.equal(resolveLoadout(member('ponyta',21)).rmb?.id,'flame-charge',
 'Ponyta Lv21 must automatically equip native Flame Charge');
for(const id of ['bulbasaur','magikarp','ponyta','rapidash'])
 assert.ok(campaignLearnset(id).length>=1);
const summary={installedLibrary:TEST_LIBRARY.length,bySource,
  kantoSpecies:report.length,gen7LegalRows:Object.values(GEN7_LETSGO_LEVEL_UP)
   .reduce((n,m)=>n+Object.keys(m).length,0),
  matchesWith50PlusMoves:report.filter(r=>r.level50>=10).length,
  averageLegalLevel50:Number((report.reduce((a,b)=>a+b.level50,0)/report.length).toFixed(2)),
  examples:report.filter(r=>['ponyta','rapidash','pikachu','charmander','meowth'].includes(r.species))};
console.log('T07_COMPILED_151_AUDIT',JSON.stringify(summary));
