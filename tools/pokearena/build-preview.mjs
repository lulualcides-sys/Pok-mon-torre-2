/* Copy the authorized site client into an isolated Phaser sandbox, without
 * overwriting the main Kanto game, and strip original analytics endpoints.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

const source=path.resolve('site-capture/pokearena-client');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const dest=path.join(root,'arena2d');
await fs.mkdir(root,{recursive:true});
await fs.cp(source,dest,{recursive:true,force:true});
// World map and dashboard now render from native Phaser Graphics, not a picture.
// Install genuine CC0 environment sprites; fail the build if they cannot
// be verified. Never silently substitute another hand-drawn fake sprite.
const {installCC0WorldTiles}=await import('./install-cc0-world-tiles.mjs');
const cc0Tiles=await installCC0WorldTiles(dest);
console.log('Verified CC0 overworld sprites',JSON.stringify(cc0Tiles));
const {installFRLGMaps}=await import('./install-frlg-location-tiles.mjs');
const frlgLocations=await installFRLGMaps(dest);
console.log('Original FireRed locality maps:',Object.keys(frlgLocations.locations));
// Optional personalized map from the user's uploaded FireRed illustration.
// Kept separate from the original FireRed city texture.
const customBrockFile='reference-assets/kanto/maps/custom-brock-map.webp';
let hasCustomBrock=false;
try{
 const picture=await fs.readFile(customBrockFile);
 if(picture.length<2500||picture.toString('ascii',0,4)!=='RIFF'||
   picture.toString('ascii',8,12)!=='WEBP')throw Error('Invalid Brock map');
 await fs.writeFile(path.join(dest,'assets/ui/torre2-brock-custom.webp'),picture);
 // The forest watermark patch must use a SEPARATE WebGL texture object.
 // A sub-frame added to the full-map texture could contaminate its UVs
 // when Phaser tileSprite flushes batches on Android WebGL.
 await fs.writeFile(path.join(dest,'assets/ui/torre2-brock-forest.webp'),picture);
 hasCustomBrock=true;
}catch(e){if(e.code!=='ENOENT')throw e}
console.log('Brock custom illustration found:',hasCustomBrock);
const {installFRLGNPCs}=await import('./install-frlg-npcs.mjs');
const originalNPCs=await installFRLGNPCs(dest);

// Build-time mirror, same-origin static licensed PMD sprites, no runtime CDN.
const {installEarlyKantoSprites}=await import('./install-early-kanto-assets.mjs');
await installEarlyKantoSprites(dest);
// Only replace the original title-image bytes. The Phaser title scene, its
// buttons, animated background, layout, hotspots and menu flow stay identical.
// Keep the approved pixel logo as a small indexed PNG for fast mobile loading.
const titlePngBase64=(await fs.readFile('tools/pokearena/pokemon-torre-logo.b64','utf8')).trim();
const titlePng=Buffer.from(titlePngBase64,'base64');
if(!titlePng.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
 throw Error('Invalid Pokémon Torre title sprite PNG');
await fs.writeFile(path.join(dest,'assets/ui/logo.png'),titlePng);
const index=path.join(dest,'index.html');
let html=await fs.readFile(index,'utf8');
// The user's personal copy must not call the original site's analytics beacons.
html=html.replace(/<title>[^<]*<\/title>/i,'<title>Pokémon Torre</title>');
html=html.replace(/<script\s+src="\/analitica\.js"><\/script>/g,'');
html=html.replace(/<script\s+async\s+src="\/m\/s"><\/script>/g,'');
// Original favicon and manifests must be relative to our subfolder.
html=html.replace('href="/favicon.png"','href="favicon.png"');
// Restore the ORIGINAL Poké Arena 2D responsive viewport and Phaser scaling.
// The previous injected landscape zoom moved #juego into <body> and overrode
// the canvas width/height. That broke click coordinates and native fullscreen.
// Do not inject viewport overrides, CSS transforms or polling resize loops.
html=html.replace('</head>','<meta name="referrer" content="no-referrer">\n</head>');
await fs.writeFile(index,html);

// Independent startup health check: HTML must explain blockers even if the
// Phaser JS import graph fails completely (before any game scene is created).
// Do not show online-game menus or connect to servers.
const diagnostics=`<style>
#pt2-boot-status{display:none;position:fixed;inset:0;background:#080c17;z-index:4000;color:#f1f6ff;
font:14px system-ui;align-items:center;justify-content:center;text-align:center;padding:20px}
#pt2-boot-card{width:min(420px,92vw);border:1px solid #42617d;border-radius:12px;padding:22px;
background:#102138;box-shadow:0 12px 40px #0007}
#pt2-boot-card h2{color:#ffdf73;margin:0 0 14px}#pt2-boot-card p{line-height:1.6}
#pt2-retry{font:700 15px system-ui;background:#ffe177;color:#102033;border:0;padding:12px 24px;border-radius:8px}
</style>
<div id="pt2-boot-status" role="status" aria-live="polite">
 <div id="pt2-boot-card"><h2>POKÉMON TORRE 2</h2>
 <p id="pt2-boot-message">Preparando a arena...</p>
 <button type="button" id="pt2-retry" onclick="location.reload()">TENTAR NOVAMENTE</button>
 <p style="font-size:12px;color:#a2b8cd">Abra no Chrome e vire o celular na horizontal. O jogo é solo.</p>
 </div>
</div>
<script>
(function(){
 var booted=false,reason='';
 var status=document.getElementById('pt2-boot-status');
 var message=document.getElementById('pt2-boot-message');
 function finished(){booted=!!(window.__pt2Started&&window.__pt2Game);
   if(booted)status.style.display='none';return booted}
 function show(error){if(finished())return;status.style.display='flex';
   message.textContent=error||'O jogo não conseguiu carregar. Verifique a conexão e abra no Chrome.'}
 window.addEventListener('error',function(e){if(!finished())reason=(e.message||'Falha ao carregar um arquivo').slice(0,190)});
 window.addEventListener('unhandledrejection',function(e){if(!finished())reason=String(e.reason?.message||e.reason||'Erro de inicialização').slice(0,190)});
 window.setTimeout(function(){if(!finished())show('Carregamento demorando mais que o normal. '+(reason||'Tente abrir no Chrome e atualizar a página.'))},17000);
 window.setInterval(finished,800);
})();
</script>`;
html=html.replace('</body>',diagnostics+'</body>');
await fs.writeFile(index,html);


// Load startup visuals in batches. Initial title/selection should not load
// every animation for every Pokémon before showing the menu on Android.
const clientSource=html.match(/src="(src-[0-9a-f]{10})\/main\.js"/)?.[1];
if(!clientSource)throw Error('Original Phaser source directory missing');
const patches=[
 ['escenas/carga.js',[
  // The public Poké Arena CDN no longer provides balls20.png. No native
  // UI/gameplay source uses "ui-balls" after preload, so drop ONLY the
  // unavailable optional request in our isolated build. Preserve every
  // existing original pixel-art icon and input binding.
  ['this.load.spritesheet("ui-balls","assets/ui/balls20.png",{frameWidth:20,frameHeight:20});',''],
  ['preload(){texto(this,ANCHO/2,ALTO/2,"LOADING...",{tam:8,color:"#d6a63a",origen:.5});',
   'preload(){const txt=texto(this,ANCHO/2,ALTO/2,"LOADING...",{tam:8,color:"#d6a63a",origen:.5});this.load.on("progress",p=>txt.active&&txt.setText("LOADING... "+Math.round(p*100)+"%"));this.load.on("loaderror",f=>console.warn("Poké Arena resource failed",f?.src));'],
  ['const nombres=soloEstos?null:BASICAS;cargarPMD(this,usados,nombres);',
   'const nombres=soloEstos?null:BASICAS;if(!soloEstos){usados=soloFormas(m,formasDe(["bulbasaur","charmander","squirtle","pichu"]));}cargarPMD(this,usados,nombres);'],
  ['crearAnimsHojas(this);generarTexturas(this);texturasUI(this);this.arrancar()',
   'crearAnimsHojas(this);generarTexturas(this);texturasUI(this);this.arrancar();window.__pt2Started=true']
 ]],
 ['escenas/titulo.js',[
  // Pokémon Torre 2: larger native Phaser pixel buttons (not CSS scaling).
  // Keep the original menu actions, keyboard navigation, frame art and
  // native fullscreen untouched. Fit all six PLAY buttons above the floor.
  ['const BX=320,BW=210,BH=MOVIL.activo?30:24,PASO=MOVIL.activo?32:27;',
   'const BX=320,BW=260,BH=MOVIL.activo?30:28,PASO=MOVIL.activo?32:29;'],
  ['const DISPOSICION={principal:MOVIL.activo?{y:114+BAJA,paso:27,alto:25}:{y:112+BAJA,paso:25,alto:23},jugar:{y:114+BAJA,paso:PASO},online:{y:113+BAJA,paso:PASO},ajustes:{y:114+BAJA,paso:PASO}};',
   'const DISPOSICION={principal:MOVIL.activo?{y:116+BAJA,paso:34,alto:32}:{y:112+BAJA,paso:32,alto:30},jugar:{y:110+BAJA,paso:PASO},online:{y:110+BAJA,paso:PASO},ajustes:{y:112+BAJA,paso:PASO}};'],
  ['textoBoton(o),{tam:16,borde:4','textoBoton(o),{tam:18,borde:4'],
  // This single call creates all four icons AND their clickable HTML links.
  // No external social controls are created; fullscreen at x=624 remains.
  ['this.redes();','/* Torre 2: no social icons or link hitboxes beside fullscreen. */'],
  ['return m&&(m.feet??5)-(m.head??-16)<=36',
   'return m&&this.anims.exists(`${f.dex}-Idle-2`)&&(m.feet??5)-(m.head??-16)<=36'],
  ['if(!m||(m.feet??5)-(m.head??-16)>50)return;',
   'if(!m||!this.anims.exists(`${forma.dex}-Idle-2`)||(m.feet??5)-(m.head??-16)>50)return;']
 ]]
];
// Place the solo campaign beside the recovered original source so browsers do
// not depend on server APIs or external runtime assets for Kanto progression.
await fs.mkdir(path.join(dest,clientSource,'torre2'),{recursive:true});
// Only preload assets which the installer actually downloaded. Optional
// missing FireRed location files never trigger 404 in the Phaser client.
await fs.writeFile(path.join(dest,clientSource,'torre2','frlg-available.js'),
 'export const AVAILABLE_FRLG=Object.freeze('+JSON.stringify(
 Object.keys(frlgLocations.locations))+');\n'+
 'export const AVAILABLE_FRLG_FILES=Object.freeze('+JSON.stringify(
 Object.fromEntries(Object.entries(frlgLocations.locations).map(
 ([id,info])=>[id,info.file])))+');\n'+
 'export const AVAILABLE_FRLG_NPCS=Object.freeze('+JSON.stringify(
 originalNPCs.available)+');\n'+
 'export const HAS_CUSTOM_BROCK='+JSON.stringify(hasCustomBrock)+';\n');
