/* Preserve the portrait helper actually exported by each native Poké Arena version.
 * New clients use ponerRetratoA; older clients use ponerRetrato.
 * The Kanto preload only requires cargarPMD and soloFormas in addition to
 * the native imports. Never invent a missing named ESM export at build time.
 */
export function ensureLeagueSpriteImports(source){
 if(typeof source!=='string')throw Error('League source must be text');
 const pattern=/import\{([^}]+)\}from["']\.\.\/sprites\.js["'];/;
 const match=source.match(pattern);
 if(!match)throw Error('Unknown League native sprites import');
 const imports=match[1].split(',').map(name=>name.trim());
 if(!imports.includes('dexAspecto')||
    !imports.some(name=>name==='ponerRetratoA'||name==='ponerRetrato'))
  throw Error('Unknown native League portrait helper; refusing guessed export');
 for(const name of ['cargarPMD','soloFormas'])
  if(!imports.includes(name))imports.push(name);
 return source.replace(match[0],'import{'+imports.join(',')+'}from"../sprites.js";');
}
