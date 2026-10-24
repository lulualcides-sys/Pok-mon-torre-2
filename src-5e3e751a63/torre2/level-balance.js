/* Pokémon Torre 2 — Kanto-only level balance for native Arena 2D combat.
 * The original client uses species Attack/Defense and type effectiveness
 * but has no dynamic Pokémon levels in its damage or maximum HP formulas.
 * These deterministic, fast multipliers add Gen III-inspired scaling without
 * replacing moves, collision, STAB/type rules, animations or other game modes.
 */
export const REFERENCE_LEVEL=30;
// Small Kanto-only 25% boost for PLAYER dealt damage. Never changes the
// original Poké Arena 2D multiplayer modes, damage previews or enemy hits.
export const CAMPAIGN_PLAYER_DAMAGE_BOOST=1.25;
export function combatLevel(value){
 const n=Number(value);
 return Number.isFinite(n)?Math.min(100,Math.max(1,Math.floor(n))):REFERENCE_LEVEL;
}
export function campaignFighterLevel(fighter){
 const game=fighter?.escena?.datos?.torre2;
 if(!game)return null;
 const lado=fighter?.lado??0;
 const team=game.party;
 const active=lado===0?team?.friend?.[team.playerIndex]:team?.foes?.[team.enemyIndex];
 return combatLevel(active?.level??(lado===0?game.playerLevel:game.enemyLevel));
}
export function campaignHpMultiplier(level){
 const n=combatLevel(level);
 // Base HP grows with level but isn't zero at level 1. At level 50 it is
 // ~1.44x original, while a level-6 fighter has only ~0.47x original HP.
 return (n+15)/(REFERENCE_LEVEL+15);
}
export function campaignDamageMultiplier(attackerLevel,defenderLevel){
 const a=combatLevel(attackerLevel),d=combatLevel(defenderLevel);
 // The (2*L/5+2) term is the source of level damage in FireRed.
 // The second factor approximates how actual Attack/Defense stats also grow
 // with level, since the Arena's native atk/def getters only use species.
 // For equal levels, the ratio part is 1; type and native species stats
 // still decide which attack is super-effective.
 return ((2*a/5+2)/(2*REFERENCE_LEVEL/5+2))*((a+12)/(d+12));
}
export function campaignScaledHp(nativeHp,level){
 if(!Number.isFinite(nativeHp)||nativeHp<=0)return nativeHp;
 return Math.max(1,Math.round(nativeHp*campaignHpMultiplier(level)));
}