await Promise.all([
 ['src/progression.js','progression.js'],
 ['tools/pokearena/torre2-campaign-core.js','campaign-core.js'],
 ['tools/pokearena/torre2-capture-mechanics.js','capture-mechanics.js'],
 ['tools/pokearena/torre2-capture-arena.js','capture-arena.js'],
 ['tools/pokearena/torre2-ball-sprites.js','ball-sprites.js'],
 ['tools/pokearena/torre2-ball-choreography.js','ball-choreography.js'],
 ['tools/pokearena/torre2-party-battle.js','party-battle.js'],
 ['tools/pokearena/torre2-training.js','training.js'],
 ['tools/pokearena/torre2-training-input.js','training-input.js'],
 ['tools/pokearena/torre2-level-balance.js','level-balance.js'],
 ['tools/pokearena/torre2-campaign-sprites.js','campaign-sprites.js'],
 ['tools/pokearena/torre2-campaign-scene.js','campanha.js'],
 ['tools/pokearena/torre2-battle-path.js','battle-path.js'],
 ['tools/pokearena/torre2-campaign-map-unified.js','campaign-map-unified.js'],
 ['tools/pokearena/torre2-campaign-art.js','campaign-art.js'],
 ['tools/pokearena/torre2-cc0-overworld.js','cc0-overworld.js'],
 ['tools/pokearena/torre2-frlg-location.js','frlg-location.js'],
 ['tools/pokearena/torre2-kanto-hotspots.js','kanto-hotspots.js'],
 ['tools/pokearena/torre2-kanto-route-layout.js','kanto-route-layout.js'],
 ['tools/pokearena/torre2-frlg-npc.js','frlg-npc.js'],
 ['tools/pokearena/torre2-frlg-interiors.js','frlg-interiors.js'],
 ['tools/pokearena/torre2-move-pool.js','move-pool.js'],
 ['tools/pokearena/torre2-signature-fx.js','signature-fx.js'],
 ['tools/pokearena/torre2-finale13.js','finale13.js'],
 ['tools/pokearena/torre2-finale13-catalog.js','torre2-finale13-catalog.js'],
 ['tools/pokearena/torre2-next-batch-fx.js','next-batch-fx.js'],
 ['tools/pokearena/torre2-mega-patch-fx.js','mega-patch-fx.js'],
 ['tools/pokearena/torre2-species-fx.js','species-fx.js'],
 ['tools/pokearena/torre2-kanto-signatures-fx.js','kanto-signatures-fx.js'],
 ['tools/pokearena/torre2-next-specific-fx.js','next-specific-fx.js'],
 ['tools/pokearena/torre2-adapted-moves-fx.js','adapted-moves-fx.js'],
 ['tools/pokearena/torre2-early-route-fx.js','early-route-fx.js'],
 ['tools/pokearena/torre2-prebrock-damage-fx.js','prebrock-damage-fx.js'],
 ['tools/pokearena/torre2-clash-fx.js','clash-fx.js'],
 ['tools/pokearena/torre2-steel-fx.js','steel-fx.js'],
 ['tools/pokearena/torre2-route-data.js','route-data.js'],
 ['tools/pokearena/torre2-kanto-regions.js','kanto-regions.js'],
 ['tools/pokearena/torre2-kanto-tiles.js','kanto-tiles.js'],
 ['tools/pokearena/torre2-kanto-levels.js','kanto-levels.js'],
 ['tools/pokearena/torre2-kanto-world-map.js','kanto-world-map.js'],
 ['tools/pokearena/torre2-early-kanto-species.js','early-kanto-species.js'],
 ['tools/pokearena/torre2-all-kanto-species.js','all-kanto-species.js'],
 ['tools/pokearena/torre2-frlg-learnsets.js','frlg-learnsets.js']
].map(async([source,name])=>{
 await fs.copyFile(path.resolve(source),path.join(dest,clientSource,'torre2',name));
}));
await fs.cp('tools/pokearena/batch24',path.join(dest,clientSource,'torre2/batch24'),{recursive:true});
await fs.cp('tools/pokearena/surge3',path.join(dest,clientSource,'torre2/surge3'),{recursive:true});
patches.push(
 ['datos.js',[
  ['const TIPOS={','import{addEarlyKantoSpecies}from"./torre2/early-kanto-species.js";import{addAllKantoSpecies}from"./torre2/all-kanto-species.js";const TIPOS={'],
  ['const ROSTER=TODOS.filter(p=>!p.desactivado);',
   'TODOS.push(...addEarlyKantoSpecies(TODOS));TODOS.push(...addAllKantoSpecies(TODOS));const ROSTER=TODOS.filter(p=>!p.desactivado);']
 ]],
 ['habilidades.js',[
  ['import{CAMPO,RADIO,VISTA,limitarCampo,fueraCampo}from"./config.js";',
   'import{CAMPO,RADIO,VISTA,limitarCampo,fueraCampo}from"./config.js";import{TORRE2_FORMS}from"./torre2/signature-fx.js";'],
  ['const FORMAS={proyectil,chorro,cono,zona,rayo,pulso,',
   'const FORMAS={...TORRE2_FORMS,torre2_metronome:(l,h,extra)=>TORRE2_FORMS.torre2_metronome(l,h,extra,FORMAS),proyectil,chorro,cono,zona,rayo,pulso,']
 ]],
 ['luchador.js',[
  ['return this.aspecto?vfx.kitAspecto(kit,this.aspecto):kit',
   'return {...(this.aspecto?vfx.kitAspecto(kit,this.aspecto):kit),...(this.escena.datos?.torre2?{lmb:null,rmb:null,q:null,e:null}:{}),...(this.escena.datos?.torre2?(this.lado===0?this.escena.datos.torre2Loadout:this.escena.datos.torre2OpponentLoadout):{})}']
 ]]
);
patches.push(
 ['main.js',[
  ['import{DEBUG,ANCHO,ALTO,VISTA,PANTALLA,REEL,caso,registrarNombres}from"./config.js";',
   'import{DEBUG,ANCHO,ALTO,VISTA,PANTALLA,REEL,caso,registrarNombres}from"./config.js";import{Campanha}from"./torre2/campanha.js";'],
  ['scene:[Carga,Titulo,Seleccion,Combate,Batalla,Reel,Preparar,',
   'scene:[Carga,Campanha,Titulo,Seleccion,Combate,Batalla,Reel,Preparar,'],
  ['iniciarAvisos(juego);iniciarChat(juego,ajustar);iniciarTarjetas(juego);vigilarVersion(juego);',
   'window.__pt2Game=juego;/* Offline Kanto: do not start online chat, account or polling services. */']
 ]],
 ['escenas/carga.js',[
  ['else this.scene.start("titulo")','else this.scene.start(q.has("original")?"titulo":"campanha")']
 ]],
 ['escenas/combate.js',[
  ['resultado(){this.fase="fin";',
   'resultado(){if(this.datos.torre2){const ganhou=this.victorias[0]>this.victorias[1];this.fase="fin";this.time.delayedCall(700,()=>this.scene.start("campanha",{finished:true,won:ganhou,marker:this.datos.torre2}));return;}this.fase="fin";'],
  ['salir(){this.soltarTiempo();',
   'salir(){this.soltarTiempo();if(this.datos.torre2)return this.scene.start("campanha");']
 ]],
 ['luchador.js',[
  ['get defensa(){return(this.forma.def+(this.mega?this.forma.mega.def:0))*(this.jefe?.def??1)}','get defensa(){return(this.forma.def+(this.mega?this.forma.mega.def:0))*(this.jefe?.def??1)*(this.escena.datos?.torre2?2/(2+(this.est?.torre2Screech?.stages||0)):1)}'],
  ['if(intento?.mega&&!aturdido&&!this.dash&&!this.accion?.bloquea)',
   'if(!this.escena.datos?.torre2&&intento?.mega&&!aturdido&&!this.dash&&!this.accion?.bloquea)'],
  ['if(antes<this.expNecesaria&&this.exp>=this.expNecesaria&&!this.escena.sim){',
   'if(!this.escena.datos?.torre2&&antes<this.expNecesaria&&this.exp>=this.expNecesaria&&!this.escena.sim){']
 ]]
);

