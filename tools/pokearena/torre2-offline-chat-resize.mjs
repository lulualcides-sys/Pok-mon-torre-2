/* The solo game intentionally removes the official online chat.
 * Alpha 0.70's native viewport adjuster nevertheless calls tecladoChat()
 * to suppress resize while a virtual keyboard is up. If the entire chat
 * import is deleted, EVERY resize throws ReferenceError. Define the
 * offline-safe predicate instead; do not alter Phaser rendering or attacks.
 */
export function removeOnlineChatPreservingNativeResize(source){
 if(typeof source!=='string')throw Error('Unrecognized native source module');
 const pattern=/import\s*\{([^}]+)\}\s*from\s*["']\.\/chat\.js["'];?/g;
 const matches=[...source.matchAll(pattern)];
 if(matches.length!==1)throw Error('Native chat module import changed or duplicated');
 const names=matches[0][1].split(',').map(x=>x.trim());
 if(!names.includes('iniciarChat')||
    names.some(x=>!['iniciarChat','reservaChat','tecladoChat'].includes(x)))
  throw Error('Unknown native chat import; do not discard an unreviewed symbol');
 const needsResize=source.includes('if(tecladoChat())return;');
 if(needsResize&&!names.includes('tecladoChat'))
  throw Error('Native resize predicate absent from actual chat import');
 const replacement=needsResize?
  'const tecladoChat=()=>false; /* Solo mode: no chat keyboard; keep native resize working. */':'';
 let result=source.replace(matches[0][0],replacement)
  .replace(/\breservaChat\s*\(\s*\)/g,'0');
 if(needsResize&&(!result.includes('const tecladoChat=()=>false;')||
    !result.includes('if(tecladoChat())return;')))
  throw Error('Offline Phaser resize predicate not preserved');
 return result;
}
