/* Guard original title scene: keep upstream method, remove its sole UI call.
 * No changes to logo, camera, menu hitboxes or animation timing.
 */
export function disableNativeTitleSocialLinks(source){
 if(typeof source!=='string')throw new TypeError('Expected native title source');
 if(/\bthis\s*\[\s*(["'])redes\1\s*\]/.test(source))
  throw Error('Dynamic native social invocation cannot be certified');
 const calls=[...source.matchAll(/\bthis\.redes\s*(?:\?\.)?\(\s*\)\s*;?/g)];
 const references=[...source.matchAll(/\bthis\.redes\b/g)];
 if(!references.length)return source; // upstream already removed invocation
 if(calls.length!==1||references.length!==1)
  throw Error('Ambiguous native title social link invocation');
 return source.replace(calls[0][0],'/* Solo Kanto: no external social controls. */');
}
