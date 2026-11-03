import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const core=readFileSync('tools/pokearena/torre2-campaign-core.js','utf8');
const scene=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
const auto=readFileSync('tools/pokearena/torre2-auto-battle.js','utf8');
const build=readFileSync('tools/pokearena/build-preview.mjs','utf8');
test('T92 true native Sumário has previous/next Pokemon with no saved party change',()=>{
 assert.match(scene,/torre2-summary-prev-pokemon/);
 assert.match(scene,/torre2-summary-next-pokemon/);
 assert.match(scene,/const next=\(index\+offset\+state\.team\.length\)%state\.team\.length/);
 assert.match(scene,/this\.showSummary\(readCampaign\(\)\|\|state,next,0,0\)/);
});
test('T92 Pokédex displays actual cached/loaded PMD pixels and unseen silhouettes',()=>{
 assert.match(scene,/const dexEpoch=this\.__torre2DexEpoch=/);
 assert.match(scene,/this\.load\.image\(portraitKey,'assets\/pmd\/'.*'\/portrait\.png'\)/);
 assert.match(scene,/setData\('torre2-dex-sprite',row\.id\)/);
 assert.match(scene,/image\.setTint\(0x465b72\)/);
 assert.match(scene,/this\.textures\.exists\(portraitKey\)/);
});
test('T92 only successful capture awards XP; pending throw never changes live stats',()=>{
 assert.match(core,/captureShared=awardSharedTeamExperience\(next,reward,\{kind:'capture'\}\)/);
 assert.match(core,/next\.team=s\.team\.map\(p=>JSON\.parse\(JSON\.stringify\(p\)\)\)/);
 assert.match(core,/saveCampaign\(next\);/);
 assert.match(core,/XP por captura/);
 assert.doesNotMatch(core,/awardSharedTeamExperience\(s,reward,\{kind:'capture'/);
});
test('T92 original native Arena stays 99s while campaign round resets to 120s',()=>{
 assert.match(build,/nativeMatches!==2/);
 assert.match(build,/this\.reloj=this\.datos\?\.torre2\?120:REGLAS\.tiempoRonda;/);
 assert.match(build,/if\(filename==='escenas\/combate\.js'\)/);
});
test('T92 opponent evasion is scoped and does not mutate shared native IA config',()=>{
 assert.match(auto,/export function tuneCampaignOpponentEvasion/);
 assert.match(auto,/if\(!scene\?\.datos\?\.torre2/);
 assert.match(auto,/opponent\.cfg=\{\.\.\.opponent\.cfg,esquiva:after\}/);
 assert.match(auto,/tuneCampaignOpponentEvasion\(this\)/);
});
