# Guardião visual e diagnóstico — Pokémon Torre 2

Ferramentas auxiliares: **não substituem o Script Mestre, `AGENTS.md`, a política integral de golpes ou as aprovações.** Objetivo: detectar regressões e entregar evidências prontas, sem investigar repetidamente as mesmas telas.

## Duas verificações

**Rápida e bloqueante (sem build):** `node tools/dev/approved-visual-guard.mjs`. Confere o Git blob SHA de três referências estáticas existentes com `data/approved-visual-baseline.json`: insígnias FRLG, imagem de UI aprovada e fonte do logo. Arquivo ausente, vazio ou alterado falha indicando caminho. Não congela os 227 VFX, 121 kits da Arena, saves ou movesets. Para mudar uma referência intencionalmente, solicitar aprovação do usuário; atualizar hash apenas depois da revisão, nunca só para passar teste. O registro não confere licença de redistribuição.

**Phaser original no Chromium:** `node tests/visual-guard-browser.cjs` após o build já previsto. Grava capturas de título desktop, título mobile emulado, mapa e primeira batalha, validando canvas, cena, logo, cinco botões, espécie e três golpes. Usa *fixture* criada pela fábrica original de campanha, sem gerar vitórias artificiais. A prova **não** equivale a jornada Pallet→Campeão nem Android físico.

Capturas ficam em `test-evidence/visual-guard/`, e o workflow arquiva artifacts por 14 dias. Ainda **não há comparação pixel-a-pixel bloqueante de ataques animados**, porque os quadros/GPU variam e não existe baseline de tela aprovado para esses estados; os bytes de três referências estáticas são comparados automaticamente e as capturas servem como evidência e comparação de revisão.

## Diagnóstico sem retrabalho

`node tools/dev/ci-diagnostics.mjs --stage <etapa>` lê evidência emitida por testes, cria `test-evidence/visual-guard/diagnostic.json` e `diagnostic.md` com etapa, SHA, problema abreviado e caminhos de screenshots. Não transcreve saves nem logs brutos. Se o teste abortar antes de capturar imagem, o relatório deixa isso explícito.

- `.github/workflows/visual-guard.yml` verifica assets rápido nos PRs/mudanças na main; Chromium roda nos PRs/manual. Não cria agendamento horário.
- `.github/workflows/pages.yml` usa o **mesmo build** de publicação para validar assets e gerar capturas Phaser antes do deploy. Em falha, prepara diagnóstico no resumo e artifact de evidências.
- Os testes existentes de golpes, sprites, colisão, TMs e campanha continuam obrigatórios; não foram apagados nem enfraquecidos.

## Comandos

```bash
node --test tests/approved-visual-guard.test.js tests/ci-diagnostics.test.js
node tools/dev/approved-visual-guard.mjs
# Requer _site/arena2d produzido por capture-client.mjs e build-preview.mjs:
CHROME_BIN=/usr/bin/google-chrome node tests/visual-guard-browser.cjs
node tools/dev/ci-diagnostics.mjs --stage visual-check
```

Quando houver defeito, usar Superpowers para diagnóstico e Spec Kit para plano de correção; **não alterar o padrão do jogo**, não reabrir trabalhos aprovados e verificar o Pages real antes de afirmar publicado.
