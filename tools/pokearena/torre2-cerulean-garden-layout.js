/* Organic Cerulean riverbank placement for approved native pixel art.
 * Presentation only: no collision, save schema, NPCs, interaction or battle logic.
 * Coordinates in fixed 640x360 campaign world; small gaps keep stone circulation clear.
 */
export const CERULEAN_GREENERY = Object.freeze([
 Object.freeze({x:13,y:82,height:38,species:'oak_deep',zone:'west-edge'}),
 Object.freeze({x:43,y:75,height:42,species:'oak_lime',zone:'west-edge'}),
 Object.freeze({x:170,y:82,height:39,species:'oak_sun',zone:'north-garden'}),
 Object.freeze({x:206,y:72,height:44,species:'berry',zone:'north-garden'}),
 Object.freeze({x:265,y:77,height:36,species:'oak_deep',zone:'north-garden'}),
 Object.freeze({x:312,y:83,height:43,species:'oak_lime',zone:'north-garden'}),
 Object.freeze({x:420,y:81,height:38,species:'oak_deep',zone:'east-garden'}),
 Object.freeze({x:596,y:77,height:44,species:'oak_sun',zone:'east-garden'}),
 Object.freeze({x:631,y:86,height:39,species:'wisteria',zone:'east-garden'}),
 Object.freeze({x:14,y:217,height:47,species:'berry',zone:'west-riverbank'}),
 Object.freeze({x:29,y:247,height:40,species:'oak_sun',zone:'west-riverbank'}),
 Object.freeze({x:221,y:270,height:41,species:'oak_deep',zone:'south-garden'}),
 Object.freeze({x:248,y:267,height:37,species:'sakura',zone:'south-garden'}),
 Object.freeze({x:421,y:260,height:40,species:'oak_sun',zone:'east-riverbank'}),
 Object.freeze({x:441,y:252,height:37,species:'oak_deep',zone:'east-riverbank'}),
 Object.freeze({x:628,y:193,height:42,species:'pine',zone:'east-woodland'}),
 Object.freeze({x:446,y:77,height:37,species:'oak_lime',zone:'east-garden'})
]);
export const CERULEAN_PROTECTED_WALKWAYS=Object.freeze([
 Object.freeze({id:'south-stairs',left:270,top:265,right:310,bottom:307}),
 Object.freeze({id:'canal-bridge',left:327,top:115,right:411,bottom:164}),
 Object.freeze({id:'central-plaza',left:210,top:149,right:280,bottom:217}),
 Object.freeze({id:'gym-entrance',left:469,top:169,right:560,bottom:214}),
 Object.freeze({id:'center-entrance',left:85,top:141,right:164,bottom:179}),
 Object.freeze({id:'mart-entrance',left:64,top:236,right:145,bottom:270}),
 Object.freeze({id:'boat',left:453,top:258,right:506,bottom:309})
]);
export function ceruleanGreeneryLayoutReport(entries=CERULEAN_GREENERY){
 const duplicateKeys=new Set(),duplicates=[],blocked=[],species=new Set(),zones=new Set();
 for(const entry of entries){
  if(!Number.isInteger(entry.x)||!Number.isInteger(entry.y)||
     !Number.isInteger(entry.height)||entry.height<30||entry.height>54)
   throw new Error('Invalid Cerulean greenery bounds');
  species.add(entry.species);zones.add(entry.zone);
  const key=entry.x+','+entry.y;
  if(duplicateKeys.has(key))duplicates.push(key);
  duplicateKeys.add(key);
  // Only the trunk's root must stay clear; tree crowns may overlap vegetation.
  for(const w of CERULEAN_PROTECTED_WALKWAYS)
   if(entry.x>=w.left&&entry.x<=w.right&&entry.y>=w.top&&entry.y<=w.bottom)
    blocked.push({entry,walkway:w.id});
 }
 return {count:entries.length,species:species.size,zones:zones.size,
  duplicates,blocked,pass:!duplicates.length&&!blocked.length};
}
