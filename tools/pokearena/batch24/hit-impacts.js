/* Batch24 projectile-hit policy. No VFX assets or upstream code.
 * Twister's approved impact can only appear after a confirmed damaging hit;
 * a blocked/dodged/accuracy-missed contact must not create a phantom impact.
 * Other approved Batch24 moves keep their existing behavior.
 */
export function shouldPaintProjectileImpact(move,hit){
 return move?.id!=='twister'||hit?.landed===true;
}
