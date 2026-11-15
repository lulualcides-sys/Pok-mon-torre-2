/* Exact third-party PNG credit audit for Alpha 0.71.3.
 * This audits the actual source file for EVERY installed fallback animation,
 * not only Idle/Attack. No art download, bypass, release, or license invention.
 * A project-wide CC BY-NC policy does not override individual credits.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {PRIORITY_FORMS} from './priority-licensed-pmd.mjs';
import {ALLOWED_VISUAL_SUBSTITUTES} from './stage-licensed-visual-substitutes.mjs';
const ROOT='https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/';
const SHA=s=>createHash('sha256').update(s).digest('hex');
const expected=[...PRIORITY_FORMS,...ALLOWED_VISUAL_SUBSTITUTES];
export function creditSource(url){
 if(typeof url!=='string'||!url.startsWith(ROOT))throw Error('Unexpected artist asset origin');
 const rel=url.slice(ROOT.length);
 if(!/^(?:sprite|portrait)\/[0-9]{4}(?:\/[0-9]{4}){0,2}\/(?:Normal|[A-Za-z0-9]+-Anim)\.png$/.test(rel))
  throw Error('Unsafe or unsupported artist PNG path');
 const dir=rel.slice(0,rel.lastIndexOf('/'));
 const basename=rel.slice(rel.lastIndexOf('/')+1);
 return {creditUrl:ROOT+dir+'/credits.txt',
  creditPath:dir+'/credits.txt',animation:basename==='Normal.png'?'Normal':basename.slice(0,-9)};
}
export function classifyCurrentCredits(content,animation){
 if(typeof content!=='string'||content.length>150000)throw Error('Invalid artist credit content');
 const credits=[];
 for(const line of content.split(/\r?\n/).filter(Boolean)){
  const c=line.split('\t');
  if(c.length<5)throw Error('Malformed artist credit row');
  if(c[2]!=='CUR')continue;
  if(c[4].split(',').map(x=>x.trim()).includes(animation))
   credits.push({artist:c[1],license:c[3]});
 }
 if(!credits.length)return {status:'MISSING_CURRENT_CREDIT',artists:[]};
 if(credits.some(x=>!x.artist||!x.license||
   x.artist.length>120||x.license.length>80))
  return {status:'MALFORMED_AUTHOR',artists:credits};
 if(credits.some(x=>x.license==='Unspecified'||x.artist==='CHUNSOFT'))
  return {status:'UNSPECIFIED_RIGHTS',artists:credits};
 if(credits.every(x=>x.license==='CC_BY-NC_4'))
  return {status:'ALL_CURRENT_CC_BY_NC',artists:credits};
 // PMDCollab's contribution policy explicitly permits noncommercial
 // reuse with attribution, but does not grant the Pokemon trademark/IP.
 if(credits.every(x=>['CC_BY-NC_4','PMDCollab_1','PMDCollab_2'].includes(x.license)))
  return {status:'POLICY_NONCOMMERCIAL_CREDITED',artists:credits};
 return {status:'OTHER_LICENSE_REVIEW',artists:credits};
}
export function collectProvenances(priority,alternatives,forms=expected){
 if(!Array.isArray(forms)||new Set(forms).size!==forms.length)throw Error('Duplicate expected forms');
 const result=new Map(forms.map(id=>[id,[]]));
 const seen=new Set();
 const add=(form,record)=>{
  if(!result.has(form)||typeof record.relative!=='string'||!record.relative.startsWith(form+'/'))
   throw Error('Unexpected recorded fallback form or filename');
  if(seen.has(record.relative))throw Error('Duplicate art provenance: '+record.relative);
  seen.add(record.relative);
  const source=creditSource(record.source);
  result.get(form).push({relative:record.relative,source:record.source,...source});
 };
 for(const item of priority?.licensed||[]){
  if(!Array.isArray(item.files))throw Error('Missing priority file audit');
  for(const file of item.files)add(item.dex,file);
 }
 for(const file of alternatives?.files||[]){
  const id=file.relative?.split('/')[0];
  add(id,file);
 }
 return result;
}
export async function auditSourceRights(root,directory,fetcher=fetch,{forms=expected}={}){
 const dest=path.resolve(directory);
 if(!dest.split(path.sep).includes('site-capture')||dest.includes('_site')||
   !dest.split(path.sep).includes('rights-provenance'))
  throw Error('Rights evidence must remain outside public site');
 const client=path.resolve(root);
 const version=JSON.parse(await fs.readFile(path.join(client,'version.json'),'utf8'));
 if(version.officialAlpha!=='0.71.3'||version.src!=='src-5ccc174cb8')
  throw Error('Unexpected official Alpha/source for rights audit');
 const [p,a]=await Promise.all([
  fs.readFile(path.join(client,'priority-licensed-pmd-report.json'),'utf8').then(JSON.parse),
  fs.readFile(path.join(client,'assets/pmd/torre2-visual-substitutes.json'),'utf8').then(JSON.parse)
 ]);
 if(p.alpha!==version.officialAlpha||p.src!==version.src||
  a.alpha!==version.officialAlpha||a.sourceDir!==version.src||
  p.redistributionCleared!==false||a.redistributionCleared!==false)
  throw Error('Invalid quarantined source/version evidence');
 const list=collectProvenances(p,a,forms);
 const cache=new Map();
 let requested=0;
 async function getCredit(url){
  if(cache.has(url))return cache.get(url);
  if(!url.startsWith(ROOT)||!url.endsWith('/credits.txt'))
   throw Error('Untrusted credit URL');
  if(++requested>50)throw Error('Rights audit HTTP budget exceeded');
  let answer;
  try{
   const r=await fetcher(url,{redirect:'error',signal:AbortSignal.timeout(12000)});
   if(r.status!==200)answer={status:r.status===404?'NO_CREDIT_FILE':'HTTP_'+r.status};
   else if(r.url&&!r.url.startsWith(ROOT))answer={status:'REDIRECT_BLOCKED'};
   else{
    const body=await r.text();
    if(body.length>150000)throw Error('Oversize credits');
    answer={status:'OK',text:body,sha256:SHA(body)};
   }
  }catch(e){answer={status:'FETCH_ERROR',reason:String(e.message).slice(0,120)}}
  cache.set(url,answer);return answer;
 }
 const rows=[];
 for(const [dex,entries] of list){
  const used=[],states=[];
  for(const x of entries){
   const credit=await getCredit(x.creditUrl);
   let verdict={status:credit.status,artists:[]};
   if(credit.status==='OK'){
    try{verdict=classifyCurrentCredits(credit.text,x.animation)}
    catch(e){verdict={status:'MALFORMED_CREDITS',reason:e.message,artists:[]}}
   }
   used.push({relative:x.relative,source:x.source,creditFile:x.creditPath,
    creditSha256:credit.sha256||null,animation:x.animation,
    status:verdict.status,artists:verdict.artists,reason:verdict.reason||null});
   states.push(verdict.status);
  }
  const allowedStates=['ALL_CURRENT_CC_BY_NC','POLICY_NONCOMMERCIAL_CREDITED'];
  const creatorPermitted=entries.length>0&&states.every(x=>allowedStates.includes(x));
  const state=!entries.length?'NO_FILES':states.every(x=>x==='ALL_CURRENT_CC_BY_NC')
   ?'CC_BY_NC_CONTRIBUTOR_CREDITS':creatorPermitted
   ?'NONCOMMERCIAL_POLICY_CONTRIBUTOR_CREDITS':'NEEDS_RIGHTS_REVIEW';
  rows.push({dex,state,files:used,
   verifiedContributors:creatorPermitted,
   redistributionCleared:false,
   note:'Contributor credits do not prove rights over Pokemon franchise or authenticity of costume variants'});
 }
 const summary={forms:rows.length,
  contributorCC:rows.filter(r=>r.state==='CC_BY_NC_CONTRIBUTOR_CREDITS').length,
  contributorNoncommercial:rows.filter(r=>r.state==='NONCOMMERCIAL_POLICY_CONTRIBUTOR_CREDITS').length,
  rightsReview:rows.filter(r=>!r.verifiedContributors).length,
  missingFileCredits:rows.reduce((n,r)=>n+r.files.filter(f=>f.status==='MISSING_CURRENT_CREDIT'||f.status==='NO_CREDIT_FILE').length,0),
  externalCreditsRequested:requested};
 const report={alpha:version.officialAlpha,src:version.src,summary,forms:rows,
  releaseApproved:false,officialSourceAuthentic:false,
  licenses:['CC_BY-NC_4','PMDCollab_1','PMDCollab_2','Unspecified'],
  licenseTerms:'https://creativecommons.org/licenses/by-nc/4.0/',
  sourceRepo:'https://github.com/PMDCollab/SpriteCollab'};
 await fs.mkdir(dest,{recursive:true});
 await fs.writeFile(path.join(dest,'rights-audit-0713.json'),JSON.stringify(report,null,2)+'\n');
 // Copy into isolated candidate root so the native coverage gate can cross-
 // check individual art provenance against these very same signed-upstream
 // author credit rows. This is NOT a publication or license waiver.
 await fs.writeFile(path.join(client,'rights-audit-0713.json'),JSON.stringify(report,null,2)+'\n');
 await fs.writeFile(path.join(dest,'CONTRIBUTOR-CREDITS-0713.md'),
 '# Source-art contributors: Alpha 0.71.3\n\n'+
 'Noncommercial SpriteCollab submission policy: https://github.com/PMDCollab/SpriteCollab\n'+
 'CC BY-NC 4.0: https://creativecommons.org/licenses/by-nc/4.0/\n'+
 'These artist permissions do NOT prove rights over the Pokemon franchise.\n\n'+
 rows.flatMap(r=>r.files.filter(f=>['ALL_CURRENT_CC_BY_NC','POLICY_NONCOMMERCIAL_CREDITED'].includes(f.status)).map(f=>
  '- '+r.dex+' — '+f.animation+': '+f.artists.map(a=>a.artist+' ('+a.license+')').join(', ')+
  '; source '+f.source+'; modified for the Torre 2 private diagnostic')).join('\n')+'\n');
 console.log('EXACT_PMD_RIGHTS_AUDIT',JSON.stringify(summary));
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 auditSourceRights(process.argv[2]||'site-capture/pokearena-client',
  process.argv[3]||'site-capture/rights-provenance')
 .catch(e=>{console.error(e);process.exitCode=1});
