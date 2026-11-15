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

// The next stage installs an adapter only for absent optional display slots.
// Require the original modern renderer to exist exactly once, so a future
// upstream API change cannot be silently patched by legacy Kanto code.
export function guardNativePokedexPagination(source,alpha,legacy) {
 const output=modernPokedexOrLegacy(source,alpha,legacy);
 if(alpha==='0.71.3' && (
   output.split('class Pokedex extends Phaser.Scene').length!==2 ||
   output.split('movimientos(c,p,et,tam){').length!==2
 ))throw Error('Unrecognized modern Pokédex move renderer; refusing unsafe compatibility patch');
 return output;
}
