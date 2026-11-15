# Torre 2 — manutenção e atualização segura (15/11/2026)

## Fonte de verdade

- Jogo publicado antes desta PR: **Alpha 0.71.3**, commit de publicação `c45c8e42c91012abf87d8bb5e2715573f8190f38`, módulo `src-c84fbc99d6`; conferir novamente `https://lulualcides-sys.github.io/Pok-mon-torre-2/RELEASE-0713-HOTFIX.json` e `/arena2d/version.json` antes de promover outra versão.
- Artefato auditado imutável: Release `torre2-audited-source-alpha0713-20261115`; restaurador `tools/pokearena/restore-audited-alpha0713.sh` valida *proveniência, run, SHA e digest*. **Não equivale a captura nova nem prova uma Alpha mais recente**.
- Montagem da versão aprovada: `tools/pokearena/publish-hotfix-on-alpha0713.mjs`. Este overlay exige assinatura estrutural dos módulos, dados de PMD, sprites de combate e cópia de rollback.
- A PR #637 já publicou correções seletivas (Earth Power multi-alvo com impacto real e dificuldade Kanto); os scripts de manutenção não devem removê-las.

## Dois fluxos que não podem ser confundidos

| Fluxo | Entrada | Resultado aceito | Bloqueio |
| --- | --- | --- | --- |
| **QA da versão publicada** | Release auditada 0.71.3 + patch do HEAD | Testes de save/IA/combate e Chromium sobre a versão exata | Falhar se artifact, SHA, `VERSION`, manifest, sprites ou scripts divergirem |
| **Captura de nova versão externa** | Página oficial, `config.js`, `src-*` e manifest atuais | Nova origem **completa**, documentação de direitos, teste real e novo archive auditado | HTTP 403/404 ou recurso ausente: registrar **bloqueado** e manter versão publicada, nunca substituir por conteúdo inventado |

### Falhas antigas identificadas

- **T03 (Eevee)**: workflow antigo `master-t03-eevee-choices.yml` repetia `capture-client.mjs` e interrompia o teste por causa do manifesto PMD ausente na origem. Na PR #638 a mesma lógica de save e a UI Phaser passam a executar sobre a release original auditada, com todos os sprites já instalados.
- **T17 (Shiny)**: `master-t17-shiny-single-roll.yml` tinha o mesmo bloqueio. Na PR #638, mantém testes determinísticos de rolagem única, persistência, PC e falha de gravação, com regressão de navegação 0.71.3.
- **Captura REA da main**: último run anterior à PR #638 com falha: `43747414224` (arquivo PMD nativo indisponível). **Ainda não é captura nova concluída**. O arquivo legítimo do release resolve a *verificação da versão aprovada*, não o HTTP 403 da fonte de terceiros.
- Testes históricos escritos para antigas telas (por exemplo, menu TRAINING de outra Alpha) não podem validar a versão 0.71.3 como se tivessem a mesma interface. São substituídos por smoke da versão instalada, preservando os testes de evolução e Shiny do mesmo módulo funcional. Isso **não significa equivalência de cobertura integral**; um novo caso específico deve ser acrescentado quando houver lacuna.

## Backlog de PRs anteriores (não mesclar em lote)

| PR(s) | Escopo | Tratamento para próxima atualização |
| --- | --- | --- |
| #635–#636 | Patches de homologação antiga de Earth Power e campanha | Encerradas como substituídas pela **#637**; não reabrir/mesclar |
| #604 | Twister sem falso impacto | O arquivo `batch24/hit-impacts.js` já possui o guard `hit.landed === true` na main; ainda comprovar integração e visual real antes de encerrar o PR |
| #606 | Earth Power multi-alvo | `batch24/runtime.js` publicado inclui `batch24AreaTargets` + impact gate; auditar se há delta residual na PR antiga, sem aplicar patch antigo |
| #605, #607 | Hurricane experimental; Deoxys Speed durante ULT | DRAFTs de homologação: só portar depois de comparar fonte nativa, regras de colisão e testes, preservando Arena |
| #619, #618, #620 | Captura lazy/monitoramento | Pendentes: testar disponibilidade pública lícita; nunca declarar 403 resolvido por snapshot |
| #621, #624–#626 | League e clientes Alpha 0.69.5–0.70 | DRAFTs **anteriores** ao release 0.71.3: comparar resultado funcional, migrar apenas lacunas comprovadas |
| #601 | Laboratório Slash de VFX | **Separado**, não integrar sem aprovação dos efeitos |
| #499–#539 e demais mapas T67 | Rotas/60 imagens/Sevii e homologação | Proteger assets, hashes e saves; revisar só com diff e testes reais antes de qualquer port |

