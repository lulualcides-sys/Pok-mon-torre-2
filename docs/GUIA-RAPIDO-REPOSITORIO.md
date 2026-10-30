# Guia rápido — Pokémon Torre 2 (índice, não nova especificação)

Objetivo: permitir que o agente leia **somente os arquivos necessários para o patch**, sem mudar a estrutura de importações do jogo. Este índice é informativo; as regras obrigatórias continuam em `AGENTS.md` e nos documentos ligados.

## Onde encontrar cada sistema

| Assunto | Código / teste inicial | Regras e detalhes |
| --- | --- | --- |
| Campanha, salvamento, ginásios, insígnias e TMs | `tools/pokearena/torre2-campaign-core.js`, `torre2-campaign-scene.js`, `torre2-route-data.js`; `tests/campaign-awards-built.test.mjs` | `docs/CONTRATO_CAMPANHA.md`, `docs/PATCH-MESTRE-2026-10-24.md` |
| Golpes iniciais nível 5 e ULT nível 8 | `tools/pokearena/torre2-kanto-intro-moves.js`; `tests/kanto-intro-moves.test.js`, `tests/kanto-intro-touch-browser.cjs` | `docs/PATCH-MESTRE-2026-10-24.md` |
| Tipos, status e clima | `tools/pokearena/torre2-gen3-types.js`, `torre2-gen3-status.js`, `torre2-weather.js`; `tests/gen3-types.test.js`, `tests/gen3-status.test.js`, `tests/weather.test.js` | `docs/PATCH-MESTRE-2026-10-24.md` |
| IA e revanches | `tools/pokearena/torre2-trainer-strategy.js`, `torre2-rematch-policy.js`; `tests/trainer-strategy.test.js`, `tests/rematch-policy.test.js` | `docs/PATCH-MESTRE-2026-10-24.md` |
| Captura, Pokébolas, equipe e PC | `tools/pokearena/torre2-capture-mechanics.js`, `torre2-ball-choreography.js`, `torre2-party-battle.js`; `tests/ball-choreography-browser.cjs` | `docs/POKEBALL-PATCH-2026-10-23.md` |
| Pokédex, evoluções e golpes por espécie | `tools/pokearena/torre2-frlg-learnsets.js`, `torre2-evolution-kits.js`, `torre2-pokedex-pages.mjs`; `tests/pokedex-upstream-layout.test.js` | `docs/KANTO-151-POKEDEX-2026-10-23.md` |
| Interface e mapas | `tools/pokearena/torre2-kanto-world-map.js`, `torre2-campaign-map-unified.js`, `torre2-campaign-art.js` | `docs/CAMPANHA-UI-REVISAO.md`, `docs/REFERENCIAS-FIRERED-MAPA.md` |
| Efeitos novos em pixel art | `tools/pokearena/torre2-*-fx.js`, `data/move-reuse-policy.json`, `tests/move-reuse-policy.test.js` | **Ler obrigatoriamente** `docs/agentes/POLITICA-GOLPES-INTEGRAL.md` e `docs/FICHA-REAPROVEITAMENTO-4-FONTES.md` |
| Cliente e geração de páginas | `tools/pokearena/capture-client.mjs`, `tools/pokearena/build-preview.mjs`, `tools/pokearena/torre2-selection-pages.mjs` | `docs/REA-IMPLEMENTACAO-INTEGRAL.md` |
| CI e publicação | `.github/workflows/ci.yml`, `.github/workflows/pages.yml`; `package.json` | `docs/ECONOMIA-DE-CONTEXTO-ASTRA.md` |
| Guardião visual/diagnóstico | `tools/dev/approved-visual-guard.mjs`, `ci-diagnostics.mjs`; `tests/visual-guard-browser.cjs`; `.github/workflows/visual-guard.yml` | `docs/guardiao-visual.md`, `data/approved-visual-baseline.json`; apenas suporte ao Script Mestre |

Todos os caminhos sem prefixo na coluna «Código» permanecem em `tools/pokearena/`. A tabela **não substitui** as dependências reais e pode ficar desatualizada; conferir o código sempre que houver alteração relevante.

## Fluxo para um patch

1. Identificar a área pela tabela; ler apenas o módulo-alvo, seus imports/dependências, testes e documentação obrigatória da área.
2. Checar o HEAD e trabalhar numa branch isolada se houver outro agente alterando a branch principal.
3. Fazer diff pequeno; não reordenar importações nem mover módulos só para 'arrumar pastas'.
4. Rodar teste focado: `node tools/dev/testes-focados.mjs --list` e `node tools/dev/testes-focados.mjs <area>`.
5. Antes do merge/publicação, executar a suíte **completa** necessária no pipeline real e confirmar a publicação no navegador; teste focado nunca substitui CI.
6. Relatar commit, escopo alterado, testes executados, publicação verificada ou pendente e riscos.

## Organização segura

- `docs/` contém relatórios históricos e contratos; não renomear documentação antiga à força.
- `tools/pokearena/` contém módulos com caminhos usados pelo build; **não mover pastas ou arquivos** sem ajustar referências e testar.
- `tests/` contém testes de unidade, integração com build e navegação; não confundir uma execução unitária com uma partida normal.
- `data/` guarda catálogos e proveniência; preservar registros e licenças.
- `reference-assets/` e `reference-library/` não devem ser limpos ou distribuídos sem revisão de uso/licença.

> Índice criado para reduzir buscas repetidas. Nenhum arquivo de execução foi movido.
