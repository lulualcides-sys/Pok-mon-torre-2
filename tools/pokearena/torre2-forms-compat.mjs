/* Add only Torre 2's approved VFX constructors to native Poké Arena.
 * October upstream reordered native forms; no native renderer is replaced.
 */
export function addTorre2FormsToNativeCatalog(source){
 const anchor='const FORMAS={';
 if(typeof source!=='string'||!source.includes(anchor)||
    !source.includes('proyectil')||!source.includes('chorro')||
    !source.includes('TORRE2_FORMS'))
  throw Error('Native ability catalog no longer matches safe additive injection');
 const injection='const FORMAS={...TORRE2_FORMS,'+
  'torre2_metronome:(l,h,extra)=>TORRE2_FORMS.torre2_metronome(l,h,extra,FORMAS),';
 if(source.includes('torre2_metronome:')||
    source.indexOf(anchor)!==source.lastIndexOf(anchor))
  throw Error('Native ability catalog already patched or has ambiguous FORMAS');
 return source.replace(anchor,injection);
}
