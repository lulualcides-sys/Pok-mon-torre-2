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

/* The upstream homepage includes static footer links to social networks.
 * They become invisible targets beside the solo Phaser fullscreen UI.
 * Strip only identified external social <a> nodes, keep privacy/local links.
 */
export function stripNativeSocialFooterLinks(source){
 if(typeof source!=='string')throw new TypeError('Expected native HTML source');
 const socialHosts=new Set([
  'discord.gg','discord.com','www.discord.com',
  'youtube.com','www.youtube.com',
  'instagram.com','www.instagram.com',
  'tiktok.com','www.tiktok.com'
 ]);
 return source.replace(/<a\b[^>]*>[\s\S]*?<\/a\s*>/gi,anchor=>{
  const href=anchor.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2];
  if(!href)return anchor;
  let url;try{url=new URL(href,'https://www.pokearena2d.com/')}catch{return anchor}
  return url.protocol==='https:'&&socialHosts.has(url.hostname.toLowerCase())?'':anchor;
 });
}
