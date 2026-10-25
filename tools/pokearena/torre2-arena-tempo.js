/**
 * Non-campaign Arena movement calibration for species added by Pokémon Torre 2.
 *
 * The native Poké Arena 2D base roster has an average walking speed around 129,
 * whereas the first custom Kanto batch averages ~121 and the PokéAPI/FRLG
 * Kanto mapping (58 + Gen III Speed * .66) has median ~104. Scale and center
 * ONLY the new roster, preserving the slow-vs-fast species ordering.
 *
 * Does not change campaign stats, animation FPS, attack/dash speed, cooldown,
 * damage, energy or any approved move. Reuse the native game's movement
 * integration / movement-status effects unchanged.
 */
export const ARENA_SPEED_REFERENCE = Object.freeze({
  native: 129,
  earlyKanto: 121,
  extendedKanto: 104,
  spread: 0.90,
  min: 86,
  max: 168,
});

export function synchronizedArenaSpeed(raw, {
  added = false,
  kanto151 = false,
  campaign = false,
} = {}) {
  if (!added || campaign || !Number.isFinite(raw) || raw <= 0) return raw;
  const benchmark = kanto151
    ? ARENA_SPEED_REFERENCE.extendedKanto
    : ARENA_SPEED_REFERENCE.earlyKanto;
  const adjusted = ARENA_SPEED_REFERENCE.native
    + (raw - benchmark) * ARENA_SPEED_REFERENCE.spread;
  return Math.round(Math.max(
    ARENA_SPEED_REFERENCE.min,
    Math.min(ARENA_SPEED_REFERENCE.max, adjusted),
  ));
}
