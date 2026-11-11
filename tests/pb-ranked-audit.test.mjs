import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditPbRanked, canonicalMoveName, validateResearchSnapshot,
  summarizeAudit, REVIEW_ACTIONS} from '../tools/dev/pb-ranked-audit-core.mjs';

const file = path => JSON.parse(fs.readFileSync(new URL('../' + path, import.meta.url),'utf8'));
const research = file('reference-library/pb-ranked/derived-move-index.json');
const native = file('data/pokearena2d-source-moves.json');
const policy = file('data/move-reuse-policy.json');

test('source snapshot is exactly 283 distinct names with grounded evidence flags', () => {
  const x=validateResearchSnapshot(research);
  assert.equal(x.total,283);
  assert.equal(x.inRoster,245);
  assert.equal(x.staticOnly,38);
  assert.equal(x.reported,70);
  assert.equal(x.lowConfidence,10);
  assert.equal(new Set(research.items.map(x=>x.id)).size,283);
  assert.ok(research.items.every(x=>x.claimedExactVfx===false));
});
test('canonicalization preserves aliases, avoids punctuation false negatives', () => {
  assert.equal(canonicalMoveName('  Thunder-Punch  '),'thunderpunch');
  assert.equal(canonicalMoveName('Thunder Punch'),'thunderpunch');
  assert.equal(canonicalMoveName('Água / Jet'),'aguajet');
  assert.equal(canonicalMoveName(null),'');
});
test('reconciles current native source without falsely marking absent moves as unimplemented', () => {
  const report=auditPbRanked(research,native,policy);
  assert.equal(report.moves.length,283);
  assert.equal(report.totals.currentNativeMatches,93);
  assert.equal(report.totals.nativeSourceMoves,165);
  const overlap=report.moves.find(x=>x.name==='Acrobatics');
  assert.equal(overlap.nativeSourceMoveIdCurrent,'acrobatics');
  assert.equal(overlap.action,REVIEW_ACTIONS.INSPECT_NATIVE);
  const nonNative=report.moves.find(x=>x.name==='Air Slash');
  assert.equal(nonNative.nativeSourceMoveIdCurrent,null);
  assert.notEqual(nonNative.action,REVIEW_ACTIONS.PRESERVE);
  assert.ok(report.limitations.some(x=>x.includes('may exist in the live')));
});
test('approved and baseline movements always block automatic changes', () => {
  const report=auditPbRanked(research,native,policy);
  const approved=['Fire Punch','Thunder Punch','Ice Punch','Flash Cannon','Surf','Swift','Shadow Ball'];
  for(const name of approved){
    const move=report.moves.find(m=>m.name===name);
    assert.ok(move, name);
    assert.equal(move.action,REVIEW_ACTIONS.PRESERVE,name);
    assert.equal(move.policyProtectedCurrent,true,name);
  }
  assert.ok(report.totals.protected>=45);
});
test('roster and static-only never imply gameplay confirmation', () => {
  const report=auditPbRanked(research,native,policy);
  const staticOnly=report.moves.filter(x=>!x.inPublicRoster);
  assert.equal(staticOnly.length,38);
  assert.ok(report.moves.every(x=>x.claimedExactVfx===false));
  assert.ok(staticOnly.every(x=> !x.defaultMove));
  const low=report.moves.filter(x=>x.confidence==='low');
  assert.equal(low.length,10);
  assert.ok(low.every(x=>x.reportedUse));
});
test('snapshot counts and duplicates are validated; no silent changes', () => {
  const clone=structuredClone(research);
  clone.items[2].id=clone.items[1].id;
  assert.throws(()=>validateResearchSnapshot(clone),/mismatched id/);
  const dup=structuredClone(research);
  dup.items[1].name=dup.items[0].name;
  dup.items[1].id=dup.items[0].id;
  assert.throws(()=>validateResearchSnapshot(dup),/duplicate normalized move/);
  const missing=structuredClone(research);
  missing.items[0].claimedExactVfx=true;
  assert.throws(()=>validateResearchSnapshot(missing),/unproven VFX flag/);
  const invalid=structuredClone(research);
  invalid.counts.reported=999;
  assert.throws(()=>validateResearchSnapshot(invalid),/count reported inconsistent/);
});
test('policy drift remains protected rather than overwriting approved effects', () => {
  const modified=structuredClone(research);
  const entry=modified.items.find(x=>x.name==='Flash Cannon');
  entry.protectedInPolicy=false;
  const report=auditPbRanked(modified,native,policy);
  const flash=report.moves.find(x=>x.name==='Flash Cannon');
  assert.equal(flash.policyProtectedCurrent,true);
  assert.equal(flash.policyDrift,true);
  assert.equal(flash.action,REVIEW_ACTIONS.PRESERVE);
});
test('caller-owned data is not modified and audit is deterministic', () => {
  const a=JSON.stringify(research),b=JSON.stringify(native),c=JSON.stringify(policy);
  const first=auditPbRanked(research,native,policy),second=auditPbRanked(research,native,policy);
  assert.deepEqual(summarizeAudit(first),summarizeAudit(second));
  assert.equal(JSON.stringify(research),a);
  assert.equal(JSON.stringify(native),b);
  assert.equal(JSON.stringify(policy),c);
  assert.equal(first.actions[REVIEW_ACTIONS.PRESERVE],first.totals.protected);
  assert.equal(Object.values(first.actions).reduce((n,x)=>n+x,0),283);
});
