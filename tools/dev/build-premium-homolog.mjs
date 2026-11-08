// A separate review entrypoint: native published client + import-map overrides.
// This is not a replacement for the clean release build.
import fs from 'node:fs/promises';
const root='https://lulualcides-sys.github.io/Pok-mon-torre-2/arena2d/';
let html=await fs.readFile('/workspace/pt2-public-cache/arena2d/index.html','utf8');
const version=/src-\w+\/main.js/.exec(html)?.[0]?.split('/')[0];
if(!version)throw Error('Published module version unavailable');
const boot=`<base href="${root}"><script>
const local=new URL('../tools/pokearena/',location.href).href;
const remote='${root}${version}/';
const imports={};
imports[local]=remote+'torre2/';
imports[new URL('../',local).href]=remote;
for(const [published,source]of Object.entries({'trainer-cards.js':'torre2-trainer-cards.js','city-scenery.js':'torre2-city-scenery.js','campanha.js':'torre2-campaign-scene.js'})){imports[remote+'torre2/'+published]=local+source;imports[local+published]=local+source;}
imports[local+'premium-art.js']=local+'torre2-premium-art.js';
imports[local+'torre2-premium-art.js']=local+'torre2-premium-art.js';
const map=document.createElement('script');map.type='importmap';map.textContent=JSON.stringify({imports});document.currentScript.after(map);
</script>`;
html=html.replace('<head>','<head>'+boot).replace('<title>Pokémon Torre</title>','<title>Homologação — Pokémon Torre 2</title>').replace(/<script async src="https:\/\/red.pokearena2d.com\/m\/s.js"><\/script>/,'');
await fs.writeFile('homolog/game.html',html);
console.log('Review import map pinned to '+version);
