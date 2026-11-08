'use strict';
/* Opt-in Phaser WebGL smoke for a locally-authored Speed Deoxys ULT/dash
 * permission. No upstream client scripts, credentials, or assets used.
 */
const fs=require('node:fs'),os=require('node:os'),http=require('node:http');
const path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..');
const engine=path.join(root,'node_modules/phaser/dist/phaser.min.js');
const ownPatch=path.join(root,'tools/pokearena/torre2-deoxys-speed-dash.js');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'pt2-speed-deoxys-'));
const mime={'.html':'text/html','.js':'text/javascript'};
const put=(name,source)=>fs.writeFileSync(path.join(tmp,name),source);
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const file=url.pathname==='/phaser.min.js'?engine:
  path.resolve(tmp,'.'+(url.pathname==='/'?'/index.html':url.pathname));
 if(url.pathname!=='/phaser.min.js'&&!file.startsWith(tmp+path.sep)){
  res.writeHead(403).end();return;
 }
 let data;
 try{data=fs.readFileSync(file);}catch{res.writeHead(404).end();return;}
 res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(data);
});
(async()=>{
 if(!fs.existsSync(engine))throw Error('MIT Phaser 3 dependency unavailable');
 put('deoxys-speed-dash.js',fs.readFileSync(ownPatch));
 put('index.html',[
  '<!doctype html><html lang="en"><head><meta charset="utf-8"></head>',
  '<body><div id="game"></div><script src="/phaser.min.js"></script>',
  '<script type="module" src="/fixture.js"></script></body></html>'
 ].join('\n'));
 put('fixture.js',[
 "import {installSpeedDeoxysUltimateDash} from './deoxys-speed-dash.js';",
 "const game=new Phaser.Game({type:Phaser.WEBGL,width:480,height:270,",
 " parent:'game',render:{pixelArt:true},backgroundColor:'#182f40',",
 " scene:{create(){this.add.rectangle(240,135,350,160,0x294860);",
 "  this.add.text(48,40,'Speed Deoxys / ULT + DASH',{color:'#d8faff'});",
 "  window.__scene=this;window.__ready=true;}}});",
 "class Fighter{",
 " constructor(options={}){",
 "  this.def={id:options.id||'deoxys'};",
 "  this.form={nombre:options.form||'SPEED DEOXYS'};",
 "  Object.defineProperty(this,'alt',{get:()=>this.form});",
 "  this.escena={datos:{torre2:!!options.campaign}};",
 "  this.accion={slot:'e',bloquea:true,permite:[]};",
 "  this.cd={esp:0,e:0};",
 "  this.kit={esp:{forma:'dash',cd:2},e:{forma:'ultimate',cd:10}};",
 "  this.est={};this.ko=false;this.x=110;this.y=130;this.dashes=0;",
 " }",
 " update(dt,input){",
 "  if(input?.esp&&this.cd.esp===0&&!this.est.sinDash&&",
 "     (!this.accion?.bloquea||this.accion.permite?.includes('esp'))){",
 "   this.dashes++;this.x+=44;this.cd.esp=2;",
 "   if(!this.accion?.permite?.includes('esp'))this.accion=null;",
 "   window.__scene.add.rectangle(this.x,this.y,12,18,0xb8eafd);",
 "   return true;",
 "  }",
 "  return false;",
 " }",
 "}",
 "installSpeedDeoxysUltimateDash(Fighter);",
 "window.__try=options=>{",
 " const f=new Fighter(options),initial=f.kit.e;",
 " const fired=f.update(.016,{esp:true});",
 " return {renderer:game.renderer.type,fired,dashes:f.dashes,",
 "  ultimateStillActive:f.accion?.slot==='e',x:f.x,ultimateKitUnchanged:f.kit.e===initial,",
 "  espCd:f.cd.esp,permitted:f.accion?.permite?.includes('esp')||false};",
 "};"
 ].join('\n'));
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const browser=await chromium.launch({
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 try{
  const page=await browser.newPage({viewport:{width:660,height:480}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await page.waitForFunction(()=>window.__ready===true,null,{timeout:30000});
  const speed=await page.evaluate(()=>window.__try({}));
  assert.equal(speed.renderer,2,'real Phaser WebGL context');
  assert.equal(speed.fired,true);
  assert.equal(speed.ultimateStillActive,true);
  assert.equal(speed.permitted,true);
  assert.equal(speed.dashes,1);
  assert.equal(speed.espCd,2,'native cooldown still starts');
  assert.equal(speed.ultimateKitUnchanged,true);
  const others=await page.evaluate(()=>[
   window.__try({form:'ATTACK DEOXYS'}),
   window.__try({form:'DEFENSE DEOXYS'}),
   window.__try({campaign:true}),
   window.__try({id:'lucario'})
  ]);
  assert.ok(others.every(x=>x.fired===false&&x.dashes===0),
   'No other form, species or campaign obtains dash');
  assert.deepEqual(errors,[]);
  const evidence=path.join(root,'test-evidence','deoxys-0657');
  fs.mkdirSync(evidence,{recursive:true});
  await page.screenshot({path:path.join(evidence,'speed-deoxys-ult-dash-webgl.png')});
  fs.writeFileSync(path.join(evidence,'result.json'),JSON.stringify({speed,others,errors},null,2));
  console.log('PASS Phaser WebGL Speed Deoxys ULT+ESP; others/campaign blocked; cooldown intact');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{
 server.close();fs.rmSync(tmp,{recursive:true,force:true});
});
