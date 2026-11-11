import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export async function auditNativePacks(root, readFile=fs.readFile, access=fs.access) {
  const html=await readFile(path.join(root,'index.html'),'utf8');
  const match=html.match(/<script[^>]*id=["']paq["'][^>]*>([\s\S]*?)<\/script>/);
  if(!match)throw Error('Missing official native package index');
  const index=JSON.parse(match[1]);
  const manifest=JSON.parse(await readFile(path.join(root,'assets/pmd/manifest.json'),'utf8'));
  const exists=async p=>{try{await access(p);return true}catch{return false}};
  const gaps=[],forms=Object.entries(index.formas||{});
  let verifiedPacks=0, verifiedLoose=0;
  const common=index.comun;
  if(!/^[0-9a-f]{20}$/.test(common||'')||!await exists(path.join(root,'assets/p',common+'.bin')))
    throw Error('Native common pack missing or invalid');
  for(const [dex,pack] of forms) {
    if(!/^[0-9]{4}(?:-[a-z0-9]+)*$/.test(dex)||!/^[0-9a-f]{20}$/.test(pack))
      throw Error('Unsafe or malformed native dex or package id');
    if(await exists(path.join(root,'assets/p',pack+'.bin'))) {verifiedPacks++;continue;}
    const meta=manifest[dex];
    if(!meta?.anims?.Idle) {gaps.push({dex,pack,missing:['manifest entry/Idle']});continue;}
    const rels=[dex+'/portrait.png',...Object.values(meta.anims).map(x=>x.file)];
    const missing=[];
    for(const rel of new Set(rels)) {
      if(!/^[0-9]{4}(?:-[a-z0-9]+)*\/[A-Za-z0-9_-]+(?:-Anim)?\.png$/.test(rel)||!rel.startsWith(dex+'/'))
        throw Error('Unsafe native sprite path: '+rel);
      if(!await exists(path.join(root,'assets/pmd',rel)))missing.push(rel);
    }
    if(missing.length)gaps.push({dex,pack,missing});else verifiedLoose++;
  }
  return {alphaReleaseCandidate:true,formCount:forms.length,verifiedPacks,verifiedLoose,missingFormCount:gaps.length,gaps,
    policy:'No missing official pack or verified original loose PNG may be replaced or forged; fail closed.'};
}
async function main(){
  const root=path.resolve(process.argv[2]||'site-capture/pokearena-client');
  const target=path.resolve(process.argv[3]||'site-capture/native-pack-gaps.json');
  const result=await auditNativePacks(root);
  await fs.mkdir(path.dirname(target),{recursive:true});
  await fs.writeFile(target,JSON.stringify(result,null,2)+'\n');
  console.log('NATIVE_PACK_COVERAGE',JSON.stringify({forms:result.formCount,packs:result.verifiedPacks,
    loose:result.verifiedLoose,missingForms:result.missingFormCount,gaps:result.gaps.map(x=>({dex:x.dex,pack:x.pack,missing:x.missing.length}))}));
  if(result.missingFormCount)throw Error('Official native client not buildable yet: '+result.missingFormCount+' forms lack their verified packs/loose sprites. No deploy.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e);process.exitCode=1});
