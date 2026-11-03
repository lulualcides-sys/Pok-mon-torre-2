import fs from 'node:fs';
import path from 'node:path';
const index=path.resolve('_site/index.html');
const game=path.resolve('_site/arena2d/index.html');
const phaser=path.resolve('_site/arena2d/lib/phaser.min.js');
for(const file of [game,phaser]){
 if(!fs.existsSync(file)||fs.statSync(file).size===0)throw Error('Homologation build missing '+file);
}
const sha=(process.env.RAILWAY_GIT_COMMIT_SHA||process.env.GITHUB_SHA||'test/homologacao-kanto-20261103').replace(/[^a-zA-Z0-9._/-]/g,'').slice(0,96);
fs.writeFileSync(index,`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta http-equiv="refresh" content="0;url=./arena2d/index.html?original=1">
<title>Pokémon Torre 2 — Teste de Homologação</title>
<script>location.replace('./arena2d/index.html?original=1'+location.hash)</script>
</head><body style="background:#111c2c;color:white;font:18px system-ui;padding:32px">
<h1>Pokémon Torre 2 — versão de teste</h1>
<p>Homologação isolada, não é o jogo oficial. Revisão: ${sha}</p>
<a style="color:#f6d77b" href="./arena2d/index.html?original=1">Abrir jogo de teste</a>
</body></html>`);
console.log('Ready: '+index+' for '+sha);
