/* Poké Zarza REA: passive public exhibition inspection only.
 * No login, no bypass, no extracted code or downloaded sprites.
 * Report library fingerprints, public resource paths, move-name hints.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {chromium}=require('playwright-core');
const base='https://pokemonzarza.com';
const targets=[
 {id:'arena',url:base+'/poke-arena.html?lang=en&city=encinacorba&mode=exhibition&entry=welcome'},
 {id:'lab',url:base+'/poke-arena-lab.html'},
 {id:'homepage',url:base+'/'},
 {id:'gallery',url:base+'/galeria/index.html'},
 {id:'ranking',url:base+'/ranking.html'}
];
const visited=new Set();
const maxPages=30;
const addPublicPage=(link,referer)=>{
 try{
  const u=new URL(link,referer);
  if(u.origin!==base||!/\.(?:html?)$|\/$/i.test(u.pathname))return;
  if(/(?:admin|login|account|profile|auth|private|api|upload|register)/i.test(u.pathname))return;
  const key=u.pathname;
  if(!visited.has(key)&&!targets.some(x=>new URL(x.url).pathname===key)&&targets.length<maxPages)
   targets.push({id:'page'+targets.length,url:u.origin+u.pathname});
 }catch{}
};
const dest=path.resolve('test-evidence/zarza-rea');
fs.mkdirSync(dest,{recursive:true});
const safe=(s)=>String(s||'').slice(0,360);
const sdk=['phaser','pixi','three','babylon','gsap','animejs','lottie','createjs','spine','howler','matter','tweenjs','webgl','particles','spritesheet','spriteSheet','shader','canvas'];
const moves=['ice beam','hyper beam','aura storm','confuse ray','shadow ball','flamethrower','fire blast','thunderbolt','hydro pump','water pulse','solar beam','surf','swift','blizzard','earthquake','psychic','aura sphere','dragon pulse','rock blast','ice punch','iron tail'];
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const reports=[];
 try{
 for(const target of targets){
   if(visited.has(new URL(target.url).pathname))continue;
   visited.add(new URL(target.url).pathname);
   const page=await browser.newPage({viewport:{width:1240,height:760},deviceScaleFactor:1,
     locale:'en-US',serviceWorkers:'block'});
   page.setDefaultTimeout(13000);
   await page.addInitScript(()=>{
    const actual=HTMLCanvasElement.prototype.getContext;
    window.__publicVfxContexts=[];
    HTMLCanvasElement.prototype.getContext=function(type,...args){
     window.__publicVfxContexts.push(String(type));
     return actual.call(this,type,...args);
    };
   });
   const errors=[],resources=[],requests=[];
   const scripts=[];
   page.on('pageerror',error=>errors.push(safe(error.message)));
   page.on('request',request=>{if(requests.length<400)requests.push({kind:request.resourceType(),url:request.url().split('?')[0].slice(0,260)})});
   page.on('response',async response=>{
     const url=response.url();
     const type=(response.headers()['content-type']||'').toLowerCase();
     if(resources.length<350)resources.push({status:response.status(),type:type.split(';')[0],
       url:safe(url.split('?')[0]),bytes:Number(response.headers()['content-length']||0)});
     if(url.startsWith(base+'/')&&(/javascript/.test(type)||/\.m?js(?:\?|$)/i.test(url))){
       try{
         const body=await response.text();
         if(body.length>2200000)return;
         const content=body.toLowerCase();
         const fingerprints=sdk.filter(k=>content.includes(k.toLowerCase()));
         const moveMentions=moves.filter(k=>content.includes(k));
         scripts.push({path:new URL(url).pathname.slice(0,170),bytes:body.length,
           sha256:crypto.createHash('sha256').update(body).digest('hex').slice(0,12),
           fingerprints,moveMentions,hasWebGL:/webgl|getcontext\s*\(\s*['"]webgl/.test(content),
           hasRaf:/requestanimationframe/.test(content),
           hasParticle:/particle|emitter/.test(content),
           hasAtlas:/atlas|spritesheet|spritesheet/.test(content),
           primitives:{
            drawImage:(body.match(/\.drawImage\s*\(/g)||[]).length,
            fillRect:(body.match(/\.fillRect\s*\(/g)||[]).length,
            stroke:(body.match(/\.stroke\s*\(/g)||[]).length,
            putImageData:(body.match(/\.putImageData\s*\(/g)||[]).length,
            createLinearGradient:(body.match(/\.createLinearGradient\s*\(/g)||[]).length,
            createRadialGradient:(body.match(/\.createRadialGradient\s*\(/g)||[]).length,
            composite:(body.match(/globalCompositeOperation/g)||[]).length,
            webglDraw:(body.match(/\.drawArrays|\.drawElements/g)||[]).length,
            raf:(body.match(/requestAnimationFrame/g)||[]).length,
            particle:(body.match(/particle|emitter/gi)||[]).length,
            atlas:(body.match(/spriteSheet|spritesheet|atlas/gi)||[]).length
           },
           declaredFunctions:[...body.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)]
             .map(x=>x[1]).filter(x=>!x.startsWith('_')).slice(0,25)
          });
       }catch(error){errors.push('public-script-read '+safe(error.message))}
     }
   });
   let response=null,navError=null;
   try{response=await page.goto(target.url,{waitUntil:'domcontentloaded',timeout:26000});}
   catch(error){navError=safe(error.message)}
   if(!navError)await page.waitForTimeout(target.id==='arena'||target.id==='lab'?3200:900);
   let dom={};
   try{dom=await page.evaluate(()=>{
     const trim=text=>String(text||'').replace(/\s+/g,' ').trim().slice(0,130);
     const els=[...document.querySelectorAll('canvas')];
     const stack=[...document.scripts].map(s=>s.src?s.src.split('?')[0]:'[inline]');
     return{
       title:document.title,
       heading:[...document.querySelectorAll('h1,h2,h3')].slice(0,20).map(n=>trim(n.textContent)),
       buttons:[...document.querySelectorAll('button,[role="button"]')].slice(0,40).map(n=>trim(n.textContent)).filter(Boolean),
       canvas:els.map(c=>({width:c.width,height:c.height,cssWidth:Math.round(c.getBoundingClientRect().width)})),
       scriptUrls:stack.slice(0,65),
       images:document.images.length,
       video:document.querySelectorAll('video').length,
       audio:document.querySelectorAll('audio').length,
       appHints:{phaser:!!window.Phaser,pixi:!!window.PIXI,three:!!window.THREE,
         gsap:!!window.gsap,babylon:!!window.BABYLON},
       contexts:window.__publicVfxContexts||[],
       internalLinks:[...document.querySelectorAll('a[href]')].map(a=>a.href).slice(0,180),
       bodySample:trim(document.body?.innerText||'').slice(0,130)
     };
   })}catch(error){errors.push('dom: '+safe(error.message))}
   for(const url of dom.internalLinks||[])addPublicPage(url,target.url);
   try{await page.screenshot({path:path.join(dest,target.id+'.png'),fullPage:false,timeout:10000})}
   catch(error){errors.push('screenshot: '+safe(error.message))}
   reports.push({target:target.id,requestedUrl:target.url,finalUrl:page.url(),
     status:response?.status()??null,navError,
     dom:{...dom,internalLinks:undefined},scriptFindings:scripts,resourceSummary:{
       total:resources.length,
       kinds:Object.fromEntries([...new Set(requests.map(r=>r.kind))].map(k=>[k,requests.filter(r=>r.kind===k).length])),
       scripts:resources.filter(r=>r.type.includes('javascript')).map(r=>r.url).slice(0,25),
       images:resources.filter(r=>r.type.startsWith('image/')).map(r=>r.url).slice(0,30),
       errors:resources.filter(r=>r.status>=400).slice(0,25)
     },errors:errors.slice(0,35)});
   await page.close();
 }
 }finally{await browser.close()}
 fs.writeFileSync(path.join(dest,'report.json'),JSON.stringify({createdAt:new Date().toISOString(),ethics:'Unauthenticated public view. No code/assets duplicated.',reports},null,2));
 const rows=reports.map(r=>{
 const fps=r.scriptFindings.flatMap(x=>x.fingerprints);
 const mention=[...new Set(r.scriptFindings.flatMap(x=>x.moveMentions))];
 return [
  '## '+r.target+' — HTTP '+(r.status??'?'),
  'URL: '+r.finalUrl,
  'Navigation: '+(r.navError||'ok'),
  'Title: '+(r.dom.title||'?'),
  'Canvas elements: '+JSON.stringify(r.dom.canvas||[]),
  'Global engine objects detected at runtime: '+JSON.stringify(r.dom.appHints||{}),
  'Canvas context types requested: '+JSON.stringify([...new Set(r.dom.contexts||[])]),
  'JS files inspected: '+r.scriptFindings.length,
  'Technology fingerprints (code strings only, not validated libraries): '+JSON.stringify([...new Set(fps)]),
  'Visible move names in public JS (keyword matches only): '+JSON.stringify(mention),
  'Resources: '+JSON.stringify(r.resourceSummary.kinds),
  'Public script paths: '+JSON.stringify(r.scriptFindings.map(x=>x.path)),
  'Relevant renderer modules (public identifiers and drawing counts, no code copied): '+
    JSON.stringify(r.scriptFindings.filter(x=>
      /\/(?:poke-arena-(?:vfx|vfx-data|beams|atlases|animation|move-art-data|lighting|moves|effects-copy|surface-reactions|visual-profiles|art)|original-arena-animation|animation)\.js$/.test(x.path))
       .map(x=>({path:x.path,bytes:x.bytes,primitives:x.primitives,
        moveMentions:x.moveMentions,functions:x.declaredFunctions}))),
  'Buttons: '+JSON.stringify((r.dom.buttons||[]).slice(0,15)),
  'Errors: '+JSON.stringify(r.errors)
 ].join('\n');
 });
 const md='# Poké Zarza REA — Public site inspection\n\nRead-only browser access, no login, no bypass, no copied art/source. Keyword matches alone do NOT prove the renderer.\n\n'+rows.join('\n\n');
 fs.writeFileSync(path.join(dest,'report.md'),md);
 const indexes={};
 for(const r of reports)for(const script of r.scriptFindings)
  for(const move of script.moveMentions)
   (indexes[move]??=new Set()).add(script.path);
 const moveMap=Object.fromEntries(Object.entries(indexes).sort((a,b)=>a[0].localeCompare(b[0]))
   .map(([move,paths])=>[move,[...paths]]));
 fs.writeFileSync(path.join(dest,'move-module-map.json'),JSON.stringify({
  scope:'Text mentions in public JavaScript; not proof animations are available.',
  pages:reports.map(r=>({page:r.finalUrl,status:r.status,contexts:r.dom.contexts,modules:r.scriptFindings.length})),
  moveMap},null,2));
 console.log('ZARZA_WIDE_SUMMARY '+JSON.stringify({
  publicPagesVisited:reports.length,
  good:reports.filter(r=>r.status===200).length,
  uniqueModules:new Set(reports.flatMap(r=>r.scriptFindings.map(s=>s.path))).size,
  canvasContexts:[...new Set(reports.flatMap(r=>r.dom.contexts||[]))],
  moveKeywords:Object.keys(moveMap).length,
  firstPages:reports.slice(0,14).map(r=>({id:r.target,status:r.status,url:r.finalUrl}))
 }));
 console.log('ZARZA_REA_BEGIN\n'+md.slice(0,16000)+'\nZARZA_REA_END');
})().catch(err=>{console.error('ZARZA_REA_FATAL',err);process.exitCode=1});
