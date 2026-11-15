import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('every gameplay module physically overlaid into release triggers QA and publish',()=>{
 const builder=read('tools/pokearena/publish-hotfix-on-alpha0713.mjs');
 const workflow=read('.github/workflows/torre2-alpha0713-hotfix-publish.yml');
 const overlays=[...builder.matchAll(/\['(tools\/pokearena\/[^']+\.js)','torre2\/[^']+\.js'\]/g)]
  .map(x=>x[1]);
 assert.equal(overlays.length,7,'Any changed release overlay must be reviewed');
 const pull=workflow.slice(workflow.indexOf('  pull_request:'),workflow.indexOf('  push:'));
 const push=workflow.slice(workflow.indexOf('  push:'),workflow.indexOf('  workflow_dispatch:'));
 for(const path of overlays){
  assert.ok(pull.includes("'"+path+"'"),'Missing QA trigger '+path);
  assert.ok(push.includes("'"+path+"'"),'Missing deployment trigger '+path);
 }
 assert.ok(push.includes("'tools/pokearena/publish-hotfix-on-alpha0713.mjs'"));
 assert.ok(!push.includes("'.github/workflows/torre2-alpha0713-hotfix-publish.yml'"),
  'Workflow-only changes must not republish a game release');
 assert.ok(!push.includes("'tests/alpha0713-hotfix-navigation-browser.cjs'"),
  'Test-only commits must not republish a game release');
});
