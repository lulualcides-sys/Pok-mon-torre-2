/* Alpha 0.65.8 native P2 packs common portrait/Idle sprites into .bin.
 * Torre 2 adds separately credited CC BY-NC SpriteCollab Kanto/Johto
 * Pokémon after packing. Read official pack first; when a specific
 * entry is absent, load only safe locally installed sprite PNG paths.
 * The original .bin bytes and unpack/decode functions remain untouched.
 */
const one=(s,a,b,label)=>{
 const n=s.split(a).length-1;
 if(n!==1)throw Error('P2 PMD compatibility '+label+' (matches '+n+')');
 return s.replace(a,b);
};
const SAFE='/^[0-9]{4}(?:-[a-z0-9]+)?[/](?:portrait[.]png|[A-Za-z0-9_-]+-Anim[.]png)$/';
export function allowIndependentSpriteCollabPMDInNativePacks(original){
 if(typeof original!=='string'||!original.includes('const INDICE='))
  throw Error('Not recognized native 0.65.8 packed-PMD module');
 const canLocal=SAFE+'.test(ruta)';
 let s=String(original);
 const oldRead='if(!abierto.hojas[ruta]||escena.textures.exists(clave2))continue;';
 const newRead=[
  'if(escena.textures.exists(clave2))continue;',
  'if(!abierto.hojas[ruta]){if(!'+canLocal+')continue;',
  'const local="assets/pmd/"+ruta;',
  'if(marco)load.spritesheet(clave2,local,marco);',
  'else load.image(clave2,local);',
  'continue;}'
 ].join('');
 s=one(s,oldRead,newRead,'native pack filecomplete');
 const oldURL='return urlDe(await abiertos.get(nombre),ruta)';
 const newURL=[
  'const abierto=await abiertos.get(nombre);',
  'if(!abierto.hojas[ruta]){if(!'+canLocal+')',
  'throw Error("Missing native/installed PMD sprite "+ruta);',
  'return "assets/pmd/"+ruta;}',
  'return urlDe(abierto,ruta)'
 ].join('');
 s=one(s,oldURL,newURL,'native async sprite URL');
 return s;
}
