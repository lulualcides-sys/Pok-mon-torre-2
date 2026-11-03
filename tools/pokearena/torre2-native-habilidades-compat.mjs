/* Native upstream compatibility — never alter original skill functions.
 * Only add the independent imported Kanto VFX registry.
 */
const fxImport='import{TORRE2_FORMS}from"./torre2/signature-fx.js";';
export function injectNativeTorre2FormsImport(source) {
 if(typeof source!=='string') throw new TypeError('Expected native skill source');
 const exists=/\bimport\s*\{\s*TORRE2_FORMS\s*\}\s*from\s*["']\.\/torre2\/signature-fx\.js["'];?/.test(source);
 if(exists)return source;
 if(/\bTORRE2_FORMS\b/.test(source))
  throw Error('Incomplete TORRE2_FORMS binding; refusing duplicate import');
 const re=/\bimport\s*\{([^{}]*)\}\s*from\s*(["'])\.\/config\.js\2\s*;?/g;
 const matches=[...source.matchAll(re)];
 if(matches.length!==1)throw Error('Unknown native skill config imports');
 const imports=matches[0][1].split(',').map(x=>x.trim());
 if(!imports.includes('CAMPO')&&!imports.includes('VISTA'))
  throw Error('Native skill config identity changed');
 const forms=(source.match(/\bconst\s+FORMAS\s*=\s*\{/g)||[]);
 if(forms.length!==1)throw Error('Unknown native FORMAS registry');
 const match=matches[0],point=match.index+match[0].length;
 return source.slice(0,point)+fxImport+source.slice(point);
}
