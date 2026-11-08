#!/usr/bin/env node
/* REA changelog-to-backlog gate: consumes sanitized, independently observed
 * official browser scripts and existing archived provenance. No source copies.
 * A new Alpha is evidence of changed native behavior, NOT game integration.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

export function compareAlpha(a,b){
 const p=s=>String(s||'').split('.').map(Number);
 if(!/^\d+\.\d+(?:\.\d+)?$/.test(a||'')||
    !/^\d+\.\d+(?:\.\d+)?$/.test(b||''))return null;
 const x=p(a),y=p(b);
 for(let i=0;i<3;i++){const d=(x[i]||0)-(y[i]||0);if(d)return Math.sign(d);}
 return 0;
}
const movePriority=(note)=>{
 const txt=(note.title+' '+note.description+' '+(note.bullets||[]).join(' ')).toLowerCase();
 if(/deoxys/.test(txt))return {priority:'P0',domain:'deoxys-forms',
  work:'Compare current native stats/form-switch, Speed Deoxys ULT dodge and hit logic; implement only original compatible delta in Arena after focused tests'};
 if(/lucario|riolu|close combat/.test(txt))return {priority:'P1',domain:'riolu-lucario',
  work:'Compare native Close Combat/movesets and reworked hitbox/cooldown; preserve approved effects'};
 if(/performance|faster|mobile/.test(txt))return {priority:'P2',domain:'performance',
  work:'Profile FPS/load without altering approved maps and sprites'};
 return {priority:'P3',domain:'other',
  work:'Review; skip source-only menus, online accounts and non-campaign features unless required'};
};
export function buildVerifiedBacklog(archive,live){
 const archived=archive?.alpha?.lastConfirmedFromArchivedConfig;
 const current=live?.liveAlpha;
 const config=live?.officialScripts?.find(s=>s.name==='config.js');
 const notes=live?.officialScripts?.find(s=>s.name==='notas.js');
 const verified=Boolean(current&&live.liveVersionEvidence==='REA_CDP_PUBLIC_CONFIG_JS'&&
  config?.included&&notes?.included&&compareAlpha(current,archived)!==null);
 const releases=verified?(live.latestChangelog||[])
  .filter(n=>compareAlpha(n.alpha,archived)>0)
  .map(n=>({...n,...movePriority(n)})):[];
 const deltas=(live?.verifiedSpeciesDelta||[]).filter(d=>d.recordChanged===true)
  .map(d=>({id:d.id,previousSha256:d.old?.sha256,currentSha256:d.new?.sha256,
   previousForms:d.old?.forms,currentForms:d.new?.forms,
   previousMoves:d.old?.namedMoves,currentMoves:d.new?.namedMoves}));
 return {
  schemaVersion:1,source:'https://www.pokearena2d.com/',
  observedAt:new Date().toISOString(),
  liveVersionVerified:verified,
  liveAlpha:verified?current:null,
  previousArchiveAlpha:archived||null,
  homepageHash:live?.officialScripts?.find(s=>s.name==='config.js')?.url?.match(/src-[0-9a-f]{10}/)?.[0]??null,
  provenance:{reaEvidenceId:live?.evidenceId||null,
   officialConfigSha256:config?.cdpHash||null,officialNotesSha256:notes?.cdpHash||null,
   copiedSourceToGame:false,codeReadableFromBrowser:config?.included===true},
  newReleaseNotes:releases,
  comparedNativeKits:deltas,
  nextFunctionalWork:verified?releases.filter(x=>x.priority==='P0'||x.priority==='P1')
   .map(x=>({release:x.alpha,domain:x.domain,work:x.work})):[],
  catalogOnly:[],
  implementedIntoArena:[],
  warnings:verified?[
   'Public source version verified; changes must not be marked playable without independent Phaser tests.',
   'Current Deoxys and Lucario kits are native third-party code; no automatic copy/replacement is authorized.'
  ]:['Current Alpha unverified; do not assert upstream version or install speculative moves.']
 };
}
async function main(){
 const [archiveFile,liveFile,outFile]=process.argv.slice(2);
 if(!archiveFile||!liveFile||!outFile)throw Error('Usage: REA-archive.json REA-live-summary.json OUT.json');
 const archive=JSON.parse(await fs.readFile(archiveFile,'utf8'));
 const live=JSON.parse(await fs.readFile(liveFile,'utf8'));
 const result=buildVerifiedBacklog(archive,live);
 await fs.mkdir(path.dirname(outFile),{recursive:true});
 await fs.writeFile(outFile,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({verified:result.liveVersionVerified,
  latestAlpha:result.liveAlpha,newNotes:result.newReleaseNotes.length,
  nativeKitsChanged:result.comparedNativeKits.map(x=>x.id),
  priority:result.nextFunctionalWork},null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname))
 main().catch(e=>{console.error(e);process.exitCode=1});
