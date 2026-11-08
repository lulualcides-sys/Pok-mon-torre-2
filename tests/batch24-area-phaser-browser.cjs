'use strict';
// Isolated Phaser/WebGL test of our Earth Power actor and contact code.
// MIT Phaser 3 only; no external game source, assets or production deploy.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const http=require('node:http'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..');
const phaser=path.join(root,'node_modules/phaser/dist/phaser.min.js');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'torre2-phaser-'));
const app=path.join(tmp,'app');
const put=(name,content)=>{
 const p=path.join(app,name);fs.mkdirSync(path.dirname(p),{recursive:true});
 fs.writeFileSync(p,content);
};
const server=http.createServer((req,res)=>{
 const key=new URL(req.url,'http://localhost').pathname;
 const p=key==='/phaser.min.js'?phaser:
  path.resolve(app,'.'+(key==='/'?'/index.html':key));
 if(key!=='/phaser.min.js'&&!p.startsWith(app+path.sep)){
  res.writeHead(403).end();return;
 }
 let bytes;
 try{bytes=fs.readFileSync(p);}catch{res.writeHead(404).end();return;}
 res.writeHead(200,{'content-type':p.endsWith('.html')?'text/html':'text/javascript'});
 res.end(bytes);
});
(async()=>{
 if(!fs.existsSync(phaser))throw Error('Pinned MIT Phaser package missing');
 const earth=(await import(pathToFileURL(path.join(root,'tools/pokearena/batch24/earth-power.js')))).default;
 for(const p of ['runtime.js','area-targets.js']){
  const target=path.join(app,'client/batch24',p);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.copyFileSync(path.join(root,'tools/pokearena/batch24',p),target);
 }
 put('client/batch24/catalog.js','export const BATCH24_MOVES='+JSON.stringify([earth])+';');
 put('client/batch24/pixels.js',[
  'export const PALETTES={earth:[0x243828,0x58754c,0x87a877,0xd6d8ba,0xf1f0d0]};',
  'export function pixel(g,x,y,c,n=2,a=1){g.fillStyle(c,a).fillRect(Math.round(x),Math.round(y),n,n);}',
  'export function stamp(g,s,x,y,p,n=1,a=0,alpha=1){pixel(g,x,y,p[2],Math.min(6,Math.max(1,n*2)),alpha);}',
  'export function impact(g,x,y,p,t){if(t<.45)pixel(g,x,y,p[4],2,.5);}'
 ].join('\n'));
 put('client/batch24/visual-upgrades.js',
  'export const paintReworkedMove=()=>false;export const paintReworkedImpact=()=>false;');
 put('client/clash-fx.js','export const clashAt=()=>false;');
 put('client/early-route-fx.js','export function contactDash(){return {step(){},release(){}};}');
 put('azar.js','export const aleatorio=()=>0.01;');
 put('index.html','<!doctype html><html><head><meta charset="utf-8"></head><body><div id="game"></div><script src="/phaser.min.js"></script><script type="module" src="/scene.js"></script></body></html>');
 put('scene.js',[
  "import {BATCH24_FORMS} from './client/batch24/runtime.js';",
  "import {BATCH24_MOVES} from './client/batch24/catalog.js';",
  'const move=BATCH24_MOVES[0];',
  "const game=new Phaser.Game({type:Phaser.WEBGL,width:480,height:270,parent:'game',render:{pixelArt:true},scene:{create(){window.__scene=this;window.__ready=true;}}});",
  'window.__run=()=>{',
  ' const e=window.__scene;e.efectos=[];',
  ' const a={x:100,y:100,ax:180,ay:100,alto:36,equipo:1,t:0,ko:false,hp:100,est:{},escena:e,animar(){}};',
  ' const target=(x,y,equipo,ko=false)=>({x,y,alto:36,equipo,ko,hp:1000,hits:0,recibir(l,h){this.hits++;this.hp-=h.dano;return "golpe";},ponerEstado(){}});',
  ' const e1=target(180,100,2),e2=target(194,103,3),ally=target(184,102,1),ko=target(180,100,4,true),far=target(280,100,5);',
  ' e.luchadores=[a,e1,e2,ally,ko,far];a.rival=e1;',
  ' const fx=BATCH24_FORMS[move.forma](a,move,{slot:"q"});',
  ' for(let i=0;i<28;i++){a.t+=1/60;fx.update(1/60);}',
  ' window.__fixture={fx,a,e1,e2,ally,ko,far};',
  ' return {webgl:game.renderer.type,hits:[e1.hits,e2.hits,ally.hits,ko.hits,far.hits],graphicsActive:fx.g.active};',
  '};',
  'window.__finish=()=>{',
  ' const s=window.__fixture;for(let i=0;i<150;i++){s.a.t+=1/60;s.fx.update(1/60);}',
  ' return {hits:[s.e1.hits,s.e2.hits,s.ally.hits,s.ko.hits,s.far.hits],hp:[s.e1.hp,s.e2.hp,s.ally.hp,s.ko.hp,s.far.hp],disposed:!s.fx.g.active};',
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
  const mid=await page.evaluate(()=>window.__run());
  assert.equal(mid.webgl,2,'Real Phaser WebGL renderer required');
  assert.deepEqual(mid.hits,[1,1,0,0,0],'FFA hits two enemies, not allies');
  assert.equal(mid.graphicsActive,true,'Live Phaser Graphics at impact');
  await page.waitForTimeout(130);
  const dir=path.join(root,'test-evidence/pokearena-area');
  fs.mkdirSync(dir,{recursive:true});
  await page.screenshot({path:path.join(dir,'earth-power-ffa-webgl.png')});
  const out=await page.evaluate(()=>window.__finish());
  assert.deepEqual(out.hits,[1,1,0,0,0],'No duplicate per-target damage');
  assert.deepEqual(out.hp,[1000-earth.dano,1000-earth.dano,1000,1000,1000]);
  assert.equal(out.disposed,true,'Graphics cleaned');
  assert.deepEqual(errors,[],'Browser errors');
  console.log('PASS isolated Phaser WebGL FFA Earth Power contact, hitboxes, teams, KO');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{
 server.close();fs.rmSync(tmp,{recursive:true,force:true});
});
