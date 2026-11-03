# T84 — Contrato de menu nativo com Personalizar

## Falha reproduzida

A PR T83 passou no Chromium por Vermilion → ROTAS → VS Seeker → Brock → Poké Mart e comprovou sprites FireRed carregados. Entretanto, a validação geral rival/cooldowns abortou em `tests/source-client-smoke.cjs:111` por um teste antigo que esperava somente cinco botões no menu principal, enquanto o cliente Phaser original atualmente expõe **seis**: `jugar`, `personalizar`, `pokedex`, `tutorial`, `ajustes`, `creditos`. O Guardião Visual já havia registrado a presença do botão `personalizar`.

## Alteração

- Atualizar a lista esperada para os seis botões atuais, sem relaxar a verificação da ordem.
- A medição real do browser revelou seis botões com \`x=320, w=260, h=24\` e \`y=[148,174,200,226,252,278]\`: sem sobreposição e com 2 unidades de intervalo. O teste antigo exigia \`h>=30\` e estava incorreto. Exigir essa geometria **exata**, preservando tamanho/posição do design aprovado; não confundir esta validação de layout com certificação de tamanho físico para toque em todos os dispositivos.
- Acrescentar o teste ao filtro de caminhos do workflow `rival-payday-validation.yml` para que futuras mudanças no contrato do menu acionem Chromium.

Esta PR é empilhada sobre o T83 e **modifica somente o teste/CI**. Nenhum comportamento, sprite, arte aprovada, botão do jogo, save ou build de produção é modificado.

## Validação

GitHub Actions Rival/Cooldowns nativo + Guardião Visual devem passar no SHA final; integrar primeiro T83 na homologação, depois T84, sem publicar `main`/GitHub Pages antes da aprovação final expressa.

## Validação adicional

- O cliente Phaser possui seis botões de menu medidos pelo Chromium: `jugar`, `personalizar`, `pokedex`, `tutorial`, `ajustes` e `creditos`; cada um mede 260 × 24 unidades e todos ficam centralizados em x=320, com y=[148,174,200,226,252,278]. A regra antiga de altura >=30 era incompatível com a implementação real.
- Os quatro elementos sociais residuais do HTML upstream têm largura e altura zero, sem interceptar o ponteiro do canvas. O teste agora reprova sobreposições clicáveis reais, não elementos inertes.
- A lista de sprites NPC carregados sob demanda para os ginásios foi ampliada por mudanças anteriores; o limite antigo de 12 texturas era incompatível com isso. O teste agora exige um teto simultâneo de 24 texturas FRLG e registra as chaves em log. Esse teto protege contra regressões, mas não substitui auditoria de memória ou FPS.

Estas atualizações são restritas ao teste; o cliente do jogo e o roteiro não foram alterados.
