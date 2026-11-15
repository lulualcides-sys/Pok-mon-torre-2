/* Licensed visual substitutes for exactly the Alpha 0.70 forms whose original
 * CDN packages return HTTP 403. Default species artwork is NOT the original
 * Squad/Gengar skin. Never override any available source-authentic artwork.
 * Attribution: PMD SpriteCollab, CC BY-NC 4.0 (noncommercial).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {auditNativePacks} from './audit-native-packs.mjs';
export const ALLOWED_VISUAL_SUBSTITUTES=Object.freeze([
 '0007-squad','0008-squad','0009-squad',
 '0092-amarillogengar','0092-azabachegengar','0092-naranjagengar','0092-shinygengar',
 '0093-amarillogengar','0093-azabachegengar','0093-naranjagengar','0093-shinygengar',
 '0094-amarillogengar','0094-azabachegengar','0094-blancofucsiagengar','0094-naranjagengar','0094-shinygengar',
 '0146','0146-aureo','0146-sombrio'
]);
const BASE='https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/';
const digest=b=>createHash('sha256').update(b).digest('hex');
export function validPng(b,meta){
 if(!Buffer.isBuffer(b)||b.length<128||b.length>8*1024*1024||
    !b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return false;
 if(!meta)return true;
 const w=b.readUInt32BE(16),h=b.readUInt32BE(20);
 return w>=meta.fw*(meta.durations?.length||1)&&h>=meta.fh&&
  w%meta.fw===0&&h%meta.fh===0;
}
export async function stageLicensedVisualSubstitutes(root,download=fetch){
 const audit=await auditNativePacks(root);
 const forms=audit.gaps.map(g=>g.dex).sort(),allowed=new Set(ALLOWED_VISUAL_SUBSTITUTES);
 if(forms.some(x=>!allowed.has(x)))throw Error('Unexpected native missing art; strict release block: '+forms.join(','));
 if(!forms.length)return {forms:[],files:[],sourceAuthentic:true};
 const version=JSON.parse(await fs.readFile(path.join(root,'version.json'),'utf8'));
 if(version.officialAlpha!=='0.70.0'||version.src!=='src-3cc4979f18')
  throw Error('Source/version changed; the authorized visual substitute list must be reviewed');
 const manifest=JSON.parse(await fs.readFile(path.join(root,'assets/pmd/manifest.json'),'utf8'));
 const html=await fs.readFile(path.join(root,'index.html'),'utf8');
 const packs=JSON.parse(html.match(/<script[^>]*id=["']paq["'][^>]*>([\s\S]*?)<\/script>/)?.[1]||'null');
 const req=new Map();
 for(const dex of forms){
  if(!packs.formas?.[dex]||!manifest[dex]?.anims?.Idle)
   throw Error('Unknown original pack or no Idle metadata: '+dex);
  const base=dex.slice(0,4),entry=manifest[dex];
  for(const m of Object.values(entry.anims)){
   if(!m.file?.startsWith(dex+'/')||!/^[A-Za-z]+-Anim\.png$/.test(m.file.slice(dex.length+1)))
    throw Error('Unexpected original PMD path: '+m.file);
   const file=m.file.slice(dex.length+1),key=base+'/'+file;
   const group=req.get(key)||{base,file,metadata:[]};
   group.metadata.push(m);req.set(key,group);
  }
  req.set(base+'/portrait.png',{base,file:'portrait.png',metadata:[]});
 }
 const bytes=new Map();
 for(const [key,item] of req){
  const src=item.file==='portrait.png'?'portrait/'+item.base+'/Normal.png':
   'sprite/'+item.base+'/'+item.file;
  const candidates=[src,src.replace(/^(sprite|portrait)\/(\d{4})\//,'$1/$2/0000/0001/')];
  let b,uri;
  for(const rel of [...new Set(candidates)]){
   const url=BASE+rel,response=await download(url,{signal:AbortSignal.timeout(22000)});
   if(response.ok){b=Buffer.from(await response.arrayBuffer());uri=url;break}
   if(response.status!==404)throw Error('Licensed source inaccessible: '+key+' HTTP '+response.status);
  }
  if(!b||item.metadata.some(m=>!validPng(b,m))||!validPng(b))
   throw Error('Licensed source image missing/incompatible: '+key);
  bytes.set(key,{data:b,sha256:digest(b),source:uri});
 }
 // No changes until every source image passes PNG+frame checks.
 const files=[];
 for(const dex of forms){
  const entry=manifest[dex],base=dex.slice(0,4);
  const list=new Set(['portrait.png',...Object.values(entry.anims).map(a=>a.file.slice(dex.length+1))]);
  for(const file of list){
   const rel=dex+'/'+file,source=bytes.get(base+'/'+file);
   const dest=path.join(root,'assets/pmd',rel);
   try{await fs.access(dest);throw Error('Never replace existing original art: '+rel)}
   catch(e){if(e.code!=='ENOENT')throw e}
   await fs.mkdir(path.dirname(dest),{recursive:true});
   await fs.writeFile(dest,source.data,{flag:'wx'});
   files.push({relative:rel,source:source.source,sha256:source.sha256,bytes:source.data.length});
  }
 }
 const report={alpha:version.officialAlpha,sourceDir:version.src,
  sourceAuthentic:false,license:'CC BY-NC 4.0 - PMD SpriteCollab',
  visualSubstituteCount:forms.length,forms,
  clearlyNotOriginalCostumeArt:true,
  files};
 await fs.writeFile(path.join(root,'assets/pmd/torre2-visual-substitutes.json'),
  JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 const covered=await auditNativePacks(root);
 if(covered.missingFormCount)throw Error('Incomplete substitute image coverage');
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 stageLicensedVisualSubstitutes(path.resolve(process.argv[2]||'site-capture/pokearena-client'))
 .then(r=>console.log('LICENSED_VISUAL_SUBSTITUTES',JSON.stringify({count:r.forms.length,files:r.files.length,original:false})))
 .catch(e=>{console.error(e);process.exitCode=1});
}
