/* T91 — first five Viridian Forest battles are Bug Catchers.
 * Pure presentation/battle identity, no changes to save indexes or party data.
 * Species exist in the original 151 battle library; never make rival or
 * Team Rocket appear behind a Bug Catcher overworld sprite.
 */
export const FOREST_BUG_CATCHERS=Object.freeze([
 Object.freeze({index:0,id:'forest-bug-1',species:'caterpie',name:'Caça-Insetos 1'}),
 Object.freeze({index:1,id:'forest-bug-2',species:'weedle',name:'Caça-Insetos 2'}),
 Object.freeze({index:2,id:'forest-bug-3',species:'metapod',name:'Caça-Insetos 3'}),
 Object.freeze({index:3,id:'forest-bug-4',species:'kakuna',name:'Caça-Insetos 4'}),
 Object.freeze({index:4,id:'forest-bug-5',species:'caterpie',name:'Caça-Insetos 5'})
]);
export function forestBugCatcher(stage,index){
 if(stage!==0||!Number.isInteger(index)||index<0||index>=FOREST_BUG_CATCHERS.length)return null;
 return FOREST_BUG_CATCHERS[index];
}