// Mud-Slap: authentic accuracy stages -1 through -6, lasting until
// switching or the end of the Kanto solo battle. Every on-target
// accuracy check uses 3/(3+stacks), but independent aiming still matters.
// This does NOT change the original client outside the Torre 2 campaign.
patches.push(
 ['luchador.js',[
  ['recibir(fuente,g){if(this.ko)return"nada";',
   'recibir(fuente,g){if(this.ko)return"nada";if(this.escena.datos?.torre2&&fuente&&fuente!==this&&!g.tick){const mud=Math.min(6,fuente.est?.torre2MudAccuracy?.stacks||0);if(mud>0&&Math.random()>=3/(3+mud))return"miss";}']
 ]]
);
// Fix CPU soft-lock: AI.elegir() previously returned early with only EVO/MEGA
// when EXP/ult meter allowed a transform, but the campaign blocks that input.
// As a result the enemy could stop fighting permanently. Skip the evolution
// *decision* exclusively in campaign and continue attack/defence planning.
patches.push(
 ['ia.js',[
  ['if(yo.puedeEvolucionar&&(d>c.evoDist||yo.hp/yo.hpMax<c.evoHp||s.vendido))',
   'if(!yo.escena.datos?.torre2&&yo.puedeEvolucionar&&(d>c.evoDist||yo.hp/yo.hpMax<c.evoHp||s.vendido))'],
  ['if(yo.puedeMega&&(d<c.megaDist||s.vendido))',
   'if(!yo.escena.datos?.torre2&&yo.puedeMega&&(d<c.megaDist||s.vendido))']
 ]]
);

