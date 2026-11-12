/* Scoped fix for Kanto sprites installed from SpriteCollab into assets/pmd.
 * The original native pack router sends EVERY Idle/Walk/portrait to the
 * official common .bin, including newly added species that aren't in #paq.
 * Preserve the original binary route for all official indexed forms.
 */
const ORIGINAL='const paqueteDe=ruta=>enComun(ruta)?INDICE.comun:INDICE.formas[ruta.split("/")[0]];';
const REPLACEMENT='const paqueteDe=ruta=>{const dex=ruta.split("/")[0];if(/^[0-9]{4}$/.test(dex)&&Number(dex)>=1&&Number(dex)<=151&&!INDICE?.formas?.[dex])return null;return enComun(ruta)?INDICE.comun:INDICE.formas[dex]};';

import {ALLOWED_VISUAL_SUBSTITUTES} from './stage-licensed-visual-substitutes.mjs';
export function routeInstalledKantoLooseSprites(source,visualSubstituteForms=[]){
 if(typeof source!=='string'||source.split(ORIGINAL).length!==2||
    !source.includes('const enComun=')||!source.includes('function cargarHoja(')||
    !source.includes('function urlHoja('))
  throw Error('Native pack router changed; refusing to reroute unknown official graphics');
 if(!Array.isArray(visualSubstituteForms)||visualSubstituteForms.some(x=>!ALLOWED_VISUAL_SUBSTITUTES.includes(x))||
    new Set(visualSubstituteForms).size!==visualSubstituteForms.length)
  throw Error('Unsafe or duplicate visual substitute ID');
 const list=JSON.stringify(visualSubstituteForms);
 const patched=REPLACEMENT.replace(
  'if(/^[0-9]{4}$/.test(dex)',
  'if('+list+'.includes(dex)||/^[0-9]{4}$/.test(dex)');
 return source.replace(ORIGINAL,patched);
}
