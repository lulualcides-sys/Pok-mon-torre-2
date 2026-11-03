/* ISOLATED VERCEL HOMOLOGATION ONLY.
 * Stage zero is still canonically blocked until Pallet Town, Route 1 and
 * Viridian City receive real approved art. Never make this change in main,
 * the homologation base, campaign saves, or the 60 original artworks.
 * In this preview build only, show Route 2 so the player can inspect the
 * existing approved art and proceed to Pewter, Brock and original battles.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const root=path.resolve('_site');
const game=path.join(root,'arena2d/index.html');
const phaser=path.join(root,'arena2d/lib/phaser.min.js');
for(const file of [game,phaser]){
 if(!fs.existsSync(file)||fs.statSync(file).size===0)
  throw Error('Homologation build missing '+file);
}
const originalHtml=fs.readFileSync(game,'utf8');
const oldVersion=originalHtml.match(/src="(src-[0-9a-f]{10})\/main\.js"/)?.[1];
if(!oldVersion)throw Error('Homologation Phaser module entry not found');

const clientRoot=path.join(root,'arena2d');
const oldSource=path.join(clientRoot,oldVersion);
const nativeCampaign=path.join(oldSource,'torre2/campanha.js');
let campaign=fs.readFileSync(nativeCampaign,'utf8');
// Four exact staging-only patches: no save write, no badge change,
// no route unlock, no changes to original Pallet opening policy.
const patches=[
 [
  'const openingMap=restored||APPROVED_STAGE_MAPS[stage];',
  "const openingMap=restored||(stage===0?'route-2':APPROVED_STAGE_MAPS[stage]);"
 ],
 [
  'const desiredMap=resume?.id||APPROVED_STAGE_MAPS[state.stage];',
  "const desiredMap=resume?.id||(state.stage===0?'route-2':APPROVED_STAGE_MAPS[state.stage]);"
 ],
 [
  'const artReady=!!APPROVED_STAGE_MAPS[0]||state.stage!==0;',
  'const artReady=state.stage===0?!!approvedMap("route-2"):!!APPROVED_STAGE_MAPS[state.stage];'
 ],
 [
  'if(state?.stage===0&&!APPROVED_STAGE_MAPS[0])return false;',
  'if(state?.stage===0&&!approvedMap("route-2"))return false;'
 ],
 [
  'this.__torre2ApprovedMapView=result;',
  'this.__torre2ApprovedMapView=result;\n'+
  '  // Testing-only label: these paintings are NOT a canonical Pallet start.\n'+
  '  if(state.stage===0&&!APPROVED_STAGE_MAPS[0])\n'+
  '   this.add.text(6,6,"HOMOLOGACAO VISUAL · ROTA 2 (ABERTURA PENDENTE)",{\n'+
  '    fontFamily:"Pixelify Sans,monospace",fontSize:"9px",\n'+
  '    color:"#fff2b2",backgroundColor:"#09253d",\n'+
  '    padding:{x:4,y:3}}).setOrigin(0,0).setDepth(76)\n'+
  '    .setData("torre2-preview-stage0-banner",true);'
 ]
];
for(const [from,to] of patches){
 if(campaign.split(from).length!==2)
  throw Error('Preview patch contract changed or duplicate: '+from.slice(0,75));
 campaign=campaign.replace(from,to);
}
fs.writeFileSync(nativeCampaign,campaign);
// The original module directory uses content-addressed URLs. Re-fingerprint
// this staging-only modified client so Chrome never reuses the old modules.
const nextVersion='src-'+createHash('sha256')
 .update(oldVersion).update(campaign).digest('hex').slice(0,10);
if(nextVersion===oldVersion||fs.existsSync(path.join(clientRoot,nextVersion)))
 throw Error('Preview fingerprint is not unique');
const nextSource=path.join(clientRoot,nextVersion);
fs.renameSync(oldSource,nextSource);
if(!originalHtml.includes('content="'+oldVersion+'"'))
 throw Error('Missing native build stamp');
const html=originalHtml
 .replace('src="'+oldVersion+'/main.js"','src="'+nextVersion+'/main.js"')
 .replace('content="'+oldVersion+'"','content="'+nextVersion+'"');
fs.writeFileSync(game,html);
const versionPath=path.join(clientRoot,'version.json');
const version=JSON.parse(fs.readFileSync(versionPath,'utf8'));
if(version.modules!==oldVersion)throw Error('Native version manifest mismatch');
version.modules=nextVersion;
version.pixelFXVersion=nextVersion;
version.homologationOnly=true;
version.openingArt='route-2';
version.canonicalOpeningPending=['pallet-town','route-1','viridian-city'];
fs.writeFileSync(versionPath,JSON.stringify(version));
fs.writeFileSync(path.join(root,'index.html'),[
 '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">',
 '<meta name="viewport" content="width=device-width,initial-scale=1">',
 '<meta name="robots" content="noindex,nofollow">',
 '<meta http-equiv="refresh" content="0;url=./arena2d/index.html?original=1">',
 '<title>Pokémon Torre 2 — HOMOLOGAÇÃO VISUAL</title>',
 '<script>location.replace("./arena2d/index.html?original=1"+location.hash)</script>',
 '</head><body style="background:#0a1623;color:white;font:16px system-ui;padding:24px">',
 '<h1>Pokémon Torre 2 · Homologação</h1>',
 '<p>Prévia começa na Rota 2: Pallet Town, Rota 1 e Viridian City ainda não têm arte homologada.</p>',
 '<p>O jogo oficial e os saves não foram modificados.</p>',
 '<p><a style="color:#ffdd8d" href="./arena2d/index.html?original=1">ABRIR JOGO DE TESTE</a></p>',
 '</body></html>'
].join('\n'));
console.log('Homologation ONLY: approved Route 2 stage-zero visual enabled; source='+nextVersion);
