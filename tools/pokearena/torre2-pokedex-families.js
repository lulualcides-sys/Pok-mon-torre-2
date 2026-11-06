/* Pokédex-only family index. Never reorder or mutate the battle ROSTER.
 * Both native Poké Arena nested evolutions and Johto/Kanto added forms belong
 * to one entry per family; each genuine form remains available in its tab.
 */
const norm=v=>String(v??'').trim().toLowerCase();
const num=v=>{const n=Number(v);return Number.isInteger(n)&&n>0?n:null};
export function buildPokedexFamilies(roster,johtoRows=[],evolutions={}){
 const dexById=new Map(),rosterByDex=new Map(),nestedOwner=new Map();
 for(const [i,p] of roster.entries()){
  const dex=num(p.dex);
  if(dex&&!rosterByDex.has(dex))rosterByDex.set(dex,i);
  if(dex&&p.id)dexById.set(norm(p.id),dex);
  if(dex&&p.nombre)dexById.set(norm(p.nombre),dex);
  for(const evo of p.evoluciones||[]){
   const child=num(evo.dex);
   if(child&&evo.nombre)dexById.set(norm(evo.nombre),child);
   if(child&&child!==dex&&!nestedOwner.has(child))nestedOwner.set(child,i);
  }
 }
 for(const row of johtoRows||[]){
  const dex=num(row[0]);if(dex&&row[1])dexById.set(norm(row[1]),dex);
 }
 const parent=new Map();
 // Official Johto family relations, including branches and baby Pokémon.
 for(const row of johtoRows||[]){
  const child=num(row[0]),before=num(row[9]);
  if(child&&before&&child!==before)parent.set(child,before);
 }
 // Kanto campaign evolution names are a supplementary relation source.
 // They do not alter Johto parent data or in-game battle progression.
 for(const [from,rules] of Object.entries(evolutions||{})){
  const before=dexById.get(norm(from));
  if(!before)continue;
  for(const rule of rules||[]){
   const child=dexById.get(norm(rule.to));
   if(child&&before!==child&&!parent.has(child))parent.set(child,before);
  }
 }
 // Cross-generation lineage that cannot be reconstructed from the Johto
 // 152-251 source alone. The first number is the EVOLVED form, the second
 // is its direct pre-evolution. Only join forms actually installed in ROSTER.
 // This is Pokédex presentation ONLY: never mutate original P2 kits/saves,
 // roster entries, animations, or level-up/evolution mechanics.
 const crossGenParents=[
  [25,172],    // Pichu -> Pikachu -> Raichu
  [35,173],    // Cleffa -> Clefairy
  [39,174],    // Igglybuff -> Jigglypuff
  [106,236],[107,236],[237,236], // Tyrogue: Hitmonlee/chan/top
  [124,238],   // Smoochum -> Jynx
  [125,239],[466,125], // Elekid -> Electabuzz -> Electivire
  [126,240],[467,126], // Magby -> Magmar -> Magmortar
  [183,298],   // Azurill -> Marill -> Azumarill
  [202,360],   // Wynaut -> Wobbuffet
  [315,406],[407,315], // Budew -> Roselia -> Roserade
  [185,438],   // Bonsly -> Sudowoodo
  [122,439],   // Mime Jr. -> Mr. Mime
  [113,440],[242,113], // Happiny -> Chansey -> Blissey
  [143,446],   // Munchlax -> Snorlax
  [226,458],   // Mantyke -> Mantine
  [82,81],[462,82], // Magnemite -> Magneton -> Magnezone
  [463,108],   // Lickitung -> Lickilicky
  [464,112],   // Rhydon -> Rhyperior
  [465,114],   // Tangela -> Tangrowth
  [176,175],[468,176], // Togepi -> Togetic -> Togekiss
  [469,193],   // Yanma -> Yanmega
  [470,133],[471,133],[700,133], // Eevee branches
  [461,215],   // Sneasel -> Weavile
  [472,207],   // Gligar -> Gliscor
  [473,221],   // Swinub -> Piloswine -> Mamoswine
  [233,137],[474,233], // Porygon -> Porygon2 -> Porygon-Z
  [475,281],   // Kirlia -> Gallade
  [476,299],   // Nosepass -> Probopass
  [477,356],   // Dusclops -> Dusknoir
  [478,361]    // Snorunt -> Froslass
 ];
 const installed=new Set(dexById.values());
 for(const [child,before] of crossGenParents)
  if(installed.has(child)&&installed.has(before))parent.set(child,before);
 // Native Poké Arena nested stages are authoritative when no relation exists.
 for(const [child,i] of nestedOwner){
  const before=num(roster[i].dex);
  if(before&&before!==child&&!parent.has(child))parent.set(child,before);
 }
 const rootIndexForIndex=roster.map((p,i)=>{
  let current=num(p.dex),chosen=i;
  const seen=new Set();
  while(current&&!seen.has(current)){
   seen.add(current);
   if(rosterByDex.has(current))chosen=rosterByDex.get(current);
   else if(nestedOwner.has(current))chosen=nestedOwner.get(current);
   current=parent.get(current);
  }
  return chosen;
 });
 // A descendant can be chosen as an intermediate because its ancestor is a
 // nested stage rather than a top-level ROSTER entry. Resolve to fixed point.
 for(let pass=0;pass<roster.length;pass++){
  let changed=false;
  for(let i=0;i<roster.length;i++){
   const r=rootIndexForIndex[i],next=rootIndexForIndex[r];
   if(next!==r){rootIndexForIndex[i]=next;changed=true}
  }
  if(!changed)break;
 }
 const membersByRoot=new Map();
 rootIndexForIndex.forEach((root,i)=>{
  if(!membersByRoot.has(root))membersByRoot.set(root,[]);
  membersByRoot.get(root).push(i);
 });
 // National Dex ordering uses the earliest available family member, not
 // necessarily the BABY root (Pichu is #172 but Pikachu's family starts #25).
 // Keep each evolution on one card without shuffling battle ROSTER indices.
 const familyFirstDex=root=>Math.min(...membersByRoot.get(root).map(i=>
  num(roster[i].dex)??100000+i));
 const order=[...membersByRoot.keys()].sort((a,b)=>
  familyFirstDex(a)-familyFirstDex(b)||a-b);
 const rank=Array(roster.length),rootSet=new Set(order);
 order.forEach((root,k)=>{for(const i of membersByRoot.get(root))rank[i]=k});
 return {order,rank,rootSet,rootIndexForIndex,membersByRoot};
}
