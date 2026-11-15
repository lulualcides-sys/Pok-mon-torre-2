/* Pokédex presentation only: one card per biological family, stages as
 * tabs. Never mutate actual battle ROSTER, moves, evolution rules or saves.
 */
const clone=kit=>Object.fromEntries(Object.entries(kit||{}).map(([k,m])=>[k,m?{...m}:m]));
export function buildFamilyDexRoster(all,battle,johto,resolveStages,buildFamilies){
 if(!Array.isArray(all)||!Array.isArray(battle)||!Array.isArray(johto)||
    typeof resolveStages!=='function'||typeof buildFamilies!=='function')
  throw Error('Invalid family source');
 const rules={};
 for(const p of battle){
  if(!p.id||!Array.isArray(p.evoluciones))continue;
  rules[p.id]=p.evoluciones.filter(e=>e?.nombre&&e.dex!==p.dex)
   .map(e=>({to:e.nombre}));
 }
 const ix=buildFamilies(all,johto,rules);
 const output=[],visited=new Set();
 for(const root of ix.order){
  const members=ix.membersByRoot.get(root);
  if(!Array.isArray(members)||!members.includes(root))throw Error('Invalid family root');
  const ordered=[root,...members.filter(i=>i!==root).sort((a,b)=>
   Number(all[a].dex)-Number(all[b].dex))];
  const stages=[],ids=[];
  for(const i of ordered){
   const p=all[i];
   if(visited.has(p.dex))throw Error('Duplicate species family: '+p.dex);
   visited.add(p.dex);ids.push(p.dex);
   const resolved=resolveStages(p);
   if(!Array.isArray(resolved)||resolved[0]?.dex!==p.dex)
    throw Error('Missing native evolution stage '+p.dex);
   for(const et of resolved){
    if(!et?.kit||!et.dex)throw Error('Invalid stage kit '+p.dex);
    stages.push({...et,kit:clone(et.kit)});
   }
  }
  const p=all[root];
  output.push({...p,torre2DexStages:stages,
   torre2DexFamilyMembers:ids,torre2DexFamilyRoot:p.dex,
   torre2DexOnly:true,torre2DexOriginId:p.torre2DexOriginId??p.id});
 }
 if(visited.size!==all.length||output.some(x=>!x.torre2DexStages.length))
  throw Error('Incomplete National Dex family coverage');
 for(const dex of ['0152','0153','0154','0240','0126','0467']){
  if(!output.some(x=>x.torre2DexFamilyMembers.includes(dex)))
   throw Error('Missing required evolution family '+dex);
 }
 for(const dex of ['0480','0481','0482']){
  const f=output.find(x=>x.torre2DexFamilyMembers.includes(dex));
  if(!f||f.torre2DexFamilyMembers.length!==1)
   throw Error('Lake Guardian must remain separate: '+dex);
 }
 return output;
}