O estado **aberto** de uma PR não prova que a funcionalidade esteja ausente; a existência da função no código também não prova jogabilidade. Registrar cada etapa: `CATALOGADO`, `IMPLEMENTADO`, `TESTADO`, `PUBLICADO+SHA`. Nunca converter o primeiro estado no último.

## Critérios obrigatórios de saída de manutenção

1. Branch curta originada do SHA atual da `main` e PR DRAFT; não sobrescrever agentes em outras branches.
2. `node --test tests/maintenance-qa-route.test.js`, suíte Node, preservação de kits/arte, testes reais de colisão e Phaser desktop/mobile.
3. QA do build aprovado **e** smoke de release no browser, com relatório de saves, progressão e sprites, **sem alterar a base auditada**.
4. Se houver versão oficial nova: registrar `config.js VERSION`, `src-*`, manifest/hashes, licenças e guardar archive completo antes do port.
5. Promoção somente quando CI necessário passar e não existirem conflitos; comparar `base_sha` e `head_sha` antes do merge.
6. Após deploy, ler **publicamente** `RELEASE-0713-HOTFIX.json` (ou sucessor com prova) e `arena2d/version.json`. Confirmar SHA real igual ao merge.
7. Falha externa de captura permanece informativa/bloqueante para atualização da fonte; não impede **manter a versão já aprovada**. Nunca afirmar que todos os PRs históricos foram aplicados.

## Rotinas

- **QA atual sem downloads repetidos:** `GH_TOKEN=... GITHUB_SHA=<commit> bash tools/pokearena/prepare-audited-qa.sh` em runner GitHub limpo. O script aceita apenas a base oficial 0.71.3 auditada; uma Alpha futura exige novo rito e novo script/pin verificado.
- **T03:** `.github/workflows/master-t03-eevee-choices.yml`; **T17:** `.github/workflows/master-t17-shiny-single-roll.yml`.
- **Captura upstream independente:** monitor `.github/workflows/pokearena-upstream-watch.yml`, capturas REA próprias. Registrar o erro, não contornar acesso.
- **Guardião:** `.github/workflows/visual-guard.yml`; **deploy:** `.github/workflows/torre2-alpha0713-hotfix-publish.yml`.
- Nas próximas atualizações, começar por **este relatório**, `AGENTS.md` e `docs/GUIA-RAPIDO-REPOSITORIO.md`; atualizar o relatório com os novos resultados e remover apenas itens efetivamente resolvidos.

## Proteção automática da próxima atualização de origem

- `data/pokearena-approved-alpha.json` foi corrigido para a última versão **efetivamente implantada** (0.71.3, `src-5ccc174cb8`, commit `c45c8e42...`). O catálogo histórico `data/pokearena2d-source-moves.json` mantém seu hash de **captura própria**, sem forjar recaptura recente.
- `tools/pokearena/capture-gate.mjs` consulta somente a página pública e o `config.js` para **comparar versão oficial e fingerprint** com a release aprovada. Se ambos forem iguais, não baixa novamente centenas de sprites; se um mudou de forma verificável, a captura independente é liberada.
- Se a origem negar `config.js`, a captura é **não executada por falta de prova** e documentada em `site-capture/capture-gate.json` e no resumo do GitHub Actions. Isso é **bloqueio de origem**, jamais sucesso de atualização.
- `.github/workflows/pokearena-source-snapshot.yml` não roda mais uma captura nova em cada push da `main`; permanece o gatilho agendado diário e a verificação manual. O monitor `pokearena-upstream-watch.yml` continua de quatro em quatro horas e pode registrar incidentes.
- Tests: `tests/capture-gate-policy.test.js` bloqueia retorno ao padrão de recaptura cega ou alteração de versão sem fonte comprovada. Para aprovar uma Alpha posterior, atualizar o manifesto de aprovação **somente depois do deploy validado**, preservando o SHA antigo como rollback.

