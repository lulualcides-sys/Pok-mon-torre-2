#!/usr/bin/env bash
# Recover the vetted native source from the original Actions run OR the
# permanent release archive. A missing/changed provenance fails closed.
set -euo pipefail
kind="${1:?Use: restore-audited-alpha0713.sh site|source|provenance DEST}"
dest="${2:?Destination directory required}"
case "$kind" in
 site) name='pokearena-alpha070-homologated-site'
       digest='sha256:130f60e5a9a5687d56f814fff7a92c55e3c960d48ecffe01362f7b4077507903' ;;
 source) name='current-rea-source-homolog-1'
         digest='sha256:a5e4cca1be70819338ab408d0cdf1be5d08fec46435aafa0acaf2d5b7cf5867c' ;;
 provenance) name='current-rea-provenance-homolog-1'
             digest='sha256:d9008396e9435093aabfb731e28714e58f372e257e2382d04764f927206c62ab' ;;
 *) echo "Unknown source kind $kind" >&2; exit 2 ;;
esac
repo="${GH_REPO:-${GITHUB_REPOSITORY:-lulualcides-sys/Pok-mon-torre-2}}"
run=43657903565
tag=torre2-audited-source-alpha0713-20261115
asset=torre2-audited-source-alpha0713.tar.gz
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
info="$(gh api "repos/$repo/actions/runs/$run")"
echo "$info" | jq -e '.conclusion=="success" and .head_sha=="7c89fb0e900702d03c4a9954c6d49311330ad1f7"' >/dev/null
artifacts="$(gh api "repos/$repo/actions/runs/$run/artifacts?per_page=100")"
found="$(echo "$artifacts" | jq -r --arg n "$name" --arg d "$digest" '[.artifacts[]|select(.name==$n and .expired==false and .digest==$d)]|length')"
mkdir -p "$dest"
if [[ "${TORRE2_FORCE_RELEASE:-0}" != 1 && "$found" -gt 0 ]]; then
 if gh run download "$run" --repo "$repo" --name "$name" --dir "$tmp/current"; then
  cp -a "$tmp/current/." "$dest/"
  echo "TORRE2_VERIFIED_ACTIONS_SOURCE $kind $run"
  exit 0
 fi
fi
gh release download "$tag" --repo "$repo" --pattern "$asset" --pattern "$asset.sha256" --dir "$tmp"
(cd "$tmp" && sha256sum --check "$asset.sha256")
mkdir -p "$tmp/archive"
tar -xzf "$tmp/$asset" -C "$tmp/archive"
test -s "$tmp/archive/MANIFEST.txt"
grep -Fxq 'source-run=43657903565' "$tmp/archive/MANIFEST.txt"
grep -Fxq 'source-commit=7c89fb0e900702d03c4a9954c6d49311330ad1f7' "$tmp/archive/MANIFEST.txt"
grep -Fxq "$name=$digest" "$tmp/archive/MANIFEST.txt"
test -d "$tmp/archive/$kind"
cp -a "$tmp/archive/$kind/." "$dest/"
if [[ "$kind" == site ]]; then
 test -s "$dest/arena2d/version.json"
 test -s "$dest/arena2d/rights-audit-0713.json"
elif [[ "$kind" == source ]]; then
 test "$(find "$dest" -type f | wc -l)" -ge 30
else
 test "$(find "$dest" -type f | wc -l)" -ge 1
fi
echo "TORRE2_VERIFIED_PERSISTENT_RELEASE_SOURCE $kind $tag"
