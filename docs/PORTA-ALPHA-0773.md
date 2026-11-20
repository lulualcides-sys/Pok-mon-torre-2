# Porta do cliente-base para a Alpha 0.77.3 (20/11/2026)

**Estado:** implementado e testado localmente e no workflow da branch. **Não publicado.**

O dono do projeto pediu em 20/11/2026: "Pode atualizar pra versão deles". Os donos do Poké Arena 2D autorizaram a captura (`docs/CAPTURA-ALPHA-0773.md`).

## Como é montado

O processo é o mesmo da 0.76.2, com uma diferença: os módulos vêm da **nossa cópia** e não do site.

1. A base de assets 0.71.3 auditada é restaurada (`restore-audited-alpha0713.sh`).
2. O release `torre2-upstream-source-alpha0773-20261120` é baixado e o `.sha256` é conferido.
3. O comando `TORRE2_UPSTREAM_ARCHIVE=<pasta> node tools/pokearena/assemble-alpha0762-capture.mjs <audited> data/alpha0773-source-modules.json` monta a base. Cada um dos 128 módulos precisa bater com o SHA-256 do pin.
4. O `build-preview.mjs` aplica as adaptações do Torre 2, tratando a 0.77.3 como a 0.76.2.
5. O workflow `.github/workflows/pokearena-alpha0773-port.yml` gera só um artefato. **Ele nunca publica.**

O site deles passou a responder 403 da Cloudflare para este servidor depois da captura. Por isso, nenhuma etapa da porta acessa o site.

## O que mudou no Torre 2

- `luchador.js` da 0.77.3 importa também `estiloFuente` de `config.js`. A âncora do Torre 2 foi reaproveitada sem alterar o import nativo (`GROWN_IMPORTS` em `torre2-alpha0762-anchors.mjs`). As outras adaptações valem sem mudança.
- **Grimer/Muk e Staryu/Starmie agora são nativos.** Arena, Pokédex e Training usam os kits nativos da 0.77.3, que não foram alterados:
  - Grimer: Poison Jab, Acid Spray, Curse, Sludge Wave e Minimize;
  - Staryu: Water Gun, Swift, Recover, Hydro Spin e Rapid Spin.
  - Os sprites são os que o Torre 2 já tinha instalado (0088, 0089, 0120 e 0121). Onde falta uma animação nativa, como o `Sleep` do Rest, o próprio cliente usa a animação substituta.
- Hoopa: o ATK psíquico perdeu `estado:"CONFUSION"` na 0.77.3. É o kit nativo, sem alteração do Torre 2.
- O botão **MENSAGENS** novo da tela de título será removido pelo publicador, como foi feito com a aba News.

## Testes executados (20/11/2026, Chromium 1243 headless, WebGL SwiftShader)

| Teste | Resultado |
| --- | --- |
| `build-preview.mjs` sobre a 0.77.3 | PASS, sem drift de adaptadores depois do ajuste do `luchador.js` |
| `approved-visual-guard.mjs` | PASS |
| `npm test` (branch da porta) | PASS 534/534 |
| `tests/source-client-smoke.cjs`: menu, Pokédex com 297 espécies, seleção, Liga, luta | PASS |
| 11 espécies novas da 0.76.2, 5 golpes cada, em luta real | PASS 55/55, 0 erros de página |
| Grimer e Staryu, 5 golpes cada, em luta real | PASS 10/10, todos com dano ou efeito |
| Android físico e campanha jogada normalmente | **não verificado** |

## Pendências

- **Imagens em `/assets` continuam 403**, por exemplo:
  - as 8 arenas dos ginásios (`assets/arenas/gimnasios/*-amplia.jpg`);
  - o fogo animado de Cinnabar (`gimnasios/vivas/`);
  - as artes do comunicado.
  - Como foi feito com as 6 folhas de VFX, essas imagens precisam ser enviadas pelos donos.
- **Músicas por import dinâmico** que não estão no pin dão 404, como já acontecia antes: `campeon`, `alto_mando`, `cerebro_*`, `zinnia` e `mewtwo`.
- **Publicar exige mais dois passos:**
  1. guardar o site desta porta como release auditado;
  2. ter um publicador 0.77.3 no `main`, equivalente a `publish-alpha0762.mjs`, que também remova o botão MENSAGENS.
