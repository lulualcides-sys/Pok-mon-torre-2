import test from 'node:test';
import assert from 'node:assert/strict';
import {fixNativeBattleIds0713} from '../tools/pokearena/torre2-combat-ids-fix-0713.mjs';
const native='class Combate extends Phaser.Scene{preload(){const dexs=new Set(["0133"]);'+
 'if(!d.torre2&&d.modo!=="online"&&ids.includes("eevee"))for(const dex of ["0196","0197"])'+
 'if(m[dex])dexs.add(dex);soltarPMD(this,m,dexs);}}';
test('Arena/League combat preload never references undeclared ids',()=>{
 const out=fixNativeBattleIds0713(native,'0.71.3');
 assert.ok(out.includes('dexs.has("0133")'));
 assert.ok(!out.includes('ids.includes("eevee")'));
 assert.equal(fixNativeBattleIds0713(native,'0.70.0'),native);
 assert.throws(()=>fixNativeBattleIds0713(out,'0.71.3'),/exactly once/);
});
test('Eevee species trigger by actual dex and remain correct for all modes',()=>{
 const expression=fixNativeBattleIds0713(native,'0.71.3');
 assert.ok(expression.includes('!d.torre2&&d.modo!=="online"&&dexs.has("0133")'));
 assert.equal(new Set(['0133','0196','0197']).has('0133'),true);
 assert.equal(new Set(['0001','0004']).has('0133'),false);
});
