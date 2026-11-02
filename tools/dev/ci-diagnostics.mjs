/** Compact, privacy-conscious summary of test evidence already produced by CI. */
import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const SHORT=(value,max=650)=>String(value??'').replace(/[\r\n\t]+/g,' ').slice(0,max);
async function listEvidence(folder,base,files=[],depth=0){
 if(depth>3||files.length>=100)return files;
 let entries;try{entries=await readdir(folder,{withFileTypes:true})}catch{return files;}
 for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name))){
  if(files.length>=100)break;
  if(entry.name==='diagnostic.json'||entry.name==='diagnostic.md')continue;
  const full=join(folder,entry.name);
  if(entry.isDirectory())await listEvidence(full,base,files,depth+1);
  else if(entry.isFile()&&/\.(?:png|jpe?g|json|txt|log)$/.test(entry.name))
   files.push(relative(base,full).replaceAll('\\','/'));
 }
 return files;
}
export async function writeDiagnostics({root=process.cwd(),commit='',runId='',status='failure',stage='unknown'}={}){
 const ev=resolve(root,'test-evidence'),out=join(ev,'visual-guard');
 await mkdir(out,{recursive:true});
 const evidence=await listEvidence(ev,root);
 const checks=[];
 for(const filename of ['browser-result.json','asset-result.json']){
  try{
   const data=JSON.parse(await readFile(join(out,filename),'utf8'));
   const issue=data?.error??data?.failures?.[0]?.reason??(data?.ok===false?'Visual check failed':null);
   checks.push({file:'test-evidence/visual-guard/'+filename,ok:data.ok===true,
    issue:issue?SHORT(issue):null,scene:typeof data.scene==='string'?SHORT(data.scene,60):undefined});
  }catch{}
 }
 const report={schemaVersion:1,ok:status==='success'&&checks.every(x=>x.ok),status:SHORT(status,30),
  stage:SHORT(stage,70),commit:SHORT(commit,48),runId:SHORT(runId,30),checks,evidence};
 // Never embed raw logs, user saves, game team state, tokens or arbitrary JSON keys.
 const lines=['# Pokémon Torre 2 — diagnóstico automático','',
  '- Estado: **'+report.status+'**','- Etapa: '+report.stage,
  '- Commit: '+(report.commit||'não informado'),'- GitHub Actions: '+(report.runId||'não informado'),''];
 for(const item of checks)lines.push('- '+(item.ok?'PASS':'FAIL')+' — '+item.file+
  (item.issue?' — '+item.issue.replace(/[<>|]/g,' '):''));
 if(!checks.length)lines.push('- O job falhou antes da emissão do diagnóstico visual; consulte os logs do GitHub Actions.');
 lines.push('','## Imagens disponíveis');
 const images=evidence.filter(f=>/\.(?:png|jpe?g)$/.test(f)).slice(0,20);
 for(const file of images)lines.push('- '+file);
 if(!images.length)lines.push('- Nenhuma imagem disponível neste job.');
 lines.push('','Capturas de fixture não comprovam campanha naturalmente jogada ou Android físico.');
 await writeFile(join(out,'diagnostic.json'),JSON.stringify(report,null,2)+'\n');
 await writeFile(join(out,'diagnostic.md'),lines.join('\n')+'\n');
 return report;
}
async function main(){
 const args=process.argv.slice(2),get=(n,d)=>{const i=args.indexOf(n);return i<0?d:args[i+1]};
 const report=await writeDiagnostics({root:get('--root',process.cwd()),
  status:get('--status',process.env.CI_RESULT||'failure'),
  stage:get('--stage','pipeline'),
  commit:get('--commit',process.env.GITHUB_SHA||''),
  runId:get('--run-id',process.env.GITHUB_RUN_ID||'')});
 console.log('CI DIAGNOSTIC: '+report.stage+'; evidence files '+report.evidence.length+'; checks '+report.checks.length);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
