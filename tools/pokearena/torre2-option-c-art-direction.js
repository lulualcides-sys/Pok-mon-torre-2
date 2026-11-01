/* T34 — user-approved Option C art language (01 Nov 2026).
 * Visual preview only: deterministic decoration, no gameplay RNG or save writes.
 * Pixel-art clarity + richer, region-specific top-down environments.
 * The generated concept is a REFERENCE, never an in-game screenshot or asset.
 */
export const OPTION_C_STANDARD=Object.freeze({
  id:'option-c-approved-2026-11-01',
  baseTilePixels:16,
  pixelSampling:'nearest',
  worldSpaces:Object.freeze(['city','route','cave','gym']),
  visualPrinciples:Object.freeze([
    'consistent pixel scale and outlined forms',
    'clear traversable routes and unobstructed entrances',
    'layered canopy, trunks, shadows, terrain borders and small props',
    'different silhouette, terrain palette and landmark per region',
    'no repeated identical map layout or stretched pixel assets',
  ]),
});
const visuals={
  pallet:{biome:'quiet village',ground:0x73b55f,grass:0x4b9455,path:0xd9c59e,edge:0x9f936b,flower:0xf3d8b1,prop:'garden',tree:'round',landmark:'Oak laboratory'},
  route1:{biome:'sunny meadow',ground:0x7dba61,grass:0x459451,path:0xe4c698,edge:0xa4a16b,flower:0xffd4bb,prop:'flowers',tree:'round',landmark:'meadow entrance'},
  viridian:{biome:'woodland city',ground:0x65a86b,grass:0x367a4d,path:0xd4c8a6,edge:0x8c9c7d,flower:0xffd5ba,prop:'gardens',tree:'broad',landmark:'closed gym'},
  forest2:{biome:'shaded forest',ground:0x3d8650,grass:0x275d42,path:0xb1a779,edge:0x5d795a,flower:0xe4dd9b,prop:'mushrooms',tree:'tall',landmark:'forest gate'},
  pewter:{biome:'rocky city',ground:0x91a47b,grass:0x69845d,path:0xd2c5a9,edge:0x8a8977,flower:0xe8cfab,prop:'stone',tree:'round',landmark:'museum and rock gym'},
  route3:{biome:'dry foothills',ground:0xa8b478,grass:0x7c925d,path:0xcbb08b,edge:0x90856c,flower:0xd7b992,prop:'stones',tree:'sparse',landmark:'rock terraces'},
  moon:{biome:'moonlit cavern',ground:0x44495d,grass:0x55576d,path:0x99919e,edge:0x56556b,flower:0x79cbd7,prop:'crystals',tree:'none',landmark:'cavern crystals'},
  route4:{biome:'riverside approach',ground:0x88b36e,grass:0x508b60,path:0xd4bf97,edge:0x9d9875,flower:0xf4d5c4,prop:'reeds',tree:'willow',landmark:'Cerulean river'},
};
export const REGION_ART=Object.freeze(Object.fromEntries(Object.entries(visuals).map(([id,v])=>[id,Object.freeze({...v})])));
export function getOptionCArt(id){return REGION_ART[id]??null;}
export function optionCRouteCenter(id,y){
  if(!['route1','forest2','route3','route4'].includes(id))throw Error('Not a route: '+id);
  const phase={route1:0,forest2:1.2,route3:2.4,route4:3.5}[id];
  return Math.round(320+13*Math.sin((y-42)/49+phase)+5*Math.sin((y-42)/27+phase));
}
export function optionCWalkwayClear(id,x,y,margin=12){
  return Math.abs(x-optionCRouteCenter(id,y))>62+margin;
}
export function paintOptionCRoute(g,id){
  const art=getOptionCArt(id);
  if(!art||!['route1','forest2','route3','route4'].includes(id))throw Error('Unknown Option C route: '+id);
  for(let y=42;y<319;y+=6){
    const c=optionCRouteCenter(id,y);
    g.fillStyle(art.edge).fillRect(c-64,y,128,6);
    g.fillStyle(art.path).fillRect(c-58,y,116,6);
    // Pixel-sized variation on the soil, never a solid rectangular highway.
    if((y-42)%24===0){
      g.fillStyle(art.edge,.28).fillRect(c-39,y+3,11,1);
      g.fillStyle(0xf4e4c1,.5).fillRect(c+17,y+1,7,1);
    }
  }
}
function hash32(s){let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export function optionCDecorPositions(id,count=24){
  const art=getOptionCArt(id);
  if(!art||!['route1','forest2','route3','route4'].includes(id))return [];
  let seed=hash32(id),next=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  const out=[];
  for(let i=0;i<count;i++){
    const x=Math.floor((i%2?52:424)+next()*150),y=Math.floor(58+next()*245);
    if(optionCWalkwayClear(id,x,y,10))out.push({x,y,kind:art.prop});
  }
  return out;
}
export function paintOptionCAccents(g,id){
  const art=getOptionCArt(id);
  if(!art)return;
  for(const {x,y,kind} of optionCDecorPositions(id)){
    if(kind==='stones'){
      g.fillStyle(0x65766a).fillRect(x,y+4,13,5);
      g.fillStyle(0xc4bca0).fillRect(x+2,y,9,6);
    }else if(kind==='mushrooms'){
      g.fillStyle(0xe1d5b2).fillRect(x+4,y+4,3,6);
      g.fillStyle(0xc66b65).fillRect(x+1,y+1,9,5);
      g.fillStyle(0xf7d9bf).fillRect(x+4,y+2,2,2);
    }else if(kind==='reeds'){
      g.fillStyle(0x2f7954).fillRect(x+2,y,2,11);
      g.fillStyle(0x83b87b).fillRect(x+6,y+2,2,9);
      g.fillStyle(0xb4a76c).fillRect(x+2,y-2,2,4);
    }else{
      g.fillStyle(art.grass).fillRect(x,y+5,16,6);
      g.fillStyle(art.flower).fillRect(x+2,y+3,3,3);
      g.fillStyle(0xfff4d7).fillRect(x+10,y+2,3,3);
      g.fillStyle(0x367b4c).fillRect(x+6,y+6,3,5);
    }
  }
}
