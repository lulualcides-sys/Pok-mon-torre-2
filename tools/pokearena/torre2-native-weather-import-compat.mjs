/* Build-only compatibility for reformatted upstream config imports.
 * Preserve all original native imports. Inject only known Torre 2 modules.
 */
const CONFIG_IMPORT = /import\s*\{\s*([^{}]{1,300})\s*\}\s*from\s*(['"])\.\/config\.js\2\s*;?/g;
const MODULES = Object.freeze({
 TORRE2_FORMS: './torre2/signature-fx.js',
 weatherFromMove: './torre2/weather.js'
});

export function ensureNativeAbilityImport(source, symbol) {
 if(typeof source !== 'string') throw new TypeError('Native abilities source must be text');
 const module = MODULES[symbol];
 if(!module) throw new Error('Unknown Torre 2 abilities import');
 const escapedModule = module.replaceAll('.', '\\.').replaceAll('/', '\\/');
 const existingPattern = new RegExp("import\\s*\\{[^{}]*\\b"+symbol+"\\b[^{}]*\\}\\s*from\\s*(['\"])" + escapedModule + "\\1\\s*;?", "g");
 const existing = [...source.matchAll(existingPattern)];
 if(existing.length === 1) return source;
 if(existing.length > 1 || source.includes(symbol)) throw new Error('Ambiguous native abilities import: '+symbol);
 const matches = [...source.matchAll(CONFIG_IMPORT)];
 if(matches.length !== 1) throw new Error('Unknown native abilities config imports');
 const names = matches[0][1].split(',').map(s=>s.trim());
 if(!['CAMPO','RADIO','limitarCampo'].every(name=>names.includes(name)))
  throw new Error('Native abilities config symbols changed');
 return source.replace(matches[0][0],matches[0][0]+'import{'+symbol+'}from"'+module+'";');
}
export const ensureNativeWeatherFromMoveImport = source => ensureNativeAbilityImport(source,'weatherFromMove');
