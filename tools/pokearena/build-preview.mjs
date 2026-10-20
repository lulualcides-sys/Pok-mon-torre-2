/* Copy the authorized site client into an isolated Phaser sandbox, without
 * overwriting the main Kanto game, and strip original analytics endpoints.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const source=path.resolve('site-capture/pokearena-client');
const root=path.resolve(process.env.PREVIEW_ROOT||'_site');
const dest=path.join(root,'arena2d');
await fs.mkdir(root,{recursive:true});
await fs.cp(source,dest,{recursive:true,force:true});
const index=path.join(dest,'index.html');
let html=await fs.readFile(index,'utf8');
// The user's personal copy must not call the original site's analytics beacons.
html=html.replace(/<script\s+src="\/analitica\.js"><\/script>/g,'');
html=html.replace(/<script\s+async\s+src="\/m\/s"><\/script>/g,'');
// Original favicon and manifests must be relative to our subfolder.
html=html.replace('href="/favicon.png"','href="favicon.png"');
html=html.replace('</head>','<meta name="referrer" content="no-referrer">\n</head>');
await fs.writeFile(index,html);

// Load startup visuals in batches. Initial title/selection should not load
// every animation for every Pokémon before showing the menu on Android.
const clientSource=(await fs.readdir(dest)).find(x=>/^src-[0-9a-f]{10}$/.test(x));
if(!clientSource)throw Error('Original Phaser source directory missing');
const patches=[
 ['escenas/carga.js',[
  ['preload(){texto(this,ANCHO/2,ALTO/2,"LOADING...",{tam:8,color:"#d6a63a",origen:.5});',
   'preload(){const txt=texto(this,ANCHO/2,ALTO/2,"LOADING...",{tam:8,color:"#d6a63a",origen:.5});this.load.on("progress",p=>txt.active&&txt.setText("LOADING... "+Math.round(p*100)+"%"));this.load.on("loaderror",f=>console.warn("Poké Arena resource failed",f?.src));'],
  ['const nombres=soloEstos?null:BASICAS;cargarPMD(this,usados,nombres);',
   'const nombres=soloEstos?null:BASICAS;if(!soloEstos){const starter=soloFormas(m,formasDe(["bulbasaur","charmander","squirtle","pichu"]));usados=Object.fromEntries(Object.entries(m).map(([dex,v])=>[dex,{...v,anims:starter[dex]?Object.fromEntries(Object.entries(v.anims).filter(([n])=>BASICAS.includes(n))):{}}]));}cargarPMD(this,usados,nombres);'],
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
for(const [filename,changes] of patches){
 const filenameFull=path.join(dest,clientSource,filename);
 let body=await fs.readFile(filenameFull,'utf8');
 for(const [from,to] of changes){
  if(!body.includes(from))throw Error('Unrecognized upstream client in '+filename+': '+from.slice(0,60));
  body=body.replace(from,to);
 }
 await fs.writeFile(filenameFull,body);
}

const raw=JSON.parse(await fs.readFile('site-capture/CAPTURE-REPORT.json','utf8'));
await fs.writeFile(path.join(dest,'version.json'),JSON.stringify({src:raw.sourceVersions?.selected||null,localMirror:true}));
await fs.writeFile(path.join(dest,'capture-provenance.json'),JSON.stringify({
 source:raw.source,files:raw.totalFiles,version:raw.sourceVersions?.selected,
 originalCatalog:raw.sourceCatalog,capturedAt:raw.completed,personalUse:true,
 notice:'Source client reproduction in Phaser: standalone training/lobby only. Pokémon Torre 1 Kanto campaign integration pending.'
},null,2));
console.log('Isolated Phaser site client ready:',dest);
