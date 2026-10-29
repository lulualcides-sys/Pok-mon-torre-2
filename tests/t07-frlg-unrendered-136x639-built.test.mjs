/* T07: deduplicated OFFICIAL FRLG level-up gaps against the exact installed
 * Phaser catalogue. This is metadata/audit only, not a VFX implementation.
 * 150 regular Kanto campaign species; Mewtwo remains an unrestricted lab.
 * No move is granted to a species by this report.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const base=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(base,'version.json'),'utf8'));
const load=name=>import(pathToFileURL(path.join(base,modules,name)).href);
const [{KANTO_151},{TEST_LIBRARY},{FRLG_LEVEL_UP}]=await Promise.all([
 load('torre2/all-kanto-species.js'),
 load('torre2/move-pool.js'),
 load('torre2/frlg-learnsets.js')
]);
assert.equal(KANTO_151.length,151);
assert.equal(TEST_LIBRARY.length,227);
const installed=new Set(TEST_LIBRARY.map(m=>m.id));
assert.equal(installed.size,227,'Duplicated installed attack ID');
const byMove=new Map(),speciesRows=[];
let campaignPairs=0,labPairs=0;
for(const {id} of KANTO_151){
 const official=FRLG_LEVEL_UP[id];
 assert.ok(official&&Object.keys(official).length>0,
  'Missing authentic FRLG level-up table for '+id);
 const missing=Object.entries(official).filter(([move])=>!installed.has(move))
  .map(([move,level])=>({move,level}));
 for(const {move,level} of missing){
  const row=byMove.get(move)||{id:move,species:[]};
  row.species.push({id,level});
  byMove.set(move,row);
 }
 if(id==='mewtwo')labPairs+=missing.length;
 else campaignPairs+=missing.length;
 speciesRows.push({species:id,mode:id==='mewtwo'?'UNRESTRICTED_LAB':'CAMPAIGN',
  missingFRLGLevelUps:missing});
}
const moves=[...byMove.values()].sort((a,b)=>
 b.species.filter(x=>x.id!=='mewtwo').length-
 a.species.filter(x=>x.id!=='mewtwo').length||a.id.localeCompare(b.id))
 .map(row=>({
  move:row.id,
  regularSpeciesCount:row.species.filter(x=>x.id!=='mewtwo').length,
  allSpeciesCount:row.species.length,
  species:row.species,
  disposition:row.id==='scratch'?'DEFERRED_BY_USER':
   row.id==='transform'?'BLOCKED_AUTHENTIC_TRANSFORM_REQUIRED':
   'NO_APPROVED_INSTALLED_RENDERER',
  fourSourceReview:'REQUIRED_BEFORE_VFX; not certified by this inventory'
 }));
assert.ok(moves.length<=136,'New missing FRLG move appeared; audit catalogue aliases');
assert.ok(campaignPairs<=639,'More regular Kanto FRLG gaps than the baseline');
assert.ok(labPairs<=6,'More laboratory Mewtwo FRLG gaps than the baseline');
assert.equal(campaignPairs+labPairs,
 moves.reduce((sum,row)=>sum+row.allSpeciesCount,0));
assert.equal(speciesRows.length,151);
for(const name of ['leer','growl','tail-whip','focus-energy','disable',
 'poison-powder','slash','stun-spore','withdraw','transform'])
 assert.ok(moves.some(row=>row.move===name),'Known gap unexpectedly absent: '+name);
assert.ok(!moves.some(row=>row.move==='surf'),
 'Surf has an installed but REJECTED renderer; never classify as missing');
const report={
 evidence:'compiled FRLG level-up metadata × original captured Phaser library',
 notEvidence:'No new VFX, four-source port, natural XP, campaign clear or Android test',
 installedRendererCount:TEST_LIBRARY.length,
 speciesCount:KANTO_151.length,regularCampaignSpecies:150,
 distinctUnrenderedFRLGMoves:moves.length,
 regularCampaignSpeciesMovePairs:campaignPairs,
 laboratoryMewtwoPairs:labPairs,
 restrictions:{scratch:'DEFERRED',surf:'REJECTED_INSTALLED_NOT_USABLE',
  transform:'DITTO_REQUIRES_AUTHENTIC_RENDERER'},
 sourcePolicy:{
  T2:'Only approved existing renderers may be reused; no overwrite',
  P2:'Inspect captured native files and explicit permission before port',
  Zarza:'Canvas 2D incompatible; inspect symbols and redistribution license',
  Emerald:'Only original MIT code may be ported with attribution; not ROM or third-party art',
  review:'This report does not prove any specific four-source reuse'
 },
 moves,species:speciesRows
};
fs.mkdirSync('test-evidence',{recursive:true});
fs.writeFileSync('test-evidence/t07-frlg-unrendered-136x639.json',
 JSON.stringify(report,null,2)+'\n');
const markdown=[
 '# T07 — Lacunas FRLG por espécie e golpe (Phaser compilado)',
 '',
 'Matriz derivada de 151 tabelas FRLG e 227 IDs instalados. **Não** é',
 'comprovação de jogo natural, licença para importar VFX ou autorização',
 'para equipar golpes incompatíveis. Mewtwo é laboratório separado.',
 '',
 '- Golpes FRLG distintos sem renderer: **'+moves.length+'**',
 '- Pares espécie/golpe da campanha regular: **'+campaignPairs+'**',
 '- Pares adicionais de Mewtwo laboratório: **'+labPairs+'**',
 '- Scratch: adiado; Surf: instalado mas reprovado; Ditto: Transform ausente.',
 '',
 '| Golpe | Espécies Kanto regulares | Situação |',
 '|---|---:|---|',
 ...moves.map(row=>'| '+row.move+' | '+row.regularSpeciesCount+
  ' | '+row.disposition+' |'),
 '',
 'Listagem por todas as 151 espécies, nível original, e matriz integral:',
 't07-frlg-unrendered-136x639.json.',
 '',
 'Portar qualquer efeito exige ficha de quatro fontes T2/P2/Zarza/Emerald,',
 'símbolos reais, permissões e autorização de dispensa quando aplicável.'
].join('\n')+'\n';
fs.writeFileSync('test-evidence/t07-frlg-unrendered-136x639.md',markdown);
console.log('PASS_T07_FRLG_UNRENDERED_DEDUP',JSON.stringify({
 species:speciesRows.length,installed:installed.size,distinct:moves.length,
 campaignPairs,labPairs,top:moves.slice(0,12).map(x=>[x.move,x.regularSpeciesCount]),
 evidence:'compiled-fixtures; not actual battle or VFX provenance'
}));
