/**
 * Read-only, derived third-party move research audit.
 * No imports from the game, no third-party sprites/source, no filesystem effects.
 * The 165-name P2 source list is not a definitive inventory of Torre 2 runtime.
 */
export function canonicalMoveName(value) {
  if (typeof value !== 'string') return '';
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]/g, '');
}
export const EVIDENCE_TIERS = Object.freeze([
  'static-only', 'aggregate-low-confidence', 'agent-reported',
]);
export const REVIEW_ACTIONS = Object.freeze({
  PRESERVE: 'preserve-approved',
  INSPECT_NATIVE: 'inspect-existing-source',
  TEST_DEFAULT: 'test-default-in-bot',
  TEST_EDITED: 'test-after-move-edit',
  STUDY_STATIC: 'static-only-nonroster',
});
const isPlainObject = x => !!x && typeof x === 'object' && !Array.isArray(x);
const nonempty = s => typeof s === 'string' && !!s.trim();
function assert(condition, message) { if (!condition) throw new Error('PB_RESEARCH_INVALID: ' + message); }

export function validateResearchSnapshot(snapshot) {
  assert(isPlainObject(snapshot), 'snapshot must be object');
  assert(snapshot.schemaVersion === 1, 'unexpected version');
  assert(Array.isArray(snapshot.items) && snapshot.items.length > 0, 'moves missing');
  assert(isPlainObject(snapshot.counts), 'counts missing');
  const seen = new Set();
  let roster = 0, reported = 0, staticOnly = 0, low = 0;
  for (const [index, entry] of snapshot.items.entries()) {
    assert(isPlainObject(entry), 'move ' + index + ' is not an object');
    assert(nonempty(entry.name), 'missing name at ' + index);
    const id = canonicalMoveName(entry.name);
    assert(id && id === entry.id, 'mismatched id: ' + entry.name);
    assert(!seen.has(id), 'duplicate normalized move: ' + entry.name);
    seen.add(id);
    assert(EVIDENCE_TIERS.includes(entry.evidenceLevel), 'invalid evidence: ' + entry.name);
    assert(typeof entry.inPublicRoster === 'boolean', 'roster flag: ' + entry.name);
    assert(typeof entry.reportedUse === 'boolean', 'usage flag: ' + entry.name);
    assert(typeof entry.protectedInPolicy === 'boolean', 'protection flag: ' + entry.name);
    assert(entry.claimedExactVfx === false, 'unproven VFX flag: ' + entry.name);
    if (entry.reportedUse) reported++;
    if (entry.inPublicRoster) roster++; else staticOnly++;
    if (entry.evidenceLevel === 'aggregate-low-confidence') low++;
    assert(!entry.defaultMove || entry.inPublicRoster, 'default move not in roster: ' + entry.name);
    assert(!entry.reportedUse || entry.evidenceLevel !== 'static-only', 'usage has static-only level: ' + entry.name);
    assert(Array.isArray(entry.inferredCategories), 'categories not array: ' + entry.name);
    assert(Array.isArray(entry.staticIdentifiers), 'identifiers not array: ' + entry.name);
    assert(Array.isArray(entry.nearbyReferences), 'references not array: ' + entry.name);
    assert(Array.isArray(entry.sourceRunUrls), 'sources not array: ' + entry.name);
  }
  assert(snapshot.counts.names === snapshot.items.length, 'count names inconsistent');
  assert(snapshot.counts.roster === roster, 'count roster inconsistent');
  assert(snapshot.counts.staticOnly === staticOnly, 'count non-roster inconsistent');
  assert(snapshot.counts.reported === reported, 'count reported inconsistent');
  assert(snapshot.counts.lowConfidence === low, 'count low-confidence inconsistent');
  return {total: seen.size, inRoster: roster, staticOnly, reported, lowConfidence: low};
}

function policyProtectedNames(policy) {
  const protectedNames = new Set();
  for (const id of policy?.baselineMoveIds || []) {
    if (nonempty(id)) protectedNames.add(canonicalMoveName(id));
  }
  for (const [name, rule] of Object.entries(policy?.newMoves || {})) {
    if (rule?.visualApproved || rule?.review === 'user-approved' ||
        /approved/i.test(String(rule?.visualScope || ''))) {
      protectedNames.add(canonicalMoveName(name));
    }
  }
  for (const [name, rule] of Object.entries(policy?.existingNonConformant || {})) {
    if (rule?.visualApproved) protectedNames.add(canonicalMoveName(name));
  }
  return protectedNames;
}

