# Porta do cliente-base para a Alpha 0.76.2 (19/11/2026)

**Estado: IMPLEMENTADO + TESTADO localmente e no workflow da branch. NÃO publicado.** A versão no Pages continua sendo a 0.71.3.

## O que é

O Torre 2 passa a ser montado sobre os **módulos públicos da Alpha 0.76.2** do Poké Arena 2D (`src-5bf1a1a788`), em vez da 0.71.3. A decisão do dono do projeto em 19/11/2026: golpes e Pokémon do cliente-base **idênticos** ao original. Quando um golpe tem o mesmo nome no Torre 2 e no cliente-base, vale a versão do cliente-base.

Autorização: veja `docs/CREDITOS-E-LICENCAS.md` (permissão declarada pelo dono do projeto; termos escritos ainda não anexados).

## Como é montado

1. `tools/pokearena/restore-audited-alpha0713.sh source|site`: restaura o release auditado 0.71.3, que é a base de assets.
2. `tools/pokearena/assemble-alpha0762-capture.mjs`: baixa os 114 módulos ES da 0.76.2 por GET público normal e exige o SHA-256 fixado em `data/alpha0762-source-modules.json`. Se o site mudar um arquivo, falha. Também usa o `index.html` atual com o índice de pacotes (`#paq`) da 0.71.3.
3. `tools/pokearena/build-preview.mjs` (com as ferramentas do release 0.71.3, commit `7c89fb0`) aplica as adaptações do Torre 2.
4. Workflow: `.github/workflows/pokearena-alpha0762-port.yml`. Gera só um artefato, **nunca publica**.

## O que mudou no Torre 2

- `torre2-alpha0762-anchors.mjs`: três patches do Torre 2 reancorados no código novo. São eles: pré-carregamento de abertura, `kitActual` com `this.fx` e kits em camadas com `sustituye`. O patch de preview da tela de preparação ficou dispensado, porque a 0.76.2 já usa `pedirBasicas`.
- Adaptadores `*-0713.mjs` aceitam `0.76.2` onde o código nativo é o mesmo. Variantes novas:
  - seleção na grade nativa com rolagem (`rejilla.js`), com pré-carregamento das linhas visíveis;
  - célula da Pokédex com `casillaFav`;
  - argumento `cos` (trajes) no início das lutas.
- `install-alpha0762-species-sprites.mjs`: 21 formas dos 11 Pokémon novos vêm do PMDCollab SpriteCollab (commit `bbed4cd`, CC BY-NC 4.0, com créditos), porque os pacotes do site respondem 403.
- Os assets herdados da 0.71.3 são declarados em `version.json` (`assetAlpha`/`assetSrc`). As auditorias de direitos comparam contra essa origem, sem relabelar a proveniência.
- **Stone Edge:** na 0.76.2 fica com o tempo de recarga nativo (1 s). O ajuste para 3,5 s do Torre 2 vale só para a 0.71.3.

## Novidades trazidas (0.71.3 → 0.76.2)

- **11 Pokémon:** Mime Jr./Mr. Mime, Porygon/Porygon-Z, Treecko→Sceptile, Sableye (+Mega), Chimchar→Infernape, Solosis→Reuniclus, Honedge→Aegislash, Regice, Darkrai, Zeraora e Hoopa (+Unbound).
- **42 golpes novos** nos kits nativos, entre eles Trick Room, King's Shield, Sacred Sword, Plasma Fists, Dark Void, Sheer Cold, Hyperspace Hole/Fury e Volt Switch. O Zubat ganhou Screech.
- Todos os kits nativos (`TODOS` em `datos.js`) ficam **byte a byte iguais** ao site. Os motores nativos têm prioridade em `FORMAS={...TORRE2_FORMS,<nativos>}`.

## Testes executados (19/11/2026, Chromium 1243 headless/WebGL SwiftShader)

| Teste | Resultado |
| --- | --- |
| `build-preview.mjs` sobre a 0.76.2 | PASS (sem drift de adaptadores) |
| `approved-visual-guard.mjs` | PASS |
| `npm test` | PASS 534/534 |
| `tests/source-client-smoke.cjs` (menu, Pokédex 297 espécies, seleção, Liga, luta Arena/Liga) | PASS |
| `tests/alpha0762-new-species-moves-browser.cjs` (5 slots × 11 espécies em luta real) | PASS 55/55, 0 erros de página |
| Workflow `pokearena-alpha0762-port.yml`, run 44446345210 (commit 41c01ac) | PASS em todos os passos |
| Android físico / campanha jogada normalmente | **não verificado** |

## Pendências

- **Folhas de efeito: completas.** O site responde 403 para as 6 folhas novas, e o dono do projeto enviou todas em 19/11/2026: `detect`, `xtijera`, `hojatormenta`, `hojafilo`, `punohielo` e `fuegofatuo`. Estão em `tools/pokearena/alpha0762-vfx/`, com SHA-256 e procedência em `PROVENANCE.json`, e o montador as instala em `assets/vfx/`.
- Pacotes `assets/p/*.bin` da 0.76.2 (formas e trajes novos do site) não foram obtidos (403).
- Músicas por import dinâmico (`musica/*.js`) e idiomas (`idiomas/*.js`) não estão na captura. Já faltavam no release 0.71.3 publicado.
- Telas novas da 0.76.2 que dependem de `/assets/ui/*` (ginásios, loja, molduras, campo do Gyarball) podem aparecer sem imagem.
- Publicar exige: aprovação do dono, workflow verde, e um publicador da 0.76.2 equivalente a `publish-hotfix-on-alpha0713.mjs`, com overlay dos 7 arquivos de jogabilidade da `main`.
