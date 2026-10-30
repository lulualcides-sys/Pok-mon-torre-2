# Script Mestre T20 — prova real da Liga, limites e continuidade (29/10/2026)

**Estado técnico:** T20 **PARCIAL**. Há cinco vitórias consecutivas genuínas em batalhas nativas, mas **não** uma jornada completa desde Pallet sem checkpoint.

## Implementação integrada e evidência

- PR [#210](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/210) — **integrada à main** no squash `b3ede4153966cc79b747beb1704d427e6d891ad5`.
- CI [#40749103218](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40749103218) — **SUCESSO**, com unitários, `check`, `check:reuse`, captura e build Phaser, cinco chefes consecutivos e regressão Chromium.
- Teste versionado: `tests/t20-all-five-native-league-bosses-browser.cjs`. Workflow: `.github/workflows/master-t20-all-five-league-bosses.yml`.
- Primeiro e **único** checkpoint inicial de prova: Victory Road, stage 8, trainer 17, oito insígnias, seis Pokémon Kanto nível 54; **não** uma campanha normal iniciada em Pallet.
- Depois do checkpoint não há escrita de progresso/HP/XP/KO/vitória forçada. Os comandos AUTO e trocas usam controle Phaser; a cura entre chefes usa o botão Centro Pokémon. São confrontos **reais**, não resultados inseridos no save.
- Resultados do CI (segundos): **Lorelei 85, Bruno 78, Agatha 93, Lance 209, Campeão 283**; cinco vitórias, zero derrotas, stage 8→13, 5 honras da Liga, oito insígnias originais, dinheiro 24.000→30.000, `champion=true`.
- Após **cada** vitória, teste recarrega página e confirma serialização do save byte a byte. Hall da Fama também foi verificado após o Campeão.
- Suite principal de `main` após integração: [#40977593904](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40977593904) — **SUCESSO**. Pages do merge só deve ser marcado publicado mediante CI e HTTP públicos próprios.

## Nova auditoria complementar em desenvolvimento

- PR [#322](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/322): audita **Bulbasaur/Charmander/Squirtle** como iniciais ORIGINAIS; versões distintas do time do Campeão e níveis FRLG `59,57,59,59,61,63`; não confunde troca de Pokémon com inicial; combate não inicia com equipe desmaiada nem reabre após Hall da Fama.
- Testes em `tests/t20-three-starter-champion-stage-built.test.mjs`, workflow `.github/workflows/master-t20-champion-three-starters.yml`, CI [#40977896743](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40977896743). **INTEGRADO** no squash `7e253dd37f6523832db3b878166142f7b5eb5136`, [CI #40977896743](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40977896743) **SUCESSO** (unitários, build, auditoria dos três iniciais e regressão Chromium).
- Esse teste é estrutural sobre o Phaser compilado. **Não** substitui cinco batalhas reais para cada um dos três iniciais.

## Pendências reais T20

1. **Campanha natural de Pallet ao Campeão**, sem preparar stage/equipe/insígnias/vitórias. A prova atual só cobre a Liga a partir de Victory Road.
2. **T03/T05/T19 ainda parciais:** confirmar evolução, captura, PC, save e percurso do mapa por confrontos reais, sem saltos entre ginásios.
3. Testar rota de 13 treinadores antes de Brock, líderes de Misty a Giovanni, Victory Road, Liga e Hall da Fama com retomadas reais, defesa da equipe e derrota/recuperação.
4. Android físico não homologado: Chromium móvel simulado **não** é Android real. Não descrever como verificação feita.

## Restrições preservadas

- PRs de T20 aqui **somente adicionam testes**. Nenhum save real, TM, sprite, tipo, cooldown, kit original P2, mecânica de captura ou VFX foi alterado por eles.
- O **Surf está aprovado pelo usuário**, inclusive no novo catálogo de Arena. Registros históricos antigos que dizem "reprovado" não representam a aprovação atual; o índice de TM/HM da campanha ainda possui restrição técnica independente que **não foi alterada no T20**.
- Os **121 kits de Arena** já registrados e as esquivas com movimentos originais são trabalho separado; não reverter nem substituir golpes do cliente base.
- A ULT da campanha e Transform do Ditto seguem as decisões mais recentes da especificação e não fazem parte deste patch.

**Próxima execução prioritária da seção 20:** preencher com provas de batalhas naturais o intervalo **Pallet→Victory Road** sem checkpoints artificiais, preservando T03/T05, e só então chamar a campanha completa de validada.
