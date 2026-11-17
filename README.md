# Pokémon Torre 2 — Guia de continuidade para IAs e colaboradores

> **Documento de passagem de contexto.** Leia este arquivo antes de alterar código, abrir PR, executar captura do cliente-base ou publicar qualquer versão. Ele registra o estado conhecido em **17/11/2026**. Como branches, PRs, hashes e workflows mudam, confirme os dados vivos no GitHub antes de agir.

- **Repositório:** https://github.com/lulualcides-sys/Pok-mon-torre-2
- **Jogo publicado:** https://lulualcides-sys.github.io/Pok-mon-torre-2/
- **Arena Phaser publicada:** https://lulualcides-sys.github.io/Pok-mon-torre-2/arena2d/
- **Cliente de referência:** https://www.pokearena2d.com/
- **Issue de acompanhamento upstream:** [#615](https://github.com/lulualcides-sys/Pok-mon-torre-2/issues/615)

---

## 1. Resumo executivo — estado atual

O projeto tem duas realidades que não podem ser confundidas:

1. **Release do Torre 2:** a versão aprovada/publicada está baseada no cliente Phaser **Poké Arena 2D Alpha 0.71.3**. O último hotfix publicado foi integrado pela [PR #645](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/645), commit **`704c0d24f6d2c92371f7493271f2f6d2d9583bc8`**.
2. **Cliente upstream:** a issue [#615](https://github.com/lulualcides-sys/Pok-mon-torre-2/issues/615) registra leitura pública de `config.js` com **Alpha 0.76.1**, fingerprint HTML `src-f9adddb65f`. Isso confirma a versão declarada pelo arquivo público observado, **não** significa que o cliente 0.76.1 esteja integralmente capturado, compilado, testado ou publicado no Torre 2.

Último estado conhecido da issue #615:
- Fingerprint observado: `src-f9adddb65f`.
- Fingerprint aprovado/publicado: `src-5ccc174cb8`.
- Fingerprint do catálogo histórico: `src-43a0198bd6`.
- Alpha upstream observada: **0.76.1**.
- Alpha aprovada no Torre 2: **0.71.3**.
- Workflows de snapshot e monitor de golpes reportados como concluídos com sucesso: [snapshot #44173552333](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/44173552333) e [moves watch #44173380982](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/44173380982).
- Estado upstream: **new-fingerprint / atualização pendente de validação incremental**. Não chamar de atualização integrada.

**Regra de linguagem:** versão detectada, código capturado, assets cobertos, build concluído, teste jogável e publicação são etapas diferentes. Só declarar cada etapa quando houver evidência correspondente.

## 2. Objetivo do produto

Manter um jogo Pokémon solo com identidade visual e de combate inspirada no Poké Arena 2D, combinada com campanha própria Kanto/FireRed e progressão do Torre 2.

Prioridades:
- Combate real no motor **Phaser/WebGL** da Arena publicada.
- Campanha Kanto, ginásios, treinadores, Elite Four, captura, evolução e saves próprios.
- Compatibilidade por espécie/forma: só liberar como lutador o que tiver kit, animações e recursos gráficos utilizáveis.
- Implementar diferenças upstream úteis de modo incremental e independente, sem assumir que metadados equivalem a comportamento jogável.
- Manter controles, desempenho e QA desktop/mobile.

O projeto é de fã e não oficial. Não presumir que a licença de um sprite individual autoriza redistribuir código, áudio, imagens ou pacotes de terceiros. Respeitar licenças e atribuições.

## 3. Regras invioláveis para qualquer IA

### Segurança de código e publicação
- **Não fazer push/merge direto na `main` nem publicar GitHub Pages sem autorização expressa do proprietário para aquela publicação.**
- Trabalhar em branch nova baseada no HEAD atual correto. Para trabalho experimental/upstream, usar a branch de homologação indicada na seção 5 somente após conferir seu HEAD e sua divergência em relação à main.
- Criar PR como **DRAFT**; não marcar como pronta nem mesclar sem autorização e gates completos.
- Nunca fazer force-push ou sobrescrever branch/PR de outra frente sem entender o estado e preservar o trabalho.
- Não criar commits vazios, PR duplicada, catálogo duplicado ou alteração documental que alegue integração inexistente.
- Não remover rollback, pacote de release, testes, Guardião ou gates para fazer CI ficar verde.
- Não confundir sucesso de monitoramento com sucesso de build, nem sucesso de teste isolado com publicação.

### Cliente-base e propriedade intelectual
- REA é a ferramenta prioritária para inspecionar **somente arquivos e funcionalidades publicamente acessíveis** do Poké Arena 2D, quando disponível e permitido.
- Primeiro conferir HTML/index, `config.js`, `VERSION`, fingerprint `src-*` e hashes de manifesto. O hash `src-*` identifica um conjunto de arquivos; **não é o número da Alpha**.
- Se fingerprints e hashes não mudaram, não repetir captura completa. Fazer comparação incremental.
- Usar navegador Chromium normal/CDP/REA e caminhos públicos legítimos. **Não contornar HTTP 403/401, autenticação, paywall, proteção, CORS ou bloqueios do servidor.** Registrar o erro real e continuar no backlog próprio.
- Não copiar código, spritesheets, imagens, áudio ou outros ativos sem licença/permissão compatível. Preferir implementação própria do comportamento e arte original/licenciada.
- Distinguir explicitamente: (a) confirmado em fonte pública; (b) catalogado/protótipo; (c) implementado no código; (d) jogável e testado; (e) publicado.

### Preservação do jogo
- Não alterar funcionalidades aprovadas do cliente-base sem motivo comprovado e escopo explícito.
- Preservar campanha, saves, seleção, Pokédex, roster, sprites, animações, golpes e VFX aprovados.
- Não substituir um golpe/efeito aprovado por outro inferior ou duplicado.
- Não alterar a frente independente **Slash**, automação **T67+ / mapas**, Astra, 60 artes/mapas, saves ou PRs paralelas sem autorização específica.
- Mudanças de combate devem preservar dano, precisão, colisão, KO, cooldown, slots, IA e modos que não fazem parte do escopo.
- Não declarar um Pokémon jogável se faltar qualquer componente obrigatório: entrada de roster, kit funcional, animações/texture carregáveis e seleção/combate reais.

## 4. Arquitetura e fontes de verdade

O repositório contém histórico e mais de uma geração de laboratório. A raiz ainda possui arquivos/documentação antigos de PixiJS e versões experimentais. **Não use o README antigo, `package.json` ou laboratório Pixi isoladamente como prova da versão do jogo publicado.**

Fontes para orientar a investigação:
- `/arena2d/`: aplicação Phaser publicada.
- `tools/pokearena/`: ferramentas de captura, transformação, catálogo, build e validação do cliente de referência.
- `tests/`: testes unitários e testes reais de navegador/Phaser.
- `.github/workflows/`: CI, Guardião, captura REA, validação e publicação.
- `data/`: catálogos e diferenças estruturadas; dados catalogados não significam que o conteúdo está equipado.
- `docs/`: contratos, auditorias e relatórios históricos. Conferir data, SHA e estado antes de confiar.
- `assets/`: recursos locais; conferir créditos/licença e proveniência antes de reutilizar.

Comandos registrados em `package.json` (verifique scripts atuais antes de executar):
- `npm test` — testes Node.
- `npm run check` — checagem sintática de módulos legados.
- `npm run test:browser` — conjunto de testes Playwright/Chromium.
- `npm run check:reuse` — política de reuso/duplicação de golpes.
- `npm run test:campaign` — testes de navegador da campanha.

O pacote npm ainda descreve uma base PixiJS antiga; isso não invalida o motor Phaser publicado, mas exige que a IA identifique o workflow/build efetivamente usado pelo release antes de escolher comandos.

## 5. Branches, PRs e trabalho em andamento

### Release principal
- `main` no checkpoint: **`704c0d24f6d2c92371f7493271f2f6d2d9583bc8`**.
- Último patch: [PR #645](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/645), merged em 16/11/2026.
- O patch condiciona impacto visual de projéteis à confirmação de acerto real e dano positivo no runtime Batch24. Não altera o renderer aprovado nem o golpe Twister.
- A PR #645 informa que os gates nativos, Chromium/Phaser e Guardião passaram. Consulte os checks e o Pages atual antes de qualquer nova publicação.

### Homologação histórica
- Branch: `test/homologacao-kanto-20261103`.
- HEAD de referência em vários PRs antigos: `cff457edf879772a9a1b16901463889c2376bce0`.
- Essa branch está muito atrás da main em alguns pontos. **Não assumir que é base atualizada**. Antes de usá-la, buscar o HEAD real, comparar com main e não tentar merge amplo/cherry-pick cego.

### PRs abertas relevantes no último levantamento
- [#644 — impactos confirmados em projéteis Batch24](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/644): DRAFT, branch `fix/pokearena-projectile-contact-proof-20261116`, head `72d9b043b78341189d4401daea3c8936d6b3e6a2`, base homologação antiga. A correção equivalente mínima já foi portada e publicada na main pela #645. Tratar #644 como histórico/experimento; não mesclar sobre main nem duplicar seu patch.
- [#625 — Electro Ball/Raichu Alpha 0.70](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/625): DRAFT, baseado na homologação antiga. Protótipo próprio de Arena; não é cliente 0.70 integral nem release publicado.
- [#626 — integração seletiva Alpha 0.70 na main](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/626): DRAFT e reportada como não mergeável no último levantamento. Não mesclar; revisar divergência e gates antes de qualquer ação.
- Consulte PRs recentes e checks no GitHub; esta lista é um snapshot, não inventário garantido de todas as branches abertas.

## 6. Próximas prioridades técnicas

1. **Validar a Alpha upstream 0.76.1:** conferir novamente `config.js`, `VERSION`, fingerprint e hashes públicos via REA/Chromium autorizado. A issue #615 registra o novo fingerprint; fazer diff incremental em relação à fonte 0.71.3 aprovada.
2. **Resolver cobertura de build com honestidade:** verificar manifesto PMD e pacotes gráficos exigidos. O histórico registra bloqueios HTTP 403 para `assets/pmd/manifest.json` e outros packs. Não dispensar sprites de combate, inventar PNG nem declarar cobertura completa sem arquivos reais e hashes.
3. **Continuar lote funcional próprio:** enquanto a captura upstream estiver incompleta, escolher uma diferença comprovada ou backlog de combate com impacto real; implementar em branch isolada e testar.
4. **Reconciliar PRs antigas:** #644/#625/#626 são baseadas em homologação antiga. Não aplicar sem comparação de diff e preservação dos commits posteriores da main.
5. **Validar release somente com gates reais:** Node, build Phaser, Chromium/WebGL desktop e mobile, Pokédex/seleção, batalha, saves, Guardião e checks de publicação. Registrar o que não rodou e por quê.

## 7. Processo recomendado para cada execução de IA

1. Ler este README e verificar data/hora atual.
2. Consultar estado real de `main`, branch de homologação, PRs abertas, issue #615 e workflows relevantes.
3. Identificar o objetivo da tarefa e os arquivos mínimos que o implementam. Não fazer varredura completa sem necessidade.
4. Para upstream: ler primeiro HTML/fingerprint e `config.js`; comparar hashes. Capturar apenas arquivos públicos alterados e necessários.
5. Classificar cada achado como **oficial confirmado**, **catalogado**, **protótipo**, **jogável/testado** ou **publicado**.
6. Preferir uma entrega funcional pequena a mais um relatório sem alteração, quando houver backlog seguro.
7. Criar branch nova no HEAD adequado, implementar, adicionar testes de regressão e executar os gates proporcionais.
8. Abrir PR DRAFT com resumo, base SHA, head SHA, testes PASS/FAIL/BLOCKED, evidências e riscos.
9. Não mesclar nem publicar sem aprovação expressa e validação integral. Se houver bloqueio externo, documentar status HTTP/arquivo/workflow e avançar em trabalho independente seguro.

## 8. Formato obrigatório de relatório da IA

Ao concluir uma rodada, informar:
- **Fonte/versão upstream:** Alpha, `src-*`, URL de `config.js`, SHA/hash e data da evidência.
- **Alterações de código:** arquivos, comportamento, espécie/modo afetados e commit SHA.
- **Classificação:** catalogado / protótipo / implementado / jogável testado / publicado.
- **Testes:** comando ou workflow, resultado e link; identificar explicitamente testes bloqueados ou não executados.
- **GitHub:** branch, PR, base SHA, head SHA e status dos checks.
- **Preservação/regressões:** saves, campanha, VFX, mapas, sprites e demais frentes afetadas ou não afetadas.
- **Pendências:** impedimento concreto, responsável externo quando aplicável e próxima ação.

Não escrever “concluído”, “integrado”, “jogável” ou “publicado” sem a evidência específica dessa afirmação.

## 9. Histórico e documentação

Este README substitui as descrições antigas e contraditórias da raiz como **ponto inicial de contexto**; não apaga documentos históricos. Ao encontrar divergência, dê prioridade aos dados vivos do GitHub, aos arquivos executáveis e aos workflows atuais, registrando o conflito em vez de escolher silenciosamente uma versão antiga.

Documentos e catálogos históricos devem ser consultados por assunto e SHA, não tratados como estado atual automaticamente. Atualize este README quando houver mudança material de release, arquitetura, regras de segurança ou prioridades; evite editar a cada commit trivial.

---

**Última revisão:** 17/11/2026.  
**Base desta revisão:** main `704c0d24f6d2c92371f7493271f2f6d2d9583bc8`, issue #615 e metadados de PRs consultados nesta data.  
**Esta alteração é documentação apenas:** não muda código do jogo, artefatos, versão, Pages ou workflows.
