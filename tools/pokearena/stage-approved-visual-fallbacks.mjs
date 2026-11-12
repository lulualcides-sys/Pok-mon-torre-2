#!/usr/bin/env node
// User-authorized VISUAL fallbacks for unavailable optional official packs.
// Never substitutes code/moves. Only original, SHA-audited same-species
// pixels from the previous fully tested Torre 2 Pages release are used.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {auditNativePacks} from './audit-native-packs.mjs';
import {verifyPublishedFallback} from './verify-pages-site-fallback.mjs';

const digest=b=>createHash('sha256').update(b).digest('hex');
const validDex=d=>/^[0-9]{4}(?:-[a-z0-9]+)*$/.test(d);
const relPmd=(dex,filename)=>'assets/pmd/'+dex+'/'+filename;
const pngSignature=Buffer.from('89504e470d0a1a0a','hex');
const safeRoot=p=>{const x=path.resolve(p);
 if(!x.split(path.sep).includes('site-capture')||x.split(path.sep).includes('_site'))
  throw Error('Write only to site-capture quarantine');
 return x;
};
async function readPng(root,rel,fw,fh){
 const bytes=await fs.readFile(path.join(root,rel));
 if(bytes.length<96||!bytes.subarray(0,8).equals(pngSignature))
  throw Error('Source not a PNG: '+rel);
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
 if(width<fw||height<fh||width%fw||height%fh)
  throw Error('PNG grid incompatible: '+rel+' '+width+'x'+height+' vs '+fw+'x'+fh);
 return bytes;
}
const sameGrid=(old,now)=>old&&now&&old.fw===now.fw&&old.fh===now.fh&&
 old.durations?.length===now.durations?.length;
