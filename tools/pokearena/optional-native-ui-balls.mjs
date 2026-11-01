// Compatibility guard for optional legacy Poké Arena ui-balls preload.
// The current upstream client uses balls10.png; keep that valid native sprite.
export function stripOptionalUiBallsPreload(body) {
 if (typeof body !== 'string') throw new TypeError('Native Phaser source must be text');
 const legacy = /this\.load\.spritesheet\(\s*["']ui-balls["']\s*,\s*["']assets\/ui\/balls20\.png["']\s*,\s*\{[^{};]{0,180}\}\s*\)\s*;/g;
 const current = /this\.load\.spritesheet\(\s*["']ui-balls["']\s*,\s*["']assets\/ui\/balls10\.png["']\s*,\s*\{\s*frameWidth\s*:\s*20\s*,\s*frameHeight\s*:\s*20\s*\}\s*\)\s*;/g;
 const legacyMatches=[...body.matchAll(legacy)];
 const currentMatches=[...body.matchAll(current)];
 const hasKey=/["']ui-balls["']/.test(body);
 const hasLegacyAsset=body.includes('balls20.png');
 if (currentMatches.length===1 && legacyMatches.length===0 && !hasLegacyAsset)
  return {body,removed:false};
 if (currentMatches.length>0)
  throw new Error('Native ui-balls preload mixed or duplicated: '+currentMatches.length);
 if (legacyMatches.length===0 && !hasKey && !hasLegacyAsset)
  return {body,removed:false};
 if (legacyMatches.length!==1)
  throw new Error('Optional native ui-balls preload changed ambiguously: '+legacyMatches.length);
 const result=body.replace(legacyMatches[0][0],'');
 if (/["']ui-balls["']/.test(result)||result.includes('balls20.png'))
  throw new Error('Native client still references ui-balls or balls20.png');
 return {body:result,removed:true};
}
