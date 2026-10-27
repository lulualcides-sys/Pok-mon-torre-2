/* Inspect public client source for static assets the older REA inventory missed.
 * Discovery does not confer permission: capture-client still enforces its
 * same-origin, path, size and HTML-fallback protections for each GET.
 */
const DIRECT_ASSET=/["'`](?:\/|\.\/)?(assets\/[a-z0-9_./-]+\.(?:png|webp|jpe?g|json|ogg|mp3|wav))["'`]/gi;
const SHEET_BLOCK=/\bconst\s+HOJAS\s*=\s*\{([\s\S]*?)\};\s*function\s+cargarHojas\s*\(/;
const NATIVE_SHEET_LOADER=/load\.spritesheet\(\s*`vfx-\$\{k\}`\s*,\s*`assets\/vfx\/\$\{k\}\.png`/;
export function discoverClientAssetPaths(source){
 if(typeof source!=='string')return [];
 const found=new Set();
 for(const [,name] of source.matchAll(DIRECT_ASSET)){
  if(!name.includes('..')&&!name.includes('\\'))found.add(name);
 }
 // The native client preloads all VFX sheets from the computed HOJAS registry.
 // These files have no quoted path in source; inventory-only capture misses them.
 if(NATIVE_SHEET_LOADER.test(source)){
  const registry=source.match(SHEET_BLOCK)?.[1]||'';
  for(const [,key] of registry.matchAll(/(?:^|,)\s*([a-z][a-z0-9_-]*):\{fw:\d+,fh:\d+/g))
   found.add('assets/vfx/'+key+'.png');
 }
 return [...found].sort();
}
