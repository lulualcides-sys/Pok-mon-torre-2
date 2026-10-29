/* Poké Arena source may retain League's ponerRetrato import after moving
 * portrait painting to casillaRetrato. Keep the original sprite atlas and
 * loadout unchanged, exposing a narrowly scoped compatibility helper only
 * when that original named export is truly absent.
 */
export function ensureNativePortraitExport(source){
 const src=String(source);
 if(!src.includes('export'))throw Error('Unrecognized native sprites module');
 const already=/(?:export\s+(?:async\s+)?function\s+ponerRetrato\b|export\s+(?:const|let|var|class)\s+ponerRetrato\b|export\s*\{[^}]*\bponerRetrato\b)/.test(src);
 if(already)return src;
 // Original implementation still exists but is no longer re-exported.
 if(/\b(?:function|const|let|var)\s+ponerRetrato\b/.test(src))
  return src+'\nexport{ponerRetrato};\n';
 // Use the already loaded native PMD portrait. No artwork, pixels, layout,
 // combat animation or scene input is introduced or replaced here.
 return src+'\\nexport function ponerRetrato(scene,image,dex){'+
  '\\n const key="retrato-"+String(dex||"");'+
  '\\n if(scene?.textures?.exists?.(key)&&image?.setTexture)image.setTexture(key);'+
  '\\n return image;'+
  '\\n}\\n';
}
\`;
}
