/* Keep native health regen for Arena; exclude only solo Kanto battles. */
export function disableNativeCampaignPassiveRegen(source){
 if(typeof source!=='string')throw new TypeError('Expected native fighter source');
 const clauses=[...source.matchAll(/\bif\s*\(\s*([^)]{0,350})\)\s*\{/g)]
   .filter(m=>m[1].includes('REGLAS.curaTras')&&
     m[1].includes('this.ultimoDano')&&
     m[1].includes('this.hp<this.hpMax')&&
     m[1].includes('enfermo'));
 if(clauses.length!==1)
  throw Error('Unknown native passive health regen condition; refusing unsafe patch');
 const original=clauses[0][0];
 if(original.includes('torre2')){
  if(!/!\s*this\.escena\??\.datos\?\.torre2/.test(original))
   throw Error('Unverified campaign healing rule');
  return source;
 }
 const modified=original.replace(/\)\s*\{$/,'&&!this.escena.datos?.torre2){');
 if(modified===original)throw Error('Cannot identify native regen guard close');
 return source.replace(original,modified);
}
