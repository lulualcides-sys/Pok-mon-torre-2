/* Release capture fail-closed contract.
 * Alpha 0.71.3 public REA observed a 404 for a NEWS illustration.
 * This exact decorative path is NOT a combat asset or JS dependency.
 * No 403, sprite, module or unknown missing resource may be ignored.
 */
const OPTIONAL_404=new Set([
 'assets/noticias/2026-11-14-codigo-instagram.webp'
]);
export function classifyPublicResourceFailures(blocked){
 if(!Array.isArray(blocked))throw TypeError('REA blocked must be an array');
 const optional=[],fatal=[];
 for(const item of blocked){
  if(item && item.status===404 &&
    typeof item.path==='string' && OPTIONAL_404.has(item.path))
   optional.push(item);
  else fatal.push(item);
 }
 return {optional,fatal};
}
