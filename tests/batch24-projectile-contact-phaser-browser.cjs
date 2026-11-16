'use strict';
// Phaser MIT + Chromium WebGL test: real combat runtime, no external capture.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const http=require('node:http'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..');
const phaser=path.join(root,'node_modules/phaser/dist/phaser.min.js');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'torre2-projectile-webgl-'));
const app=path.join(dir,'app');
const put=(name,contents)=>{const full=path.join(app,name);
 fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,contents);};
const server=http.createServer((req,res)=>{
 const key=new URL(req.url,'http://localhost').pathname;
 const full=key==='/phaser.min.js'?phaser:path.resolve(app,'.'+(key==='/'?'/index.html':key));
 if(key!=='/phaser.min.js'&&!full.startsWith(app+path.sep)){res.writeHead(403).end();return;}
 try{const data=fs.readFileSync(full);res.writeHead(200,{'content-type':full.endsWith('.html')?'text/html':'text/javascript'});res.end(data);}
 catch{res.writeHead(404).end();}
});
(async()=>{
 if(!fs.existsSync(phaser))throw Error('Phaser MIT dependency unavailable');
 const ice=(await import(pathToFileURL(path.join(root,'tools/pokearena/batch24/ice-shard.js')))).default;
 for(const name of ['runtime.js','verified-projectile-impact.js']){
  const dest=path.join(app,'client/batch24',name);
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.copyFileSync(path.join(root,'tools/pokearena/batch24',name),dest);
 }
 put('client/batch24/catalog.js','export const BATCH24_MOVES='+JSON.stringify([ice])+';');
 put('client/batch24/pixels.js',[
  'export const PALETTES={ice:[0x10233b,0x388caa,0x8ddbed,0xc1faff,0xffffff]};',
  'export const stamp=()=>{};export const pixel=()=>{};',
  'export function impact(g,x,y,p){g.__impacts=(g.__impacts||0)+1;g.fillStyle(p[4],1).fillRect(x,y,3,3)}'
 ].join('\n'));
 put('client/batch24/visual-upgrades.js',[
  'export function paintReworkedMove(g,h,x,y){g.fillStyle(0x8ddbed,1).fillRect(x,y,5,5);return true}',
  'export const paintReworkedImpact=()=>false;'
 ].join('\n'));
 put('client/clash-fx.js','export const clashAt=()=>false;');
 put('client/early-route-fx.js','export const contactDash=()=>({step(){},release(){}});');
 put('azar.js','export const aleatorio=()=>0.1;');
 put('index.html','<!doctype html><html><head><meta charset="utf-8"></head><body><div id="game"></div><script src="/phaser.min.js"></script><script type="module" src="/scene.js"></script></body></html>');
 put('scene.js',[
  "import {BATCH24_FORMS} from './client/batch24/runtime.js';",
  "import {BATCH24_MOVES} from './client/batch24/catalog.js';",
  'const h=BATCH24_MOVES[0];',
  'const game=new Phaser.Game({type:Phaser.WEBGL,width:480,height:270,parent:"game",render:{pixelArt:true},scene:{create(){window.__scene=this;window.__ready=true}}});',
  'window.__run=(mode)=>{',
  ' const e=window.__scene;e.efectos=[];',
  ' const l={x:100,y:100,ax:180,ay:100,alto:36,t:0,ko:false,est:{},escena:e,animar(){}};',
  ' const r={x:180,y:100,alto:36,hp:1000,ko:false,tipos:["NORMAL"],hits:0,ponerEstado(){},recibir(_l,a){this.hits++;if(mode==="blocked")return "bloqueado";this.hp-=a.dano;return "golpe"}};',
  ' l.rival=r;const fx=BATCH24_FORMS[h.forma](l,h,{slot:"q"});',
  ' for(let j=0;j<42;j++){l.t+=1/60;fx.update(1/60);}',
  ' const observed={webgl:game.renderer.type,hits:r.hits,hp:r.hp,impactCount:fx.g.__impacts||0};',
  ' fx.destroy();return observed;',
  '};'
 ].join('\n'));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
   '--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:640,height:420}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await page.waitForFunction(()=>window.__ready===true,null,{timeout:30000});
  const blocked=await page.evaluate(()=>window.__run('blocked'));
  assert.equal(blocked.webgl,2,'real Phaser WebGL is required');
  assert.ok(blocked.hits>0,'blocked projectile reached the target');
  assert.equal(blocked.hp,1000,'shielded target HP unchanged');
  assert.equal(blocked.impactCount,0,'no phantom impact after block');
  const landed=await page.evaluate(()=>window.__run('landed'));
  assert.equal(landed.webgl,2);
  assert.ok(landed.hp<1000,'real contact damage preserved');
  assert.ok(landed.impactCount>0,'approved contact particles still render');
  assert.deepEqual(errors,[]);
  console.log('PASS: Phaser WebGL Ice Shard hit vs shield/blocked contact');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{
 server.close();fs.rmSync(dir,{recursive:true,force:true});
});
