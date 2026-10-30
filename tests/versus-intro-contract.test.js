import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('tools/pokearena/torre2-versus-intro.js','utf8');
const campaign=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
const builder=readFileSync('tools/pokearena/build-preview.mjs','utf8');

test('VS is a Phaser graphics scene, not an HTML overlay or a video',()=>{
 assert.match(source,/scene\.add\.container\(/);
 assert.match(source,/scene\.tweens\.add\(/);
 assert.match(source,/addRedPlayer\(/);
 assert.match(source,/addFireRedNPC\(/);
 assert.match(source,/originalBallSprite\(/);
 assert.match(source,/VERSUS_DURATION_MS=1480/);
 assert.doesNotMatch(source,/document\.createElement|canvas\.getContext|<video|<iframe/);
});
test('VS uses named opponents and real party counts, not hard-coded 6 balls',()=>{
 assert.match(source,/meta\.versus\.name/);
 assert.match(source,/meta\.versus\.city/);
 assert.match(source,/meta\.party\?\.friend\?\.length/);
 assert.match(source,/meta\.party\?\.foes\?\.length/);
 assert.match(source,/LEADERS=Object\.freeze\(/);
 assert.match(source,/trainerClass\(/);
});
test('VS does not run on wild encounters, lab or training',()=>{
 assert.match(source,/meta\.kind==='wild'\|\|meta\.training\|\|meta\.laboratory/);
 assert.match(campaign,/if\(!wild\)\{\s*const opponent=currentOpponent\(state\)/);
 assert.match(campaign,/kind:'rematch'[\s\S]*?versus:versusOpponentProfile/);
});
test('VS cannot award XP, badges, TM or change saves',()=>{
 assert.doesNotMatch(source,/localStorage|saveCampaign|resolveBattle|resolveWildBattle|applyPartyBattleResult|damage|xpReward|grantGymTM/);
 assert.match(campaign,/if\(playVersusIntro\(this,match,enterCombat\)\)return/);
 assert.match(campaign,/if\(this\.scene\.isActive\(\)\)this\.scene\.start\('combate',match\)/);
 assert.match(campaign,/if\(battle\.scene\.isActive\(\)\)combatEntered=true/);
 assert.match(campaign,/combatEntered&&game\.scene\.isActive\('campanha'\)/);
});
test('build includes versus module and native cache fingerprint',()=>{
 assert.match(builder,/\['tools\/pokearena\/torre2-versus-intro\.js','versus-intro\.js'\]/);
 assert.match(builder,/'torre2\/versus-intro\.js'/);
});
