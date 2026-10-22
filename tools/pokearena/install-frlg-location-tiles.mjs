/* FireRed locality maps, separately loaded during site build.
 * The Phaser client renders the source as 16x16 map tiles and adds its own
 * node/interactions: no single screenshot pasted over the game.
 * The sprites are copyright Nintendo/Game Freak and the external map
 * screenshots are reference derivatives: keep clear attribution.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
const MAPS=[
 ['route1','Route 1','https://poketrainervault.com/images/frlg/maps/Route_1.webp'],
 ['viridian','Viridian City','https://poketrainervault.com/images/frlg/maps/Viridian_City.webp'],
 ['forest','Viridian Forest','https://poketrainervault.com/images/frlg/maps/Viridian_Forest.webp'],
 ['pewter','Pewter City','https://poketrainervault.com/images/frlg/maps/Pewter_City.webp']
];
const timeout=12000;
async function load(url){
 const r=await fetch(url,{signal:AbortSignal.timeout(timeout),
  headers:{'User-Agent':'PokemonTorre2-Maps/1.0 (personal noncommercial)',
   'Accept':'image/webp,image/png;q=0.9,*/*;q=0.1'}});
 if(!r.ok)throw Error('HTTP '+r.status);
 const b=Buffer.from(await r.arrayBuffer());
 if(b.length<10000||b.length>6e6||
  !(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'))
  throw Error('not an expected WebP map');
 return b;
}
export async function installFRLGMaps(dest){
 const folder=path.join(dest,'assets/ui/frlg');
 await fs.mkdir(folder,{recursive:true});
 const manifest={title:'FireRed locality art',tileSize:16,locations:{},attribution:
 'Nintendo / Game Freak, Pokémon FireRed/LeafGreen; collected as map references from Poké Trainer Vault'};
 for(const [id,name,url]of MAPS){
  let data=null,issue='';
  for(let i=0;i<2;i++)try{data=await load(url);break}
   catch(e){issue=String(e.message||e)}
  if(data){
   await fs.writeFile(path.join(folder,id+'.webp'),data);
   manifest.locations[id]={name,file:'assets/ui/frlg/'+id+'.webp',
    source:url,bytes:data.length};
  }else console.warn('FireRed locality map unavailable',id,issue);
 }
 await fs.writeFile(path.join(folder,'manifest.json'),JSON.stringify(manifest,null,2));
 const found=Object.keys(manifest.locations);
 console.log('FireRed locality maps downloaded:',found.join(', ')||'none');
 // The rest of Kanto retains our own authored tiles until its files
 // are verified; do not claim those regions are pixel-perfect FireRed.
 if(found.length<2)throw Error('Insufficient FireRed map assets: '+found.join(','));
 return manifest;
}
