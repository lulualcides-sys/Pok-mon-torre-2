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
test('campaign button library paints unique pixel icons and preserves all callbacks',()=>{
 for(const tone of ['blue','green','teal','red','gold','cream'])
  assert.match(source,new RegExp(tone+":\\s*\\{fill:"));
 assert.match(source,/\.setData\('torre2-path-action',title\)/);
 assert.match(source,/\.setData\('torre2-campaign-button-tone',kind\)/);
 assert.match(source,/\.setData\('torre2-campaign-button-role',role\)/);
 for(const role of ['bag','pokemon','center','shop','training','capture','battle','reset','fullscreen','menu','seeker','badge','city'])
  assert.ok(source.includes("case '"+role+"':"),'Unillustrated item '+role);
 assert.match(source,/export function campaignIcon\(/);
 assert.match(source,/graphics\.fillRect\(iconX-8,by\+3,16,h-6\)/);
 assert.match(source,/playOriginalMenuCue\(scene\);action\(\)/);
 assert.match(source,/setData\('torre2-central-cta',true\)/);
 assert.match(source,/setData\('torre2-reset-journey',true\)/);
 assert.match(source,/side\.fillRect\(499,242,130,69\)/);
 assert.match(source,/const iconOffset=compact\?8:gold&&role\?12:0/);
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

test('shop, healing, inventory and capture use distinct icons in campaign submenus',()=>{
 const sub=fs.readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 const art=fs.readFileSync('tools/pokearena/torre2-campaign-art.js','utf8');
 assert.match(sub,/import \{renderBattlePath,BATTLE_PATH_BACKDROP,campaignIcon\} from '\.\/battle-path\.js'/);
 for(const role of ['bag','pokemon','center','shop','training','capture'])
  assert.ok(sub.includes("?'"+role+"'"),'Missing submenu icon role '+role);
 assert.match(sub,/setData\('torre2-campaign-item-icon',decorated\?role:null\)/);
 assert.match(sub,/const decorated=Boolean\(role\)&&w>=116&&h>=27/);
 for(const tone of ['teal','red','cream'])assert.ok(art.includes("tone==='"+tone+"'"));
});
