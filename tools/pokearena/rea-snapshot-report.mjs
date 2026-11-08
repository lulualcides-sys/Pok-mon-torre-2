#!/usr/bin/env node
/* REA provenance gate: version-aware report from a captured public JS client.
 * Read-only. Never substitutes src hashes for Alpha release numbers.
 * No copied JS/assets are committed; captured files remain CI inputs only.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

export function parseOfficialVersion(config){
 const m=String(config).match(/\b(?:const|let)\s+VERSION\s*=\s*["'](\d+\.\d+(?:\.\d+)?)["']/);
 return m?.[1]??null;
}
export function parseOfficialNotes(notes){
 return [...String(notes).matchAll(/\{version:"(\d+\.\d+(?:\.\d+)?)",fecha:"([^"]+)",titulo:"([^"]+)"/g)]
  .map(m=>({alpha:m[1],date:m[2],title:m[3]}));
}
export function findSiteHash(html){
 return [...String(html).matchAll(/\bsrc-[0-9a-f]{10}\b/g)].map(m=>m[0])[0]??null;
}
export function distinguishStatus(snapshot,siteHash){
 if(!siteHash)return 'site-version-not-verified';
 return siteHash===snapshot?'homepage-hash-unchanged':'homepage-hash-changed-alpha-unverified';
}
export function makeSnapshotReport({config,notes,sourceData,archive,siteHash=null,siteStatus=null}){
 const officialAlpha=parseOfficialVersion(config);
 if(!officialAlpha)throw Error('Version missing in captured official config.js');
 const changelog=parseOfficialNotes(notes);
 if(!changelog.some(n=>n.alpha===officialAlpha))
  throw Error('Archived version not found in changelog: '+officialAlpha);
 const observedMoves=Array.isArray(sourceData?.moves)?sourceData.moves.length:null;
 return {
  schemaVersion:1,
  generatedAt:new Date().toISOString(),
  source:'https://www.pokearena2d.com/',
  alpha:{
   lastConfirmedFromArchivedConfig:officialAlpha,
   currentLive:null,
   verification:'ARCHIVED_SOURCE_ONLY_NO_LIVE_ALPHA_ASSERTION'
  },
  archive,
  site:{
   htmlStatus:siteStatus,
   homepageHash:siteHash,
   hashComparison:distinguishStatus(sourceData?.siteVersion,siteHash),
   note:'Homepage src hash and JS module hash may differ; hashes are not Alpha numbers.'
  },
  baseCatalog:{
   alpha:null,
   siteVersion:sourceData?.siteVersion??null,
   moduleVersion:sourceData?.sourceVersion??null,
   moveCount:observedMoves,
   note:'Catalog metadata is not installed/playable attack proof.'
  },
  archivedNotes:changelog,
  knownRelevantChanges:changelog.filter(n=>['0.64.2','0.65.0','0.65.1'].includes(n.alpha)),
  limitations:[
   'Archive is NOT evidence of the present live Alpha release.',
   'REA static graph identifies modules/imports but does not prove that a move is playable.',
   'Do not reproduce source or unlicensed assets in the Torre 2 public game.',
   'When the official host responds HTTP 403, stop; do not bypass controls.'
  ]
 };
}

async function main(){
 const archiveDir=process.argv[2];
 const output=process.argv[3];
 if(!archiveDir||!output)throw Error('Usage: node rea-snapshot-report.mjs SNAPSHOT_DIR OUT.json');
 const config=await fs.readFile(path.join(archiveDir,'config.js'),'utf8');
 const notes=await fs.readFile(path.join(archiveDir,'notas.js'),'utf8');
 const sourceData=JSON.parse(await fs.readFile('data/pokearena2d-source-moves.json','utf8'));
 let siteHash=null,siteStatus=null;
 try{
  const res=await fetch('https://www.pokearena2d.com/',{
   signal:AbortSignal.timeout(12000),
   headers:{Accept:'text/html'}
  });
  siteStatus=res.status;
  if(res.ok)siteHash=findSiteHash(await res.text());
 }catch(error){siteStatus='unavailable:'+String(error.message).slice(0,130);}
 const report=makeSnapshotReport({
  config,notes,sourceData,
  archive:{path:archiveDir,provenanceBranch:'pokearena2d-cliente-phaser'},
  siteHash,siteStatus
 });
 await fs.mkdir(path.dirname(output),{recursive:true});
 await fs.writeFile(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({
  archivedAlpha:report.alpha.lastConfirmedFromArchivedConfig,
  liveAlpha:report.alpha.currentLive,siteHash,
  status:report.site.hashComparison,notes:report.knownRelevantChanges
 },null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname))
 main().catch(e=>{console.error(e);process.exitCode=1;});
