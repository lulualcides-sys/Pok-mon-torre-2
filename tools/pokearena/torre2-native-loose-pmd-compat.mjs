/* Scoped fix for Kanto sprites installed from SpriteCollab into assets/pmd.
 * The original native pack router sends EVERY Idle/Walk/portrait to the
 * official common .bin, including newly added species that aren't in #paq.
 * Preserve the original binary route for all official indexed forms.
 */
const ORIGINAL='const paqueteDe=ruta=>enComun(ruta)?INDICE.comun:INDICE.formas[ruta.split("/")[0]];';
const REPLACEMENT='const paqueteDe=ruta=>{const dex=ruta.split("/")[0];if(/^[0-9]{4}$/.test(dex)&&Number(dex)>=1&&Number(dex)<=151&&!INDICE?.formas?.[dex])return null;return enComun(ruta)?INDICE.comun:INDICE.formas[dex]};';

export function routeInstalledKantoLooseSprites(source){
 if(typeof source!=='string'||source.split(ORIGINAL).length!==2||
    !source.includes('const enComun=')||!source.includes('function cargarHoja(')||
    !source.includes('function urlHoja('))
  throw Error('Native pack router changed; refusing to reroute unknown official graphics');
 return source.replace(ORIGINAL,REPLACEMENT);
}
