#!/usr/bin/env bash
# Restore the audited Torre 2 build of the Alpha 0.76.2 base client (output of
# .github/workflows/pokearena-alpha0762-port.yml, PR #647) from its pinned
# Actions artifact, or from the permanent release once it exists.
# A different run, commit or artifact digest fails closed.
set -euo pipefail
dest="${1:?Destination directory required (receives arena2d/)}"
repo="${GH_REPO:-${GITHUB_REPOSITORY:-lulualcides-sys/Pok-mon-torre-2}}"
run="${TORRE2_ALPHA0762_RUN:?pinned run id}"
commit="${TORRE2_ALPHA0762_COMMIT:?pinned port commit}"
name=torre2-alpha0762-port
digest="${TORRE2_ALPHA0762_DIGEST:?pinned artifact digest}"
tag=torre2-audited-site-alpha0762
asset=torre2-audited-site-alpha0762.tar.gz
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$dest"
if gh release view "$tag" --repo "$repo" >/dev/null 2>&1; then
 gh release download "$tag" --repo "$repo" --pattern "$asset" --pattern "$asset.sha256" --dir "$tmp"
 (cd "$tmp" && sha256sum --check "$asset.sha256")
 tar -xzf "$tmp/$asset" -C "$tmp"
 grep -Fxq "run=$run" "$tmp/MANIFEST.txt"
 grep -Fxq "commit=$commit" "$tmp/MANIFEST.txt"
 grep -Fxq "$name=$digest" "$tmp/MANIFEST.txt"
 cp -a "$tmp/site/." "$dest/"
 echo "TORRE2_ALPHA0762_FROM_RELEASE $tag"
else
 gh api "repos/$repo/actions/runs/$run" | jq -e --arg c "$commit" '.conclusion=="success" and .head_sha==$c' >/dev/null
 gh api "repos/$repo/actions/runs/$run/artifacts?per_page=100" |
  jq -e --arg n "$name" --arg d "$digest" '[.artifacts[]|select(.name==$n and .expired==false and .digest==$d)]|length==1' >/dev/null
 gh run download "$run" --repo "$repo" --name "$name" --dir "$tmp/artifact"
 test -d "$tmp/artifact/_site/arena2d"
 cp -a "$tmp/artifact/_site/." "$dest/"
 echo "TORRE2_ALPHA0762_FROM_ACTIONS $run"
fi
test -s "$dest/arena2d/version.json"
jq -e '.src=="src-5bf1a1a788"' "$dest/arena2d/version.json" >/dev/null
test -s "$dest/arena2d/lib/phaser.min.js"
test -s "$dest/arena2d/rights-audit-0713.json"
test -s "$dest/arena2d/assets/pmd/ALPHA0762-SPRITECOLLAB-CREDITS.txt"
