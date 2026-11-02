/* Narrow compatibility for the public upstream client's optional ball sheet.
 * Do not edit user-approved Poké Ball sprites or battle/capture choreography.
 * This only removes the preload of a missing and otherwise unused ui-balls
 * spritesheet from the ephemeral copied Phaser client during build.
 */
export function stripUnavailableUiBallsPreload(source){
 if(typeof source!=='string')throw new TypeError('Expected captured source');
 const mentions=source.match(/ui-balls/g)||[];
 if(!mentions.length)return source;
 const request=/this\.load\.spritesheet\(\s*(["'])ui-balls\1\s*,\s*(["'])assets\/ui\/balls20\.png\2\s*,\s*\{[^{}]*\}\s*\)\s*;/g;
 const matches=[...source.matchAll(request)];
 if(matches.length!==1||mentions.length!==1)
  throw new Error('Changed or referenced ui-balls preload; refusing to remove gameplay code');
 return source.replace(matches[0][0],'');
}
