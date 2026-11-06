#!/usr/bin/env bash
# Authorized Poké Arena source acquisition with a fail-closed GitHub Actions
# fallback. Does NOT patch native kits, download from unknown mirrors, ignore
# missing files or substitute placeholder sprites.
set -euo pipefail

if node tools/pokearena/capture-client.mjs; then
  echo "LIVE_P2_CAPTURE_SUCCESS"
  exit 0
fi

echo "::warning::Poké Arena 2D unavailable; restoring verified snapshot from authorized earlier GitHub Actions capture."
if [[ -z "${GH_TOKEN:-}" || -z "${GITHUB_REPOSITORY:-}" ]]; then
  echo "::error::No GH_TOKEN or repository identity. Cannot restore protected artifact; fail closed."
  exit 1
fi

# Pinned SOURCE artifact, not a compiled client or unverified external mirror.
# Created by source capture run on 2026-11-06; archive may expire: fail
# rather than weakening verification. Re-pin only after a fresh audited capture.
readonly RUN_ID=42195598090
readonly ARTIFACT=pokearena2d-cliente-publico-capturado
rm -rf site-capture
mkdir -p site-capture
gh run download "$RUN_ID" --repo "$GITHUB_REPOSITORY" \
  --name "$ARTIFACT" --dir site-capture
node tools/pokearena/verify-pinned-capture.mjs
echo "PINNED_P2_SOURCE_RESTORED_AND_VERIFIED"
