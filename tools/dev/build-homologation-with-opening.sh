#!/usr/bin/env bash
# Isolated Vercel homologation build: generate the Phaser sandbox, not the Kanto public release.
set -euo pipefail
for attempt in 1 2 3 4; do
  if node tools/pokearena/capture-client.mjs; then break; fi
  if [[ "$attempt" -eq 4 ]]; then
    echo "Upstream client capture unavailable; refusing a stale preview." >&2
    exit 1
  fi
  sleep 4
done
node tools/pokearena/build-preview.mjs
test -s _site/arena2d/version.json
cat > _site/index.html <<'EOF'
<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Pokémon Torre 2 — Homologação Johto</title><meta http-equiv="refresh" content="0;url=arena2d/"></head><body><a href="./arena2d/">Abrir Mewtwo Training Lab</a></body></html>
EOF
echo "Homologacao isolada concluida. Jogo: /arena2d/"
