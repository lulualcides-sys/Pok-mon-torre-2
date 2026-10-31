/* T24: independent, pure Kanto route interaction priorities.
 * Optional wild catches never replace mandatory trainers or rematches.
 */
export function pathCheckpointAction(index,progress,total,rematchEligible=false){
 const valid=[index,progress,total].every(Number.isSafeInteger)&&
  total>=0&&progress>=0&&progress<=total&&index>=0&&index<=total;
 if(!valid)return null;
 const boss=index===total,active=index===progress,done=index<progress;
 return Object.freeze({
  index,boss,active,done,available:active||done,
  optionalCapture:!boss&&(index%13===2||index%13===8),
  primary:active?(boss?'gym':'battle'):
   done&&rematchEligible?'rematch':'locked'
 });
}
