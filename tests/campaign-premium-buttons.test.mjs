import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const file=path.resolve('tools/pokearena/torre2-battle-path.js');
const source=fs.readFileSync(file,'utf8');
test('six campaign quick-actions remain visible with 23px nonoverlapping mobile touch targets',()=>{
 const expected=['BOLSA','POKÉMON','CENTRO','LOJA','TREINAMENTO','CAPTURA'];
 for(const label of expected)
  assert.ok(source.includes("'"+label+"'"),'Missing campaign control '+label);
 assert.match(source,/533\+\(i%2\)\*64,254\+Math\.floor\(i\/2\)\*23,/);
 assert.match(source,/60,20,label,action,\{depth:39,small:true,tone\}/);
 assert.match(source,/Math\.max\(h,23\)/);
 const y=[254,277,300],hit=23;
 assert.ok(y.every((v,i)=>i===0||v-y[i-1]>=hit));
 assert.ok(y[0]-hit/2>=240&&y[2]+hit/2<=313,
  'All quick actions must fit below party slots and above bottom action bar');
});
test('campaign buttons have clear semantic tones and preserve callbacks',()=>{
 for(const tone of ['blue','green','teal','red','gold'])
  assert.match(source,new RegExp(tone+":\\s*\\{fill:"));
 assert.match(source,/\.setData\('torre2-path-action',title\)/);
 assert.match(source,/\.setData\('torre2-campaign-button-tone',kind\)/);
 assert.match(source,/playOriginalMenuCue\(scene\);action\(\)/);
 assert.match(source,/setData\('torre2-central-cta',true\)/);
 assert.match(source,/setData\('torre2-reset-journey',true\)/);
});
test('arena and real combat controls never import the campaign skin',()=>{
 // The existing build already patches battle logic for older approved
 // features; this PR must not change those patches. Check this campaign-only
 // component instead of falsely rejecting established build transforms.
 assert.ok(!source.includes('from "../hud.js"'));
 assert.ok(!source.includes("from '../hud.js'"));
 assert.ok(!source.includes('torre2/noncombat-pixel-buttons.js'));
 // We changed only battle-path.js, a campaign navigation module.
 assert.match(source,/renderBattlePath\(scene,state,handlers\)/);
});
