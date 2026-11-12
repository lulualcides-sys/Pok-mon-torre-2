/* Additive, syntax-guarded Gen III campaign types adapter.
 * Preserve exact native getter expression in Arena modes. No source substitution.
 */
export function wrapNativeTypesGetter(source){
 if(typeof source!=='string')throw Error('Native types source absent');
 const head=/get\s+tipos\s*\(\s*\)\s*\{/g;
 const headers=[...source.matchAll(head)];
 if(headers.length!==1)throw Error('Ambiguous native types getter');
 const pattern=/get\s+tipos\s*\(\s*\)\s*\{\s*return\s+([^{}]{1,240}?)\s*;?\s*\}/g;
 const matches=[...source.matchAll(pattern)];
 if(matches.length!==1)throw Error('Unsupported native types getter control flow');
 const full=matches[0][0];
 const expr=matches[0][1].trim().replace(/;$/,'').trim();
 if(!expr.includes('.tipos')||!/this\.(?:forma|def|alt)/.test(expr)||
   /\b(?:await|yield|throw|new Function|eval)\b/.test(expr))
  throw Error('Native types getter expression not verified');
 const upgraded='get tipos(){const types=('+expr+');'+
  'return this.escena?.datos?.torre2?gen3Types(types):types}';
 return source.replace(full,upgraded);
}
