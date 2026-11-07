/* Torre 2 — six independent original slash VFX. VISUAL ONLY.
 * Optional Phaser/WebGL adapter. Not wired into any native move or battle yet.
 * Loads pre-rendered indexed PNG spritesheets; NO Canvas attack renderer.
 */
export const SIX_SLASH_IDS = Object.freeze([
  'ember-rake','solar-crescent','frost-shatter','ivory-gale',
  'verdant-sickle','astral-reaver'
]);
export const SLASH_FRAME_SIZE = 96;
export const SLASH_FRAMES = 12;
export const SLASH_FPS = 24;
const keyFor = (id) => 'torre2-six-slashes-' + id;
const allowed = (id) => SIX_SLASH_IDS.includes(id);

/** Call within Phaser Scene.preload, with a directory URL for the six PNG strips.
 * On the native client, the default is suitable once the build copies these
 * authored PNGs to /arena2d/assets/torre2/six-slashes/.
 */
export function preloadSixSlashVfx(scene, baseUrl = './assets/torre2/six-slashes') {
  if (!scene?.load?.spritesheet) throw new Error('Phaser Scene.preload required');
  for (const id of SIX_SLASH_IDS) {
    scene.load.spritesheet(keyFor(id), baseUrl.replace(/\/$/, '') + '/' + id + '.png',
      {frameWidth: SLASH_FRAME_SIZE, frameHeight: SLASH_FRAME_SIZE, margin: 0, spacing: 0});
  }
}

/** Cosmetic-only VFX; no event updates HP, native moves, status or hitboxes. */
export function playSixSlashVfx(scene, id, x, y, options = {}) {
  if (!allowed(id)) throw new RangeError('Unknown slash id: ' + id);
  if (!scene?.textures?.exists(keyFor(id))) return null;
  if (!scene?.add?.sprite || !scene?.anims) return null;
  const loop = Boolean(options.loop);
  const anim = keyFor(id) + (loop ? '-loop' : '-play');
  if (!scene.anims.exists(anim)) {
    scene.anims.create({
      key: anim,
      frames: scene.anims.generateFrameNumbers(keyFor(id), {start: 0, end: SLASH_FRAMES - 1}),
      frameRate: SLASH_FPS, repeat: loop ? -1 : 0
    });
  }
  const sprite = scene.add.sprite(Math.round(x), Math.round(y), keyFor(id), 0);
  sprite.setDepth(options.depth ?? 1537);
  sprite.setScale(options.scale ?? 1);
  sprite.setFlipX(Boolean(options.flipX));
  sprite.setAngle(options.angle ?? 0);
  sprite.setAlpha(1);
  if (globalThis.Phaser?.Textures?.FilterMode?.NEAREST !== undefined) {
    scene.textures.get(keyFor(id)).setFilter(globalThis.Phaser.Textures.FilterMode.NEAREST);
  }
  if (!loop) sprite.once('animationcomplete', () => sprite.destroy());
  sprite.play(anim);
  return sprite;
}
