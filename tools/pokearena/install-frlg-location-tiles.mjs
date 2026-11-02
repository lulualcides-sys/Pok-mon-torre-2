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
 ['pewter','Pewter City','https://poketrainervault.com/images/frlg/maps/Pewter_City.webp'],
 ['cerulean','Cerulean City','https://poketrainervault.com/images/frlg/maps/Cerulean_City.webp'],
 ['vermilion','Vermilion City','https://poketrainervault.com/images/frlg/maps/Vermilion_City.webp'],
 ['lavender','Lavender Town','https://poketrainervault.com/images/frlg/maps/Lavender_Town.webp'],
 ['celadon','Celadon City','https://poketrainervault.com/images/frlg/maps/Celadon_City.webp'],
 ['fuchsia','Fuchsia City','https://poketrainervault.com/images/frlg/maps/Fuchsia_City.webp'],
 ['cinnabar','Cinnabar Island','https://poketrainervault.com/images/frlg/maps/Cinnabar_Island.webp'],
 ['pallet','Pallet Town','https://poketrainervault.com/images/frlg/maps/Pallet_Town.webp'],
 ['route2','Route 2','https://poketrainervault.com/images/frlg/maps/Route_2.webp'],
 ['route3','Route 3','https://poketrainervault.com/images/frlg/maps/Route_3.webp'],
 ['route4','Route 4','https://poketrainervault.com/images/frlg/maps/Route_4.webp'],
 ['route24','Route 24','https://poketrainervault.com/images/frlg/maps/Route_24.webp'],
 ['route25','Route 25','https://poketrainervault.com/images/frlg/maps/Route_25.webp'],
 ['mtmoon','Mt. Moon','https://poketrainervault.com/images/frlg/maps/Mt_Moon.webp'],
 ['saffron','Saffron City','https://poketrainervault.com/images/frlg/maps/Saffron_City.webp'],
 ['pokemontower','Pokémon Tower','https://poketrainervault.com/images/frlg/maps/Pokemon_Tower.webp'],
 ['rockethideout','Rocket Hideout','https://poketrainervault.com/images/frlg/maps/Rocket_Hideout.webp'],
 ['silph','Silph Co.','https://poketrainervault.com/images/frlg/maps/Silph_Co.webp'],
 ['safari','Safari Zone','https://poketrainervault.com/images/frlg/maps/Safari_Zone.webp'],
 ['seafoam','Seafoam Islands','https://poketrainervault.com/images/frlg/maps/Seafoam_Islands.webp'],
 ['victory','Victory Road','https://poketrainervault.com/images/frlg/maps/Victory_Road.webp'],
 ['indigo','Indigo Plateau','https://poketrainervault.com/images/frlg/maps/Indigo_Plateau.webp'],
 ['ssanne','S.S. Anne','https://poketrainervault.com/images/frlg/maps/SS_Anne.webp'],
 ['powerplant','Power Plant','https://poketrainervault.com/images/frlg/maps/Power_Plant.webp'],
 ['rocketwarehouse','Rocket Warehouse','https://poketrainervault.com/images/frlg/maps/Rocket_Warehouse.webp']
];
// User-supplied composites, checked into the reference library.
 // Prefer local images over remote requests so maps always load after deploy.
 const LOCAL=Object.freeze({
  pallet:'maps/cities/pallet-town.png',viridian:'maps/cities/viridian-city.png',
  pewter:'maps/cities/pewter-city.png',cerulean:'maps/cities/cerulean-city.png',
  vermilion:'maps/cities/vermilion-city.png',lavender:'maps/cities/lavender-town.png',
  celadon:'maps/cities/celadon-city.png',fuchsia:'maps/cities/fuchsia-city.png',
  saffron:'maps/cities/saffron-city.png',cinnabar:'maps/cities/cinnabar-island.png',
  forest:'maps/locations/viridian-forest.png',mtmoon:'maps/dungeons/mt-moon-floors.png',
  seafoam:'maps/dungeons/seafoam-islands-floors.png',
  victory:'maps/dungeons/victory-road-floors.png',
  safari:'maps/locations/safari-zone-sections.png',
  silph:'maps/locations/silph-co-floors.png',
  indigo:'maps/locations/indigo-plateau-elite-four.png',
  rocketwarehouse:'maps/locations/rocket-warehouse.png',
  rockethideout:'maps/locations/rocket-hideout-floors.png',
  powerplant:'maps/locations/power-plant.png',
  route24:'maps/routes/route-24.png',route25:'maps/routes/route-25-bills-house.png',
  ssanne:'maps/locations/vermilion-harbor-ss-anne.png',
  pokemontower:'maps/locations/pokemon-tower-floors.png'
 });
const timeout=8500;
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
 // Limit concurrency to keep GitHub Actions fast and avoid overwhelming
 // the source. Unavailable optional locations are skipped without broken
 // Phaser asset requests; the game still uses its existing route fallback.
 for(let i=0;i<MAPS.length;i+=5)await Promise.all(
  MAPS.slice(i,i+5).map(async([id,name,url])=>{
   let data=null,issue='',ext='.webp',source=url;
   const local=LOCAL[id]&&path.join('reference-assets','kanto',LOCAL[id]);
   if(local){
    try{
     data=await fs.readFile(local);
     if(!data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
      throw Error('Not a PNG');
     ext='.png';source='user-uploaded reference: '+local;
    }catch(e){data=null;issue=String(e.message||e)}
   }
   if(!data)try{data=await load(url)}catch(e){issue=String(e.message||e)}
   if(data){
    await fs.writeFile(path.join(folder,id+ext),data);
    manifest.locations[id]={name,file:'assets/ui/frlg/'+id+ext,
     source,bytes:data.length};
   }else console.warn('Optional FireRed map unavailable',id,issue);
  })
 );
 await fs.writeFile(path.join(folder,'manifest.json'),JSON.stringify(manifest,null,2));
 const found=Object.keys(manifest.locations);
 console.log('FireRed locality maps downloaded:',found.join(', ')||'none');
 // The rest of Kanto retains our own authored tiles until its files
 // are verified; do not claim those regions are pixel-perfect FireRed.
 if(found.length<4)throw Error('Insufficient FireRed map assets: '+found.join(','));
 return manifest;
}
