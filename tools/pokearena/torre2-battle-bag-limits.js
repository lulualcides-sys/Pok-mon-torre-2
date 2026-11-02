/* T31 — per-encounter Potion cap.
 * Keep this battle-only on the existing party payload: scene/HUD reloads
 * must not reset a player's three heals. Never write it to campaign saves.
 */
export const BATTLE_POTION_LIMIT=3;
export function battlePotionUses(party){
 const value=party?.torre2PotionUses;
 if(value===undefined||value===null)return 0;
 // Unexpected positive values fail closed rather than silently resetting
 // the allowance. No trusted counter may exceed the finite cap.
 if(!Number.isSafeInteger(value)||value<0)return BATTLE_POTION_LIMIT;
 return Math.min(BATTLE_POTION_LIMIT,value);
}
export function canUseBattlePotion(party){
 return party!=null&&battlePotionUses(party)<BATTLE_POTION_LIMIT;
}
export function recordBattlePotionUse(party){
 if(!canUseBattlePotion(party))return false;
 party.torre2PotionUses=battlePotionUses(party)+1;
 return true;
}
