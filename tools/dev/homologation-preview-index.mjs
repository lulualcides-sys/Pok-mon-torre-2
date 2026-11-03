/* T87 canonical opening: never force the previous Route 2 fallback.
 * The native title, boot, saves, battles and campaign scenes are preserved.
 * Four user scenes must be SHA-verified by build-preview.mjs beforehand.
 * This helper ONLY supplies the isolated hosting root index.
 */
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('_site');
const client=path.join(root,'arena2d');
for(const rel of ['index.html','lib/phaser.min.js','version.json']){
 const file=path.join(client,rel);
 if(!fs.existsSync(file)||fs.statSync(file).size===0)
  throw Error('Missing native Phaser dependency: '+rel);
}
const version=JSON.parse(fs.readFileSync(path.join(client,'version.json'),'utf8'));
if(!/^src-[a-f0-9]{10}$/.test(version.modules||''))throw Error('Invalid native content fingerprint');
const nativeModule=path.join(client,version.modules,'torre2/campanha.js');
const actors=path.join(client,version.modules,'torre2/torre2-opening-npc-overlays.js');
if(!fs.existsSync(nativeModule)||!fs.existsSync(actors))
 throw Error('Missing T87 native campaign or FireRed NPC overlay module');
const scene=fs.readFileSync(nativeModule,'utf8');
if(!scene.includes('approvedOpeningMapId(approvedMap,hasFirstApprovedHotspots)')||
   scene.includes("stage===0?'route-2'"))
 throw Error('T87 opening must come from the canonical Pallet scene, not staging Route 2');
for(const name of ['pallet-town','route-1','viridian-city','viridian-forest']){
 const p=path.join(client,'assets/ui/kanto-opening-user',name+'.webp');
 if(!fs.existsSync(p)||fs.statSync(p).size<1024)throw Error('Missing user opening WebP: '+name);
}
const html=`<!doctype html><html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta http-equiv="refresh" content="0;url=./arena2d/index.html?original=1">
<title>Pokémon Torre 2 — Teste Kanto T87</title>
<script>location.replace("./arena2d/index.html?original=1"+location.hash)</script>
</head><body style="background:#101a2c;color:white;font:16px system-ui;padding:25px">
<h1>Pokémon Torre 2 · Homologação isolada</h1>
<p>Abertura: Pallet Town → Rota 1 → Viridian City → Floresta de Viridian → Rota 2.</p>
<p>Sprites nativos em teste na Floresta. O jogo oficial não foi alterado.</p>
<a style="color:#ffdf84" href="./arena2d/index.html?original=1">ABRIR JOGO DE TESTE</a>
</body></html>`;
fs.writeFileSync(path.join(root,'index.html'),html);
console.log('T87 ready: canonical Pallet opening with native forest sprites; fingerprint '+version.modules);
