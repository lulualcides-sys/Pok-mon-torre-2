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
const raw=JSON.parse(await fs.readFile('site-capture/CAPTURE-REPORT.json','utf8'));
await fs.writeFile(path.join(dest,'capture-provenance.json'),JSON.stringify({
 source:raw.source,files:raw.totalFiles,version:raw.sourceVersions?.selected,
 originalCatalog:raw.sourceCatalog,capturedAt:raw.completed,personalUse:true,
 notice:'Source client reproduction in Phaser: standalone training/lobby only. Pokémon Torre 1 Kanto campaign integration pending.'
},null,2));
console.log('Isolated Phaser site client ready:',dest);
