/* Pokémon Torre 2 — actual Kanto chapter/map locations.
 * FireRed/LeafGreen-inspired navigation, with original Phaser/WebGL art.
 * Only environment/route presentation. Pokémon icons, portraits and moves
 * remain supplied by the Poké Arena 2D client.
 * Regions are split into 5-encounter pages. Stages, trainer counts and
 * saved trainer indices retain their existing values.
 */
export const KANTO_CHAPTERS=Object.freeze([
 // One entry per gym or Elite Four stage, preserving existing save IDs.
 [
  ['ROTA 1 / VIRIDIAN','VIRIDIAN CITY','route'],
  ['ROTA 2 / FLORESTA','VIRIDIAN FOREST','forest'],
  ['PEWTER / GINÁSIO','PEWTER · BROCK','pewter']
 ],
 [
  ['ROTA 3 / MONTE','ROUTE 3','cliff'],
  ['MT. MOON / CAVERNA','MT. MOON','cave'],
  ['ROTA 4 / CERULEAN','CERULEAN CITY','river'],
  ['CERULEAN / GINÁSIO','CERULEAN · MISTY','water-gym']
 ],
 [
  ['ROTA 24 / 25','NUGGET BRIDGE','bridge'],
  ['ROTAS 5 E 6','UNDERGROUND PATH','route'],
  ['NAVIO S.S. ANNE','VERMILION PORT','ship'],
  ['VERMILION / GIN.','LT. SURGE','electric-gym']
 ],
 [
  ['ROTAS 9 E 10','ROCK TUNNEL','cliff'],
  ['ROCK TUNNEL','CAVERNA','cave'],
  ['LAVENDER / TORRE','POKÉMON TOWER','graveyard'],
  ['CELADON / GIN.','CELADON · ERIKA','grass-gym']
 ],
 [
  ['CELADON / ROCKET','ROCKET HIDEOUT','hideout'],
  ['ROTAS 12 A 15','SILENCE BRIDGE','bridge'],
  ['CYCLING ROAD','ROTAS 16 A 18','road'],
  ['SAFARI ZONE','FUCHSIA CITY','safari'],
  ['FUCHSIA / GIN.','FUCHSIA · KOGA','poison-gym']
 ],
 [
  ['ROTA 15 / SAFFRON','SAFFRON ACCESS','route'],
  ['DOJO DE LUTA','SAFFRON CITY','dojo'],
  ['SILPH CO.','EQUIPE ROCKET','tower'],
  ['SILPH CO. / ALTO','LÍDER ROCKET','tower'],
  ['SAFFRON / GIN.','SAFFRON · SABRINA','psychic-gym']
 ],
 [
  ['ROTA 19 / MAR','SURF / SEAFOAM','sea'],
  ['SEAFOAM ISLANDS','CAVERNAS DE GELO','ice'],
  ['ROTA 20 / MAR','CINNABAR ISLAND','sea'],
  ['MANSÃO POKÉMON','CINNABAR','mansion'],
  ['ILHA CINNABAR','LABORATÓRIO','volcano'],
  ['CINNABAR / GIN.','CINNABAR · BLAINE','fire-gym']
 ],
 [
  ['ROTA 21 / PALLET','PALLET TOWN','sea'],
  ['VIRIDIAN CITY','GINÁSIO REABERTO','city'],
  ['VIRIDIAN / PRAÇA','CENTRO DE KANTO','city'],
  ['VIRIDIAN / GIN.','GIOVANNI','ground-gym']
 ],
 [
  ['ROTA 22 / 23','RIVAL / PORTÕES','gate'],
  ['VICTORY ROAD','CAVERNA FINAL','victory'],
  ['INDIGO PLATEAU','ENTRADA DA LIGA','league'],
  ['ELITE 1 / LORELEI','CÂMARA DE GELO','ice']
 ],
 [
  ['LIGA / BRUNO','DOJO DE PEDRA','dojo'],
  ['CÂMARA DO BRUNO','ELITE FOUR','ground-gym']
 ],
 [
  ['LIGA / AGATHA','CÂMARA SOMBRIA','graveyard'],
  ['CÂMARA AGATHA','ELITE FOUR','graveyard']
 ],
 [
  ['LIGA / LANCE','CÂMARA DRAGÃO','dragon'],
  ['CÂMARA DE LANCE','ELITE FOUR','dragon'],
  ['PORTAL DO CAMPEÃO','ÚLTIMO DESAFIO','dragon']
 ],
 [
  ['SALÃO DO CAMPEÃO','RIVAL · BATALHA FINAL','hall']
 ]
]);
export function campaignRegion(stage,page,totalPages=3,champion=false){
 if(champion)return {title:'KANTO / CAMPEÃO',subtitle:'HALL OF FAME',biome:'hall',stage,page};
 const chapter=KANTO_CHAPTERS[stage]||KANTO_CHAPTERS[KANTO_CHAPTERS.length-1];
 // No gaps if an old or newly extended route contains more pages than
 // references: repeat the final area without losing leader accessibility.
 const actualPage=Math.max(0,Math.min(totalPages-1,page));
 // Distribute the chapter's distinct locations across all trainer pages,
 // keeping the leader room on the last page (including old 30+ trainer saves).
 const p=totalPages===1?chapter.length-1:
  Math.floor(actualPage*(chapter.length-1)/(totalPages-1));
 const [title,subtitle,biome]=chapter[p];
 return {title,subtitle,biome,stage,page:actualPage,chapterPage:p};
}
