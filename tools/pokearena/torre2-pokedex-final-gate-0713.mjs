/* Final Pokédex guard: the 0.71.3 native responsive Pokédex is not a
 * legacy 0.65.8 grid. Applying legacy 36-card preload and evolution reset
 * would overwrite the official trio and dynamic layout. Strictly validate
 * upstream signature; never silently reinterpret unknown newer code.
 */
import {preserveModernPokedex} from './torre2-pokedex-modern-compat.mjs';
export function modernPokedexOrLegacy(source,alpha,legacy) {
 if(typeof source!=='string'||typeof legacy!=='function')
  throw TypeError('Invalid Pokédex adapter inputs');
 if(preserveModernPokedex(source,alpha))return source;
 return legacy(source);
}
