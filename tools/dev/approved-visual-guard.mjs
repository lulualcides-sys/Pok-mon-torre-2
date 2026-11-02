/** Verify explicit static visual references without a Phaser build. */
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,isAbsolute,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

export function gitBlobSha(data){
 const bytes=Buffer.isBuffer(data)?data:Buffer.from(data);
 return createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
}
function safePath(value,root){
 if(typeof value!=='string'||!value||isAbsolute(value)||value.includes('\\')||value.includes('\0'))return false;
 const parts=value.split('/');
 if(parts.some(part=>part===''||part==='.'||part==='..'))return false;
 const absolute=resolve(root,value),rel=relative(root,absolute);
 return rel!==''&&!rel.startsWith('..'+sep)&&rel!=='..'&&!isAbsolute(rel);
}
export async function checkApprovedVisualAssets(manifest,root=process.cwd()){
 const failures=[];
 if(!manifest||manifest.schemaVersion!==1||!Array.isArray(manifest.assets)||manifest.assets.length===0)
  return {ok:false,checked:0,failures:[{path:'<manifest>',reason:'invalid or empty approved visual baseline'}]};
 const seen=new Set();
 for(const item of manifest.assets){
  const p=item?.path??'<invalid>';
  if(!safePath(p,root)||!/^[a-f0-9]{40}$/.test(item?.gitBlobSha||'')||seen.has(p))
   failures.push({path:p,reason:'invalid path, SHA, or duplicate entry'});
  seen.add(p);
 }
 if(failures.length)return {ok:false,checked:0,failures};
 for(const {path,gitBlobSha:expected} of manifest.assets){
  try{
   const bytes=await readFile(resolve(root,path));
   if(bytes.length===0){failures.push({path,reason:'empty visual asset'});continue;}
   const current=gitBlobSha(bytes);
   if(current!==expected)failures.push({path,reason:'checksum mismatch (approved reference modified)',expected,actual:current});
  }catch(e){failures.push({path,reason:e?.code==='ENOENT'?'approved visual asset missing':'could not read approved visual asset'});}
 }
 return {ok:failures.length===0,checked:manifest.assets.length,failures};
}
async function main(){
 const args=process.argv.slice(2);
 const value=(flag,fallback)=>{const index=args.indexOf(flag);return index<0?fallback:args[index+1]};
 const root=resolve(value('--root',process.cwd()));
 const manifestPath=resolve(root,value('--manifest','data/approved-visual-baseline.json'));
 const outputPath=resolve(root,value('--out','test-evidence/visual-guard/asset-result.json'));
 let result;
 try{const manifest=JSON.parse(await readFile(manifestPath,'utf8'));result=await checkApprovedVisualAssets(manifest,root)}
 catch(e){result={ok:false,checked:0,failures:[{path:'<manifest>',reason:'missing/unreadable approved visual baseline: '+e.message}]};}
 await mkdir(dirname(outputPath),{recursive:true});
 await writeFile(outputPath,JSON.stringify({...result,source:'approved-visual-guard'},null,2)+'\n');
 console.log(result.ok?'VISUAL ASSETS OK: '+result.checked+' locked references':'VISUAL ASSETS FAILED: '+JSON.stringify(result.failures));
 if(!result.ok)process.exitCode=1;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
