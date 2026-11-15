import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('T03 and T17 use pinned release QA, not unaudited live capture loops',()=>{
 for(const filename of [
  '.github/workflows/master-t03-eevee-choices.yml',
  '.github/workflows/master-t17-shiny-single-roll.yml'
 ]){
  const flow=get(filename);
  assert.match(flow,/prepare-audited-qa\.sh/);
  assert.match(flow,/GH_TOKEN:/);
  assert.doesNotMatch(flow,/node tools\/pokearena\/capture-client\.mjs/);
  assert.doesNotMatch(flow,/npm run test:browser/);
  assert.match(flow,/node tests\/alpha0713-hotfix-navigation-browser\.cjs/);
  assert.match(flow,/node tests\/arena-johto-evolutions-browser\.cjs/);
 }
});

test('T03 and T17 keep focused functional tests in compiled native Phaser',()=>{
 const t03=get('.github/workflows/master-t03-eevee-choices.yml');
 const t17=get('.github/workflows/master-t17-shiny-single-roll.yml');
 for(const name of ['t03-eevee-branch-choice-built.test.mjs',
  't03-legacy-eevee-uid-built.test.mjs','t03-eevee-choice-ui-browser.cjs'])
  assert.ok(t03.includes(name),name);
 assert.match(t17,/t17-shiny-single-roll-built\.test\.mjs/);
});

test('audit helper refuses version, provenance and critical gameplay regressions',()=>{
 const script=get('tools/pokearena/prepare-audited-qa.sh');
 assert.match(script,/set -euo pipefail/);
 assert.match(script,/restore-audited-alpha0713\.sh site/);
 assert.match(script,/publish-hotfix-on-alpha0713\.mjs/);
 assert.match(script,/release\.patchCommit!==process\.env\.GITHUB_SHA/);
 assert.match(script,/src-5ccc174cb8/);
 assert.match(script,/assets\/pmd\/manifest\.json/);
 assert.match(script,/torre2\/batch24\/runtime\.js/);
 assert.match(script,/torre2\/campaign-core\.js/);
 assert.match(script,/rollback snapshot missing/);
 assert.doesNotMatch(script,/capture-client\.mjs/);
});
