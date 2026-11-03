/* Build-only compatibility for a reformatted upstream config import.
 * Preserve the original native imports; add only the campaign weather hook.
 * Fail closed if import provenance or identifiers become ambiguous.
 */
const CONFIG_IMPORT = /import\s*\{\s*([^{}]{1,300})\s*\}\s*from\s*(['"])\.\/config\.js\2\s*;?/g;
const WEATHER_IMPORT = 'import{weatherFromMove}from"./torre2/weather.js";';
const EXISTING_WEATHER = /import\s*\{[^{}]*\bweatherFromMove\b[^{}]*\}\s*from\s*(['"])\.\/torre2\/weather\.js\1\s*;?/g;

export function ensureNativeWeatherFromMoveImport(source) {
  if (typeof source !== 'string') throw new TypeError('Native abilities source must be text');
  const existing = [...source.matchAll(EXISTING_WEATHER)];
  if (existing.length === 1) return source;
  if (existing.length > 1 || source.includes('weatherFromMove'))
    throw new Error('Ambiguous native weatherFromMove import/reference');
  const matches = [...source.matchAll(CONFIG_IMPORT)];
  if (matches.length !== 1) throw new Error('Unknown native abilities config imports');
  const names = matches[0][1].split(',').map(s => s.trim());
  if (!['CAMPO', 'RADIO', 'limitarCampo'].every(name => names.includes(name)))
    throw new Error('Native abilities config symbols changed; refusing guessed weather import');
  return source.replace(matches[0][0], matches[0][0] + WEATHER_IMPORT);
}
