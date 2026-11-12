#!/usr/bin/env bash
# Restore the last fully tested Pages build when official live source capture
# is incomplete. Do not publish a mixed asset tree or a fictitious Alpha.
set -euo pipefail
: "$GITHUB_REPOSITORY"
: "$GH_TOKEN"
command -v gh >/dev/null || { echo 'GitHub CLI unavailable'; exit 1; }
echo "::warning::Live capture/build incomplete. Recovering last successful Pages release."
run_ids="$(gh api "repos/$GITHUB_REPOSITORY/actions/workflows/pages.yml/runs?status=success&branch=main&per_page=35" \
 --jq '.workflow_runs[] | select(.conclusion=="success" and .head_branch=="main") | .id')"
if [[ -z "$run_ids" ]]; then
 echo "::error::No tested successful Pages releases available"
 exit 1
fi
for run_id in $run_ids; do
 stage="$(mktemp -d)"
 if gh run download "$run_id" --repo "$GITHUB_REPOSITORY" \
    --name pokemon-torre-2-site-pronto --dir "$stage"; then
   if node tools/pokearena/verify-pages-site-fallback.mjs "$stage"; then
     rm -rf _site/arena2d
     mkdir -p _site
     cp -a "$stage"/. _site/
     rm -rf "$stage"
     echo "::notice::Restored tested full Phaser build from Pages run $run_id."
     echo "FALLBACK_PAGES_SOURCE_RUN=$run_id" >> "$GITHUB_ENV"
     exit 0
   fi
 fi
 echo "::warning::Run $run_id has no complete compatible saved release; trying next."
 rm -rf "$stage"
done
echo "::error::No complete previous Pages release could be restored."
exit 1