// Pokédex (native): load the 26 real PMD base portraits + Idle animations
// before rendering its grid. The original client only preloads 4 starters at
// boot for Android speed, so most Pokédex images showed blank/black squares.
// Keep ALL original layout/controls/evolution tabs untouched. Evolutions
// download their own PMD Idle sheet on first click, and are cached thereafter.
patches.push(
 ['escenas/pokedex.js',[
  // Pending levels are visible in the native Pokédex, original sprites kept.
  ['const out=slot==="e"?["ULT"]:[];',
   'const out=slot==="e"?["ULT"]:[];if(h.pendiente&&h.torre2UnlockLevel)out.push("LOCKED LV "+h.torre2UnlockLevel);if(h.pendiente&&h.torre2UnlockEvolution)out.push("EVOLVE "+h.torre2UnlockEvolution);'],
  // Original styled Pokedex: adjust only the card grid for 36 families.
  ['const COLS=5,CEL=44,GX=10,GY=36;',
   'const COLS=6,CEL=36,GX=10,GY=36;'],
  ['this.add.image(x+1,y+1,`retrato-${p.dex}`).setOrigin(0);',
   'this.add.image(x+1,y+1,`retrato-${p.dex}`).setOrigin(0).setDisplaySize(CEL-4,CEL-4);'],
  ['import{atacarEnMenu}from"../sprites.js";',
   'import{atacarEnMenu,cargarPMD,crearAnimsPMD,soloFormas}from"../sprites.js";'],
  ['init(datos){this.foco=Math.max(0,ROSTER.findIndex(p=>p.id===datos?.id));this.etapa=0}create(){',
   'init(datos){this.foco=Math.max(0,ROSTER.findIndex(p=>p.id===datos?.id));this.etapa=0}preload(){const m=this.registry.get("manifiesto");this._torre2DexForms=soloFormas(m,new Set(ROSTER.map(p=>p.dex)));cargarPMD(this,this._torre2DexForms,["Idle"]);}create(){crearAnimsPMD(this,this._torre2DexForms,["Idle"]);'],
  ['irEtapa(i){if(i===this.etapa)return;this.etapa=i;sfx("confirmar");this.refrescar(true)}',
   'irEtapa(i){if(i===this.etapa)return;const e=etapasDe(ROSTER[this.foco])[i];if(!e)return;const m=this.registry.get("manifiesto"),forms=soloFormas(m,new Set([e.dex]));if(forms[e.dex]&&!this.anims.exists(`${e.dex}-Idle-0`)){const waiting=cargarPMD(this,forms,["Idle"]);if(waiting){this.load.once("complete",()=>{if(!this.scene.isActive())return;crearAnimsPMD(this,forms,["Idle"]);this.irEtapa(i)});if(!this.load.isLoading())this.load.start();return;}crearAnimsPMD(this,forms,["Idle"]);}this.etapa=i;sfx("confirmar");this.refrescar(true)}']
 ]]
);
// Offline single-player UI clean-up: retain the site's original pixel font,
// title logo, animated background, controls, credit screen and other screens.
// Only online, multiplayer, chat, connected players and combat evolution go.
patches.push(
 ['escenas/titulo.js',[
  ['{id:"online",txt:"ONLINE",menu:"online",ico:"globo"},',''],
  ['[["tiktok",600],["youtube",578],["instagram",556],["discord",528]]','[["tiktok",600],["youtube",578],["instagram",556]]'],
  ['const halo=this.add.graphics().setDepth(999).setPosition(528,Y);halo.fillStyle(5793266,.45);halo.fillRoundedRect(-13,-13,26,26,6);this.tweens.add({targets:halo,alpha:.15,duration:700,yoyo:true,repeat:-1,ease:"Sine.easeInOut"});const flecha=this.flecha(1).setDepth(1e3).setPosition(505,Y);this.tweens.add({targets:flecha,x:509,duration:420,yoyo:true,repeat:-1,ease:"Sine.easeInOut"});const c=this.chapa(528,Y+19,"JOIN!");c.mover(-Math.round(c.w/2))',''],
  ['{id:"versus",txt:"2 PLAYERS",escena:"seleccion",datos:{previo:{modo:"versus"}},ico:"dos"},',''],
  ['jugar:[{id:"liga",txt:"LEAGUE"',
   'jugar:[{id:"kanto",txt:"KANTO CAMPAIGN",escena:"campanha",ico:"pokeball"},{id:"liga",txt:"LEAGUE"'],
  ['ajustes:[{id:"perfil",txt:"PROFILE",escena:"perfil",ficha:true,ico:"perfil"},','ajustes:['],
  ['this.time.addEvent({delay:CADA_GENTE,loop:true,callback:()=>this.consultarGente()});this.consultarGente();',''],
  ['this.puntoGente=this.add.graphics().setDepth(1e3);',
   'this.puntoGente=this.add.graphics().setDepth(1e3).setVisible(false);'],
  ['this.gente=texto(this,22,10,"",{tam:8,color:"#bfe9c8",borde:3}).setOrigin(0,.5).setDepth(1e3);',
   'this.gente=texto(this,22,10,"",{tam:8,color:"#bfe9c8",borde:3}).setOrigin(0,.5).setDepth(1e3).setVisible(false);'],
  ['if(this.scene.isActive()&&red.conectado)red.pedir("$cuantos",{version:VERSION}).catch(()=>{})',
   '/* No connected-player checks in solo game. */'],
  ['this.conectarOnline();this.consultarGente()',
   '/* Online menus are disabled in the solo game. */'],
  ['if(o.menu==="online"&&!red.cuenta&&!red.ficha)return this.scene.start("cuenta",{volver:"online"});',
   'if(o.menu==="online")return;'],
  ['this.botones.forEach((b,i)=>{if(!b.dato)return;b.dato.setText(this.datoOnline(b.id)??"").setX(this.derecha(i)+1+(b.nuevo?b.nuevo.width+5:0))})',
   '/* No online person counter or activity data. */']
 ]],
 ['escenas/seleccion.js',[
  ['import{atacarEnMenu,precargarLineas,alTerminarCarga,dexAspecto,auraAspecto,ponerRetrato}from"../sprites.js";',
   'import{atacarEnMenu,precargarLineas,alTerminarCarga,dexAspecto,auraAspecto,ponerRetrato,cargarPMD,crearAnimsPMD,soloFormas,formasDe}from"../sprites.js";'],
  ['init(datos){this.previo=datos?.previo}create(){',
   'init(datos){this.previo=datos?.previo}preload(){const m=this.registry.get("manifiesto");this._torre2Selecao=soloFormas(m,formasDe(ROSTER.map(p=>p.id)));cargarPMD(this,this._torre2Selecao,["Idle"]);}create(){crearAnimsPMD(this,this._torre2Selecao,["Idle"]);'],
  ['const MODOS=[{id:"cpu",nombre:"VS CPU"},{id:"versus",nombre:"2 PLAYERS"},{id:"entreno",nombre:"TRAINING"}];',
   'const MODOS=[{id:"cpu",nombre:"VS CPU"},{id:"entreno",nombre:"TRAINING"}];'],
  ['ANCHO/2-130+i*130,27,m.nombre','ANCHO/2-67+i*134,27,m.nombre']
 ]],
 ['tactil.js',[
  ['BOTONES=calcular(CONTROLES.tactil?.tam);this.botones=BOTONES;',
   'BOTONES=calcular(CONTROLES.tactil?.tam).filter(b=>!escena.datos?.torre2||b.slot!=="mega");this.botones=BOTONES;']
 ]],
 ['hud.js',[
  ['else if(l.puedeEvolucionar&&l.humano&&parpadeo)est.push(',
   'else if(!this.e.datos?.torre2&&l.puedeEvolucionar&&l.humano&&parpadeo)est.push('],
  ['else if(l.puedeMega&&l.humano&&parpadeo)est.push(',
   'else if(!this.e.datos?.torre2&&l.puedeMega&&l.humano&&parpadeo)est.push(']
 ]],
 ['escenas/combate.js',[
  [' · ${n(k.mega)} mega evolve','${this.datos?.torre2?"":" · "+n(k.mega)+" mega evolve"}'],
  [' · ${n(k2.mega)} Mega','${this.datos?.torre2?"":" · "+n(k2.mega)+" Mega"}'],
  [' · ${bp("mega")} mega evolve','${this.datos?.torre2?"":" · "+bp("mega")+" mega evolve"}']
 ]],
 ['main.js',[
  ['import{iniciarChat,reservaChat}from"./chat.js";',
   'const reservaChat=()=>0; /* No chat widget or reserved space in solo game. */']
 ]],
 ['escenas/carga.js',[
  ['else this.scene.start(q.has("original")?"titulo":"campanha")',
   'else this.scene.start("titulo")']
 ]]
);
// League and selection use their OWN scene caches. Preloading only the
// selection never fixed the green missing-texture squares in the League map.
// Load precisely the league opponents' actual portrait IDs before create().
patches.push(
 ['escenas/liga.js',[
  ['import{dexAspecto,ponerRetrato}from"../sprites.js";',
   'import{dexAspecto,ponerRetrato,cargarPMD,soloFormas}from"../sprites.js";'],
  ['init(datos){this.conGuia=!!datos?.tutorial;this.sys.settings.data={}}create(){',
   'init(datos){this.conGuia=!!datos?.tutorial;this.sys.settings.data={}}preload(){const m=this.registry.get("manifiesto");const needed=new Set();for(const circuit of LIGA.ligas)for(const rv of rivalesDe(circuit)){const p=ROSTER.find(q=>q.id===(rv.pokemon??rv.id));if(!p)continue;const stage=rv.etapa??rv.retrato;const actual=stage?etapaDe(p,stage):p;if(actual?.dex){needed.add(actual.dex);needed.add(dexAspecto(actual.dex,rv.aspecto,m));}}cargarPMD(this,soloFormas(m,needed),[]);}create(){'],
  ['if(dex!==p.dex)ponerRetrato(this,img,dex);',
   'ponerRetrato(this,img,dex);']
 ]],
 ['escenas/seleccion.js',[
  ['const img=this.add.image(x+2,y+3,`retrato-${p.dex}`).setOrigin(0);const bloqueado=',
   'const img=this.add.image(x+2,y+3,`retrato-${p.dex}`).setOrigin(0);ponerRetrato(this,img,p.dex);const bloqueado=']
 ]]
);
// Ice Beam uses original Chorro.pintarHaz renderer (Hyper Beam / Aura Storm).
// The client ships unchanged original palettes, plus this opt-in icy variant.
patches.push(['habilidades.js',[
 ['const aAspecto=',"PALETAS.hieloTorre2={contorno:0x0b2843,borde:0x5daaca,cuerpo:0x40b9e2,nucleo:0xe4fcff,hebra:0xffffff,hebraAtras:0x66c0dc,claro:0xdaf6ff,particula:\"chispa\"};HAZ.hieloTorre2={halo:0x65bbec,borde:0x143b61,cuerpo:0x68c6e8,nucleo:0xeaffff,veta:0xb0edff,motas:[0xffffff,0xacecff,0x54bbda,0x2787ad]};const aAspecto="],
 ["if(h.haz&&frente>cola)this.pintarHaz(dt,dispara,S,cos,sin,cola,frente,tc);","if(h.haz&&frente>cola)this.pintarHaz(dt,dispara,S,cos,sin,cola,frente,tc);if(h.paleta===\"hieloTorre2\"&&frente>cola){const gg=this.g,span=Math.max(1,frente-cola-14),step=Math.floor(tc*30);for(const b of S)for(let k=0;k<7;k++){const s=cola+8+((k*43+step*9)%span),side=k%2?1:-1,offset=side*(h.ancho*.69+3+Math.sin(tc*22+k*1.9)*2);const xx=Math.round(b.x+cos*s-sin*offset),yy=Math.round(b.y+sin*s+cos*offset-alturaRayo(b.alt,s));gg.fillStyle(0x113e5e,.9);gg.fillRect(xx-2,yy-4,5,9);gg.fillRect(xx-4,yy-2,9,5);gg.fillStyle(k%3===0?0xffffff:0x9eeafb,1);gg.fillRect(xx-1,yy-4,3,9);gg.fillRect(xx-4,yy-1,9,3);gg.fillStyle(0x49acdf,.9);gg.fillRect(xx-1,yy-1,3,3);}}"]
]]);
// New Steel Beam delegates the ORIGINAL Lucario Aura Storm Chorro renderer.
// The source renderer and its approved colors remain unchanged; only this
// named optional palette is installed. Native beam fragments/hit timing,
// real cursor steering, Clash, impact and depth stay owned by habilidades.js.
patches.push(['habilidades.js',[
 ['const aAspecto=',
  'PALETAS.metalTorre2={contorno:0x101f30,borde:0x5c788b,cuerpo:0x8fb9cb,nucleo:0xf8ffff,hebra:0xffffff,hebraAtras:0x91b7c9,claro:0xf0ffff,particula:"chispa"};HAZ.metalTorre2={halo:0x8fdde9,borde:0x213b51,cuerpo:0xb6d7e1,nucleo:0xffffff,veta:0xe7fcff,motas:[0xffffff,0xe6fbff,0xb5d9e4,0x739cab]};const aAspecto='
 ]
]]);
// Delegate Steel Beam to the EXACT original chorro function. No clone of
// its visual engine or modified native Aura Storm metadata.
patches.push(['habilidades.js',[
 ['torre2_metronome:(l,h,extra)=>TORRE2_FORMS.torre2_metronome(l,h,extra,FORMAS),proyectil,chorro,',
  'torre2_steelbeam:(l,h,extra)=>TORRE2_FORMS.torre2_steelbeam(l,h,extra,chorro),torre2_metronome:(l,h,extra)=>TORRE2_FORMS.torre2_metronome(l,h,extra,FORMAS),proyectil,chorro,'
 ]
]]);
// Level 50 versus level 6: adapt the FireRed level term and HP to the
// original Arena 2D damage pipeline without touching moves or visual effects.
patches.push(['luchador.js',[
 ['import{REGLAS,TIPOS,ESTADOS_TIPO,efectividad,etapaDe,umbralesExp}from"./datos.js";',
  'import{REGLAS,TIPOS,ESTADOS_TIPO,efectividad,etapaDe,umbralesExp}from"./datos.js";import{campaignFighterLevel as torre2FighterLevel,campaignDamageMultiplier as torre2DamageMultiplier,campaignScaledHp as torre2ScaledHp,CAMPAIGN_PLAYER_DAMAGE_BOOST as torre2PlayerDamageBoost}from"./torre2/level-balance.js";'],
 ['get hpMax(){return this.jefe?.vidaFija??Math.round(this.forma.hp*REGLAS.vidaGlobal*(this.jefe?.vida??1))}',
  'get hpMax(){const base=this.jefe?.vidaFija??Math.round(this.forma.hp*REGLAS.vidaGlobal*(this.jefe?.vida??1));return this.escena.datos?.torre2?torre2ScaledHp(base,torre2FighterLevel(this)):base}'],
 ['let d=g.dano*mult*(g.puro?1:REGLAS.danoGlobal);if(!g.puro){',
  'let d=g.dano*mult*(g.puro?1:REGLAS.danoGlobal);if(e.datos?.torre2&&!g.puro&&fuente&&fuente!==this&&Number.isInteger(fuente.lado)&&fuente.lado!==this.lado){d*=torre2DamageMultiplier(torre2FighterLevel(fuente),torre2FighterLevel(this));if(fuente.lado===0)d*=torre2PlayerDamageBoost;}if(!g.puro){']
]]);
// Flash Cannon lowers Special Defense on an actual successful hit.
// The Arena 2D base has one generic defensive stat: apply the stage modifier
// ONLY to explicitly tagged SPECIAL Torre 2 moves, never to physical natives.
patches.push(['luchador.js',[[
 'd*=(fuente?.atk??1)/this.defensa;',
 'd*=(fuente?.atk??1)/this.defensa;if(e.datos?.torre2&&(g.categoria==="SPECIAL"||g.especial===true)&&this.est.torre2SteelSpDef?.stacks)d*=(2+Math.min(6,this.est.torre2SteelSpDef.stacks))/2;'
]]]);
// Final 13 only: status effects use native Luchador state lifetimes.
// Sand Attack: 28% accuracy loss on physical collision, never blind all hits.
// Light Screen: halve Special damage; Rain Dance affects Water and Fire.
// Preserve all approved VFX and non-Kanto game modes.
patches.push(['luchador.js',[
 ['recibir(fuente,g){if(this.ko)return"nada";',
  'recibir(fuente,g){if(this.ko)return"nada";if(this.escena?.datos?.torre2&&!g?.tick&&!g?.puro&&fuente?.est?.torre2SandAccuracy&&Math.random()<(fuente.est.torre2SandAccuracy.chance??.28))return"miss";'],
 ['let d=g.dano*mult*(g.puro?1:REGLAS.danoGlobal);',
  'let d=g.dano*mult*(g.puro?1:REGLAS.danoGlobal);if(e.datos?.torre2&&!g.puro){if(this.est.torre2LightScreen&&(g.categoria==="SPECIAL"||g.especial===true))d*=.5;if(e.__torre2Rain?.until>e.t){if(g.tipo==="WATER")d*=1.35;else if(g.tipo==="FIRE")d*=.65}}']
]]);
// Preload every member before first round: in-place swap never triggers LOADING.
patches.push(['escenas/combate.js',[[
 'const dexs=formasDe(d.jugadores?d.jugadores.map(j=>j.id):[d.p1,d.p2],d.jugadores?d.jugadores.map(j=>j.aspecto):d.aspectos);',
 'const ids=d.torre2?.party?[...d.torre2.party.friend,...d.torre2.party.foes].map(m=>m.id):d.jugadores?d.jugadores.map(j=>j.id):[d.p1,d.p2];const dexs=d.torre2?.party?new Set(ids.map(id=>{const found=buscar(id);return found?.etapa?found.def.evoluciones[found.etapa-1]?.dex??found.def.dex:found?.def?.dex}).filter(Boolean)):formasDe(ids,d.jugadores?d.jugadores.map(j=>j.aspecto):d.aspectos);'
]]]);
// KANTO-ONLY: fix the real Phaser Luchador renderer instead of only changing
// the HUD or a single sprite frame during a manual switch. Native walking,
// attacks and fainting may switch PMD atlases on every update. If an old
// animation survives a species replacement, discard it before render and
// recover the atlas for the active fighter. Preserve all other game modes.
patches.push(['luchador.js',[[
 'actualizarGraficos(dt=0){const r=CAMPO.ovalo?v=>v:Math.round;',
 'actualizarGraficos(dt=0){if(this.escena.datos?.torre2&&this.spr?.active){const actual=String(this.spr.texture?.key||""),due="pmd-"+this.dex+"-";if(actual.startsWith("pmd-")&&!actual.startsWith(due)){this.spr.anims.stop();const idle=due+"Idle";if(this.escena.textures.exists(idle))this.spr.setTexture(idle);this.claveAnim=null;this.__torre2RenderCorrections=(this.__torre2RenderCorrections||0)+1}}const r=CAMPO.ovalo?v=>v:Math.round;'
]]]);
for(const [filename,changes] of patches){
 const filenameFull=path.join(dest,clientSource,filename);
 let body=await fs.readFile(filenameFull,'utf8');
 for(const [from,to] of changes){
  if(!body.includes(from)){
   // Original site startup calls change; no optional online code in Torre 2.
   if(filename==='main.js'&&from.startsWith('iniciarAvisos(juego);')){
    const marker='if(DEBUG)window.juego=juego;';
    if(!body.includes(marker))throw Error('Unknown upstream Phaser game startup');
    body=body.replace(marker,marker+'window.__pt2Game=juego;');
    body=body.replace(/\b(?:iniciarAvisos|iniciarChat|iniciarTarjetas|vigilarVersion)\(juego(?:,ajustar)?\);/g,'');
    continue;
   }
   if(filename==='main.js'&&from.includes('import{iniciarChat,reservaChat}')){
    // Chat bootstrap no longer has a stable import form in the public client.
    // The offline game does not use the chat nor reserve any chat width.
    body=body.replace(/import\s*\{[^}]*\b(?:iniciarChat|reservaChat)\b[^}]*\}\s*from\s*["']\.\/chat\.js["'];?/g,'');
    body=body.replace(/\breservaChat\s*\(\s*\)/g,'0');
    continue;
   }
   // Native League's optional portrait warmup can move between releases.
   // Only Kanto's Phaser code is altered by this patch; never block its
   // release on an unrelated legacy-mode preload variation.
   if(filename==='escenas/liga.js'){
    // The native League has changed its init signature, but its PMD
    // portraits still must be preloaded BEFORE create() builds the cards.
    if(from.startsWith('init(datos)')){
     const begin=to.indexOf('preload(){'),end=to.lastIndexOf('create(){');
     if(begin<0||end<=begin||!body.includes('create(){'))
      throw Error('League bootstrap changed beyond safe preload injection');
     if(!body.includes('preload(){'))body=body.replace('create(){',
      to.slice(begin,end)+'create(){');
     continue;
    }
    if(from.startsWith('if(dex!==p.dex)')){
     body=body.replace(/if\([^)]*\)ponerRetrato\(this,img,dex\);/g,
      'ponerRetrato(this,img,dex);');
     continue;
    }
    console.warn('Optional League patch moved:',from.slice(0,70));
    continue;
   }
   // The upstream client occasionally changes the CAMPO renderer's
   // first statement. Apply the SAME Kanto-only wrong-texture guard at
   // the actual method entry, without rewriting native drawing logic.
   if(filename==='luchador.js'&&from.startsWith('actualizarGraficos(dt=0)')){
    const originalEntry='actualizarGraficos(dt=0){';
    if(!body.includes(originalEntry))
     throw Error('Changed Luchador graphics method; refusing unsafe patch');
    const guarded=to.slice(originalEntry.length).split('const r=CAMPO.ovalo')[0];
    if(!guarded||!guarded.includes('this.escena.datos?.torre2'))
     throw Error('Invalid scoped Kanto texture guard');
    body=body.replace(originalEntry,originalEntry+guarded);
    continue;
   }
   if(filename==='ia.js'&&from.startsWith('if(yo.puede')){
    const capability=from.includes('puedeMega')?'puedeMega':'puedeEvolucionar';
    const pattern=new RegExp('if\\s*\\(\\s*yo\\.'+capability+'\\s*&&');
    if(pattern.test(body))body=body.replace(pattern,
     'if(!yo.escena.datos?.torre2&&yo.'+capability+'&&');
    else console.warn('Native Arena AI has changed its optional '+capability+' branch');
    continue;
   }
   throw Error('Unrecognized upstream client in '+filename+': '+from.slice(0,60));
  }
  body=body.replace(from,to);
 }
 await fs.writeFile(filenameFull,body);
}

