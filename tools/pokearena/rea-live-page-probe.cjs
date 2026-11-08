'use strict';
/* REA passive public website check with a clean Chromium/CDP context.
 * No stealth, proxies, auth, WAF bypass, user state, client assets or form actions.
 * A blocked/unavailable script must remain a documented UNKNOWN Alpha.
 */
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const path=require('node:path');
const os=require('node:os');
const {spawn}=require('node:child_process');
const OUT=path.resolve(process.argv[2]||'test-evidence/pokearena-rea');
const CHROME=process.env.CHROME_BIN||'/usr/bin/google-chrome';
const CDP='http://127.0.0.1:9234';
const host='https://www.pokearena2d.com/';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'rea-pokearena-public-'));
fs.mkdirSync(OUT,{recursive:true});
function command(args,file,timeoutMs=40000){
 return new Promise(resolve=>{
  const child=spawn('npx',['-y','rea-agents@6.8.0',...args],{
   stdio:['ignore','pipe','pipe']
  });
  const w=fs.createWriteStream(path.join(OUT,file));
  let error='',finished=false;
  child.stdout.pipe(w);
  child.stderr.on('data',c=>{if(error.length<15000)error+=String(c)});
  const timeout=setTimeout(()=>child.kill('SIGTERM'),timeoutMs);
  child.on('close',(code,signal)=>{
   if(finished)return;finished=true;clearTimeout(timeout);
   w.end(()=>resolve({code,signal,error:error.slice(0,2000)}));
  });
  child.on('error',e=>{
   if(finished)return;finished=true;clearTimeout(timeout);
   w.end(()=>resolve({code:-1,error:String(e)}));
  });
 });
}
function officialRecord(source,id){
 if(typeof source!=='string')return null;
 const at=source.indexOf('{id:"'+id+'"');
 if(at<0)return null;
 let depth=0,quote=null,escaped=false;
 for(let i=at;i<source.length;i++){
  const c=source[i];
  if(quote){
   if(escaped)escaped=false;
   else if(c==='\\')escaped=true;
   else if(c===quote)quote=null;
   continue;
  }
  if(c==='"'||c==="'"){quote=c;continue;}
  if(c==='{')depth++;
  if(c==='}'&&--depth===0)return source.slice(at,i+1);
 }
 return null;
}
function compactKitEvidence(source,id){
 const record=officialRecord(source,id);
 if(!record)return {id,found:false};
 const all=[...record.matchAll(/nombre:"([^"]+)"/g)].map(m=>m[1]);
 const forms=[...new Set(all.filter(x=>/DEOXYS|LUCARIO|RIOLU/i.test(x)))];
 const attacks=[...new Set(all.filter(x=>!/DEOXYS|LUCARIO|RIOLU/i.test(x)))];
 const speed=record.indexOf('nombre:"SPEED DEOXYS"');
 const fragment=speed<0?'':record.slice(speed,speed+400);
 const prop=k=>fragment.match(new RegExp('(?:^|,)'+k+':([0-9.]+)'))?.[1]??null;
 return {id,found:true,sha256:createHash('sha256').update(record).digest('hex'),
  forms:forms.slice(0,12),namedMoves:attacks.slice(0,50),
  speedForm:speed<0?null:{vel:prop('vel'),atk:prop('atk'),def:prop('def')}};
}
function parseReleaseDetails(notes){
 const records=[...notes.matchAll(/\{version:"(0\.\d+(?:\.\d+)?)",fecha:"([^"]+)",titulo:"([^"]+)"/g)];
 return records.slice(0,12).map((match,index)=>{
  const text=notes.slice(match.index,records[index+1]?.index??notes.length);
  const points=text.match(/puntos:\[([^\]]*)\]/)?.[1];
  let bullets=[];
  if(points){try{bullets=JSON.parse('['+points+']')}catch{}}
  const description=text.match(/texto:"([^"]+)"/)?.[1]??null;
  return {alpha:match[1],date:match[2],title:match[3],
   description,bullets:bullets.slice(0,9)};
 });
}

