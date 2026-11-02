# Pokémon Torre 2 — Atlas aprovado: 60 mapas

Este pacote contém **60 fundos aprovados** (59 recuperados do chat + S.S. Anne enviado agora), em ordem sugerida para navegação, e não confunde essa ordem com o índice de batalha salvo.

- `assets/ui/kanto-approved-maps/{kanto,liga,sevii}/*.webp`: versões de jogo em 1280px; originais PNG são preservados no backup separado.
- `approved-maps-atlas.json`: ID, rótulo, caminho, hash da fonte, conexões geográficas e hotspots normalizados.
- `torre2-approved-maps-atlas.js`: módulo importável pelo Phaser; só metadados, não grava save.
- `approved-maps-atlas.test.mjs`: teste de 60 IDs, conexões, coordenadas e regra sem HM.
- `ORDEM-60-MAPAS.csv`: planilha de rastreabilidade por ID.

## Regra de implementação

Aprovação visual NÃO é implantação. Não alterar índices, XP, insígnias e saves. No Phaser, exibir somente a imagem da cena corrente e sobrepor em objetos separados zonas clicáveis, NPCs, Pokémon, marcadores e HUD, com `x = cx * larguraRenderizada + origemX` e `y = cy * alturaRenderizada + origemY`. Este pacote traz hotspots revisados somente para alguns mapas; os demais exigem posicionamento e teste manual antes de serem declarados jogáveis. Transições do grafo geográfico não desbloqueiam eventos nem ignoram progressão. A ordem de `ORDEM-60-MAPAS.csv` é uma organização, não o caminho obrigatório do jogador.

## Lacunas de abertura

Pallet Town, Rota 1, Viridian City, Viridian Forest e Rock Tunnel **não integram o conjunto de 60 artes desta sequência**: consultar o código/artes anteriores e validar sua aprovação antes de trocar esses mapas. Caverna dos Diglett foi pulada a pedido do usuário; não criá-la automaticamente.

## Versões específicas aprovadas

- S.S. Anne: screenshot fornecida pelo usuário em 2026-11-02.
- Silph Co.: primeira arte, **com Lapras**, como usuário escolheu.
- Blaine: arte **sem Blaine e sem Arcanine**.
- Cinnabar: segunda versão corrigida, sem grande vulcão.
- Interior da Liga: quadros vazios sem líderes; esses quadros ainda precisam ser recortados em cinco salas se forem usados separadamente.
- Elite Four e pós-jogo devem preservar a progressão de campanha, não forçar minigames de HM.

## Operação segura

Primeiro ligar o atlas sob uma rota de navegação/preview isolada; depois renderizar uma cidade e seu ginásio; depois testar clique/recuo/entrada, sprites, recompensas e salvamento. Só liberar todos os 60 mapas após validação em navegador e Android real.