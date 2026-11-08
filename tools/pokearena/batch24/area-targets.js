/* Independent target selection for Torre 2 area attacks, not original P2 code.
 * Original Poké Arena 2D 0.64.2 notes confirmed multi-target area hits.
 * Keep the single-rival contract for the Kanto campaign and 1v1 Arena.
 * An Arena FFA (3+ fighters) uses the active scene roster, excluding allies.
 */
export function batch24AreaTargets(actor){
 const fighters=actor?.escena?.luchadores;
 if(!Array.isArray(fighters)||fighters.length<=2){
  const target=actor?.rival;
  return target&&target!==actor&&!target.ko?[target]:[];
 }
 const team=actor?.equipo??actor?.equipe;
 return fighters.filter(target=>target&&target!==actor&&!target.ko&&
  !(team!=null&&(target.equipo??target.equipe)===team));
}
