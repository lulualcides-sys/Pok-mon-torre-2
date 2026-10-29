/* Poké Arena source can retain the League's ponerRetrato import after
 * moving card drawing to casillaRetrato. Keep the real native sprites,
 * export the missing helper only when needed, never replace any VFX.
 */
export function ensureNativePortraitExport(source){
 const src=String(source);
 if(!src.includes('export'))throw Error('Unrecognized native sprites module');
 const exported=/(?:export\s+(?:async\s+)?function\s+ponerRetrato\b|export\s+(?:const|let|var|class)\s+ponerRetrato\b|export\s*\{[^}]*\bponerRetrato\b)/.test(src);
 if(exported)return src;
 if(/\b(?:function|const|let|var)\s+ponerRetrato\b/.test(src))
  return src+'\nexport{ponerRetrato};\n';
 return src+[
  '',
  'export function ponerRetrato(scene,image,dex){',
  ' const key="retrato-"+String(dex||"");',
  ' if(scene?.textures?.exists?.(key)&&image?.setTexture)image.setTexture(key);',
  ' return image;',
  '}',
  ''
 ].join('\n');
}
