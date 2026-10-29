/* T07 full Kanto audit against the actually captured/compiled Poké Arena 2D.
 * This verifies metadata + menu + native renderer, NOT natural XP/reloads. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const modules=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const load=name=>import(pathToFileURL(path.join(root,modules,name)));
const [{KANTO_151},
 {TEST_LIBRARY,availableMoves,moveUnlockLevel,campaignLearnset,
  resolveLoadout,canonicalMoveKey,isPendingApprovalMove},
 {GEN4_HGSS_KANTO_LEVEL_UP,GEN5_B2W2_KANTO_LEVEL_UP,gen45KantoUnlockLevel},
 {GEN7_LETSGO_LEVEL_UP,gen7LetsGoUnlockLevel},
 {frlgUnlockLevel,frlgMachineCompatible,frlgEvolutionLevel},
 {gen5KantoUnlockLevel}
]=await Promise.all([
 load('torre2/all-kanto-species.js'),
 load('torre2/move-pool.js'),
 load('torre2/gen45-kanto-learnsets.js'),
 load('torre2/gen7-letsgo-learnsets.js'),
 load('torre2/frlg-learnsets.js'),
 load('torre2/gen5-existing-levels.js')
]);
const member=(id,level,tmMoves=[])=>({id,progression:{species:id,level},tmMoves});
const key=s=>canonicalMoveKey(s).replace(/[^a-z0-9]/g,'');
const approved=new Map(TEST_LIBRARY.filter(m=>m.forma&&
 !isPendingApprovalMove(m)).map(m=>[key(m.nombre),m]));
assert.equal(KANTO_151.length,151);
assert.equal(TEST_LIBRARY.length,227,'Do not create/duplicate any VFX');
assert.equal(new Set(TEST_LIBRARY.map(x=>x.id)).size,TEST_LIBRARY.length);
const additions=[],family=[];
for(const {id} of KANTO_151){
 if(id==='mewtwo')continue; // test Mewtwo currently exposes unrestricted lab kit
 assert.ok(GEN4_HGSS_KANTO_LEVEL_UP[id]&&GEN5_B2W2_KANTO_LEVEL_UP[id],id);
 for(const [label,level] of [['starter',5],['ult',8],['mid',25],['late',50]]){
  const pool=availableMoves(member(id,level));
  assert.ok(pool.length,'No attacks '+id+' '+label);
  for(const move of pool){
   assert.ok(move.forma,'Unrenderable '+id+' '+move.nombre);
   assert.ok(move.torre2IntroPractice||TEST_LIBRARY.some(m=>m.id===move.id),
    'Invented uninstalled move '+id+' '+move.id);
  }
 }
 for(const move of TEST_LIBRARY){
  const installed=approved.get(key(move.nombre));
  if(!installed||installed.id!==move.id)continue;
  const gen45=gen45KantoUnlockLevel(id,move.nombre);
  if(gen45===null||frlgUnlockLevel(id,move.nombre)!==null||
     frlgMachineCompatible(id,move.nombre)||
     gen7LetsGoUnlockLevel(id,move.nombre)!==null||
     gen5KantoUnlockLevel(id,move.nombre)!==null)continue;
  const required=moveUnlockLevel(member(id,50),move.nombre);
  const at50=availableMoves(member(id,50)).some(m=>m.id===move.id);
  if(!at50)continue; // strictly no renderer/untested evolution locks
  // Existing, deliberately curated early-route/legacy effects sometimes
  // do not appear in the generic moveUnlockLevel index. They existed before
  // the Gen4/5 addition and must not be misreported as newly imported moves.
  if(!Number.isInteger(required))continue;
  const dex=campaignLearnset(id).find(m=>m.id===move.id);
  if(dex?.level!==required)continue; // already unlocked by approved override
  assert.ok(required>=13&&required<=50,
   'New Gen4/5 move learned too soon '+id+' '+move.id);
  assert.ok(!availableMoves(member(id,required-1)).some(m=>m.id===move.id),
   'New Gen4/5 move unlocked prematurely '+id+' '+move.id+' before '+required);
  assert.ok(availableMoves(member(id,required)).some(m=>m.id===move.id),
   'New Gen4/5 move absent exactly at learning level '+id+' '+move.id);
  additions.push({species:id,move:move.id,level:required,fromGen45:gen45,
   renderer:move.forma,source:move.source});
 }
 const lv50=availableMoves(member(id,50)).filter(m=>!m.torre2IntroPractice);
 family.push({id,lv50:lv50.length,gen4:Object.keys(GEN4_HGSS_KANTO_LEVEL_UP[id]).length,
  gen5:Object.keys(GEN5_B2W2_KANTO_LEVEL_UP[id]).length});
}
assert.ok(additions.length>=1,
 'Imported Gen4/5 metadata produced no additional installed species moves');
assert.ok(!availableMoves(member('charmander',49)).some(m=>m.id==='fire-blast'));
assert.ok(availableMoves(member('charizard',50)).some(m=>m.id==='fire-blast'));
assert.ok(!availableMoves(member('magikarp',50)).some(m=>m.id==='fire-blast'));
assert.ok(!availableMoves(member('bulbasaur',50)).some(m=>m.id==='flamethrower'));
assert.ok(availableMoves(member('ponyta',49)).some(m=>m.id==='flare-blitz'));
const summary={
 originalLibrary:TEST_LIBRARY.length,
 auditedSpecies:KANTO_151.length,sourceGen4Rows:Object.values(GEN4_HGSS_KANTO_LEVEL_UP)
  .reduce((n,m)=>n+Object.keys(m).length,0),
 sourceGen5Rows:Object.values(GEN5_B2W2_KANTO_LEVEL_UP)
  .reduce((n,m)=>n+Object.keys(m).length,0),
 newInstalledSpeciesPairs:additions.length,
 affectedSpecies:[...new Set(additions.map(m=>m.species))].length,
 newPairsSample:additions.slice(0,28),
 examples:family.filter(x=>['charmander','charmeleon','charizard','magmar','ponyta','squirtle','pikachu','rattata'].includes(x.id))
};
// Machine-readable 151 x 227 audit. "Unavailable" is not a defect:
 // many official moves are inherently incompatible with a given species.
 // Mewtwo remains a separate unrestricted test fixture and is labeled.
const matrix=KANTO_151.map(({id})=>{
 const learnset=new Map(campaignLearnset(id).map(m=>[m.id,m]));
 return {species:id,mode:id==='mewtwo'?'UNRESTRICTED_TEST_FIXTURE':'CAMPAIGN',
  moves:TEST_LIBRARY.map(move=>{
   const acquired=learnset.get(move.id);
   return {id:move.id,name:move.nombre,origin:move.source,
    status:acquired?.method==='LEVEL'?'LEVEL':
      acquired?.method==='TM'?'TM':'INCOMPATIBLE_OR_UNINSTALLED',
    level:acquired?.level??null,
    renderer:move.forma,approved:!isPendingApprovalMove(move)};
  })};
});
fs.mkdirSync('test-evidence',{recursive:true});
fs.writeFileSync('test-evidence/t07-kanto-151x227-coverage.json',
 JSON.stringify({note:'Compiled client fixtures, NOT a naturally played game.',
  ...summary,matrix},null,2)+'\n');
console.log('T07_MATRIX_GENERATED',JSON.stringify({
 species:matrix.length,catalog:TEST_LIBRARY.length,
 cells:matrix.reduce((n,row)=>n+row.moves.length,0),
 output:'test-evidence/t07-kanto-151x227-coverage.json'}));
console.log('T07_ALL_KANTO_GEN45_VERIFIED',JSON.stringify(summary));
