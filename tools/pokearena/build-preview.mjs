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
const clientSource=(await fs.readdir(dest)).find(x=>/^src-[0-9a-f]{10}$/.test(x));
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
  ['return m&&(m.feet??5)-(m.head??-16)<=36',
   'return m&&this.anims.exists(`${f.dex}-Idle-2`)&&(m.feet??5)-(m.head??-16)<=36'],
  ['if(!m||(m.feet??5)-(m.head??-16)>50)return;',
   'if(!m||!this.anims.exists(`${forma.dex}-Idle-2`)||(m.feet??5)-(m.head??-16)>50)return;']
 ]]
];
// Place the solo campaign beside the recovered original source so browsers do
// not depend on server APIs or external runtime assets for Kanto progression.
await fs.mkdir(path.join(dest,clientSource,'torre2'),{recursive:true});
await Promise.all([
 ['src/progression.js','progression.js'],
 ['tools/pokearena/torre2-campaign-core.js','campaign-core.js'],
 ['tools/pokearena/torre2-campaign-scene.js','campanha.js'],
 ['tools/pokearena/torre2-campaign-art.js','campaign-art.js'],
 ['tools/pokearena/torre2-move-pool.js','move-pool.js'],
 ['tools/pokearena/torre2-signature-fx.js','signature-fx.js'],
 ['tools/pokearena/torre2-next-batch-fx.js','next-batch-fx.js'],
 ['tools/pokearena/torre2-mega-patch-fx.js','mega-patch-fx.js'],
 ['tools/pokearena/torre2-species-fx.js','species-fx.js'],
 ['tools/pokearena/torre2-kanto-signatures-fx.js','kanto-signatures-fx.js'],
 ['tools/pokearena/torre2-next-specific-fx.js','next-specific-fx.js'],
 ['tools/pokearena/torre2-adapted-moves-fx.js','adapted-moves-fx.js'],
 ['tools/pokearena/torre2-early-route-fx.js','early-route-fx.js'],
 ['tools/pokearena/torre2-prebrock-damage-fx.js','prebrock-damage-fx.js'],
 ['tools/pokearena/torre2-clash-fx.js','clash-fx.js'],
 ['tools/pokearena/torre2-route-data.js','route-data.js'],
 ['tools/pokearena/torre2-early-kanto-species.js','early-kanto-species.js']
].map(async([source,name])=>{
 await fs.copyFile(path.resolve(source),path.join(dest,clientSource,'torre2',name));
}));
patches.push(
 ['datos.js',[
  ['const TIPOS={','import{addEarlyKantoSpecies}from"./torre2/early-kanto-species.js";const TIPOS={'],
  ['const ROSTER=TODOS.filter(p=>!p.desactivado);',
   'TODOS.push(...addEarlyKantoSpecies(TODOS));const ROSTER=TODOS.filter(p=>!p.desactivado);']
 ]],
 ['habilidades.js',[
  ['import{CAMPO,RADIO,VISTA,limitarCampo,fueraCampo}from"./config.js";',
   'import{CAMPO,RADIO,VISTA,limitarCampo,fueraCampo}from"./config.js";import{TORRE2_FORMS}from"./torre2/signature-fx.js";'],
  ['const FORMAS={proyectil,chorro,cono,zona,rayo,pulso,',
   'const FORMAS={...TORRE2_FORMS,torre2_metronome:(l,h,extra)=>TORRE2_FORMS.torre2_metronome(l,h,extra,FORMAS),proyectil,chorro,cono,zona,rayo,pulso,']
 ]],
 ['luchador.js',[
  ['return this.aspecto?vfx.kitAspecto(kit,this.aspecto):kit',
   'return {...(this.aspecto?vfx.kitAspecto(kit,this.aspecto):kit),...(this.escena.datos?.torre2?(this.lado===0?this.escena.datos.torre2Loadout:this.escena.datos.torre2OpponentLoadout):{})}']
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
for(const [filename,changes] of patches){
 const filenameFull=path.join(dest,clientSource,filename);
 let body=await fs.readFile(filenameFull,'utf8');
 for(const [from,to] of changes){
  if(!body.includes(from))throw Error('Unrecognized upstream client in '+filename+': '+from.slice(0,60));
  body=body.replace(from,to);
 }
 await fs.writeFile(filenameFull,body);
}

// Avoid stale attack VFX on mobile browsers and GitHub Pages caching.
// Previously all revisions imported exactly the same /src-8d89349697/*.js
// URL: a ?v= query added to /arena2d/ never invalidated those modules.
// Fingerprint the FINAL patched JS and place that entire original Phaser
// module tree under a fresh, content-addressed src-xxxxxxxxxx directory.
const vfxFingerprint=createHash('sha256');
vfxFingerprint.update(await fs.readFile('tools/pokearena/torre2-campaign-art.js'));
for(const filename of [
 'main.js','habilidades.js','datos.js','escenas/titulo.js','escenas/pokedex.js','escenas/carga.js',
 'torre2/next-specific-fx.js','torre2/adapted-moves-fx.js','torre2/early-route-fx.js','torre2/prebrock-damage-fx.js','torre2/clash-fx.js','torre2/signature-fx.js',
 'torre2/move-pool.js','torre2/early-kanto-species.js','torre2/campanha.js','torre2/campaign-art.js','torre2/capture-mechanics.js','torre2/capture-arena.js','torre2/kanto-signatures-fx.js'
])vfxFingerprint.update(await fs.readFile(path.join(dest,clientSource,filename)));
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