// Expand Pokedex without overlapping its original animated Pokémon
// pedestal: six rows of six cards with tiny previous/next Phaser controls.
const {paginateKantoPokedexSource}=await import('./torre2-pokedex-pages.mjs');
const pokedexPath=path.join(dest,clientSource,'escenas/pokedex.js');
await fs.writeFile(pokedexPath,paginateKantoPokedexSource(
 await fs.readFile(pokedexPath,'utf8')));

// Avoid stale attack VFX on mobile browsers and GitHub Pages caching.
// Previously all revisions imported exactly the same /src-8d89349697/*.js
// URL: a ?v= query added to /arena2d/ never invalidated those modules.
// Fingerprint the FINAL patched JS and place that entire original Phaser
// module tree under a fresh, content-addressed src-xxxxxxxxxx directory.
const vfxFingerprint=createHash('sha256');
vfxFingerprint.update(await fs.readFile('tools/pokearena/torre2-campaign-art.js'));
for(const filename of [
 'main.js','habilidades.js','datos.js','escenas/titulo.js','escenas/pokedex.js','escenas/carga.js',
 'torre2/next-specific-fx.js','torre2/adapted-moves-fx.js','torre2/early-route-fx.js','torre2/prebrock-damage-fx.js','torre2/finale13.js','torre2/torre2-finale13-catalog.js','torre2/clash-fx.js','torre2/steel-fx.js','torre2/signature-fx.js',
 'torre2/move-pool.js','torre2/early-kanto-species.js','torre2/all-kanto-species.js','torre2/campanha.js','torre2/battle-path.js',
 'torre2/party-battle.js','torre2/training.js','torre2/training-input.js','torre2/campaign-map-unified.js','torre2/level-balance.js',
 'torre2/campaign-art.js','torre2/cc0-overworld.js','torre2/frlg-location.js','torre2/frlg-npc.js','torre2/kanto-hotspots.js','torre2/frlg-interiors.js','torre2/frlg-available.js','torre2/kanto-regions.js','torre2/kanto-tiles.js','torre2/kanto-levels.js','torre2/kanto-world-map.js','torre2/capture-mechanics.js','torre2/capture-arena.js','torre2/ball-sprites.js','torre2/ball-choreography.js','torre2/campaign-sprites.js','torre2/kanto-signatures-fx.js'
])vfxFingerprint.update(await fs.readFile(path.join(dest,clientSource,filename)));
for(const name of (await fs.readdir('tools/pokearena/batch24')).sort())
 vfxFingerprint.update(await fs.readFile(path.join(dest,clientSource,'torre2/batch24',name)));
