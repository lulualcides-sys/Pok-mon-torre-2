/** Human-approved visual baselines for REAL Phaser screenshots.
 * Evidence mode can be green while approval remains pending.
 * Release mode FAILS CLOSED until approved, verified PNG baselines are present.
 * No snapshots are generated or marked approved automatically.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve,relative,sep,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const SIG=Buffer.from([137,80,78,71,13,10,26,10]);
const sha256=b=>createHash('sha256').update(b).digest('hex');
const pathIsSafe=(root,p)=>{
 if(typeof p!=='string'||!p||p.includes('\\')||p.includes('\\0')||isAbsolute(p)||p.split('/').some(k=>!k||k==='.'||k==='..'))return false;
 const abs=resolve(root,p),rel=relative(root,abs);
 return rel!==''&&!rel.startsWith('..'+sep)&&rel!=='..'&&!isAbsolute(rel);
};
export function inspectPng(data){
 if(!Buffer.isBuffer(data)||data.length<24||!data.subarray(0,8).equals(SIG)||
    data.toString('ascii',12,16)!=='IHDR')
  throw Error('not a valid PNG signature/IHDR');
 const width=data.readUInt32BE(16),height=data.readUInt32BE(20);
 if(!width||!height||width>8192||height>8192)throw Error('invalid screenshot dimensions');
 return {width,height,bytes:data.length};
}
export function validateManifest(doc){
 const errors=[];
 if(doc?.schemaVersion!==1||!Array.isArray(doc?.requiredScenes)||!doc.requiredScenes.length)
  return ['manifest must declare requiredScenes and schemaVersion=1'];
 const names=new Set();
 for(const item of doc.requiredScenes){
  if(!/^[a-z0-9-]+$/.test(item.id||'')||names.has(item.id))errors.push('invalid/duplicate ID '+item.id);
  names.add(item.id);
  if(typeof item.screenshot!=='string'||!item.screenshot.endsWith('.png'))
   errors.push(item.id+': screenshot PNG missing');
  if(!['approved','pending','rejected'].includes(item.approval))
   errors.push(item.id+': invalid review state');
  if(!Number.isFinite(item.maxDifferentPixelRatio)||item.maxDifferentPixelRatio<0||
     item.maxDifferentPixelRatio>.2)errors.push(item.id+': invalid difference threshold');
 }
 return errors;
}
async function comparePngs(reference,actual){
 // Use Chromium's native Canvas PNG decoder (no npm image packages).
 const {chromium}=await import('playwright-core');
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage();
  return await page.evaluate(async ({a,b})=>{
   async function decode(bytes){
    const img=new Image();
    img.src='data:image/png;base64,'+bytes;
    await img.decode();
    const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
    const ctx=c.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(img,0,0);
    return {w:c.width,h:c.height,pixels:ctx.getImageData(0,0,c.width,c.height).data};
   }
   const aa=await decode(a),bb=await decode(b);
   if(aa.w!==bb.w||aa.h!==bb.h)return {ratio:1,differentPixels:-1,reason:'dimension mismatch'};
   let changed=0,total=aa.w*aa.h;
   for(let i=0;i<total*4;i+=4){
    const x=aa.pixels,y=bb.pixels;
    if(Math.max(Math.abs(x[i]-y[i]),Math.abs(x[i+1]-y[i+1]),
      Math.abs(x[i+2]-y[i+2]),Math.abs(x[i+3]-y[i+3]))>24)changed++;
   }
   return {ratio:changed/total,differentPixels:changed,totalPixels:total};
  },{a:reference.toString('base64'),b:actual.toString('base64')});
 }finally{await browser.close()}
}
export async function reviewScreenshots(doc,root,{mode='evidence',compare=comparePngs}={}){
 const errors=validateManifest(doc),scenes=[];
 if(!['evidence','release'].includes(mode))errors.push('unknown mode '+mode);
 if(errors.length)return {ok:false,approved:false,status:'invalid_manifest',scenes,errors};
 let pending=0;
 for(const item of doc.requiredScenes){
  const record={id:item.id,approval:item.approval,capture:item.screenshot};
  try{
   if(!pathIsSafe(root,item.screenshot))throw Error('unsafe screenshot path');
   const captured=await readFile(resolve(root,item.screenshot));
   const image=inspectPng(captured);
   record.dimensions=[image.width,image.height];
   record.sha256=sha256(captured);
   if(item.approval!=='approved'){
    pending++;record.result='pending_visual_review';
   }else{
    if(!item.reviewedBy||!item.reviewedAt||
       !item.approvedBaseline||!pathIsSafe(root,item.approvedBaseline)||
       !/^[a-f0-9]{64}$/.test(item.baselineSha256||''))
      throw Error('approved item needs reviewer, date, baseline PNG and SHA-256');
    const baseline=await readFile(resolve(root,item.approvedBaseline));
    const dimensions=inspectPng(baseline);
    if(sha256(baseline)!==item.baselineSha256)throw Error('approved baseline checksum changed');
    if(dimensions.width!==image.width||dimensions.height!==image.height)
     throw Error('screenshot geometry differs from approved baseline');
    const result=await compare(baseline,captured);
    record.differentPixelRatio=result.ratio;
    if(result.ratio>item.maxDifferentPixelRatio)
     throw Error('visual regression ratio '+result.ratio.toFixed(5)+' exceeds '+item.maxDifferentPixelRatio);
    record.result='passed_comparison';
   }
  }catch(e){errors.push(item.id+': '+e.message);record.result='failed';}
  scenes.push(record);
 }
 const approved=pending===0&&errors.length===0;
 return {ok:errors.length===0&&(mode!=='release'||approved),approved,
  status:errors.length?'failed':approved?'approved':'pending_visual_review',mode,scenes,errors};
}
async function main(){
 const args=process.argv.slice(2),get=(flag,defaultValue)=>{
  const idx=args.indexOf(flag);return idx<0?defaultValue:args[idx+1];
 };
 const root=resolve(get('--root',process.cwd()));
 const mode=get('--mode','evidence');
 const manifestPath=resolve(root,get('--manifest','data/visual-review/review-manifest.json'));
 const reportPath=resolve(root,get('--out','test-evidence/visual-guard/manual-review-report.json'));
 let result;
 try{
  const doc=JSON.parse(await readFile(manifestPath,'utf8'));
  result=await reviewScreenshots(doc,root,{mode});
 }catch(e){result={ok:false,approved:false,status:'failed',errors:[e.message]};}
 await mkdir(dirname(reportPath),{recursive:true});
 await writeFile(reportPath,JSON.stringify(result,null,2)+'\n');
 console.log('VISUAL REVIEW',result.status,JSON.stringify(result.scenes?.map(x=>({id:x.id,status:x.result}))));
 if(result.errors?.length)console.error(JSON.stringify(result.errors));
 if(!result.ok)process.exitCode=1;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 await main();
