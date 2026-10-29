#!/usr/bin/env node
/* Metadata-only catalog of public Poké Arena 2D movements.
 * Does not touch native effects, saves, battle kits or ULT balancing.
 */
import fs from 'node:fs';
import path from 'node:path';
import {FRLG_LEVEL_UP} from './torre2-frlg-learnsets.js';
import {GEN4_HGSS_KANTO_LEVEL_UP,GEN5_B2W2_KANTO_LEVEL_UP} from './torre2-gen45-kanto-learnsets.js';
import {GEN7_LETSGO_LEVEL_UP} from './torre2-gen7-letsgo-learnsets.js';

const input=process.argv[2]||'site-capture/POKEARENA-MOVE-AUDIT.json';
const output=process.argv[3]||'data/pokearena2d-source-moves.json';
const changeOutput=process.argv[4]||'data/pokearena2d-source-changes.json';
const normalize=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const audit=JSON.parse(fs.readFileSync(input,'utf8'));
if(audit.source!=='https://www.pokearena2d.com/'||!Array.isArray(audit.originalMoves)||audit.originalMoves.length<100)
 throw Error('Invalid or incomplete original Poké Arena 2D audit: refusing to replace catalog');
if((audit.deduplication?.collisions||[]).length||(audit.deduplication?.duplicatedSelections||[]).length)
 throw Error('Move collisions in source audit');
const historic=fs.existsSync(output)?JSON.parse(fs.readFileSync(output,'utf8')):null;
const sources=[
 ['FRLG_G3',FRLG_LEVEL_UP],
 ['HGSS_G4',GEN4_HGSS_KANTO_LEVEL_UP],
 ['B2W2_G5',GEN5_B2W2_KANTO_LEVEL_UP],
 ['LETSGO_G7',GEN7_LETSGO_LEVEL_UP]
];
const kantoSpecies=Object.keys(FRLG_LEVEL_UP).sort();
const compatibleKanto=move=>{
 const moveId=normalize(move);
 return kantoSpecies.flatMap(species=>{
  const sourcesForSpecies=[];
  for(const [edition,learnsets] of sources){
   const data=learnsets?.[species]||{};
   for(const [name,level] of Object.entries(data)){
    if(normalize(name)!==moveId||!Number.isInteger(level)||level<0)continue;
    sourcesForSpecies.push({edition,level,method:'level-up'});
   }
  }
  return sourcesForSpecies.length?[{species,sources:sourcesForSpecies}]:[];
 });
};
const seen=new Set();
const moves=audit.originalMoves.map(move=>{
 const id=normalize(move.name);
 if(!id||seen.has(id))throw Error('Duplicate/invalid native move ID: '+String(move.name));
 seen.add(id);
 return {
  id,
  name:move.name,
  types:[...new Set(move.types||[])].sort(),
  forms:[...new Set(move.forms||[])].sort(),
  nativeExamples:(move.examples||[]).map(e=>({pokemon:e.pokemon,stage:e.stage,slot:e.slot})),
  nativeScopes:[...new Set(move.sources||[])].sort(),
  compatibleKantoByVerifiedLevelUp:compatibleKanto(move.name),
  integration:'native-source-metadata; not automatically equipped'
 };
}).sort((a,b)=>a.id.localeCompare(b.id));
const nativePokemon=[...new Set(moves.flatMap(m=>m.nativeExamples.map(e=>String(e.pokemon))))].sort();
const version=audit.version?.modules||audit.version||null;
if(!version)throw Error('Source version missing: catalog not updated');
const catalog={
 schemaVersion:1,
 source:'https://www.pokearena2d.com/',
 sourceVersion:version,
 note:'Only confirmed native source names. Kanto compatibility is official level-up metadata; battle availability, VFX, user-approved ULT rules and save safety still require independent validation.',
 originalMoveCount:moves.length,
 nativePokemonCount:nativePokemon.length,
 nativePokemon,
 moves
};
const prevMoves=new Map((historic?.moves||[]).map(move=>[move.id,move]));
const nextMoves=new Map(moves.map(move=>[move.id,move]));
const additions=moves.filter(m=>!prevMoves.has(m.id)).map(m=>({id:m.id,name:m.name,compatibleKanto:m.compatibleKantoByVerifiedLevelUp.map(x=>x.species)}));
const removals=[...prevMoves.values()].filter(m=>!nextMoves.has(m.id)).map(m=>({id:m.id,name:m.name}));
const changed=moves.filter(m=>prevMoves.has(m.id)&&JSON.stringify(prevMoves.get(m.id))!==JSON.stringify(m)).map(m=>({id:m.id,name:m.name}));
const newSpecies=nativePokemon.filter(s=>!(historic?.nativePokemon||[]).includes(s));
const change={
 schemaVersion:1,source:catalog.source,previousVersion:historic?.sourceVersion||null,
 currentVersion:version,comparison:historic?'differential':'initial-baseline',
 additions:historic?additions:[],removals:historic?removals:[],changed:historic?changed:[],
 newSourcePokemon:historic?newSpecies:[],
 initialSnapshotCount:historic?null:moves.length,
 action:'Cataloged for reuse; validate renderers, licensing, legal Kanto learning, approval and campaign gates before editing battle kits.'
};
function writeIfChanged(file,value){
 const contents=JSON.stringify(value,null,2)+'\n';
 if(fs.existsSync(file)&&fs.readFileSync(file,'utf8')===contents)return false;
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,contents);
 return true;
}
const catalogWritten=writeIfChanged(output,catalog);
const noteworthy=!historic||additions.length||removals.length||changed.length||newSpecies.length;
const changesWritten=noteworthy?writeIfChanged(changeOutput,change):false;
console.log(JSON.stringify({sourceVersion:version,originalMoves:moves.length,nativePokemon:nativePokemon.length,
 baseline:!historic,newMoves:historic?additions.length:0,removed:historic?removals.length:0,
 modified:historic?changed.length:0,newSourcePokemon:historic?newSpecies:[],catalogWritten,changesWritten},null,2));
