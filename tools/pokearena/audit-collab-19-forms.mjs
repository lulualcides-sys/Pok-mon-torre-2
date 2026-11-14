/* Public SpriteCollab CREDIT inventory for 19 *unresolved* Alpha 0.71.3
 * forms. This never installs art, alters a client, bypasses 403 or declares
 * that a base Pokemon asset matches a costume/recolor. Its only output is
 * an isolated, revision-scoped reference/rights audit.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {contextFor} from './native-progress-folders.mjs';
import {ALLOWED_VISUAL_SUBSTITUTES} from './stage-licensed-visual-substitutes.mjs';
import {auditNativePacks} from './audit-native-packs.mjs';

const BASE='https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/';
const SHA=value=>createHash('sha256').update(value).digest('hex');
const FAMILY_IDS=Object.freeze({
 'squirtle-squad':Object.freeze(['0007-squad','0008-squad','0009-squad']),
 'gengar-line':Object.freeze([
  '0092-amarillogengar','0092-azabachegengar','0092-naranjagengar','0092-shinygengar',
  '0093-amarillogengar','0093-azabachegengar','0093-naranjagengar','0093-shinygengar',
  '0094-amarillogengar','0094-azabachegengar','0094-blancofucsiagengar',
  '0094-naranjagengar','0094-shinygengar'
 ]),
 moltres:Object.freeze(['0146','0146-aureo','0146-sombrio'])
});
const SOURCE=Object.freeze({
 '0007':['sprite/0007/0000/0001','portrait/0007/0000/0001'],
 '0008':['sprite/0008/0001','portrait/0008/0001'],
 '0009':['sprite/0009/0004','portrait/0009/0004'],
 '0092':['sprite/0092/0000/0001','portrait/0092/0000/0001'],
 '0093':['sprite/0093/0000/0001','portrait/0093/0000/0001'],
 '0094':['sprite/0094/0001','portrait/0094/0001'],
 '0146':['sprite/0146/0001','portrait/0146/0001'],
 '0146-aureo':['sprite/0146/0003','portrait/0146/0003'],
 // The third Moltres sprite set is NOT confirmed to be the shadow costume;
 // its portrait/0002/credits.txt is not currently present on GitHub.
 '0146-sombrio':['sprite/0146/0002','portrait/0146/0002']
});
export const COLLAB_19=Object.freeze(Object.entries(FAMILY_IDS).flatMap(([family,ids])=>
 ids.map(dex=>{
  const selected=SOURCE[dex]||SOURCE[dex.slice(0,4)];
  if(!selected)throw Error('No proposed Collab base mapping: '+dex);
  return Object.freeze({dex,family,sprite:selected[0],portrait:selected[1],
   exactCostumeMatch:false,redistributionCleared:false});
 })));
export function classifyCredits(raw,required){
 if(typeof raw!=='string'||raw.length>100000||!Array.isArray(required)||
  !required.length||required.some(x=>!/^[A-Za-z0-9]+$/.test(x)))
  throw Error('Invalid SpriteCollab credit input');
 const records=raw.split(/\r?\n/).filter(Boolean).map(line=>{
  const cols=line.split('\t');
  if(cols.length<5||!['CUR','OLD'].includes(cols[2])||
   !cols[1]||!cols[3]||cols[1].length>120||cols[3].length>60)
   throw Error('Malformed SpriteCollab credit row');
  return {artist:cols[1],state:cols[2],license:cols[3],
   applies:cols[4].split(',').map(x=>x.trim())};
 });
 const picked={};
 for(const animation of required){
  const authors=records.filter(r=>r.state==='CUR'&&r.applies.includes(animation));
  if(!authors.length)return {status:'MISSING_CURRENT_CREDIT',for:animation,credits:picked};
  picked[animation]=authors.map(({artist,license})=>({artist,license}));
 }
 const licences=Object.values(picked).flat().map(x=>x.license);
 let status='CC_BY_NC_CREDITED';
 if(licences.some(x=>x==='Unspecified'))status='UNSPECIFIED_RIGHTS';
 else if(licences.some(x=>x!=='CC_BY-NC_4'))status='MANUAL_RIGHTS_REVIEW';
 return {status,credits:picked};
}
const safeRel=s=>/^(?:sprite|portrait)\/[0-9]{4}(?:\/[0-9]{4}){0,2}\/credits\.txt$/.test(s);
export async function auditCollab19(rootArg,outputArg,fetcher=fetch){
 const c=await contextFor(rootArg);
 if(c.alpha!=='0.71.3'||c.src!=='src-5ccc174cb8')
  throw Error('Collab audit requires exact verified Alpha 0.71.3');
 const out=path.resolve(outputArg);
 if(!out.split(path.sep).includes('site-capture')||out.split(path.sep).includes('_site')||
  out.split(path.sep).includes('.git')||!out.includes('substitutes-quarantine'))
  throw Error('Collab audit must remain in isolated site-capture quarantine');
 const expected=new Set(ALLOWED_VISUAL_SUBSTITUTES);
 if(COLLAB_19.length!==19||COLLAB_19.some(f=>!expected.delete(f.dex))||expected.size)
  throw Error('Collab source mapping differs from official 19 unresolved IDs');
 const existing=new Set((await auditNativePacks(c.root)).gaps.map(g=>g.dex));
 const cache=new Map(),rows=[],summary={candidate:0,review:0,blocked:0,alreadyPresent:0};
 let requests=0;
 async function getCredit(dir){
  const rel=dir+'/credits.txt';
  if(!safeRel(rel))throw Error('Unsafe Collab credit path');
  if(cache.has(rel))return cache.get(rel);
  if(++requests>24)throw Error('Collab request budget exceeded');
  let item;
  try{
   const response=await fetcher(BASE+rel,{
    redirect:'error',signal:AbortSignal.timeout(12000)
   });
   if(response.status!==200){
    item={status:response.status===404?'MISSING_CREDIT_FILE':'HTTP_ERROR',
     httpStatus:response.status,path:rel};
   }else if(response.url&&!response.url.startsWith(BASE)){
    item={status:'UNEXPECTED_ORIGIN',path:rel};
   }else{
    const content=await response.text();
    if(content.length>100000||/<html[\s>]/i.test(content))throw Error('Non-credit response');
    item={status:'FETCHED',path:rel,sha256:SHA(content),content};
   }
  }catch(e){item={status:'FETCH_ERROR',path:rel,error:String(e.message).slice(0,120)}}
  cache.set(rel,item);
  return item;
 }
 const baseOut=path.join(out,c.alpha,c.src,c.indexSha256.slice(0,16));
 for(const f of COLLAB_19){
  const [sprite,portrait]=await Promise.all([getCredit(f.sprite),getCredit(f.portrait)]);
  const evaluate=(item,anims)=>{
   if(item.status!=='FETCHED')return {status:item.status,httpStatus:item.httpStatus};
   try{
    const x=classifyCredits(item.content,anims);
    return {...x,creditFile:item.path,sha256:item.sha256};
   }catch(e){return {status:'INVALID_CREDITS',error:e.message}}
  };
  const checks={sprite:evaluate(sprite,['Idle','Attack']),
   portrait:evaluate(portrait,['Normal'])};
  const statuses=[checks.sprite.status,checks.portrait.status];
  let stage=statuses.every(x=>x==='CC_BY_NC_CREDITED')?'candidate':
   statuses.some(x=>['UNSPECIFIED_RIGHTS','MISSING_CREDIT_FILE','INVALID_CREDITS','HTTP_ERROR','FETCH_ERROR','UNEXPECTED_ORIGIN','MISSING_CURRENT_CREDIT'].includes(x))?'blocked':'review';
  // Even a candidate with clear attribution remains reference ONLY:
  // the exact costume was not found in SpriteCollab.
  if(!existing.has(f.dex)){summary.alreadyPresent++;stage='already-present'}
  else summary[stage]++;
  const record={...f,stage,
   status:'NOT_A_RELEASE_ASSET',
   originalCostumeNotFound:true,releaseReady:false,
   requiresOriginalArtOrRightsReview:true,checks,
   sourceRepo:'https://github.com/PMDCollab/SpriteCollab',
   notes:'Reference base only. No costume fidelity, PMD animation compatibility or redistribution clearance inferred.'};
  const folder=stage==='candidate'?'candidatos':stage==='review'?'pendentes':
   stage==='already-present'?'verificados':'bloqueados';
  const target=path.join(baseOut,folder,f.family,f.dex+'.json');
  await fs.mkdir(path.dirname(target),{recursive:true});
  await fs.writeFile(target,JSON.stringify(record,null,2)+'\n');
  rows.push(record);
 }
 const report={alpha:c.alpha,src:c.src,indexSha256:c.indexSha256,
  scope:'SPRITECOLLAB_CREDIT_AUDIT_ONLY',sourceAuthentic:false,
  releaseReady:false,assetInstallCount:0,officialGaps:existing.size,
  count:rows.length,summary,creditRequests:requests,forms:rows};
 await fs.mkdir(baseOut,{recursive:true});
 await fs.writeFile(path.join(baseOut,'resumo.json'),JSON.stringify({
  ...report,forms:rows.map(x=>({dex:x.dex,stage:x.stage,family:x.family}))
 },null,2)+'\n');
 console.log('COLLAB_19_CREDIT_AUDIT',JSON.stringify({
  alpha:c.alpha,forms:rows.length,summary,creditRequests:requests,
  releaseReady:false,installed:0,directory:baseOut
 }));
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 auditCollab19(process.argv[2]||'site-capture/pokearena-client',
  process.argv[3]||'site-capture/substitutes-quarantine')
 .catch(e=>{console.error(e);process.exitCode=1});
