// Owner list 2026-11-20: items 19 (points shop), 20 (secret titles),
// 21 (shiny/medal), 22 (Pokédex filters), 25 (install as an app).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ensureDaily,claimDailyWithPoints,missionPoints,POINT_SHOP,buyWithPoints,shopItemState,POINTS_PER_MISSION,POINTS_BONUS}
 from '../tools/pokearena/torre2-daily-missions.js';
import {TITLES,syncLegacy,emptyLegacy} from '../tools/pokearena/torre2-legacy.js';
import {filterDexRows,paginate,cycle,DEX_SHOW} from '../tools/pokearena/torre2-dex-filter.js';
import {pwaManifest,serviceWorker,PWA_HOOK} from '../tools/pokearena/torre2-pwa.mjs';

const read=f=>fs.readFileSync(new URL('../tools/pokearena/'+f,import.meta.url),'utf8');
test('points: each claimed mission and the bonus add points, once',()=>{
 let s=ensureDaily({wins:0,team:[],box:[],dexSeen:[],inventory:{pokeball:0}},'2026-11-20');
 const winMission=s.daily.missions.find(m=>m.kind==='wins');
 if(winMission){
  s={...s,wins:99};
  const a=claimDailyWithPoints(s,winMission.id);assert.equal(missionPoints(a),POINTS_PER_MISSION);
  assert.equal(claimDailyWithPoints(a,winMission.id),null,'never twice');
 }
 assert.equal(claimDailyWithPoints(s,'bonus')?.missionPoints??null,null,'bonus only after all three');
 assert.ok(POINTS_BONUS>POINTS_PER_MISSION);
});
test('points shop: costs, Master Ball once per journey',()=>{
 let s={missionPoints:600,inventory:{masterball:0,ultraball:1},pointShopBought:[]};
 s=buyWithPoints(s,'master');assert.equal(s.inventory.masterball,1);assert.equal(s.missionPoints,350);
 assert.equal(buyWithPoints(s,'master'),null);assert.equal(shopItemState(s,POINT_SHOP[0]).ok,false);
 s=buyWithPoints(s,'ultra5');assert.equal(s.inventory.ultraball,6);assert.equal(s.missionPoints,290);
 assert.equal(buyWithPoints({missionPoints:10,inventory:{}},'ultra5'),null);
 assert.equal(buyWithPoints(s,'nope'),null);
});
test('secret titles: hidden until earned, earned from real save data',()=>{
 const secret=TITLES.filter(t=>t.secret);
 assert.deepEqual(secret.map(t=>t.id),['monotype','cleancatch','towermaster']);
 assert.ok(TITLES.length<=16,'fits the 4×4 titles grid');
 const {legacy}=syncLegacy({secretFlags:{monoLeader:true,cleanCatch:true},tower:{best:25},team:[],box:[]},emptyLegacy(),1);
 for(const id of ['monotype','cleancatch','towermaster'])assert.ok(legacy.titles[id],id);
 const none=syncLegacy({tower:{best:24},team:[],box:[]},emptyLegacy(),1).legacy;
 for(const id of ['monotype','cleancatch','towermaster'])assert.ok(!none.titles[id],id);
 assert.match(read('torre2-campaign-scene.js'),/t\.secret&&!on\?'Conquista secreta':t\.desc/);
});
test('secret flags come from battles and captures, not from the UI',()=>{
 const core=read('torre2-campaign-core.js');
 assert.match(core,/if\(monoTypeTeam\(next\.team\)\)next\.secretFlags=/);
 assert.match(core,/if\(options\.playerUntouched===true\)next\.secretFlags=/);
 assert.match(read('torre2-capture-arena.js'),/playerUntouched:playerUntouched\(scene,save\)/);
});
test('trainer card: shiny row and Pokédex medal (50/100/151)',()=>{
 const scene=read('torre2-campaign-scene.js');
 assert.match(scene,/\['Shiny',\(state\.dexShinyCaught\|\|\[\]\)\.length\+' capturados/);
 assert.match(scene,/caughtN>=151\?\[MENU_UI\.oro,'OURO'\]:caughtN>=100\?\[0xc0c8d8,'PRATA'\]:caughtN>=50\?\[0xcd8a4a,'BRONZE'\]/);
});
test('Pokédex filters: show, type and route, then paginate',()=>{
 const rows=[{id:'a',seen:true,caught:true},{id:'b',seen:true,caught:false},{id:'c',seen:false,caught:false}];
 const types={a:['FIRE'],b:['WATER'],c:['FIRE']},routes={a:[0],b:[1],c:[0,1]};
 const f=o=>filterDexRows(rows,o,id=>types[id],id=>routes[id]).map(r=>r.id);
 assert.deepEqual(f({show:'all'}),['a','b','c']);
 assert.deepEqual(f({show:'caught'}),['a']);
 assert.deepEqual(f({show:'seen'}),['b']);
 assert.deepEqual(f({show:'missing'}),['b','c']);
 assert.deepEqual(f({type:'FIRE'}),['a','c']);
 assert.deepEqual(f({route:1}),['b','c']);
 assert.deepEqual(f({route:0,type:'FIRE',show:'missing'}),['c']);
 assert.deepEqual(paginate([1,2,3,4,5],9,2),{page:2,pages:3,rows:[5]});
 assert.equal(cycle(DEX_SHOW,'missing'),'all');
});
test('install as an app: manifest declares real 192px and 512px icons',()=>{
 const m=JSON.parse(pwaManifest(JSON.stringify({name:'Poké Arena 2D',icons:[
  {src:'iconos/icono-192.png',sizes:'192x192',type:'image/png'},
  {src:'iconos/icono-512.png',sizes:'512x512',type:'image/png'}
 ]})));
 assert.equal(m.name,'Pokémon Torre 2');assert.equal(m.short_name,'Torre 2');
 assert.equal(m.display,'fullscreen');
 assert.deepEqual(m.icons.map(i=>i.sizes),['192x192','512x512']);
 const icon512=fs.readFileSync(new URL('../tools/pokearena/pwa/icono-512.png',import.meta.url));
 assert.equal(icon512.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(icon512.readUInt32BE(16),512);assert.equal(icon512.readUInt32BE(20),512);
 const sw=serviceWorker('src-0123456789');
 assert.match(sw,/RELEASE='src-0123456789'/);assert.match(sw,/caches\\.delete/);assert.match(sw,/fetch\\(req\\)\\.then/);
 assert.throws(()=>serviceWorker('../x'),/bad release/);
 assert.match(PWA_HOOK,/beforeinstallprompt/);assert.match(PWA_HOOK,/register\\("sw\\.js"\\)/);
 const pub=read('publish-alpha0762.mjs');
 assert.ok(pub.includes("tools/pokearena/pwa/icono-512.png"));
 assert.ok(pub.includes("await fs.writeFile(path.join(root,'iconos/icono-512.png'),icon512);"));
 assert.match(pub,/pngDimensions\\(icon512\\)\\.width===512/);
 assert.match(pub,/html=html\\.replace\\('<\\/head>',PWA_HOOK\\+'<\\/head>'\\)/);
 assert.match(read('torre2-trainer-cards.js'),/\\['INSTALAR APP',handlers\\.installApp,'fullscreen'\\]/);
});
test('the generated Pages PWA bundle includes valid files for every manifest icon',t=>{
 const root=new URL('../_site/arena2d/',import.meta.url);
 const manifestUrl=new URL('manifest.webmanifest',root);
 if(!fs.existsSync(manifestUrl)){t.skip('Publisher output is not present outside the Pages build');return;}
 const manifest=JSON.parse(fs.readFileSync(manifestUrl,'utf8'));
 for(const size of [192,512]){
  const item=manifest.icons.find(i=>i.sizes===size+'x'+size&&i.type==='image/png');
  assert.ok(item,'missing '+size+'px manifest entry');
  const file=new URL(item.src,root);
  assert.ok(fs.existsSync(file),'missing published '+item.src);
  const png=fs.readFileSync(file);
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);
 }
});