const available=async(p)=>{try{await fs.access(p);return true}catch(e){if(e.code==='ENOENT')return false;throw e}};
export async function stageApprovedVisualFallbacks(candidateRoot,approvedRoot,verify=verifyPublishedFallback){
 const candidate=safeRoot(candidateRoot),approved=path.resolve(approvedRoot);
 if(candidate===approved||candidate.startsWith(approved+path.sep)||approved.startsWith(candidate+path.sep))
  throw Error('Original approved Pages build and candidate cannot overlap');
 const prior=await verify(approved);
 if(prior.alpha!=='0.65.8'||!prior.prebuilt)throw Error('Approved fallback version not verified');
 const version=JSON.parse(await fs.readFile(path.join(candidate,'version.json'),'utf8'));
 if(!/^src-[a-f0-9]{10}$/.test(version.src||'')||version.officialAlpha!=='0.69.5')
  throw Error('Expected independently verified current official Alpha 0.69.5');
 const conf=await fs.readFile(path.join(candidate,version.src,'config.js'),'utf8');
 if(!/\b(?:const|let)\s+VERSION\s*=\s*["']0\.69\.5["']/.test(conf))
  throw Error('Native config.js is not the official Alpha 0.69.5');
 const before=await auditNativePacks(candidate);
 const currentManifestPath=path.join(candidate,'assets/pmd/manifest.json');
 const current=JSON.parse(await fs.readFile(currentManifestPath,'utf8'));
 const old=JSON.parse(await fs.readFile(path.join(approved,'arena2d/assets/pmd/manifest.json'),'utf8'));
 const originalManifestSha=digest(await fs.readFile(currentManifestPath));
 const stage=[],used=[],remapped=[];
 // No broad substitution. New form gameplay is kept, only visuals proven by
 // species ID and compatible original animation grid are reused.
 for(const gap of before.gaps){
   const dex=gap.dex,base=dex.slice(0,4),destForm=current[dex];
   if(!validDex(dex)||!destForm?.anims?.Idle||!old[base]?.anims?.Idle)
    throw Error('No authentic same-species approved artwork for '+dex);
   const direct=old[dex],sourceMeta=direct||old[base],sourceDex=direct?dex:base;
   const visualMode=direct?'prior-same-form':'prior-same-species-form';
   const copyEntries=[['portrait.png',null]];
   for(const [anim,tgt] of Object.entries(destForm.anims)){
     let src=sourceMeta.anims?.[anim],sourceAnim=anim;
     if(!sameGrid(src,tgt)){
       // Moltres official 0.69.5 introduces Strike and Double, which were
       // not present in the approved native build. Reuse existing approved
       // frame sequences with EXACTLY the same frame count, never invent
       // empty/corrupt png files. Keep new move logic and timing.
       if(base!=='0146'||!['Strike','Double'].includes(anim))
        throw Error('No compatible approved visual for '+dex+'/'+anim);
       sourceAnim=anim==='Strike'?'Attack':'Shoot';
       src=sourceMeta.anims?.[sourceAnim];
       if(!src||src.durations?.length!==tgt.durations?.length)
        throw Error('No 1:1 frames for '+dex+'/'+anim);
       // Phaser must slice the source PNG using its ACTUAL frame size.
       // The original hit frame/timing of the new move is not changed.
       destForm.anims[anim]={...tgt,fw:src.fw,fh:src.fh};
       remapped.push({dex,anim,using:sourceAnim,
         oldSize:[tgt.fw,tgt.fh],renderSize:[src.fw,src.fh]});
     }
     const srcFile=src.file;
     if(typeof srcFile!=='string'||!srcFile.startsWith(sourceDex+'/')||
        !/^[0-9]{4}(?:-[a-z0-9]+)*\/[A-Za-z0-9_-]+(?:-Anim)?\.png$/.test(srcFile))
       throw Error('Untrusted approved image path: '+dex+'/'+anim);
     const targetRel=tgt.file;
     if(typeof targetRel!=='string'||!targetRel.startsWith(dex+'/')||
        !/^[0-9]{4}(?:-[a-z0-9]+)*\/[A-Za-z0-9_-]+(?:-Anim)?\.png$/.test(targetRel))
       throw Error('Untrusted official image path: '+dex+'/'+anim);
     copyEntries.push([path.posix.basename(targetRel),{srcRel:'assets/pmd/'+srcFile,
       fw:src.fw,fh:src.fh,anim}]);
   }
   for(const [targetName,meta] of copyEntries){
     const dst=path.join(candidate,relPmd(dex,targetName));
     if(await available(dst))continue; // Keep current official asset, never overwrite.
     const sourceRel=meta?.srcRel||relPmd(sourceDex,'portrait.png');
     const bytes=meta
       ?await readPng(approved,path.join('arena2d',sourceRel),meta.fw,meta.fh)
       :await readPng(approved,path.join('arena2d',sourceRel),1,1);
     stage.push({dst,bytes,dex,sourceRel,anim:meta?.anim||'portrait',
       sha256:digest(bytes),mode:visualMode});
   }
   used.push({dex,sourceDex,mode:visualMode});
 }
 // Validate *all* files and paths before first write; no partial release.
 const destinations=new Set();
 for(const e of stage){
   if(destinations.has(e.dst)||!e.dst.startsWith(candidate+path.sep))
    throw Error('Duplicate or unsafe fallback path');
   destinations.add(e.dst);
 }
 for(const e of stage){
   await fs.mkdir(path.dirname(e.dst),{recursive:true});
   await fs.writeFile(e.dst,e.bytes,{flag:'wx'});
 }
 if(remapped.length)await fs.writeFile(currentManifestPath,
    JSON.stringify(current));
 const after=await auditNativePacks(candidate);
 const report={
   officialAlpha:'0.69.5',originalSourceHash:version.src,
   priorApprovedAlpha:'0.65.8',priorReleaseModules:prior.modules,
   beforeMissing:before.missingFormCount,afterMissing:after.missingFormCount,
   visualFallbacks:used,remappedAnimations:remapped,
   originalManifestSha256:originalManifestSha,
   effectiveManifestSha256:digest(await fs.readFile(currentManifestPath)),
   files:stage.map(x=>({dex:x.dex,anim:x.anim,source:x.sourceRel,
     sha256:x.sha256,bytes:x.bytes.length,mode:x.mode})),
   disclosure:'The alpha is 0.69.5 code, but unavailable cosmetic sprite variants temporarily reuse approved authentic same-species art. Moltres Strike/Double use approved Attack/Shoot images. No 0.69.5 visual identity is claimed for these fallbacks.',
   releaseGate:'Must still pass full Chromium/WebGL, moves, saves and visual regression suite.'
 };
 await fs.writeFile(path.join(candidate,'native-visual-fallbacks.json'),
   JSON.stringify(report,null,2)+'\n');
 if(after.missingFormCount)throw Error('Native gaps remain after fallback: '+after.missingFormCount);
 return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 stageApprovedVisualFallbacks(process.argv[2]||'site-capture/pokearena-client',
   process.argv[3]||'site-capture/last-green').then(r=>{
    console.log('ALPHA_0695_VISUAL_FALLBACK_VERIFIED',JSON.stringify({
     alpha:r.officialAlpha,missingBefore:r.beforeMissing,missingAfter:r.afterMissing,
     files:r.files.length,remapped:r.remappedAnimations.length}));
 }).catch(e=>{console.error('ALPHA_0695_VISUAL_FALLBACK_FAILED',e);process.exitCode=1});
}
