# T74 — Encontros selvagens pendentes e VS Seeker

**Execução exclusiva na homologação** `test/homologacao-kanto-20261103`. Nenhuma das 60 artes aprovadas é alterada; proibido publicar em `main` ou Pages sem autorização final expressa.

## Problema concreto observado na T73

`startWildEncounter` gerava um novo encontro e salvava `pendingWild` sem primeiro conferir se já existia um encontro em andamento. Após um reload ou saída para o mapa, clicar novamente em **Procurar Pokémon** substituía o Pokémon pendente, inclusive um Shiny, consumindo novo RNG, incrementando `wildEncountersStage` e invalidando a identidade do encontro original. O validador T73 rejeitava corretamente o resultado antigo, mas não impedia a perda do encontro pelo próprio botão de busca.

## Solução

- `startWildEncounter` retorna `ok:false` com aviso para retomar se `pendingWild` já existir. Essa verificação ocorre **antes** do RNG, contadores, Pokédex e `saveCampaign`; nenhuma mutação é realizada.
- Na janela de grama alta, **PROCURAR POKÉMON** torna-se **RETOMAR ENCONTRO** quando existe um encontro válido na mesma etapa. O clique relê `readCampaign()` e chama a batalha original `enterBattle(...,true)`, sem sortear ou substituir espécie e Shiny.
- A ação continua sob as regras originais: não concede vitória, não facilita capturas, não altera taxas, equipes, Pokébolas ou saves de outros modos.
- `torre2-grass-resume` e `torre2-grass-find` são marcadores de teste nos próprios controles Phaser, sem novos botões visuais no mapa.

## QA

- `tests/t74-pending-wild-resume.test.mjs`: guarda de ausência de mutações, retomada do save, identidade do encontro T73, consumo único de ticket VS Seeker e rejeição após progresso alterado.
- `tests/approved-map-real-browser.cjs`: em **fixture controlada** de Vermilion etapa 2, o resolvedor nativo gera um Shiny forçado apenas pela sequência RNG de teste, confirma save e contador, exige que uma segunda busca não substitua o encontro, abre a janela de grama, fotografa o botão e toca/clica nele em desktop e mobile; verifica que o próprio combate recebe a espécie, Shiny e o contador salvos, com checkpoint idêntico.

**Observação:** forçar um resultado Shiny exclusivamente em testes não altera a taxa real de 1% nem representa um Shiny obtido por um jogador. Uma campanha natural completa e testes de desempenho em Android físico permanecem pendentes.

**Critério de integração:** T41, Guardião Visual e workflow de homologação desktop/mobile em PASS no commit final; atualizar somente a branch de homologação, sem merge em `main`.
