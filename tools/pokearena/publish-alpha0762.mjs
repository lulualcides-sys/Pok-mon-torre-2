/* Alpha 0.76.2 release candidate: overlay of the current main gameplay modules
 * onto the audited Torre 2 build of the public 0.76.2 base client (PR #647,
 * docs/PORTA-ALPHA-0762.md). Same overlay as publish-hotfix-on-alpha0713.mjs;
 * keeps the official client, credited art, saves and approved VFX, and the
 * pre-overlay module tree as a rollback sibling. Refuses drift.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {patchFriendlyRoomTeams} from './torre2-sala-teams-patch.mjs';
import {patchOnlineResult} from './torre2-online-result-patch.mjs';
import {pwaManifest,serviceWorker,PWA_HOOK} from './torre2-pwa.mjs';
import {removeNewsTitleOption,removeUpdatesTitleButton,removeMessagesTitleButton} from './torre2-title-pokedex-fast.mjs';
import {patchFireTrailMarks} from './torre2-fire-trail-patch.mjs';
import {windowNativePokedex} from './torre2-pokedex-window.mjs';
import {installJohtoSpriteCollabAssets} from './install-johto-sprites.mjs';
import {installShinySpriteCollabAssets,SHINY_FOLDER} from './install-shiny-sprites.mjs';
import {patchAccountRequirement,patchAccountScene} from './torre2-trainer-name.mjs';

const site=path.resolve(process.env.TORRE2_SITE_ROOT||'_site');
const root=path.join(site,'arena2d');
const read=file=>fs.readFile(file,'utf8');
const must=(ok,message)=>{if(!ok)throw Error('Alpha 0.76.2/0.77.3 release: '+message)};
const exactly=(text,part,label)=>must(text.split(part).length===2,'Unexpected '+label);
const versionFile=path.join(root,'version.json');
const version=JSON.parse(await read(versionFile));
// Audited base clients this publisher accepts (docs/PORTA-ALPHA-0762.md and
// docs/PORTA-ALPHA-0773.md). Anything else is refused.
const BASES={'src-5bf1a1a788':'0.76.2','src-712ba03dbb':'0.77.3'};
const baseAlpha=BASES[version.src];
must(baseAlpha&&/^src-[a-f0-9]{10}$/.test(version.modules||''),
 'not an audited 0.76.2/0.77.3 site');
const oldModule=version.modules;
const original=path.join(root,oldModule);
must((await fs.stat(path.join(original,'config.js'))).isFile(),'native Phaser source missing');
const config=await read(path.join(original,'config.js'));
must(new RegExp('\\bVERSION\\s*=\\s*["\']'+baseAlpha.replaceAll('.','\\.')+'["\']').test(config),'official native Alpha changed');
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
 ['tools/pokearena/torre2-battle-report.js','torre2/battle-report.js'],
 // Campaign battles only: 3-switch limit resets with each new round (time-out).
 ['tools/pokearena/torre2-party-battle.js','torre2/party-battle.js'],
 // Campaign-only cooldown table (Arena/VS kits untouched).
 ['tools/pokearena/torre2-move-pool.js','torre2/move-pool.js'],
 // Legendaries: Master Ball row in the wild capture menu and its ball sprite.
 ['tools/pokearena/torre2-capture-arena.js','torre2/capture-arena.js'],
 ['tools/pokearena/torre2-ball-sprites.js','torre2/ball-sprites.js'],
 // Reviewed 2026-11-20: byte-identical to the audited build module before the
 // fix that brings a fighter caught mid-Fly/Dig back into view on a switch.
 ['tools/pokearena/torre2-combat-boundary.js','torre2/combat-boundary.js'],
 // Reviewed 2026-11-20: identical to the audited build before the Lugia /
 // Ho-Oh catch rates (post-League legendaries).
 ['tools/pokearena/torre2-capture-mechanics.js','torre2/capture-mechanics.js']
];
// New Torre 2 modules (not in the audited build): written next to the
// overlays; refused if the audited build already has a file with that name.
const newModuleNames=[
 // Permanent trainer legacy, achievement rewards and the offline ranking code.
 ['tools/pokearena/torre2-legacy.js','torre2/legacy.js'],
 // Legendary encounters (pure rules), imported by campaign-core and campanha.
 ['tools/pokearena/torre2-legendaries.js','torre2/legendaries.js'],
 // Pixel-art lairs of the legendaries (original drawing, no map images).
 ['tools/pokearena/torre2-legendary-lairs.js','torre2/legendary-lairs.js'],
 // Fire particle cap for the whole game, imported by escenas/combate.js.
 ['tools/pokearena/torre2-fire-particle-cap.js','torre2/fire-particle-cap.js'],
 // Daily missions (pure rules), imported by campanha.js.
 ['tools/pokearena/torre2-daily-missions.js','torre2/daily-missions.js'],
 // Pokémon trade by code (pure), imported by campaign-core.js.
 ['tools/pokearena/torre2-trade-code.js','torre2/trade-code.js'],
 // FireRed story scenes (pure data), imported by campanha.js.
 ['tools/pokearena/torre2-story.js','torre2/story.js'],
 // Route weather (visual + encounter weights only), imported by campaign-core.
 ['tools/pokearena/torre2-route-weather.js','torre2/route-weather.js'],
 // Torre de desafios rules (pure), imported by campaign-core and the scene.
 ['tools/pokearena/torre2-challenge-tower.js','torre2/challenge-tower.js'],
 // Battle weather by chance + Eventos 3x3 (pure), imported by campaign-core and the scene.
 ['tools/pokearena/torre2-battle-events.js','torre2/battle-events.js'],
 // Individual Pokémon traits + combat hook (pure + tiny installer).
 ['tools/pokearena/torre2-individuality.js','torre2/individuality.js'],
 // Trainers standing in the arena, Poké Ball from the hand, move-name speech.
 ['tools/pokearena/torre2-arena-trainers.js','torre2/arena-trainers.js'],
 // Custom battles and custom challenge series (README 6 and 11).
 ['tools/pokearena/torre2-custom-battles.js','torre2/custom-battles.js'],
 // Trainer customization: outfit colour, pose and accessories (README 3).
 ['tools/pokearena/torre2-trainer-look.js','torre2/trainer-look.js'],
 // Terrains from real Electric/Grass/Water/Psychic ULT casts (README 8).
 ['tools/pokearena/torre2-terrain.js','torre2/terrain.js'],
 // City missions (item 16) and battle speed (item 21).
 ['tools/pokearena/torre2-npc-quests.js','torre2/npc-quests.js'],
 ['tools/pokearena/torre2-battle-speed.js','torre2/battle-speed.js'],
 // Day/night, favorite Pokémon and rare colour forms (items 18, 26, 28).
 ['tools/pokearena/torre2-world.js','torre2/world.js'],
 ['tools/pokearena/torre2-arena-follow.js','torre2/arena-follow.js'],
 // Pokédex filters (pure), imported by the campaign scene.
 ['tools/pokearena/torre2-dex-filter.js','torre2/dex-filter.js'],
 // Multiplayer by code (main menu): WebRTC link + emulated room server for
 // the base client's own 1v1 friendly match. Registered in main.js below.
 ['tools/pokearena/torre2-multiplayer-core.js','torre2/multiplayer-core.js'],
 ['tools/pokearena/torre2-multiplayer.js','torre2/multiplayer.js']
];
const newModules=await Promise.all(newModuleNames.map(async([source,target])=>{
 const content=await read(source);
 must(content.length>900,'truncated '+source);
 must(!(await fs.stat(path.join(original,target)).catch(()=>null)),'new module would overwrite '+target);
 return {target,content};
}));
// Multiplayer 4G/5G relay (optional): repository secret TORRE2_TURN, validated.
{
 const {turnConfig}=await import('./torre2-multiplayer-core.js');
 const turn=turnConfig(process.env.TORRE2_TURN);
 newModules.push({target:'torre2/turn.js',content:
  '// Generated at publish time from the TORRE2_TURN secret (empty = direct links only).\n'+
  'export const TURN='+JSON.stringify(turn.servers)+';export const TURN_URL='+JSON.stringify(turn.url)+';\n'});
 console.log('MULTIPLAYER_RELAY',turn.servers.length?'servers':turn.url?'url':'none');
}
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
 if(target==='torre2/party-battle.js')
  must(content.includes('scene.__torre2PlayerSwitchLimit=3;')&&content.includes('this.__torre2PlayerSwitches=0;'),
   'Party battle switch limit or per-round reset missing');
 if(target==='torre2/combat-boundary.js')
  must(content.includes('if(!actor.ko&&(actor.ocultoVuelo||actor.est?.vuelo||(actor.spr&&!actor.spr.visible))){'),
   'Fly/Dig visibility restore on switch missing');
 if(target==='torre2/move-pool.js')
  must(content.includes('export function balanceCampaignQuickCooldown(move)')&&content.includes("'cross-poison':5"),
   'Campaign-only cooldown table missing');
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
let rosterPatched=sourceRoster.replace(rosterAnchor,
 'upgradeKantoEvolutionBattleKits(TODOS);'+eeveeBranches+'const ROSTER=');

const nativeSkills=await read(path.join(original,'habilidades.js'));
const fxImport='import{TORRE2_FORMS}from"./torre2/signature-fx.js";';
const fxSpread='const FORMAS={...TORRE2_FORMS,';
exactly(nativeSkills,fxImport,'Wobbuffet dependency injection');
exactly(nativeSkills,fxSpread,'Wobbuffet renderer registration');
must(!nativeSkills.includes('TORRE2_WOBBUFFET_FORMS'),
 'renderer already contains Wobbuffet forms; review source before overwrite');
const wobbuffetImport='import{TORRE2_WOBBUFFET_FORMS}from"./torre2/wobbuffet-native.js";';
// Trainers in the arena (owner 2026-11-22): the trainer says the move name
// when a fighter really casts it. No-op unless a campaign battle installed
// globalThis.__torre2Cast (torre2/arena-trainers.js); native flow unchanged.
const presentAnchor='presentar(l,slot,h,surge){';
exactly(nativeSkills,presentAnchor,'native move presentation');
const skillUpdate=nativeSkills.replace(fxImport,fxImport+wobbuffetImport)
 .replace(fxSpread,'const FORMAS={...TORRE2_FORMS,...TORRE2_WOBBUFFET_FORMS,')
 .replace(presentAnchor,presentAnchor+'try{globalThis.__torre2Cast?.(l,slot,h)}catch{}');
must(skillUpdate.includes('...TORRE2_WOBBUFFET_FORMS'),'Wobbuffet cast registration failed');

let fighter=await read(path.join(original,'luchador.js'));
// Individual Pokémon (owner 2026-11-22, README 5/9/1/10): campaign HP and
// damage also follow the Pokémon's potential, hidden ability, held item and
// rivalries (globalThis.__torre2Indiv, torre2/individuality.js). Only inside
// the existing Torre 2 campaign branches; other modes and kits untouched.
{
 const hpOld='return this.escena.datos?.torre2?torre2ScaledHp(base,torre2FighterLevel(this)):base}';
 const dmgOld='if(fuente.lado===0)d*=torre2PlayerDamageBoost;}';
 exactly(fighter,hpOld,'campaign HP scaling');exactly(fighter,dmgOld,'campaign damage scaling');
 fighter=fighter.replace(hpOld,'return this.escena.datos?.torre2?Math.max(1,Math.round(torre2ScaledHp(base,torre2FighterLevel(this))*(globalThis.__torre2Indiv?.hp?.(this)??1))):base}')
  .replace(dmgOld,'if(fuente.lado===0)d*=torre2PlayerDamageBoost;d*=globalThis.__torre2Indiv?.damage?.(fuente,this,g)??1;}');
 // Final damage (Focus Band, Sturdy, Shell Bell, Scope Lens, Volt/Water
 // Absorb, King's Rock) and a per-frame tick (Leftovers, Quick Claw, herbs,
 // Pressure, Ice Body): campaign branch only, right before the HP change.
 const hitOld='delete this.est.congelado;this.hp=Math.max(this.inmortal?1:0,this.hp-d);';
 const tickOld='tickGen3Status(this,dt);intento=gen3StatusInput(this,intento)}';
 exactly(fighter,hitOld,'campaign final damage');exactly(fighter,tickOld,'campaign status tick');
 fighter=fighter.replace(hitOld,'delete this.est.congelado;if(e.datos?.torre2&&d>0&&!g.puro&&fuente&&fuente!==this)d=globalThis.__torre2Indiv?.final?.(fuente,this,g,d)??d;this.hp=Math.max(this.inmortal?1:0,this.hp-d);')
  .replace(tickOld,'tickGen3Status(this,dt);globalThis.__torre2Indiv?.tick?.(this,dt);intento=gen3StatusInput(this,intento)}');
}
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
// Campaign shiny Pokémon (owner 2026-11-24): also preload the original shiny
// sheet (NNNN-shinyt2) of every shiny party member / wild Pokémon.
const shinyPreload='if(d.torre2?.party)for(const mm of [...d.torre2.party.friend,...d.torre2.party.foes]){'+
 'if(mm?.shiny!==true)continue;const f=buscar(mm.id);'+
 'const dx=f?.etapa?f.def.evoluciones[f.etapa-1]?.dex??f.def.dex:f?.def?.dex;'+
 'if(dx&&m[dx+"-shinyt2"])dexs.add(dx+"-shinyt2")}';
const branchPreload=shinyPreload+'if(!d.torre2&&d.modo!=="online")for(const [baby,stages] of '+
 '[["0240",["0126","0467"]],["0236",["0107","0106","0237"]],["0123",["0212"]]])'+
 'if(dexs.has(baby))for(const dex of stages)if(m[dex])dexs.add(dex);';
// Whole game (owner request 2026-11-20): cap live fire particles per emitter
// so fire moves stop freezing phones. Installed once at boot, before any scene.
const fireCapHook="import {installFireParticleCap} from '../torre2/fire-particle-cap.js';installFireParticleCap();\n"+
 // Light mode (campaign Mais): expose the 0.76.2 graphics options module.
 "import * as torre2NativeGraphics from '../calidad.js';globalThis.__torre2NativeGraphics=torre2NativeGraphics;\n";
// Multiplayer end screen (3x3 K.O. score, history, TROCAR TIME): no-op hooks
// without the Torre 2 link; ranked results untouched.
const combatPatched=fireCapHook+patchOnlineResult(combat.replace(nativeSpriteLoad,
 branchPreload+'window.__torre2HotfixPreloads=[...dexs];'+nativeSpriteLoad));
must(combatPatched.includes('globalThis.__torre2Fim?.fim?.(this,ganador)'),'multiplayer end hooks missing');
must(combatPatched.startsWith(fireCapHook),'fire particle cap hook missing');
// Whole game: at most 6 new fire scorch marks per second (each mark was two
// new GPU textures; ~60 per Flare Blitz froze phones).
const marksPatched=patchFireTrailMarks(await read(path.join(original,'marcas.js')));
must(marksPatched.includes('m.torre2Quemados'),'fire scorch patch missing');

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
// Multiplayer 3x3: hooks in the native friendly room (no-op without the link).
const salaPatched=patchFriendlyRoomTeams(await read(path.join(original,'escenas/sala.js')));
must(salaPatched.includes('globalThis.__torre2Sala?.combate?.(this,m)'),'friendly room 3x3 hooks missing');
const titleBase=removeMessagesTitleButton(removeUpdatesTitleButton(removeNewsTitleOption(originalTitle)));
// Main menu: MULTIPLAYER (by code) right after PLAY.
const PLAY_ENTRY='{id:"jugar",txt:"PLAY",menu:"jugar",ico:"pokeball"},';
exactly(titleBase,PLAY_ENTRY,'title PLAY entry');
const title=titleBase.replace(PLAY_ENTRY,PLAY_ENTRY+'{id:"multi",txt:"MULTIPLAYER",escena:"torre2Multi",ico:"personas"},');
must(!/\btxt\s*:\s*["']NEWS["']/i.test(title),'NEWS remains in title');
must(!title.includes('this.scene.start("novedades")'),'UPDATES/News shortcut remains in title');
must(!title.includes('this.esquinaStreamer();'),'STREAMER MODE toggle remains in title');
must(!title.includes('["mensaje",'),'MESSAGES button remains in title');
must(title.includes('escena:"torre2Multi"'),'MULTIPLAYER entry missing in title');

// Update exclusively missing artist-sourced Magmortar combat animations.
// installJohtoSpriteCollabAssets is additive and rejects missing originals.
await installJohtoSpriteCollabAssets(root);
// Original shiny PMD sheets (owner 2026-11-24), additive NNNN-shinyt2 folders.
{const shiny=await installShinySpriteCollabAssets(root);
 console.log('Shiny PMD: '+shiny.species+' species, '+shiny.png+' new files'+(shiny.missing.length?', no source for '+shiny.missing.join(','):''));
 must(shiny.species>=140||JSON.parse(await read(manifestFile))['0006-'+SHINY_FOLDER],'shiny PMD sprites missing');}
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

// Owner arenas 2026-11-20 (Giovanni, Lorelei, Bruno, Agatha, Lance, Champion):
// six NEW gym arenas appended after the native list (native ones untouched),
// art in assets/arenas/torre2/, SHA-256 and oval in torre2-arenas/PROVENANCE.json.
{
 const src='tools/pokearena/torre2-arenas',prov=JSON.parse(await read(path.join(src,'PROVENANCE.json')));
 const ids=Object.keys(prov.arenas||{});
 must(ids.length===6&&ids.every(id=>/^[a-z]+$/.test(id)),'six Torre 2 arenas required');
 const extra=[];
 for(const id of ids){
  const file=id+'.jpg',bytes=await fs.readFile(path.join(src,file));
  must(createHash('sha256').update(bytes).digest('hex')===prov.files[file],'Torre 2 arena hash mismatch '+file);
  const o=prov.arenas[id].ovalo;must([o.cx,o.cy,o.rx,o.ry].every(Number.isFinite),'bad oval '+id);
  const target=path.join(root,'assets/arenas/torre2',file);
  await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,bytes);
  extra.push({id:'t2-'+id,nombre:{viridian:'VIRIDIAN GYM',lorelei:'LORELEI',bruno:'BRUNO',agatha:'AGATHA',lance:'LANCE',champion:'CHAMPION'}[id]||id.toUpperCase(),
   imagen:'assets/arenas/torre2/'+file,ovalo:{cx:o.cx,cy:o.cy,rx:o.rx,ry:o.ry}});
 }
 await fs.writeFile(path.join(root,'assets/arenas/torre2/PROVENANCE.json'),JSON.stringify(prov,null,1));
 const anchor='imagen:`assets/arenas/gimnasios/${id}-amplia.jpg`,ovalo:{...ovaloGym}}));';
 exactly(rosterPatched,anchor,'native gym arena list');
 rosterPatched=rosterPatched.replace(anchor,'imagen:`assets/arenas/gimnasios/${id}-amplia.jpg`,ovalo:{...ovaloGym}})).concat('+JSON.stringify(extra)+');');
}
// Owner 2026-11-22: held items use their ORIGINAL FireRed icons
// (pret/pokefirered, pinned commit, hashes in torre2-held-items/PROVENANCE.json).
{
 const src='tools/pokearena/torre2-held-items',prov=JSON.parse(await read(path.join(src,'PROVENANCE.json')));
 must(prov.source==='pret/pokefirered'&&/^[0-9a-f]{40}$/.test(prov.commit),'held item icon provenance');
 const keys=Object.keys(prov.items||{});must(keys.length===47,'47 FRLG held items required (every hold item except berries and mail)');
 const target=path.join(root,'assets/ui/frlg/items/held');await fs.mkdir(target,{recursive:true});
 for(const key of keys){
  must(/^[a-z]+$/.test(key),'bad held item '+key);
  const bytes=await fs.readFile(path.join(src,key+'.png'));
  must(createHash('sha256').update(bytes).digest('hex')===prov.files[key+'.png'],'held item icon hash mismatch '+key);
  await fs.writeFile(path.join(target,key+'.png'),bytes);
 }
 await fs.writeFile(path.join(target,'PROVENANCE.json'),JSON.stringify(prov,null,1));
}
const inputHash=createHash('sha256');
inputHash.update(rosterPatched);
inputHash.update(version.src+'|'+oldModule+'|'+process.env.GITHUB_SHA);
for(const {target,content} of overlays)inputHash.update(target+'\0'+content);
for(const {target,content} of newModules)inputHash.update(target+'\0'+content);
inputHash.update(skillUpdate);inputHash.update(fighter);inputHash.update(title);inputHash.update(combatPatched);inputHash.update(marksPatched);
inputHash.update(packsPatched);

inputHash.update(virtualDex);inputHash.update(arenaPrepared);
inputHash.update(perfScript);
inputHash.update(redPatched);inputHash.update(accountPatched);inputHash.update(salaPatched);
const newModule='src-'+inputHash.digest('hex').slice(0,10);
must(newModule!==oldModule,'unchanged release hash');
const dest=path.join(root,newModule);
await fs.cp(original,dest,{recursive:true,force:false,errorOnExist:true});
for(const {target,content} of overlays)await fs.writeFile(path.join(dest,target),content);
for(const {target,content} of newModules)await fs.writeFile(path.join(dest,target),content);
// Owner request (2026-11-19/20): no news on screen. The base client mounts a
// sliding NEWS side tab (noticias.js) and a patch-notes popup (comunicado.js)
// from main.js; neither is started in the published copy.
{
 const mainFile=path.join(dest,'main.js');
 let main=await read(mainFile);
 exactly(main,'iniciarNoticias(juego);iniciarComunicado(juego);','native news/patch-notes start');
 main=main.replace('iniciarNoticias(juego);iniciarComunicado(juego);','');
 // Multiplayer by code: register the Torre 2 link scene next to the campaign.
 exactly(main,'import{Campanha}from"./torre2/campanha.js";','campaign scene import');
 exactly(main,'scene:[Carga,Campanha,','native scene list');
 main=main.replace('import{Campanha}from"./torre2/campanha.js";',
  'import{Campanha}from"./torre2/campanha.js";import{Torre2Multi}from"./torre2/multiplayer.js";')
  .replace('scene:[Carga,Campanha,','scene:[Carga,Campanha,Torre2Multi,');
 await fs.writeFile(mainFile,main);
}
await fs.writeFile(path.join(dest,'habilidades.js'),skillUpdate);
await fs.writeFile(path.join(dest,'paquetes.js'),packsPatched);
await fs.writeFile(path.join(dest,'luchador.js'),fighter);
await fs.writeFile(path.join(dest,'escenas/titulo.js'),title);
await fs.writeFile(path.join(dest,'red.js'),redPatched);
await fs.writeFile(path.join(dest,'escenas/cuenta.js'),accountPatched);
await fs.writeFile(path.join(dest,'escenas/sala.js'),salaPatched);
await fs.writeFile(path.join(dest,'escenas/combate.js'),combatPatched);
await fs.writeFile(path.join(dest,'marcas.js'),marksPatched);
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
// Gym arenas of the 0.77.3 base client (ARENAS_GIMNASIO / arena_viva.js),
// supplied by the project owner because /assets/ of the site answers 403.
// Installed at the exact paths the native client already loads; SHA-256
// checked against alpha0773-arenas/PROVENANCE.json. 0.76.2 has no gym arenas.
let gymArenas=0;
if(baseAlpha==='0.77.3'){
 const arenaSource='tools/pokearena/alpha0773-arenas';
 const arenaProvenance=JSON.parse(await read(path.join(arenaSource,'PROVENANCE.json')));
 const arenaFiles=Object.entries(arenaProvenance.files||{});
 must(arenaFiles.filter(([f])=>/^gimnasios\/[a-z]+-amplia\.jpg$/.test(f)).length===8,'eight gym arenas required');
 for(const [file,sha] of arenaFiles){
  must(/^gimnasios\/(?:[a-z]+-amplia\.jpg|vivas\/cinnabar-[a-z-]+\.png)$/.test(file),'unexpected gym arena file '+file);
  const bytes=await fs.readFile(path.join(arenaSource,file));
  must(createHash('sha256').update(bytes).digest('hex')===sha,'gym arena hash mismatch '+file);
  const target=path.join(root,'assets/arenas',file);
  await fs.mkdir(path.dirname(target),{recursive:true});
  await fs.writeFile(target,bytes);gymArenas++;
 }
 await fs.writeFile(path.join(root,'assets/arenas/gimnasios/PROVENANCE.json'),JSON.stringify(arenaProvenance,null,1));
 // Owner authorization 2026-11-20: turn on the native animated fire/lava of
 // the Cinnabar gym arena (off in the 0.77.3 client data). Only this flag.
 const vivaFile=path.join(dest,'arena_viva.js');
 const viva=await read(vivaFile);
 exactly(viva,'cinnabar:{activa:false,','Cinnabar live-arena flag');
 await fs.writeFile(vivaFile,viva.replace('cinnabar:{activa:false,','cinnabar:{activa:true,'));
}
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
// Install as an app (owner list item 25): Torre 2 manifest, service worker
// for this release and the install-prompt hook.
must(html.split('</head>').length===2,'native index head changed');
html=html.replace('</head>',PWA_HOOK+'</head>');
// Chromium installability requires both declared raster sizes. The audited
// source pack contains icono-192.png but omits its declared 512px counterpart.
// Bundle an exact nearest-neighbour enlargement of the same approved pixel art.
const pwaManifestPath=path.join(root,'manifest.webmanifest');
const appManifest=JSON.parse(pwaManifest(await read(pwaManifestPath)));
const icon512Source=path.resolve('tools/pokearena/pwa/icono-512.png');
const icon512=await fs.readFile(icon512Source);
const icon192=await fs.readFile(path.join(root,'iconos/icono-192.png'));
const pngDimensions=bytes=>{
 must(bytes.length>=24&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
  'PWA icon is not a valid PNG');
 return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
};
must(pngDimensions(icon192).width===192&&pngDimensions(icon192).height===192,
 'PWA 192px icon missing or malformed');
must(pngDimensions(icon512).width===512&&pngDimensions(icon512).height===512,
 'PWA 512px icon missing or malformed');
for(const size of [192,512]){
 const src='iconos/icono-'+size+'.png';
 must(appManifest.icons?.some(i=>i.src===src&&i.sizes===size+'x'+size&&i.type==='image/png'),
  'PWA manifest must declare '+size+'x'+size+' PNG');
}
await fs.writeFile(path.join(root,'iconos/icono-512.png'),icon512);
await fs.writeFile(pwaManifestPath,JSON.stringify(appManifest,null,2));
await fs.writeFile(path.join(root,'sw.js'),serviceWorker(newModule));
await fs.writeFile(htmlFile,html);
await fs.writeFile(versionFile,JSON.stringify({...version,modules:newModule,pixelFXVersion:newModule}));
const release={alpha:baseAlpha,source:version.src,assetBase:{alpha:'0.71.3',src:'src-5ccc174cb8'},
 baseModules:oldModule,modules:newModule,baseRun:Number(process.env.TORRE2_ALPHA0762_RUN)||null,
 patchCommit:process.env.GITHUB_SHA||'unverified',noncommercial:true,pmdForms:Object.keys(manifest).length,campaignArt:artFiles.length,campaignMusic:musicFiles.length,gymArenas};
await fs.writeFile(path.join(site,'RELEASE-0762.json'),JSON.stringify(release,null,2));
console.log('ALPHA0762_RELEASE_READY',JSON.stringify(release));
