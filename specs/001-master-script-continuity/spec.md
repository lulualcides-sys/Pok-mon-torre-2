# Especificação — Continuidade segura do Script Mestre com Superpowers e Spec Kit

## T19 — aceite natural Misty COMPROVADO na CI original (31/10/2026)
- Run #41194363962, job #124517430468, arquivo `t19-earned-cerulean-misty-report.json` e artefato #13041220602: 15 treinadores naturais de Cerulean, Misty, Cascata, TM03, XP e reload no Phaser, `stage=2`, `trainer=0`, `wins=42`, `losses=0`; sem alteração da seed legítima. Regressão obrigatória no código atual pós T13/T14/T24 antes de merge.

## T19 — dez treinadores Cerulean com prova nativa (31/10/2026)
- Aceite verificado no HEAD antigo: CI #41174200072 comprovou dez treinadores reais e save exportado, sem injetar progresso, com 36 vitórias acumuladas e zero derrotas. Revalidação obrigatória após sincronizar main; Misty/Cascata/TM03 fora do escopo deste lote.


## Lote T08 — limite de poder em prévias Lv5/Lv8 (31/10/2026)
**Defeito reproduzido em execução isolada do módulo da main `ce38c4c2`:** `resolveKantoIntro` reduzia `dano` para até 9/12, mas copiava `poder` Gen III 130/150 para ataques de treino Lv5 e para ULT sem assinatura. Critério: prévias dos slots LMB/RMB/Q com `poder` 0–40; ULT Lv8 com `poder` 0–60; preservar fonte, save, renderer, nível real de desbloqueio e Arena. Teste RED no commit `83106e92`; patch mínimo `110cc7d2`. CI, Chromium e Pages ainda pendentes.


## Lote T22 — ticket legado sem token (31/10/2026)
Aceite: pendência sem token positivo seguro não bloqueia o VS Seeker carregado nem concede prêmio; resultado ausente retorna falso sem lançar erro; ticket válido permanece consumível uma única vez. Sem reescrever saves, XP, TM, VFX ou gameplay.

