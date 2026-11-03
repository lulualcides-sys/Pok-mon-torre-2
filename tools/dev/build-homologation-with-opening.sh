#!/usr/bin/env bash
# Preview Vercel: create a playable isolated Phaser artifact.
# NEVER deploy or write to GitHub Pages/main from this script.
set -euo pipefail
node --check tools/pokearena/build-preview.mjs
node --test tests/rayquaza-mega-preview.test.js
node tools/pokearena/capture-client.mjs
node tools/pokearena/build-preview.mjs
node tests/rayquaza-mega-built.test.mjs
test -s _site/arena2d/index.html
test -s _site/arena2d/lib/phaser.min.js
cat > _site/index.html <<'EOF'
<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pokémon Torre 2 — Rayquaza e Mega (Teste)</title>
<meta http-equiv="refresh" content="0;url=./arena2d/index.html?original=1">
<script>location.replace('./arena2d/index.html?original=1'+location.hash)</script>
</head>
<body style="background:#101725;color:#fff;font:18px system-ui;padding:32px;text-align:center">
<h1>Pokémon Torre 2 — Rayquaza e Mega</h1>
<p>Versão exclusiva de homologação. Escolha JOGAR para testar Rayquaza na arena Phaser.</p>
<p><a href="./arena2d/index.html?original=1" style="color:#ffe16d">Abrir jogo de teste</a></p>
</body></html>
EOF
echo 'Homologation Rayquaza/Mega Phaser bundle verified.'
