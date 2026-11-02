/* Build-only compatibility for a missing optional Poké Arena 2D texture.
 * The original client can reformat the preload call between releases.
 * Never remove other sprites, references, or unrelated Phaser statements.
 */
const BALL_REQUEST = /this\.load\.spritesheet\(\s*["']ui-balls["']\s*,\s*["']assets\/ui\/balls20\.png["']\s*,\s*\{[^{}]{0,160}\}\s*\)\s*;?/g;

export function stripUnavailableBallPreload(source) {
  if (typeof source !== 'string') throw new TypeError('Native preload source must be text');
  const matches = [...source.matchAll(BALL_REQUEST)];
  if (matches.length === 0) {
    if (source.includes('ui-balls') || source.includes('balls20.png'))
      throw new Error('Unknown native ui-balls preload; refusing to guess');
    return source; // The upstream client may have removed this preload entirely.
  }
  if (matches.length !== 1)
    throw new Error('Multiple native ui-balls preload statements; refusing to guess');
  const request = matches[0][0];
  if (!/\bframeWidth\s*:\s*\d+\b/.test(request) ||
      !/\bframeHeight\s*:\s*\d+\b/.test(request))
    throw new Error('Unrecognized native ui-balls spritesheet frame configuration');
  const remaining = source.replace(request, '');
  if (remaining.includes('ui-balls') || remaining.includes('balls20.png'))
    throw new Error('Native ui-balls still referenced; preserving preload and failing safely');
  return remaining;
}
