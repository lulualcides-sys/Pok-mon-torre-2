/* Alpha 0.76.2 / 0.77.3 equivalents for Torre 2 native patches written against 0.71.3.
 * Each entry maps the exact 0.71.3 anchor to the exact 0.76.2 native code and
 * returns the patched body, or null when the 0.76.2 code is not the expected
 * one (the caller then records adapter drift and blocks the release).
 * Native kits, slots and VFX stay untouched: only the same Torre 2 wrappers
 * are re-anchored.
 */
const once=(body,from,to)=>body.split(from).length===2?body.replace(from,to):null;

const ADAPTERS={
 // Boot preload: 0.76.2 loads no animations at boot (nombres=[]). Keep the
 // approved Torre 2 boot set (starters, Pichu line, 12 finals) with Idle/Walk
 // so title and first selection cards are animated, as on 0.71.3.
 'escenas/carga.js\nconst nombres=soloEstos?null:BASICAS;cargarPMD(this,usados,nombres);':(body,to)=>{
  const withImport=once(body,'import{cargarPMD,crearAnimsPMD,formasDe,soloFormas}from"../sprites.js"',
   'import{cargarPMD,crearAnimsPMD,formasDe,soloFormas,BASICAS}from"../sprites.js"');
  return withImport&&once(withImport,'const nombres=soloEstos?null:[];cargarPMD(this,usados,nombres);',to);
 },
 // kitActual: 0.76.2 adds this.fx (skin effects) next to this.aspecto.
 'luchador.js\nreturn this.aspecto?vfx.kitAspecto(kit,this.aspecto):kit':(body,to)=>{
  const oldTail='(this.aspecto?vfx.kitAspecto(kit,this.aspecto):kit)';
  if(!to.endsWith(oldTail))return null;
  return once(body,'return this.fx||this.aspecto?vfx.kitAspecto(kit,this.fx??this.aspecto):kit',
   to.slice(0,-oldTail.length)+'(this.fx||this.aspecto?vfx.kitAspecto(kit,this.fx??this.aspecto):kit)');
 },
 // Kit layering: 0.76.2 switched to reduce() with `sustituye`. Keep that
 // native merge, but still enumerate slots that exist only in layers.
 'luchador.js\nObject.entries(this.def.kit).map(([k,v])=>[k,Object.assign({},v,...capas.map(c=>c[k]??{}))])':body=>
  once(body,
   'Object.entries(this.def.kit).map(([k,v])=>[k,capas.reduce((a,c)=>c[k]?.sustituye?{...c[k]}:Object.assign(a,c[k]??{}),{...v})])',
   '[...new Set([...Object.keys(this.def.kit),...capas.flatMap(c=>Object.keys(c))])].map(k=>[k,capas.reduce((a,c)=>c[k]?.sustituye?{...c[k]}:Object.assign(a,c[k]??{}),{...(this.def.kit[k]??{})})])'),
};

// Patches made obsolete by native 0.76.2 code. Each one requires positive
// evidence that the native replacement is present.
const OBSOLETE={
 // 0.76.2 preparar.js uses pedirBasicas() with de-duplication and a
 // refresh callback, which is what the Torre 2 preview queue added.
 'escenas/preparar.js':body=>body.includes('if(pedirBasicas(this,[p.dex,dex,...formasDe([pl.id],[aspecto])],()=>{if(this.scene.isActive()){t.mostrado=null;this.refrescar()}})){'),
};

// Alpha 0.77.3: native imports that only gained extra names. The Torre 2
// patch appends its own imports after the native one, so keep the native
// import exactly as it is and append the same Torre 2 text after it.
const GROWN_IMPORTS={
 'luchador.js\nimport{CAMPO,COLOR,RADIO,limitarCampo}from"./config.js";':
  'import{CAMPO,COLOR,RADIO,limitarCampo,estiloFuente}from"./config.js";',
};

export function adaptAnchor0762(filename,from,to,body){
 const adapter=ADAPTERS[filename+'\n'+from];
 if(adapter)return adapter(body,to);
 const grown=GROWN_IMPORTS[filename+'\n'+from];
 if(grown&&to.startsWith(from))return once(body,grown,grown+to.slice(from.length));
 const obsolete=OBSOLETE[filename];
 if(obsolete&&from.startsWith('if(dex!==p.dex&&!this.anims.exists(`${dex}-Idle-0`)){precargarLineas(')&&obsolete(body))
  return body;
 return null;
}
