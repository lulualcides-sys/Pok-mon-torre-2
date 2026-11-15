/* Deploy candidate built from the exact previously audited Alpha 0.71.3 artifact.
 * Keep the official client, assets, credited art, game saves and approved VFX.
 * Source-only overlay: refuse drift instead of silently downgrading Alpha.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {removeNewsTitleOption} from './torre2-title-pokedex-fast.mjs';
import {installJohtoSpriteCollabAssets} from './install-johto-sprites.mjs';

const site=path.resolve(process.env.TORRE2_SITE_ROOT||'_site');
const root=path.join(site,'arena2d');
const read=file=>fs.readFile(file,'utf8');
const must=(ok,message)=>{if(!ok)throw Error('Alpha 0.71.3 hotfix: '+message)};
const exactly=(text,part,label)=>must(text.split(part).length===2,'Unexpected '+label);
const versionFile=path.join(root,'version.json');
const version=JSON.parse(await read(versionFile));
must(version.src==='src-5ccc174cb8'&&/^src-[a-f0-9]{10}$/.test(version.modules||''),
 'not the audited 0.71.3 site');
const oldModule=version.modules;
const original=path.join(root,oldModule);
must((await fs.stat(path.join(original,'config.js'))).isFile(),'native Phaser source missing');
const config=await read(path.join(original,'config.js'));
must(/\bVERSION\s*=\s*["']0\.71\.3["']/.test(config),'official native Alpha changed');
const audits=JSON.parse(await read(path.join(root,'rights-audit-0713.json')));
must(audits.alpha==='0.71.3'&&audits.src===version.src&&audits.summary?.forms===30,
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
 ['tools/pokearena/torre2-gen3-status.js','torre2/gen3-status.js']
];
const overlays=await Promise.all(overlayNames.map(async([source,target])=>{
 const incoming=await read(source);
 must(incoming.length>900,'truncated '+source);
 must((await fs.stat(path.join(original,target))).size>500,
  'missing approved module '+target);
 let content=incoming;
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

const originalTitle=await read(path.join(original,'escenas/titulo.js'));
const title=removeNewsTitleOption(originalTitle);
must(!/\btxt\s*:\s*["']NEWS["']/i.test(title),'NEWS remains in title');

// Update exclusively missing artist-sourced Magmortar combat animations.
// installJohtoSpriteCollabAssets is additive and rejects missing originals.
await installJohtoSpriteCollabAssets(root);
const manifest=JSON.parse(await read(manifestFile));
for(const name of ['Idle','Attack','Shoot','SpAttack','Emit']){
 const file=manifest['0467']?.anims?.[name]?.file;
 must(file&&((await fs.stat(path.join(root,'assets/pmd',file))).size>128),
   'Magmortar '+name+' art absent');
}

const inputHash=createHash('sha256');
inputHash.update(version.src+'|'+oldModule+'|'+process.env.GITHUB_SHA);
for(const {target,content} of overlays)inputHash.update(target+'\0'+content);
inputHash.update(skillUpdate);inputHash.update(fighter);inputHash.update(title);
const newModule='src-'+inputHash.digest('hex').slice(0,10);
must(newModule!==oldModule,'unchanged release hash');
const dest=path.join(root,newModule);
await fs.cp(original,dest,{recursive:true,force:false,errorOnExist:true});
for(const {target,content} of overlays)await fs.writeFile(path.join(dest,target),content);
await fs.writeFile(path.join(dest,'habilidades.js'),skillUpdate);
await fs.writeFile(path.join(dest,'luchador.js'),fighter);
await fs.writeFile(path.join(dest,'escenas/titulo.js'),title);
const htmlFile=path.join(root,'index.html');
let html=await read(htmlFile);
exactly(html,oldModule+'/main.js','native main entrypoint');
html=html.replace(oldModule+'/main.js',newModule+'/main.js');
html=html.replaceAll('content="'+oldModule+'"','content="'+newModule+'"');
await fs.writeFile(htmlFile,html);
await fs.writeFile(versionFile,JSON.stringify({...version,modules:newModule,pixelFXVersion:newModule}));
const release={alpha:'0.71.3',source:version.src,baseModules:oldModule,
 modules:newModule,baseRun:43657903565,patchCommit:process.env.GITHUB_SHA||'unverified',
 noncommercial:true,pmdForms:Object.keys(manifest).length};
await fs.writeFile(path.join(site,'RELEASE-0713-HOTFIX.json'),JSON.stringify(release,null,2));
console.log('ALPHA0713_HOTFIX_READY',JSON.stringify(release));