## CONTINUIDADE VERIFICADA 31/10/2026 — PR #369 T20 integrada; Pallet→Brock comprovado
- **Código de teste integrado:** PR [#369](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/369), squash `1fcc64eb53407b535cc8919832bacbfd492c7354`. Não duplicar #369 nem reabrir o antigo bloqueio do 13º rival.
- **CI original da branch:** [#41153415212](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41153415212) **success**: build real Phaser, testes unitários e Chromium, 13 treinadores em save único iniciado com Bulbasaur Lv5, capturas genuínas de Spearow e Geodude, quatro derrotas normais e recuperação, Brock vencido, estágio 1, insígnia **Rocha** e TM **tm-rock-tomb**. Resultado final: 37 vitórias acumuladas (inclui treino selvagem), 4 derrotas, equipe Bulbasaur Lv14 / Spearow Lv14 / Geodude Lv12. Guardião visual da branch [#41153419869](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41153419869) **success**.
- **Limites essenciais:** as 13 vitórias e Brock são execução real de combate automatizado com encontros/capturas sem forçar HP/vitória; não provam controle Android físico, jornada natural Brock→Campeão, nem Pages público no novo SHA. O teste original rodou sobre a branch da PR anterior ao merge; verificar CI da main e Pages HTTP para marcar publicação. A implementação de #369 altera somente teste/workflow, não balanceamento ou golpes.
- **Próxima frente independente:** T19 continuação pós-Brock → Cerulean/Misty, verificando no mesmo save XP, capturas, evolução, equipe, insígnias/TMs sem fixtures de nível/progresso, antes de afirmar campanha integral. T07/T08 permanecem parciais; T10 #381 permanece isolada por CI vermelha.
- **Golpe pedido no chat:** Egg Bomb na campanha `cd:2.3` já integrado pela PR [#394](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/394) em `5323ac25cce7cda03ed16a221c64fca7f1be6918`; Arena/VS e VFX mantidos.


## Lote T03 — Eevee em saves legados sem UID (30/10/2026, aguardando CI)
**Falha no código da main `be1d230c`:** `pendingEeveeEvolution` expõe `uid:undefined` para Eevee Lv30 em saves v1 sem UID; `chooseEeveeEvolution` rejeita qualquer UID não string. A escolha fica bloqueada mesmo com nível legítimo. **Aceite:** token estável não mutante para Eevee legado na equipe/PC, proteção contra colisão com UIDs reais, escolha Lv30 somente, gravação atômica antes de atribuir identidade; Shiny, TM, HP, XP, Pokédex, outros membros e saves preservados. Testes são fixtures, não campanha natural; merge/Pages pendentes.


## Lote T08 — ULT preferida respeita exclusões canônicas (30/10, PR #368)

**Defeito reproduzível:** `resolveKantoIntro` aceitava `preferredSignature` instalada com dano >=6 sem aplicar as exclusões do seletor canônico, permitindo ULT `Tackle`, `Surf`, `Scratch` ou `Transform` quando passada por configuração. **Aceite:** a preferência excluída deve cair no seletor legal (no fixture Bulbasaur Lv8, `Vine Whip`); a preferência temática permitida deve continuar disponível. Não mudar o efeito Surf aprovado nem liberar HM, Scratch/Transform, alterar saves ou os 227 VFX. **Escopo:** só predicado, teste e documentação; não homologa 151 espécies nem combate natural.


## Lote 30/10 — CI pública independente contra 503 isolado

**RED observado:** workflow público independente #41091689377, versão `src-78948ecbc5`, único 503 em `/red.js`, nenhuma exceção Phaser, apesar de Pages #41090646026 verde. **Aceite:** somente falha comprovada exclusivamente por 503 no domínio oficial permite até duas novas auditorias integrais (máximo 3); todo outro erro, falta de diagnóstico, versão/slots errados ou 503 persistente falha. Nenhuma mudança no jogo, saves, VFX ou baseline.


## Lote T07/T08 — não promover VFX customizado sem aprovação (30/10/2026)
**Falha observável:** mesmo com `pendiente:false`, um renderer `source: new-phaser-fx` e `approved:false` pode entrar nos três golpes Lv5 via learnset FRLG ou servir de Struggle neutro; a preferência de ULT já tinha um gate próprio, mas o fallback não. **Aceite:** nenhum renderer customizado não aprovado entra por esses caminhos em Lv5/Lv8; os aprovados permanecem disponíveis; entradas originais não sofrem mutação. Não criar efeito nem liberar HM, Scratch ou Transform. RED real: CI #41084164169 (dois asserts falhos). Prova de 151 partidas e ULT com medidor natural permanece fora deste lote.


## Lote 30/10 — diagnóstico do boot da Pokédex pública
**Problema observável:** após Pages #41050085664 verde no SHA `477dac7410ad7a89f73dfb9a9946187cbdbca657` e versão HTTP `src-dc921f3851`, a auditoria pública integral #41050887159 falhou no `waitForFunction` da cena Pokédex (90 s), antes de criar artifact. **Aceite do lote:** em eventual timeout, salvar JSON com estado Phaser, requisições/erros, screenshot quando possível e manter CI vermelha. Não alterar runtime, saves, VFX nem reduzir o gate dos 150 Pokémon.
**Identificador:** 001-master-script-continuity
**Estado:** Em andamento — documentação de fluxo; execução das seções do Script Mestre permanece parcial
**Fonte funcional:** [Script Mestre definitivo](../../docs/SCRIPT-MESTRE-DEFINITIVO-2026-10-27.md) · [controle](../../docs/CONTROLE-EXECUCAO-SCRIPT-MESTRE.md) · [fila](../../docs/FILA-CONTINUE-SCRIPT-MESTRE.md)

## Objetivo
Tornar Superpowers + metodologia Spec Kit o padrão de **todas as futuras correções, melhorias e continuações** do Pokémon Torre 2, sem reiniciar as 37 seções nem alterar a jogabilidade para introduzir apenas o processo.

## Histórias e critérios de aceite
### US1 — Um agente recebe “continue”
Dado acesso ao projeto, quando o agente recebe “continue”, ele:
1. lê `AGENTS.md`, o índice rápido, a constituição e o trecho pertinente do Script Mestre;
2. compara HEAD/main, PRs abertas, branches concorrentes, CI e checkpoint existente;
3. escolhe a primeira pendência testável e não bloqueada;
4. desenvolve em branch isolada, produz testes e evidencia resultados;
5. atualiza fila/controle **somente após** prova verificável, preservando o histórico;
6. informa PR/SHA, gates e publicação confirmada ou não confirmada.

**Aceite:** a decisão sobre a próxima tarefa cita o checkpoint e não trata falhas, fixtures, CI inconclusa ou mero commit como homologação.

### US2 — Correção de um bug da campanha ou Arena
Dado um defeito reportado, quando o agente diagnostica:
- identifica a causa e cria/atualiza um teste que reproduz o defeito;
- corrige apenas o necessário, confere os efeitos colaterais e os aprovados;
- submete PR com checklist de testes relevantes e diagnóstico;
- não simula vitórias, medidor de ULT, loot ou evolução para parecer que corrigiu.

**Aceite:** evidências RED/GREEN (quando tecnicamente executáveis), build/CI compatíveis e ausência de regressão observada nas áreas tocadas.

### US3 — Gestão de conflito de trabalho
Dado outro agente com PR aberta no mesmo componente, quando surge nova tarefa:
- não sobrescreve a branch concorrente nem reverte melhorias aprovadas;
- evita alterações simultâneas nos mesmos arquivos; adia ou isola a tarefa;
- registra conflito e ação escolhida.

**Aceite:** PR legível, sem histórico destruído, com comportamento preservado.

## Restrições
- A constituição em `.specify/memory/constitution.md` é complemento ao `AGENTS.md` e à política integral de golpes.
- O catálogo atual de 151 Pokémon/121 kits Arena/227 VFX e os saves existentes não serão modificados para adotar o processo.
- Surf permanece aprovado; políticas de TM/HM, Scratch e Transform exigem decisões próprias, não mudanças incidentais.
- Arquivos `spec.md`, `plan.md`, `tasks.md` representam o **formato Spec Kit**; não se afirma instalação do CLI ou execução automática.
- “Superpowers instalado no ChatGPT” não garante que outro agente/runner tenha acesso a suas skills; nesse caso a disciplina é aplicada manualmente.
- Alterações de processo não provam correção de bug, vitória em Brock, publicação no Pages ou jogo completo.

## Estado observado no início do lote (2026-10-30)
- T20: [PR #329](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/329) aberta; CI [#41028820921](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41028820921) **failure** no SHA `b386d3ca6092e2847aac7649286326c9f1d642dc`. Não alterar essa branch neste lote; dono/execução concorrente em curso.
- T07/T08: resta provar disparo legítimo da ULT e sanar variação de técnicas Lv5 de Charmander sob política integral de VFX.
- Pallet→Campeão sem checkpoint e Android físico continuam sem validação integral.

## Fora de escopo deste lote
- Modificar o motor Phaser, alterar VFX/cooldowns/IA, reformular movesets e saves.
- Integrar uma PR de combate concorrente ou declarar o Script Mestre concluído.
- Publicar automaticamente no GitHub Pages apenas porque a documentação foi adicionada.

## Lote T07/T08 — aprovação Surf e gate HM (30/10/2026)
**Cenário:** Surf permanece no catálogo VFX aprovado, enquanto a campanha não concede HM Surf por nível, TM gravada sem liberação ou editor. Scratch/Transform seguem adiados.
**Aceite:** teste compilado preserva renderer e metadados Surf após consultas a Pokédex/moveset; nenhum save é reescrito; nenhum HM é liberado. Testes Chromium/CI completos antes de merge; este lote não valida ULT em combate nem Brock.


## Lote 30/10 — Pages: HTTP 503 transitório na auditoria Chromium pública

**Falha reproduzida:** Pages #41072227909, SHA main `d8b3c8b43436081e681c05ebe938e24234383750`, implantou e confirmou `src-616165d778`, mas o Chromium recebeu HTTP 503 de `/arena2d/src-616165d778/torre2/laboratory.js`, não inicializou Phaser e encerrou após 90 s. A auditoria pública independente #41072786298 no mesmo SHA foi verde. Isto evidencia intermitência de entrega, não autoriza concluir que o problema nunca ocorrerá.

**Aceite:** uma falha somente por HTTP 503 em assets do domínio público oficial, sem outros erros de runtime/requisição, permite até duas **novas auditorias completas** (máximo três execuções). Qualquer 404/500, asset de outro host, erro Phaser, diagnóstico ausente, erro de slots, versão errada ou 503 persistente mantém CI vermelha. Cada execução exige o mesmo SHA/version.json e as mesmas sete espécies; auditoria de 150 espécies permanece independente. Não mexer em código do jogo, saves, VFX ou baseline.

## T19 — aceite incremental cinco treinadores Cerulean (31/10/2026)
Partir de um save exportado por campanha natural e comprovado por SHA-256; realizar cinco lutas reais no Phaser com cura via Centro, sem fixture de vitória, HP, XP ou níveis. A prova exige cinco vitórias, nenhuma derrota ocultada, trainer=5, estágio 1, Rocha/TM39 e persistência após reload. Não afirmar Misty/Cascata até vencer a líder em teste separado.


## T31 — contrato do gate REA para TM03 (31/10/2026)
- Ao testar cliente construído, comprar Water Pulse antes de vencer Misty deve falhar; estágio 2 sem Cascata também deve falhar; estágio 2 com Cascata e dinheiro suficiente deve permitir a compra e ensino ao Squirtle.
- Aceite: preservar política atual de TM, saves, sprites, VFX e campanhas; regressão built-client e Chromium verdes no HEAD. O teste não concede insígnia a jogador real nem prova vitória sobre Misty.
