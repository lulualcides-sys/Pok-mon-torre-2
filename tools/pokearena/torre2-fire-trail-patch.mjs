/* Whole game (owner request 2026-11-20): fire moves froze phones because
 * every scorch mark ("quemado": ground flames of Flare Blitz, fire dash
 * trails, eruptions…) creates two brand-new canvas textures uploaded to the
 * GPU — about 60 per Flare Blitz. At most FIRE_SCORCH.perSecond new scorch
 * marks are created per second in a scene; extra ones in the same second are
 * skipped (they overlap the existing marks anyway). Other ground marks
 * (water, electric, ice, cracks…) are byte-identical. Refuses to patch if the
 * base client changed.
 */
export const FIRE_SCORCH=Object.freeze({perSecond:6});
const once=(src,from,to,label)=>{
 if(src.split(from).length!==2)throw Error('Fire scorch patch: unexpected '+label+' (base client changed)');
 return src.replace(from,to);
};
export function patchFireTrailMarks(source,{perSecond=FIRE_SCORCH.perSecond}=FIRE_SCORCH){
 const anchor='function quemado(e,x,y,R,{brasas=true,hueco=0}={}){if(!activas()||R<3)return;const m=gestor(e),t=reloj(e);if(repetida(m,hueco?"aro":"quemado",x,y,R))return;';
 return once(String(source),anchor,anchor+
  'm.torre2Quemados=(m.torre2Quemados||[]).filter(s=>t-s<1&&t>=s);if(m.torre2Quemados.length>='+perSecond+')return;m.torre2Quemados.push(t);',
  'scorch mark function');
}
