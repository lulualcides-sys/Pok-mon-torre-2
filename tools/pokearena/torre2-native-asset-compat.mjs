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
 // 2026-11 upstream uses balls10.png (not the removed balls20.png).
 // This is a different native asset and may be used by other scenes.
 // Keep it entirely intact; never rewrite an active upstream texture.
 const nextNative=/this\\.load\\.spritesheet\\(\\s*(["'])ui-balls\\1\\s*,\\s*(["'])assets\\/ui\\/balls10\\.png\\2\\s*,\\s*\\{[^{}]*\\}\\s*\\)\\s*;/g;
 if(mentions.length===1&&[...source.matchAll(nextNative)].length===1)
  return source;
 if(matches.length!==1||mentions.length!==1)
  throw new Error('Changed or referenced ui-balls preload; refusing to remove gameplay code ('+
   'references='+mentions.length+', matches='+matches.length+', context='+
   JSON.stringify(source.slice(Math.max(0,source.indexOf('ui-balls')-70),
     source.indexOf('ui-balls')+170))+')');
 return source.replace(matches[0][0],'');
}
