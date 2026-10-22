/* Pokémon Torre 2 — rota natural, preservando a ordem dos treinadores.
 * Os pontos ficam sobre as folhas FireRed; os sprites originais não mudam.
 */
const SHAPES=Object.freeze({
 town:[[73,240],[122,221],[191,197],[266,167],[326,128]],
 road:[[187,242],[184,219],[207,191],[187,160],[200,126]],
 forest:[[96,239],[166,214],[153,187],[242,160],[307,128]],
 bridge:[[69,241],[132,227],[195,189],[273,171],[329,126]],
 mountain:[[82,240],[116,209],[197,195],[251,147],[330,121]],
 coast:[[66,239],[127,210],[210,202],[249,157],[318,125]],
 gym:[[84,237],[150,212],[191,181],[274,165],[323,123]]
});
export function trainerRoutePoints(count,region={}){
 if(!Number.isInteger(count)||count<0||count>8)
  throw RangeError('Route checkpoint count must be 0–8');
 if(count===0)return [];
 const biome=region?.biome||'route';
 const shape=biome==='forest'||biome==='safari'?'forest':
  biome==='bridge'||biome==='river'?'bridge':
  ['cliff','cave','victory','volcano'].includes(biome)?'mountain':
  ['sea','ship','water-gym','ice'].includes(biome)?'coast':
  /gym|league|hall/.test(biome)?'gym':
  region?.stage===0&&region?.chapterPage===1?'road':
  biome==='route'&&region?.page%3===1?'road':'town';
 const anchors=SHAPES[shape];
 return Array.from({length:count},(_,i)=>{
  const t=count===1?2:i*4/(count-1);
  const a=Math.min(3,Math.floor(t)),f=t-a;
  return {x:Math.round(anchors[a][0]+(anchors[a+1][0]-anchors[a][0])*f),
   y:Math.round(anchors[a][1]+(anchors[a+1][1]-anchors[a][1])*f)};
 });
}
// Alias compatível com integrações antigas; o padrão não é mais zigue-zague.
export const zigzagRoutePoints=trainerRoutePoints;
