import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('every gameplay module physically overlaid into release triggers QA and publish',()=>{
 // Alpha 0.76.2 is the published release; 0.71.3 is kept as manual rollback.
 const builder=read('tools/pokearena/publish-alpha0762.mjs');
 const workflow=read('.github/workflows/torre2-alpha0762-publish.yml');
 const overlays=[...builder.matchAll(/\['(tools\/pokearena\/[^']+\.js)','torre2\/[^']+\.js'\]/g)]
  .map(x=>x[1]);
 assert.deepEqual(overlays,[
  'tools/pokearena/torre2-arena-move-policy.js',
  'tools/pokearena/torre2-johto-100-species.js',
  'tools/pokearena/torre2-auto-battle.js',
  'tools/pokearena/torre2-wobbuffet-native.js',
  'tools/pokearena/torre2-gen3-status.js',
  'tools/pokearena/batch24/runtime.js',
  'tools/pokearena/torre2-campaign-core.js',
  'tools/pokearena/torre2-trainer-cards.js',
  'tools/pokearena/torre2-campaign-scene.js',
  // Reviewed: identical to the built module plus playerSpriteId (Red/Leaf).
  'tools/pokearena/torre2-frlg-npc.js',
  // Reviewed: identical to the built module, restyled with the native kit.
  'tools/pokearena/torre2-battle-report.js'
 ],'Any changed or added release overlay must be reviewed explicitly');
 const pull=workflow.slice(workflow.indexOf('  pull_request:'),workflow.indexOf('  push:'));
 const push=workflow.slice(workflow.indexOf('  push:'),workflow.indexOf('  workflow_dispatch:'));
 for(const path of overlays){
  assert.ok(pull.includes("'"+path+"'"),'Missing QA trigger '+path);
  assert.ok(push.includes("'"+path+"'"),'Missing deployment trigger '+path);
 }
 assert.ok(push.includes("'tools/pokearena/publish-alpha0762.mjs'"));
 assert.ok(!push.includes("'.github/workflows/torre2-alpha0762-publish.yml'"),
  'Workflow-only changes must not republish a game release');
 assert.ok(!push.includes("'tests/alpha0713-hotfix-navigation-browser.cjs'"),
  'Test-only commits must not republish a game release');
 // The 0.71.3 pipeline must never publish on its own any more.
 const legacy=read('.github/workflows/torre2-alpha0713-hotfix-publish.yml');
 assert.ok(!/\n  push:\n/.test(legacy),'0.71.3 must not deploy on push (rollback only)');
 assert.match(legacy,/if: github\.event_name == 'workflow_dispatch' && github\.ref == 'refs\/heads\/main'/);
});
