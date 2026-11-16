/* Impactos funcionais do Batch24: somente projeteis que causam dano.
 * Twister permanece sob o patch independente #604; seus VFX aprovados
 * nao sao alterados por este lote. Nenhum asset ou codigo externo e usado.
 */
export function shouldShowVerifiedProjectileImpact(move,hit){
 if(move?.id==='twister')return true;
 return hit?.landed===true&&Number.isFinite(hit.damage)&&hit.damage>0;
}
