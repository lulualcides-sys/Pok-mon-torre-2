'use strict';
// Real Phaser/Chromium regression for the reported campaign options, TM
// caption overlap, and the EQUIPE button showing only the active Pokémon.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.png':'image/png','.webp':'image/webp','.css':'text/css',
 '.jpg':'image/jpeg','.woff2':'font/woff2','.ogg':'audio/ogg'};
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url||'/','http://127.0.0.1');
 const file=path.resolve(root,'.'+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 try{const bytes=await fs.readFile(file);res.writeHead(200,
  {'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes)}
 catch{res.writeHead(404);res.end('not found')}
});
(async()=>{
 await fs.mkdir('test-evidence/kanto-cards',{recursive:true});
 await new Promise(resolve=>server.listen(4598,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
   '--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:854,height:480},hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4598/arena2d/',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__pt2Game?.scene.isActive('titulo'),null,{timeout:60000});
  await page.evaluate(async()=>{
   const src=[...document.scripts].find(s=>s.src?.includes('/main.js')).src;
   const core=window.__uiCore=await import(new URL('./torre2/campaign-core.js',src));
   const {createPokemonProgression}=await import(new URL('./torre2/progression.js',src));
   const state=core.createCampaign('squirtle');
   const species=['beedrill','alakazam','raichu','rhyhorn','ninetales'];
   state.team=[state.team[0],...species.map((id,i)=>({
    id,uid:'t99-party-'+i,hp:i===4?71:100,
    progression:createPokemonProgression(id,40+i),
    status:null,tmMoves:[],moves:[]
   }))];
   state.active=0;
   state.inventory.tms=['tm-rock-tomb','tm-giga-drain','tm-calm-mind'];
   core.saveCampaign(state);
   window.__pt2Game.scene.getScene('titulo').scene.start('campanha');
  });
  await page.waitForFunction(()=>{
   const c=window.__pt2Game?.scene.getScene('campanha');
   return c?.scene.isActive()&&c.__torre2CardUI?.mode==='cards';
  },null,{timeout:45000});
  assert.equal(await page.evaluate(()=>window.__uiCore.readCampaign().team.length),6);
  // MAIS: each caption must share the geometric center of its button, and
  // both columns + the Back button must fit inside the 50..590 modal.
  await page.evaluate(()=>{
   const c=__pt2Game.scene.getScene('campanha');
   const root=c.children.list.find(o=>o.getData?.('torre2-trainer-cards-root'));
   root.list.find(o=>o.getData?.('torre2-card-control')==='cards-more').emit('pointerdown');
  });
  const extras=await page.evaluate(()=>{
   const c=__pt2Game.scene.getScene('campanha');
   const layer=c.children.list.find(o=>o.getData?.('torre2-cards-extras'));
   if(!layer)throw Error('MAIS modal not rendered');
   const names=['POKÉDEX','INSÍGNIAS','ÁUDIO','REINICIAR JORNADA','VOLTAR AOS CARDS'];
   return names.map((name,i)=>{
    const id=i===4?'cards-extras-close':'cards-extras-'+i;
    const z=layer.list.find(o=>o.getData?.('torre2-card-control')===id);
    const t=layer.list.find(o=>o.type==='Text'&&o.text===name);
    if(!z||!t)throw Error('Missing extras control '+name);
    return {name,cx:z.x,cy:z.y,w:z.width,h:z.height,tx:t.x,ty:t.y};
   });
  });
  for(const e of extras){
   assert.ok(e.cx-e.w/2>=50&&e.cx+e.w/2<=590,e.name+' extends beyond modal');
   assert.equal(e.tx,e.cx,e.name+' caption is not horizontally centered');
   assert.equal(e.ty,e.cy,e.name+' caption is not vertically centered');
  }
  assert.equal(extras[4].cx,320,'Back control must be centered on the modal');
  await page.screenshot({path:'test-evidence/kanto-cards/03-centered-options.png'});
  await page.evaluate(()=>{
   const c=__pt2Game.scene.getScene('campanha');
   const layer=c.children.list.find(o=>o.getData?.('torre2-cards-extras'));
   layer.list.find(o=>o.getData?.('torre2-card-control')==='cards-extras-close')
    .emit('pointerdown');
   const root=c.children.list.find(o=>o.getData?.('torre2-trainer-cards-root'));
   root.list.find(o=>o.getData?.('torre2-card-control')==='cards-0')
    .emit('pointerdown');
  });
  const team=await page.evaluate(()=>{
   const c=__pt2Game.scene.getScene('campanha');
   const slots=c.children.list.filter(o=>o.getData?.('torre2-team-overview-slot')!==undefined);
   return {slots:slots.map(o=>({index:o.getData('torre2-team-overview-slot'),
    x:o.x,y:o.y,w:o.width,h:o.height})),
    heading:c.children.list.find(o=>o.getData?.('torre2-team-overview'))?.text};
  });
  assert.equal(team.slots.length,6,'EQUIPE must show all six slots at once');
  assert.ok(team.heading.includes('6/6'));
  assert.deepEqual(team.slots.map(s=>s.index),[0,1,2,3,4,5]);
  for(const s of team.slots){
   assert.ok(s.x-s.w/2>=0&&s.x+s.w/2<=640,'Team card horizontally clipped');
   assert.ok(s.y-s.h/2>=0&&s.y+s.h/2<=360,'Team card vertically clipped');
  }
  await page.screenshot({path:'test-evidence/kanto-cards/04-full-six-member-team.png'});
  // The last Pokémon is reachable, and Summary -> EQUIPE returns to all six.
  await page.evaluate(()=>{
   const c=__pt2Game.scene.getScene('campanha');
   c.children.list.find(o=>o.getData?.('torre2-team-overview-slot')===5)
    .emit('pointerdown');
  });
  assert.ok(await page.evaluate(()=>__pt2Game.scene.getScene('campanha')
   .children.list.some(o=>o.getData?.('torre2-summary-input-shield'))));
  await page.evaluate(()=>{
   const c=__pt2Game.scene.getScene('campanha');
   c.children.list.find(o=>o.getData?.('torre2-summary-back')).emit('pointerdown');
  });
  assert.equal(await page.evaluate(()=>__pt2Game.scene.getScene('campanha')
   .children.list.filter(o=>o.getData?.('torre2-team-overview-slot')!==undefined).length),6);
  // Selecting a different member persists the active index and returns to roster.
  await page.evaluate(()=>{
   const c=__pt2Game.scene.getScene('campanha');
   c.children.list.find(o=>o.getData?.('torre2-team-overview-slot')===1)
    .emit('pointerdown');
   c.children.list.find(o=>o.getData?.('torre2-active-select')).emit('pointerdown');
  });
  assert.equal(await page.evaluate(()=>__uiCore.readCampaign().active),1);
  assert.equal(await page.evaluate(()=>__pt2Game.scene.getScene('campanha')
   .children.list.filter(o=>o.getData?.('torre2-team-overview-slot')!==undefined).length),6);
  await page.evaluate(()=>{
   const c=__pt2Game.scene.getScene('campanha');
   c.bagScreen(__uiCore.readCampaign());
  });
  const tm=await page.evaluate(()=>{
   const c=__pt2Game.scene.getScene('campanha');
   const zones=c.children.list.filter(o=>o.getData?.('torre2-bag-teach-tm'));
   const captions=c.children.list.filter(o=>o.getData?.('torre2-button-caption'));
   return zones.map(z=>{
    const t=captions.find(t=>Math.abs(t.y-z.y)<.1&&Math.abs(t.x-(z.x+16))<.1);
    if(!t)throw Error('TM caption not found at reserved center for '+z.getData('torre2-bag-teach-tm'));
    const r=t.getBounds();
    return {id:z.getData('torre2-bag-teach-tm'),zoneX:z.x,zoneW:z.width,
     textX:t.x,left:r.left,right:r.right,label:t.getData('torre2-button-caption')};
   });
  });
  assert.equal(tm.length,3,'All three TM buttons must remain visible');
  for(const t of tm){
   assert.ok(t.left>=t.zoneX-t.zoneW/2+27-1,t.id+' text overlaps TM icon');
   assert.ok(t.right<=t.zoneX+t.zoneW/2-3,t.id+' text exceeds button');
  }
  await page.screenshot({path:'test-evidence/kanto-cards/05-centered-tm-captions.png'});
  assert.deepEqual(errors,[],'Uncaught Phaser browser errors');
  console.log('PASS_T99_OPTIONS_TEAM_TM',JSON.stringify({extras,teamCount:team.slots.length,tm}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
