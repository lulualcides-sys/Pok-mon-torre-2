/* Alpha 0.76.2 release candidate: overlay of the current main gameplay modules
 * onto the audited Torre 2 build of the public 0.76.2 base client (PR #647,
 * docs/PORTA-ALPHA-0762.md). Same overlay as publish-hotfix-on-alpha0713.mjs;
 * keeps the official client, credited art, saves and approved VFX, and the
 * pre-overlay module tree as a rollback sibling. Refuses drift.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {removeNewsTitleOption} from './torre2-title-pokedex-fast.mjs';
import {windowNativePokedex} from './torre2-pokedex-window.mjs';
import {installJohtoSpriteCollabAssets} from './install-johto-sprites.mjs';
import {patchAccountRequirement,patchAccountScene} from './torre2-trainer-name.mjs';

const site=path.resolve(process.env.TORRE2_SITE_ROOT||'_site');
const root=path.join(site,'arena2d');
const read=file=>fs.readFile(file,'utf8');
const must=(ok,message)=>{if(!ok)throw Error('Alpha 0.76.2 release: '+message)};
const exactly=(text,part,label)=>must(text.split(part).length===2,'Unexpected '+label);
const versionFile=path.join(root,'version.json');
const version=JSON.parse(await read(versionFile));
must(version.src==='src-5bf1a1a788'&&/^src-[a-f0-9]{10}$/.test(version.modules||''),
 'not the audited 0.76.2 site');
const oldModule=version.modules;
const original=path.join(root,oldModule);
must((await fs.stat(path.join(original,'config.js'))).isFile(),'native Phaser source missing');
const config=await read(path.join(original,'config.js'));
must(/\bVERSION\s*=\s*["']0\.76\.2["']/.test(config),'official native Alpha changed');
const audits=JSON.parse(await read(path.join(root,'rights-audit-0713.json')));
// Art and its rights audit are inherited unchanged from the audited 0.71.3 release.
must(audits.alpha==='0.71.3'&&audits.src==='src-5ccc174cb8'&&audits.summary?.forms===30,
 'artist/source audit changed');
must((await fs.stat(path.join(root,'CONTRIBUTOR-CREDITS-0713.md'))).size>100,
 'artist credits absent');
const manifestFile=path.join(root,'assets/pmd/manifest.json');
const currentManifest=JSON.parse(await read(manifestFile));
must(Object.keys(currentManifest).length>=278&&currentManifest['0467']?.anims?.Idle,
 'approved PMD manifest or Magmortar missing');

// Keep the old SHA-addressed source tree as a rollback sibling.
const overlayNames=[
 ['tools/pokearena/torre2-arena-move-policy.js','torre2/arena-move-policy.js'],
 ['tools/pokearena/torre2-johto-100-species.js','torre2/johto-100-species.js'],
 ['tools/pokearena/torre2-auto-battle.js','torre2/auto-battle.js'],
 ['tools/pokearena/torre2-wobbuffet-native.js','torre2/wobbuffet-native.js'],
 ['tools/pokearena/torre2-gen3-status.js','torre2/gen3-status.js'],
 // Signed off independently: original Batch24 AoE collision/VFX and current
 // regional Kanto battle logic. Both are part of the existing approved site.
 ['tools/pokearena/batch24/runtime.js','torre2/batch24/runtime.js'],
 ['tools/pokearena/torre2-campaign-core.js','torre2/campaign-core.js'],
 // Audited presentation-only #600 backport; preserves sprites and campaign save order.
 ['tools/pokearena/torre2-trainer-cards.js','torre2/trainer-cards.js'],
 // Campaign menus (native buttons/panels, Pokémon Center): presentation only.
 ['tools/pokearena/torre2-campaign-scene.js','torre2/campanha.js'],
 // Player character (Red/Leaf) chosen on the trainer-name screen.
 ['tools/pokearena/torre2-frlg-npc.js','torre2/frlg-npc.js'],
 // Post-battle report restyled with the native kit (texts and hit zones unchanged).
 ['tools/pokearena/torre2-battle-report.js','torre2/battle-report.js']
];
const overlays=await Promise.all(overlayNames.map(async([source,target])=>{
 const incoming=await read(source);
 must(incoming.length>900,'truncated '+source);
 must((await fs.stat(path.join(original,target))).size>500,
  'missing approved module '+target);
 let content=incoming;
 if(target==='torre2/batch24/runtime.js')
  must(content.includes('if(hit.landed)hitPoints.push({x:contact.x,y:contact.y})')&&
   content.includes('for(const r of batch24AreaTargets(l))'),
   'Earth Power AoE verified-impact patch missing');
 if(target==='torre2/campaign-core.js')
  must(content.includes('const tier=campaignDifficultyTier(s.stage,opponent.leader,opponent.kind)')&&
   content.includes('const encounter=regionalTrainer(s.stage,s.trainer)'),
   'Campaign native battle and regional roster patch missing');
 if(target==='torre2/trainer-cards.js')
  must(content.includes('export function trainerCardSections(stage,total)')&&
   content.includes('const visibleEntries=sections[page].indices.map(index=>all[index])')&&
   content.includes('scenicBackdrop(scene,layer,state.stage)')&&
   content.includes("setData('torre2-trainer-card-index',entry.index)"),
   'Safe campaign route/gym card partition or approved touch hitboxes absent');
 if(target==='torre2/arena-move-policy.js'){
  for(const [before,after] of [
   ["from './torre2-frlg-learnsets.js'","from './frlg-learnsets.js'"],
   ["from './torre2-arena-approved-121.js'","from './arena-approved-121.js'"],
   ["from './torre2-arena-native-dodges.js'","from './arena-native-dodges.js'"]
  ]){
   exactly(content,before,target+' imports');
   content=content.replace(before,after);
  }
 }
 return {target,content};
}));

// The pinned 0.71.3 pack index pre-dates installed fan-made Magmortar and
// Johto PMD; it wrongly routes their Idle sprites to the old common .bin.
// Use only already-hosted, verified loose PNGs for affected form IDs.
// Scizor #0212 is absent from the pinned binary pack index; its official
// loose PMD files already exist and must bypass the obsolete common archive.\n// Native packed client remains untouched; never synthesize missing sprites.
const packs=await read(path.join(original,'paquetes.js'));
const packAnchor='const paqueteDe=ruta=>{const dex=ruta.split("/")[0];';
exactly(packs,packAnchor,'native PMD package routing');
const looseDex=['0467','0236','0237','0171','0198','0212'];
const packageOverride='if(["0467","0236","0237","0212"].includes(dex)||'+
 '(["0171","0198"].includes(dex)&&/\\/Idle-Anim\\.png$/.test(ruta)))return null;';
const packsPatched=packs.replace(packAnchor,packAnchor+packageOverride);

// In this exact Alpha 0.71.3 snapshot the native Eevee has two obsolete
// self-stages (DEX 0133), not the real evolutions. Reconstruct ONLY its
// offline candidate stage descriptors from installed Kanto/Johto libraries.
// No made-up VFX, types, statistics, scripts, or replacement of original P2.
const sourceRoster=await read(path.join(original,'datos.js'));
const rosterAnchor='upgradeKantoEvolutionBattleKits(TODOS);const ROSTER=';
exactly(sourceRoster,rosterAnchor,'native 0.71.3 roster factory');
const eeveeBranches=[
 'const __pt2Eevee=TODOS.find(p=>p.id==="eevee");',
 'const __pt2KantoEevee=addAllKantoSpecies(TODOS.filter(p=>p.id!=="eevee")).find(p=>p.id==="eevee");',
 'const __pt2JohtoEevee=["espeon","umbreon"].map(id=>TODOS.find(p=>p.id===id));',
 'if(!__pt2Eevee||__pt2KantoEevee?.evoluciones?.length!==3||__pt2JohtoEevee.some(p=>!p?.kit?.lmb?.forma))',
 'throw Error("Eevee branches require five installed native legal battle kits");',
 '__pt2Eevee.evoluciones=[',
 '...__pt2KantoEevee.evoluciones.map(p=>({...p})),',
 '...__pt2JohtoEevee.map(p=>({dex:p.dex,nombre:p.nombre,tipos:[...p.tipos],',
 ' hp:p.hp,atk:p.atk,def:p.def,vel:p.vel,regen:p.regen,kit:p.kit}))];',
 'if(__pt2Eevee.evoluciones.some(p=>!p?.kit?.lmb?.forma||!p.dex))',
 'throw Error("Missing Eevee real evolution moves or art");'
].join('');
const rosterPatched=sourceRoster.replace(rosterAnchor,
 'upgradeKantoEvolutionBattleKits(TODOS);'+eeveeBranches+'const ROSTER=');

const nativeSkills=await read(path.join(original,'habilidades.js'));
const fxImport='import{TORRE2_FORMS}from"./torre2/signature-fx.js";';
const fxSpread='const FORMAS={...TORRE2_FORMS,';
exactly(nativeSkills,fxImport,'Wobbuffet dependency injection');
exactly(nativeSkills,fxSpread,'Wobbuffet renderer registration');
must(!nativeSkills.includes('TORRE2_WOBBUFFET_FORMS'),
 'renderer already contains Wobbuffet forms; review source before overwrite');
const wobbuffetImport='import{TORRE2_WOBBUFFET_FORMS}from"./torre2/wobbuffet-native.js";';
const skillUpdate=nativeSkills.replace(fxImport,fxImport+wobbuffetImport)
 .replace(fxSpread,'const FORMAS={...TORRE2_FORMS,...TORRE2_WOBBUFFET_FORMS,');
must(skillUpdate.includes('...TORRE2_WOBBUFFET_FORMS'),'Wobbuffet cast registration failed');

let fighter=await read(path.join(original,'luchador.js'));
const poisonHit='this.hp=Math.max(this.inmortal?1:0,this.hp-d);';
exactly(fighter,poisonHit,'poison HP hit pathway');
const previousPoisonGuard='if(!this.inmortal&&this.def?.torre2ArenaAdded===true&&!this.escena.datos?.torre2&&g.puro&&g.tick&&g.tipo==="POISON"&&this.hp>0&&this.hp<1)this.hp=0;';
exactly(fighter,previousPoisonGuard,'previous poison guard');
fighter=fighter.replace(previousPoisonGuard,
 'if(!this.inmortal&&!this.escena.datos?.torre2&&!this.escena.entreno&&g.puro&&g.tick&&g.tipo==="POISON"&&this.hp>0&&this.hp<1)this.hp=0;');
const previousRegen='!(this.def?.torre2ArenaAdded===true&&!this.escena.entreno&&this.est.veneno)';
exactly(fighter,previousRegen,'previous poison regeneration guard');
fighter=fighter.replace(previousRegen,
 '!(!this.escena.entreno&&!this.escena.datos?.torre2&&this.est.veneno)');
// The approved 0.71.3 native EVO callback can complete after the branch
// guard has selected Eevee/ Tyrogue's final form. Synchronize the actual
// Phaser fighter sprite and move kit to its selected dex on the next frame.
// One-time, per-fighter, offline, after evolution; never repaint in campaign,
// online, or for any other species. The visual update still belongs to Phaser.
// Some 0.71.3 Eevee slots retain alternate-costume dex #0133 even after
// the fighter's evolved form has switched to Umbreon/Espeon. Native dexActual
// prioritizes that cosmetic alternate. Only the chosen permanent offline
// branch should override this priority; all other costumes remain native.
const branchDexAnchor='get dexActual(){return this.alt?.dex??this.forma.dex}';
exactly(fighter,branchDexAnchor,'native cosmetic-first dex getter');
const branchDexGetter='get dexActual(){'+
 'if(!this.escena?.datos?.torre2&&this.escena?.datos?.modo!=="online"&&'+
 '((this.def?.id==="eevee"||this.def?.id==="tyrogue")||'+
 'this.def?.torre2ArenaAdded===true)&&this.etapa>0)'+
 'return this.forma.dex;return this.alt?.dex??this.forma.dex}';
fighter=fighter.replace(branchDexAnchor,branchDexGetter);
const spriteGraphicsAnchor='actualizarGraficos(dt=0){';
exactly(fighter,spriteGraphicsAnchor,'native sprite update');
const branchSpriteSync='if(!this.escena?.datos?.torre2&&'+
 'this.escena?.datos?.modo!=="online"&&'+
 '((this.def?.id==="eevee"||this.def?.id==="tyrogue")||'+
 'this.def?.torre2ArenaAdded===true)&&this.etapa>0){'+
 'const dex=this.dexActual;'+
 'if(dex&&this.dex!==dex&&this.escena.manifiesto?.[dex]){'+
 'this.cambiarForma(dex);this.kit=this.kitActual();'+
 'this.__torre2BranchSpriteSync=(this.__torre2BranchSpriteSync||0)+1;'+
 // Only when the dex changes may the previous native animation be reset.
 // Walk, attacks and dodges switch textures every frame on purpose: never
 // force Idle each tick once the evolved sprite is already synchronized.
 'const idleKey="pmd-"+this.dex+"-Idle";'+
 'if(this.spr?.active&&this.escena.textures.exists(idleKey)&&'+
 'this.spr.texture?.key!==idleKey){'+
 'this.spr.anims?.stop();this.spr.setTexture(idleKey);this.claveAnim=null;'+
 'this.__torre2EvolutionTextureSync=(this.__torre2EvolutionTextureSync||0)+1;'+
 '}'+
 '}'+
 '}';
fighter=fighter.replace(spriteGraphicsAnchor,spriteGraphicsAnchor+branchSpriteSync);


// The audited 0.71.3 client only preloads the current fighter sprite.
// Preload genuine installed sprites for Magby and Tyrogue alternatives before
// their Phaser EVO callback; never switch sprites post-hit or affect online.
const combat=await read(path.join(original,'escenas/combate.js'));
const nativeSpriteLoad='soltarPMD(this,m,dexs);';
exactly(combat,nativeSpriteLoad,'native fighter sprite preload');
const branchPreload='if(!d.torre2&&d.modo!=="online")for(const [baby,stages] of '+
 '[["0240",["0126","0467"]],["0236",["0107","0106","0237"]],["0123",["0212"]]])'+
 'if(dexs.has(baby))for(const dex of stages)if(m[dex])dexs.add(dex);';
const combatPatched=combat.replace(nativeSpriteLoad,
 branchPreload+'window.__torre2HotfixPreloads=[...dexs];'+nativeSpriteLoad);

// Virtualize only the native Pokedex graphics in the isolated SHA-addressed
// hotfix tree. The original P2 client and battle roster are never modified.
const originalDex=await read(path.join(original,'escenas/pokedex.js'));
const virtualDex=windowNativePokedex(originalDex);
const nativeArena=await read(path.join(original,'escenas/preparar.js'));
// 0.76.2 preparar.js already requests only the shown fighter's sprites with
// pedirBasicas() and refreshes on arrival: the 0.71.3 preview patch is obsolete.
must(nativeArena.includes('if(pedirBasicas(this,[p.dex,dex,...formasDe([pl.id],[aspecto])],()=>{if(this.scene.isActive()){t.mostrado=null;this.refrescar()}})){'),
 'native 0.76.2 Arena preview loader not found');
const arenaPrepared=nativeArena;
const perfScript=await read('tools/pokearena/torre2-performance-monitor.js');
must(perfScript.length>1500,'performance probe missing');
const originalTitle=await read(path.join(original,'escenas/titulo.js'));
// Offline game: the mandatory online-account screen becomes a trainer-name screen.
const redPatched=patchAccountRequirement(await read(path.join(original,'red.js')));
const accountPatched=patchAccountScene(await read(path.join(original,'escenas/cuenta.js')));
const title=removeNewsTitleOption(originalTitle);
must(!/\btxt\s*:\s*["']NEWS["']/i.test(title),'NEWS remains in title');

// Update exclusively missing artist-sourced Magmortar combat animations.
// installJohtoSpriteCollabAssets is additive and rejects missing originals.
await installJohtoSpriteCollabAssets(root);
const manifest=JSON.parse(await read(manifestFile));
for(const dex of ['0123','0212'])
 must(manifest[dex]?.anims?.Idle?.file,
  'Scyther/Scizor approved original PMD Idle missing: '+dex);
for(const dex of looseDex){
 const f=manifest[dex]?.anims?.Idle?.file;
 must(f&&((await fs.stat(path.join(root,'assets/pmd',f))).size>128),
   'verified loose Idle sheet absent for '+dex);
}
for(const name of ['Idle','Attack','Shoot','SpAttack','Emit']){
 const file=manifest['0467']?.anims?.[name]?.file;
 must(file&&((await fs.stat(path.join(root,'assets/pmd',file))).size>128),
   'Magmortar '+name+' art absent');
}

const inputHash=createHash('sha256');
inputHash.update(version.src+'|'+oldModule+'|'+process.env.GITHUB_SHA);
for(const {target,content} of overlays)inputHash.update(target+'\0'+content);
inputHash.update(skillUpdate);inputHash.update(fighter);inputHash.update(title);inputHash.update(combatPatched);
inputHash.update(packsPatched);
inputHash.update(rosterPatched);
inputHash.update(virtualDex);inputHash.update(arenaPrepared);
inputHash.update(perfScript);
inputHash.update(redPatched);inputHash.update(accountPatched);
const newModule='src-'+inputHash.digest('hex').slice(0,10);
must(newModule!==oldModule,'unchanged release hash');
const dest=path.join(root,newModule);
await fs.cp(original,dest,{recursive:true,force:false,errorOnExist:true});
for(const {target,content} of overlays)await fs.writeFile(path.join(dest,target),content);
await fs.writeFile(path.join(dest,'habilidades.js'),skillUpdate);
await fs.writeFile(path.join(dest,'paquetes.js'),packsPatched);
await fs.writeFile(path.join(dest,'luchador.js'),fighter);
await fs.writeFile(path.join(dest,'escenas/titulo.js'),title);
await fs.writeFile(path.join(dest,'red.js'),redPatched);
await fs.writeFile(path.join(dest,'escenas/cuenta.js'),accountPatched);
await fs.writeFile(path.join(dest,'escenas/combate.js'),combatPatched);
await fs.writeFile(path.join(dest,'datos.js'),rosterPatched);
await fs.writeFile(path.join(dest,'escenas/pokedex.js'),virtualDex);
await fs.writeFile(path.join(dest,'escenas/preparar.js'),arenaPrepared);
await fs.writeFile(path.join(root,'torre2-performance-monitor.js'),perfScript);
// Owner-supplied campaign illustrations (presentation only, never sprites).
// Every file must match the SHA-256 in its PROVENANCE.json.
const artSource='tools/pokearena/campaign-art';
const artProvenance=JSON.parse(await read(path.join(artSource,'PROVENANCE.json')));
const artFiles=Object.entries(artProvenance.files||{});
must(artFiles.length>=21,'campaign art provenance incomplete');
const artDest=path.join(root,'assets/ui/torre2-campaign');
await fs.mkdir(artDest,{recursive:true});
for(const [file,sha] of artFiles){
 must(/^[a-z0-9-]+\.png$/.test(file),'unexpected campaign art name '+file);
 const bytes=await fs.readFile(path.join(artSource,file));
 must(createHash('sha256').update(bytes).digest('hex')===sha,'campaign art hash mismatch '+file);
 await fs.writeFile(path.join(artDest,file),bytes);
}
await fs.writeFile(path.join(artDest,'PROVENANCE.json'),JSON.stringify(artProvenance,null,1));
// CC0 campaign music (campaign-music/PROVENANCE.json), verified by SHA-256.
const musicSource='tools/pokearena/campaign-music';
const musicProvenance=JSON.parse(await read(path.join(musicSource,'PROVENANCE.json')));
must(/^CC0/.test(musicProvenance.license||''),'campaign music must be CC0');
const musicFiles=Object.entries(musicProvenance.files||{});
must(musicFiles.length>=8,'campaign music provenance incomplete');
const musicDest=path.join(root,'assets/audio/torre2-campaign');
await fs.mkdir(musicDest,{recursive:true});
for(const [file,sha] of musicFiles){
 must(/^[a-z0-9-]+\.(ogg|mp3)$/.test(file),'unexpected campaign music name '+file);
 const bytes=await fs.readFile(path.join(musicSource,file));
 must(createHash('sha256').update(bytes).digest('hex')===sha,'campaign music hash mismatch '+file);
 await fs.writeFile(path.join(musicDest,file),bytes);
}
await fs.writeFile(path.join(musicDest,'PROVENANCE.json'),JSON.stringify(musicProvenance,null,1));
const htmlFile=path.join(root,'index.html');
let html=await read(htmlFile);
exactly(html,oldModule+'/main.js','native main entrypoint');
html=html.replace(oldModule+'/main.js',newModule+'/main.js');
html=html.replaceAll('content="'+oldModule+'"','content="'+newModule+'"');
// Diagnostics are completely off for normal players; load the probe only
// when explicitly requested. Do not alter native Phaser scenes or VFX.
const perfHook='<script>if(new URLSearchParams(location.search).get("torre2-perf")==="1")'+
 '{const s=document.createElement("script");s.src="./torre2-performance-monitor.js";document.head.append(s)}</script>';
must(html.split('</body>').length===2,'native index body changed');
html=html.replace('</body>',perfHook+'</body>');
await fs.writeFile(htmlFile,html);
await fs.writeFile(versionFile,JSON.stringify({...version,modules:newModule,pixelFXVersion:newModule}));
const release={alpha:'0.76.2',source:version.src,assetBase:{alpha:'0.71.3',src:'src-5ccc174cb8'},
 baseModules:oldModule,modules:newModule,baseRun:Number(process.env.TORRE2_ALPHA0762_RUN)||null,
 patchCommit:process.env.GITHUB_SHA||'unverified',noncommercial:true,pmdForms:Object.keys(manifest).length,campaignArt:artFiles.length,campaignMusic:musicFiles.length};
await fs.writeFile(path.join(site,'RELEASE-0762.json'),JSON.stringify(release,null,2));
console.log('ALPHA0762_RELEASE_READY',JSON.stringify(release));