for(const name of (await fs.readdir('tools/pokearena/surge3')).sort())
 vfxFingerprint.update(await fs.readFile(path.join(dest,clientSource,'torre2/surge3',name)));
const versionedSource='src-'+vfxFingerprint.digest('hex').slice(0,10);
if(versionedSource===clientSource)throw Error('VFX fingerprint collides with upstream dir');
const finalHTML=await fs.readFile(index,'utf8');
const oldModule='src="'+clientSource+'/main.js"';
if(!finalHTML.includes(oldModule))
 throw Error('Main Phaser module URL not found for cache-busted revision');
const stampedHTML=finalHTML.replace(oldModule,
 'src="'+versionedSource+'/main.js"')
 .replace('</head>',
 '<meta name="pokemon-torre-build" content="'+versionedSource+'">\n</head>');
await fs.writeFile(index,stampedHTML);
await fs.rename(path.join(dest,clientSource),path.join(dest,versionedSource));
console.log('Versioned Phaser modules for mobile cache:',versionedSource);

const raw=JSON.parse(await fs.readFile('site-capture/CAPTURE-REPORT.json','utf8'));
await fs.writeFile(path.join(dest,'version.json'),JSON.stringify({
 src:raw.sourceVersions?.selected||null,modules:versionedSource,
 pixelFXVersion:versionedSource,localMirror:true
}));
await fs.writeFile(path.join(dest,'capture-provenance.json'),JSON.stringify({
 source:raw.source,files:raw.totalFiles,version:raw.sourceVersions?.selected,
 originalCatalog:raw.sourceCatalog,capturedAt:raw.completed,personalUse:true,
 notice:'Source client reproduction in Phaser: standalone training/lobby only. Pokémon Torre 1 Kanto campaign integration pending.'
},null,2));
console.log('Isolated Phaser site client ready:',dest);