/**
 * Cross-references evidence without deciding which attacks actually exist
 * in the live Phaser game. Source metadata and runtime are different layers.
 */
export function auditPbRanked(snapshot, nativeCatalog, policy) {
  const counters = validateResearchSnapshot(snapshot);
  assert(Array.isArray(nativeCatalog?.moves), 'native source moves missing');
  assert(isPlainObject(policy), 'reuse policy missing');
  const natives = new Map();
  for (const source of nativeCatalog.moves) {
    const key = canonicalMoveName(source.name || source.id);
    if (key) {
      assert(!natives.has(key), 'duplicate canonical source move: ' + key);
      natives.set(key, source);
    }
  }
  const protectedNames = policyProtectedNames(policy);
  const mapped = snapshot.items.map(entry => {
    const native = natives.get(entry.id);
    const protectedNow = protectedNames.has(entry.id) || entry.protectedInPolicy;
    const policyDrift = protectedNames.has(entry.id) !== entry.protectedInPolicy;
    let action;
    if (protectedNow) action = REVIEW_ACTIONS.PRESERVE;
    else if (native) action = REVIEW_ACTIONS.INSPECT_NATIVE;
    else if (!entry.inPublicRoster) action = REVIEW_ACTIONS.STUDY_STATIC;
    else if (entry.defaultMove) action = REVIEW_ACTIONS.TEST_DEFAULT;
    else action = REVIEW_ACTIONS.TEST_EDITED;
    const evidence = entry.evidenceLevel;
    // A probability or move-power estimate is intentionally NOT generated.
    const priority = (entry.inPublicRoster ? 40 : 0) +
      (entry.defaultMove ? 20 : 0) + (entry.reportedUse ? 15 : 0) +
      (entry.staticIdentifiers.length ? 5 : 0) -
      (protectedNow ? 50 : 0) - (native ? 25 : 0) -
      (evidence === 'aggregate-low-confidence' ? 10 : 0);
    return {
      ...entry,
      nativeSourceMoveIdCurrent: native?.id || null,
      policyProtectedCurrent: protectedNow,
      policyDrift,
      action,
      priority,
      confidence: evidence === 'aggregate-low-confidence' ? 'low' :
        entry.reportedUse ? 'reported-without-frames' : 'static-only',
    };
  });
  const actions = Object.fromEntries(Object.values(REVIEW_ACTIONS).map(a =>
    [a, mapped.filter(m => m.action === a).length]));
  const currentNativeMatches = mapped.filter(m => !!m.nativeSourceMoveIdCurrent).length;
  const uniqueTypes = [...new Set(mapped.map(m => m.type).filter(Boolean))].sort();
  const priorities = mapped.filter(x => x.action !== REVIEW_ACTIONS.PRESERVE)
    .sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));
  return {
    schemaVersion: 1,
    source: snapshot.origin,
    limitations: [
      'Names missing from the 165-move native source list may exist in the live Torre 2 engine.',
      'Bot action reports do not establish pixel-perfect original attack animation.',
      'Static effect labels are hints, not licences or verified hitboxes/timings.',
      'Never edit approved VFX, saves, gameplay or imported third-party assets automatically.',
    ],
    totals: {...counters, nativeSourceMoves: natives.size, currentNativeMatches,
      protected: mapped.filter(m => m.policyProtectedCurrent).length,
      policyDrift: mapped.filter(m => m.policyDrift).length},
    actions, types: uniqueTypes, priorities: priorities.map(x => x.id), moves: mapped,
  };
}

/** Stable summary for validation and CI, intentionally with no gameplay claims. */
export function summarizeAudit(report) {
  return {
    sourceMoves: report.totals.nativeSourceMoves,
    researchMoves: report.totals.total,
    rosterMoves: report.totals.inRoster,
    staticOnly: report.totals.staticOnly,
    agentReported: report.totals.reported,
    lowConfidence: report.totals.lowConfidence,
    protected: report.totals.protected,
    nativeSourceOverlap: report.totals.currentNativeMatches,
    namesForHumanReview: report.actions[REVIEW_ACTIONS.TEST_DEFAULT] +
      report.actions[REVIEW_ACTIONS.TEST_EDITED],
    protectedNeedsPreservation: report.actions[REVIEW_ACTIONS.PRESERVE],
    notes: report.limitations,
  };
}
