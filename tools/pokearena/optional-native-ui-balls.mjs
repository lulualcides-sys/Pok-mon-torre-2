// Compatibility guard for the optional native Poké Arena ui-balls preload.
// A newer client may omit it entirely; never rewrite unrelated Phaser art.
export function stripOptionalUiBallsPreload(body) {
 if (typeof body !== 'string') throw new TypeError('Native Phaser source must be text');
 const preload = /this\.load\.spritesheet\(\s*["']ui-balls["']\s*,\s*["']assets\/ui\/balls20\.png["']\s*,\s*\{[^{};]{0,180}\}\s*\)\s*;/g;
 const matches = [...body.matchAll(preload)];
 const hasKey = /["']ui-balls["']/.test(body);
 const hasAsset = body.includes('balls20.png');
 if (matches.length === 0 && !hasKey && !hasAsset) return {body, removed:false};
 if (matches.length !== 1) throw new Error('Optional native ui-balls preload changed ambiguously: '+matches.length);
 const result = body.replace(matches[0][0], '');
 if (/["']ui-balls["']/.test(result) || result.includes('balls20.png'))
  throw new Error('Native client still references ui-balls or balls20.png');
 return {body:result, removed:true};
}
