# Release Alpha 0.76.2 (19/11/2026)

O jogo publicado passa da base **Alpha 0.71.3** para a **Alpha 0.76.2** do Poké Arena 2D, por decisão do dono do projeto. Os golpes e Pokémon do cliente-base ficam idênticos ao original, e as adições do Torre 2 são preservadas.

## Como é publicado

1. O build auditado vem do workflow `pokearena-alpha0762-port.yml` da branch `port/alpha-0762-cliente` (PR #647). Detalhes em `docs/PORTA-ALPHA-0762.md` daquela branch.
2. `tools/pokearena/restore-audited-alpha0762.sh` restaura esse build. Ele usa o run, o commit e o digest fixados em `torre2-alpha0762-publish.yml`, ou a release `torre2-audited-site-alpha0762`, que é criada na primeira publicação.
3. `tools/pokearena/publish-alpha0762.mjs` aplica por cima os módulos atuais de jogabilidade da `main`. É o mesmo overlay de `publish-hotfix-on-alpha0713.mjs`: Earth Power, dificuldade regional, cartões de treinador, Wobbuffet, Scyther/Scizor, ramos do Eevee e Pokédex virtualizada.
   - O patch de preview da Arena é dispensado, porque a 0.76.2 já carrega o preview com `pedirBasicas`.
   - A árvore anterior ao overlay fica como irmã, para rollback.
4. `torre2-alpha0762-publish.yml` roda a mesma QA da 0.71.3, mais o teste dos golpes dos 11 Pokémon novos, e publica no Pages quando um push na `main` mexe nos arquivos de overlay (ou por disparo manual).

## Rollback para 0.71.3

O workflow `torre2-alpha0713-hotfix-publish.yml` continua como QA de PR. Ele **só publica por disparo manual** (`workflow_dispatch` na `main`). Para voltar à 0.71.3, basta dispará-lo.

## QA executada antes do merge (local, Chromium 1243 com WebGL)

| Teste | Resultado |
| --- | --- |
| Unitários de release da `main` (16 arquivos) | 89/89 PASS |
| `arena-johto-evolution-built`, `arena-johto-evolutions-browser`, `arena-species-kit-browser` | PASS |
| `alpha0713-hotfix-navigation-browser` (desktop e mobile), `alpha0713-performance-browser` | PASS |
| `arena-scyther-visible-sprite-browser`, `alpha0713-projectile-contact-webgl-browser` | PASS |
| `alpha0762-new-species-moves-browser` (55 golpes) | PASS |

Bug encontrado e corrigido por essa QA: o patch do controle de toque usava a variável `escena` fora do escopo na 0.76.2, o que travava a luta no celular. Corrigido nos commits `83466ee` e `6caf532` da porta (este também reserva os cards iniciais da seleção dentro do limite nativo de sprites). Build publicado: run 44451995630, commit `6caf532`.

**Não verificado:** Android físico, campanha jogada normalmente e FPS em celular real.