async function run(){
 const chrome=spawn(CHROME,[
  '--headless=new','--no-sandbox','--disable-dev-shm-usage',
  '--no-first-run','--no-default-browser-check',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=9234',
  '--user-data-dir='+profile,host
 ],{stdio:'ignore'});
 let summary={url:host,method:'REA passive Chromium CDP',liveAlpha:null,
  access:'inconclusive',noBypass:true,scriptSourceCopied:false};
 try{
  let target=null;
  for(let i=0;i<25;i++){
   try{
    const res=await fetch(CDP+'/json/list',{signal:AbortSignal.timeout(2500)});
    if(res.ok){
     const list=await res.json();
     target=list.find(x=>x.type==='page'&&x.url.startsWith(host));
     if(target)break;
    }
   }catch{}
   await sleep(400);
  }
  if(!target){
   summary.access='CDP page not ready';
   return;
  }
  const result=await command(['inspect-web-page',CDP,target.id,
   '--observation-ms','900','--include-accessibility-text',
   '--include-script-sources','--json'],
   'rea-live-page-evidence.json',45000);
  summary.reaExitCode=result.code;
  if(result.code!==0){
   summary.access='REA browser observation incomplete';
   summary.diagnostics=result.error;
   return;
  }
  let analysis;
  try{analysis=JSON.parse(fs.readFileSync(path.join(OUT,'rea-live-page-evidence.json')))}
  catch(e){summary.access='invalid REA JSON';summary.diagnostics=String(e);return}
  const normalized=analysis.normalized_result??{};
  summary.access='REA browser observation completed';
  summary.evidenceId=analysis.evidence_id??null;
  summary.resultTopLevel=Object.keys(normalized).slice(0,25);
  const items=normalized.scripts?.items||[];
  summary.loadedScriptCount=items.length;
  const get=(suffix)=>items.find(x=>x.url?.startsWith('https://www.pokearena2d.com/')&&
   x.url.endsWith('/'+suffix));
  const selected=['config.js','notas.js','datos.js'].map(name=>{
   const item=get(name);
   return item?{name,url:item.url,cdpHash:item.cdp_hash,
    included:item.source?.included===true,
    sourceFields:item.source&&typeof item.source==='object'?Object.keys(item.source):[]}:null;
  }).filter(Boolean);
  summary.officialScripts=selected;
  const getText=(item)=>{
   if(!item)return null;
   if(typeof item.source==='string')return item.source;
   if(typeof item.source?.artifact?.text==='string')return item.source.artifact.text;
   for(const key of ['text','source_text','sourceText','source','content','code','body']){
    const value=item.source?.[key]??item[key];
    if(typeof value==='string'&&value.length>40)return value;
   }
   return null;
  };
  const config=getText(get('config.js')),notes=getText(get('notas.js'));
  const version=config?.match(/\b(?:const|let)\s+VERSION\s*=\s*["'](0\.\d+(?:\.\d+)?)["']/);
  summary.liveAlpha=version?.[1]??null;
  summary.liveVersionEvidence=version?'REA_CDP_PUBLIC_CONFIG_JS':'NO_OFFICIAL_VERSION_RETRIEVED';
  if(notes)summary.latestChangelog=parseReleaseDetails(notes);
  const liveData=getText(get('datos.js'));
  const archivePath=path.resolve('rea-input/datos.js');
  const oldData=fs.existsSync(archivePath)?fs.readFileSync(archivePath,'utf8'):null;
  summary.verifiedSpeciesDelta=['deoxys','riolu'].map(id=>{
   const previous=compactKitEvidence(oldData,id);
   const current=compactKitEvidence(liveData,id);
   return {id,old:previous,new:current,
    recordChanged:previous.found&&current.found?previous.sha256!==current.sha256:null};
  });
  // Original published JavaScript is read for evidence, not retained in artifacts.
  fs.rmSync(path.join(OUT,'rea-live-page-evidence.json'),{force:true});
 }finally{
  await fs.promises.writeFile(path.join(OUT,'rea-live-page-summary.json'),
   JSON.stringify(summary,null,2)+'\n');
  chrome.kill('SIGTERM');
  await sleep(350);
  fs.rmSync(profile,{recursive:true,force:true});
 }
}
run().catch(e=>{
 console.error(e);process.exitCode=1;
 fs.writeFileSync(path.join(OUT,'rea-live-error.txt'),String(e));
});
