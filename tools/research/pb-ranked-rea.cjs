/* PB Ranked — REA + Playwright study of public, unauthenticated UI.
 * NEVER logs in, creates an account, reads storage/cookies, mirrors source,
 * exports sprites, probes hidden endpoints, or circumvents restrictions.
 * Produces evidence and a bounded, provenance-labeled public feature inventory.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawn,spawnSync}=require('node:child_process');
const {setTimeout:delay}=require('node:timers/promises');
const {chromium}=require('playwright-core');

const origin='https://ranked.pokemonbattlegrounds.com';
const out=path.resolve('test-evidence/pb-ranked-rea');
fs.mkdirSync(out,{recursive:true});
const outJson=(file,value)=>fs.writeFileSync(path.join(out,file),
 JSON.stringify(value,null,2)+'\n');
const redactUrl=value=>{
 try{const u=new URL(value);if(u.origin!==origin)return '[outside-origin]';
 return u.origin+u.pathname;}catch{return '[not-a-url]';}
};
const safe=s=>String(s||'').replace(/\s+/g,' ').slice(0,160);
const report={capturedAt:new Date().toISOString(),target:origin,scope:
 'public unauthenticated page, UI/metadata only, no third-party code or assets copied',
 steps:[],limitations:[],status:'incomplete'};
const chrome=spawn(process.env.CHROME_BIN||'/usr/bin/google-chrome',[
 '--headless=new','--no-sandbox','--disable-dev-shm-usage',
 '--disable-background-networking','--disable-extensions',
 '--disable-gpu','--password-store=basic','--no-first-run',
 '--remote-debugging-address=127.0.0.1','--remote-debugging-port=9222',
 '--user-data-dir='+path.join(os.tmpdir(),'rea-pb-ranked-'+process.pid),
 origin
],{stdio:'ignore'});
chrome.on('error',error=>report.limitations.push('chrome: '+safe(error.message)));

let browser;
const runRea=(subcommand,targetId,extra=[])=>{
 const args=[subcommand,'http://127.0.0.1:9222',targetId,...extra,'--json'];
 const r=spawnSync('rea',args,{encoding:'utf8',timeout:100000,
  maxBuffer:12*1024*1024,env:{...process.env,NO_COLOR:'1'}});
 const name='rea-'+subcommand+'.json';
 if(r.status===0){
   try{outJson(name,JSON.parse(r.stdout));}
   catch{fs.writeFileSync(path.join(out,name.replace('.json','.txt')),String(r.stdout||'').slice(0,250000))}
   report.steps.push({step:subcommand,status:'ok',file:name});
 }else{
   report.steps.push({step:subcommand,status:'failed',exitCode:r.status,
     error:safe(r.error?.message||r.stderr||r.stdout)});
   report.limitations.push('REA '+subcommand+' did not complete; no runtime evidence claimed');
 }
};
(async()=>{
 try{
   let targets=[];
   for(let i=0;i<40;i++){
     try{
       const response=await fetch('http://127.0.0.1:9222/json/list',
         {signal:AbortSignal.timeout(1800)});
       if(response.ok){
         targets=await response.json();
         if(targets.some(t=>t.type==='page'&&t.url?.startsWith(origin)))break;
       }
     }catch{}
     await delay(500);
   }
   const target=targets.find(t=>t.type==='page'&&t.url?.startsWith(origin));
   if(!target)throw new Error('Chrome did not reach an eligible public page on the expected origin');
   browser=await chromium.connectOverCDP('http://127.0.0.1:9222');
   const context=browser.contexts()[0]||await browser.newContext();
   // CDP discovery can see a tab before Playwright has hydrated its Page
   // object; never misclassify this attachment race as an origin refusal.
   let page=context.pages().find(p=>p.url().startsWith(origin));
   if(!page){
     await delay(1100);
     page=context.pages().find(p=>p.url().startsWith(origin));
   }
   if(!page){
     page=await context.newPage();
     try{await page.goto(origin,{waitUntil:'domcontentloaded',timeout:25000});}
     catch(error){report.limitations.push('Public page navigation: '+safe(error.message))}
     if(!page.url().startsWith(origin))
       throw new Error('Public page unavailable after CDP attach; url='+redactUrl(page.url()));
   }
   await page.waitForTimeout(2200);
   const dom=await page.evaluate(()=>{
      const text=n=>String(n?.textContent||'').replace(/\s+/g,' ').trim().slice(0,90);
      const nodes=[...document.querySelectorAll('button,[role=button],select')].slice(0,220);
      return{
        title:document.title,
        headings:[...document.querySelectorAll('h1,h2,h3')].slice(0,65).map(text),
        buttons:nodes.filter(n=>n.tagName.toLowerCase()!=='select').map(text).filter(Boolean),
        selects:nodes.filter(n=>n.tagName.toLowerCase()==='select').map(n=>({
          label:n.getAttribute('aria-label')||n.name||n.id||'unknown',
          options:[...n.options].slice(0,50).map(o=>text(o))})),
        canvas:[...document.querySelectorAll('canvas')].map(n=>({
          width:n.width,height:n.height})),
        scripts:[...document.querySelectorAll('script[src]')].slice(0,65).map(n=>new URL(n.src).origin),
        images:document.images.length,
        textHeadings:[...document.querySelectorAll('strong,h4')].slice(0,40).map(text),
        requiresLogin:/sign in|log in|connect account/i.test(document.body?.innerText||''),
        disclaimer:'Presence of a button does not prove its behavior or runtime implementation.'
      };
   });
   outJson('dom-public.json',dom);
   report.steps.push({step:'public-dom',status:'ok',file:'dom-public.json'});
   try{
      await page.screenshot({path:path.join(out,'landing-public.png'),fullPage:false,timeout:10000});
      report.steps.push({step:'public-screenshot',status:'ok',file:'landing-public.png'});
   }catch(e){report.limitations.push('Screenshot: '+safe(e.message))}
   const ids=await(await fetch('http://127.0.0.1:9222/json/list')).json();
   const selected=ids.find(t=>t.type==='page'&&t.url?.startsWith(origin));
   if(!selected)throw new Error('Page target was replaced before REA attached');
   runRea('inspect-web-page',selected.id,['--observation-ms','1000']);
   runRea('analyze-web-bundle',selected.id);
   // The built-in page descriptions are an observed public feature list, NOT
   // proof of captured gameplay, source licensing, or a working Pokéball animation.
   report.status=report.steps.some(s=>s.step==='inspect-web-page'&&s.status==='ok')
     ?'rea-page-inspected':'public-ui-only';
 }catch(e){
   report.limitations.push(safe(e.stack||e.message));
   report.status='failed';
 }finally{
   outJson('summary.json',report);
   if(browser)try{await browser.close()}catch{}
   chrome.kill('SIGTERM');
   console.log(JSON.stringify({status:report.status,steps:report.steps,
     limitations:report.limitations.slice(0,5)},null,2));
   if(report.status==='failed'||report.status==='public-ui-only')
     process.exitCode=1;
 }
})();