## Impedir código integrado sem ir ao Pages

- O workflow `torre2-alpha0713-hotfix-publish.yml` agora acompanha **todos os 7 arquivos de gameplay** que o publicador realmente sobrepõe (Arena, Johto, AUTO, Wobbuffet, status Gen III, Earth Power Batch24 e campanha). Uma alteração nessas fontes dispara QA no PR e, se validada/mesclada, o pipeline de publicação da Alpha auditada.
- Alterações **somente** em documentação, testes ou YAML de CI **não** disparam novo deploy do jogo. Isso evita gastar Actions e mudar o hash do jogo quando a jogabilidade está idêntica.
- `tests/release-publish-triggers.test.js` confere em cada suíte Node que a lista real de overlays e os caminhos do workflow de publicação continuam sincronizados. Se um novo módulo for adicionado ao publicador sem gatilho correspondente, a verificação falha em vez de criar uma atualização silenciosamente ausente.
- A conclusão do GitHub Actions **não substitui** ler o SHA real no CDN depois de um deploy. Nunca declarar atualização jogável apenas por merge.

## Proteção do catálogo de golpes e capturas bloqueadas (15/11 — manutenção adicional)

**Causa concreta de falha antiga:** o workflow `pokearena-native-moves-watch.yml` comparava o hash do catálogo histórico de golpes (`src-43a0198bd6`) ao site atual, concluía que precisava de captura e tentava baixar todos os PMD. O runner falhou com `Critical native PMD manifest unavailable`. A rotina de captura REA também podia tentar um download incompleto.

**Fluxo corrigido:**

- O `capture-gate.mjs` e o `catalog-preflight.mjs` consultam somente a origem pública legítima, o `config.js` oficial e o **manifesto PMD crítico** antes de tentar capturar muitos assets.
- A resposta `blocked`/HTTP 403/404 fica registrada como artefato e alerta, mas não altera catálogo, golpes, jogo ou Pages e não é confundida com uma atualização validada.
- Uma atualização efetivamente comprovada só é importada se o manifesto estiver legível e plausível; a captura completa ainda precisa provar **todos os arquivos**, direitos e QA. Não há bypass de restrição externa.
- O catálogo nativo é **metadado de pesquisa**. O workflow novo não dá mais push automático no `main`: propõe PR DRAFT separada a partir de um hash oficial verificável. Antes de integrar, comparar kits do cliente base, preservar o padrão de golpes e executar testes Chromium/Phaser.
- Os testes de rotina do catálogo usam a Alpha 0.71.3 auditada, evitando que uma falha de terceiros seja considerada regressão do jogo. Uma captura de Alpha nova **permanece pendente** se o manifesto oficial continuar inacessível.
- Testes: `node --test tests/catalog-preflight.test.mjs tests/capture-gate-policy.test.js`; histórico do último resultado antes desta manutenção: captura REA `43748682357`, catálogo `43748635712` (ambos falharam por manifesto nativo ausente).

### Falha real de descoberta corrigida

A análise de `tools/pokearena/capture-client.mjs` mostrou que a lista de arquivos vinha de um inventário REA antigo. Quando ele não continha `assets/pmd/manifest.json`, o próprio capturador **não solicitava** o manifesto e depois abortava ao tentar expandir os sprites. Isso não é prova de HTTP 403 naquele arquivo: antes, o log `Critical native PMD manifest unavailable` era ambíguo.

- `tools/pokearena/capture-critical-assets.mjs` agora injeta **exatamente uma** solicitação do manifesto oficial na frente da fila, preservando a proveniência do inventário quando já existe.
- `tools/pokearena/capture-client.mjs` usa essa fila. A validação de PNGs, importações, hashes, sprites e direitos permanece estrita: erro de leitura **ainda bloqueia** a sincronização real.
- `tests/capture-critical-assets.test.js` valida inventário antigo, ausência/duplicação de manifesto e preservação da recusa em concluir capturas incompletas.

Mesmo com o arquivo principal recuperável, outros sprites podem continuar indisponíveis no ambiente de Actions; **somente uma captura integral com QA prova que a origem nova está apta à atualização**.
