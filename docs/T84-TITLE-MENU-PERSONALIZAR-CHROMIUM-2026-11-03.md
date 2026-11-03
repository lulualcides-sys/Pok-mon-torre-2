# T84 — Contrato de menu nativo com Personalizar

## Falha reproduzida

A PR T83 passou no Chromium por Vermilion → ROTAS → VS Seeker → Brock → Poké Mart e comprovou sprites FireRed carregados. Entretanto, a validação geral rival/cooldowns abortou em `tests/source-client-smoke.cjs:111` por um teste antigo que esperava somente cinco botões no menu principal, enquanto o cliente Phaser original atualmente expõe **seis**: `jugar`, `personalizar`, `pokedex`, `tutorial`, `ajustes`, `creditos`. O Guardião Visual já havia registrado a presença do botão `personalizar`.

## Alteração

- Atualizar a lista esperada para os seis botões atuais, sem relaxar a verificação da ordem.
- Continuar exigindo que todos estejam centralizados em x=320, com a mesma largura mínima/camadas originais, e que botões sociais invisíveis não sejam criados.
- Acrescentar o teste ao filtro de caminhos do workflow `rival-payday-validation.yml` para que futuras mudanças no contrato do menu acionem Chromium.

Esta PR é empilhada sobre o T83 e **modifica somente o teste/CI**. Nenhum comportamento, sprite, arte aprovada, botão do jogo, save ou build de produção é modificado.

## Validação

GitHub Actions Rival/Cooldowns nativo + Guardião Visual devem passar no SHA final; integrar primeiro T83 na homologação, depois T84, sem publicar `main`/GitHub Pages antes da aprovação final expressa.
