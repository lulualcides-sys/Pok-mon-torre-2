import test from 'node:test';
import assert from 'node:assert/strict';
import {wrapNativeTypesGetter} from '../tools/pokearena/torre2-native-types-compat.mjs';
test('old native types getter preserves exact source semantics in Arena',()=>{
 const native='class L{get tipos(){return this.mega&&this.forma.mega.tipos||this.forma.tipos}}';
 const updated=wrapNativeTypesGetter(native);
 assert.match(updated,/this\.mega&&this\.forma\.mega\.tipos\|\|this\.forma\.tipos/);
 assert.match(updated,/this\.escena\?\.datos\?\.torre2\?gen3Types\(types\):types/);
 const L=Function('gen3Types',updated+';return L')(types=>types.map(s=>s.toUpperCase()));
 const x=new L();x.forma={tipos:['electric']};x.mega=false;
 x.escena={datos:{torre2:false}};
 assert.deepEqual(x.tipos,['electric']);
 x.escena.datos.torre2=true;
 assert.deepEqual(x.tipos,['ELECTRIC']);
});
test('new getter expression from a different official release also keeps native result',()=>{
 const native='class Fighter{get tipos(){return this.alt?.tipos??this.def.tipos;}}';
 const updated=wrapNativeTypesGetter(native);
 const Fighter=Function('gen3Types',updated+';return Fighter')(t=>t.map(x=>x.toUpperCase()));
 const f=new Fighter();f.alt={tipos:['steel']};f.def={tipos:['fire']};
 f.escena={datos:{torre2:false}};
 assert.deepEqual(f.tipos,['steel']);
 f.escena.datos.torre2=true;
 assert.deepEqual(f.tipos,['STEEL']);
});
test('fail closed on multiple getters or unknown dynamic types control flow',()=>{
 for(const invalid of [
  'class F{}','get tipos(){throw Error("hidden")}',
  'get tipos(){const x=this.def.tipos;return x}',
  'get tipos(){return this.def.id}',
  'get tipos(){return this.def.tipos}get tipos(){return this.def.tipos}'
 ])assert.throws(()=>wrapNativeTypesGetter(invalid));
});
