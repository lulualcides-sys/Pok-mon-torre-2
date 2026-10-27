# Controle de execução — Script Mestre Definitivo (Pokémon Torre 2)

**Atualizado em:** 27/10/2026. **Base inspecionada:** `main` @ `c705d0b84f0d85cf3a4e59d8fa0fc4b75aec964c`.  
**Especificação integral e imutável de referência:** [SCRIPT-MESTRE-DEFINITIVO-2026-10-27.md](./SCRIPT-MESTRE-DEFINITIVO-2026-10-27.md) (37 seções numeradas e 10 fases de execução — **não** 37 patches concluídos).  
**Histórico técnico precedente:** [PATCH-MESTRE-2026-10-24.md](./PATCH-MESTRE-2026-10-24.md). **Regras dos agentes:** [AGENTS.md](../AGENTS.md).

## Como interpretar este controle

- **Histórico validado:** existe relato com testes/commits anteriores; a funcionalidade **não foi reexecutada nesta atualização documental**.
- **Parcial:** parte do escopo foi codificada, mas ainda faltam integrações, casos, visual, regressões ou validação real.
- **Em PR:** alteração não integrada no `main` de referência.
- **Pendente / não auditado:** falta implementação demonstrada ou evidência suficiente. **Não presumir que está ausente do código** sem inspecionar o módulo.
- Cada atualização de linha deve citar **commit/PR**, **comando e resultado de teste**, **navegador e ambiente**, além da **pendência remanescente**. Não marcar “concluído” por haver um arquivo, teste com fixture ou passagem por 13 chefes em modo de depuração.
- Não alterar/apagar aprovações anteriores, saves ou código em andamento de outra branch. Revalidar HEAD e PRs antes de mexer em `main`.
- O Script Mestre mais recente explicita as frentes autorizadas; diante de conflito com o roadmap histórico de 21/10, preservar golpes/cliente aprovados e aplicar o novo escopo **apenas nas áreas solicitadas**, sem reorganização indiscriminada.

## Quadro por seção (evidências até o HEAD acima)

| § | Subsistema | Estado | Já identificado em histórico/commits | O que ainda exige trabalho/verificação |
|---|---|---|---|---|
| 1 | Missão e preparação | Parcial | `AGENTS.md`, índice de código, branches e backups anteriores | Revisar conflitos e HEAD a cada lote; evidenciar a versão realmente publicada |
| 2 | Captura sem mira e animação | Parcial | Lançamento automático, menu e consumo/captura descritos no patch mestre | Inspecionar todas as etapas visuais e captura em fluxo natural/celular |
| 3 | Fórmula original FRLG | Histórico validado | Taxas das 151 espécies, arredondamentos e quatro verificações registrados com testes no patch mestre | Regressão da integração mais recente, inclusive RNG natural e saves |
| 4 | FIGHT da Arena | Parcial | Paginação e FIGHT testados anteriormente; correções recentes da UI | Reproduzir no modo **Arena** e campanha, desktop/mobile, após alterações atuais |
| 5 | Tela preta após evoluir | Parcial | Corrigido atributo inválido/NaN (Raticate), nove formas verificadas | Cobertura integral das evoluções e trocas, no Phaser público |
| 6 | Identidade dos sprites | Parcial | HUD e primeiro integrante dos chefes corrigidos no histórico | Conferir espécies/formas/trocas de todas as equipes até Campeão |
| 7 | Learnsets dos 151 | Parcial | Fonte de learnsets FRLG e resolução da Pokédex já relatadas | Auditar 151 espécies nos modos, evolução, golpes exclusivos e compatibilidade de TMs |
| 8 | 4 golpes e ULT nível 8 | Parcial | Bloqueio da campanha nível 5 / ULT nível 8 já integra `AGENTS.md`; regressões citadas | Validar novos iniciais, todos os modos, evolução, save e nenhuma ULT forte antecipada |
| 9 | Tipos/STAB/crítico | Parcial | Tabela de 17 tipos e testes de combinações, STAB e burn | Fórmula final de dano e classes físico/especial com testes de jogabilidade |
| 10 | Status e Toxic | Parcial + PR | Regras base documentadas; [PR #16](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/16) do Toxic ainda aberto | Auditar VFX, timeouts, cura em batalha, Toxic e todas as transições |
| 11 | Cooldowns e IA de ataque | Parcial | Restrições descritas e correções específicas de movimentos no histórico | Auditoria por espécie/golpe dos cooldowns de ambos os lados |
| 12 | IA de troca estratégica | Parcial | Política de troca limitada para líderes e chefes no patch mestre | Partidas reais, transições, múltiplas reservas e compatibilidade mobile |
| 13 | Poções de treinadores | Parcial | Inventário por etapa, limiar de HP, atraso e intervalo relatados | Sprites/partículas e teste natural por cada líder/Elite Four |
| 14 | Clima | Parcial | Sol/chuva/areia/granizo com duração, multiplicadores e laboratório relatados | Efeitos de pixel art globais, movimentos ainda não ligados e precisão/recuperação |
| 15 | Dano residual na troca | Parcial | Limpeza de projéteis/timers e testes de troca relatados | Regressão nos golpes multi-hit, derrotas e trocas rápidas após novos VFX |
| 16 | Shiny 1% | Em PR | [PR #17](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/17) ainda aberto | Sprite canônico, persistência nas evoluções, batalha real e integração |
| 17 | Revanches | Parcial | Política de cargas, recompensa moderada e bloqueio de prêmio único relatados | Validar níveis, rotas e economia em jogo normal |
| 18 | Pokémon Center | Parcial | Cura/remoção de status e animação; correção de reaplicação de derrota `10da46d` | Fluxo sem fixtures após KO total e consistência dos saves antigos |
| 19 | Balanceamento geral | Parcial | Ajustes pontuais de HP, XP, velocidade e economia | Métricas de duração e dificuldade do início até a Liga |
| 20 | Campanha completa | Parcial | Oito batalhas naturais documentadas e correções [PR #31](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/31), [#32](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/32) integradas | [PR #30](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/30) aberta; avançar jogando de forma normal até Brock e Campeão |
| 21 | Mapa e locais | Parcial | Mapa, rotas e loja já inspecionados em relatórios | Abrir **cada local** e comprovar todos os menus e transições |
| 22 | Loja, TMs e economia | Parcial | Sete TMs compatíveis por espécie e lojas por etapa no patch mestre | Toxic de Koga (PR #16), remédios em batalha, todas as regras de consumo |
| 23 | Redesign de menus | Parcial | Sumário, Pokédex, estojo, Bolsa e BAG de batalha `e77bd4f` | Cobrir PC, mochila, mobile, acessibilidade e funcionamento real |
| 24 | Apresentação dos líderes | Parcial / não auditado | Times/HUD dos chefes e recompensas descritos | Validar apresentações visuais, falas, ás, insígnia e salvamento de cada líder |
| 25 | Estojo das insígnias | Histórico validado / integração a rever | Interface 2×4; [sprites descritos](./BADGE-SPRITES-2026-10-26.md) | Confirmar publicação/frames e transição após vitórias sem fixtures |
| 26 | Relatório de batalha | Parcial | Painel nativo relatado pelo commit `c8223fc` | Regressão de todas as recompensas, XP, insígnias e recarga sem duplicação |
| 27 | K.O. em pixel art | Pendente / não auditado | Sem evidência consolidada nesta revisão | Auditar implementação atual, efeitos, derrota de membro vs fim da luta |
| 28 | Sons e música | Pendente / não auditado | Sem evidência consolidada nesta revisão | Licenciamento, áudio do jogo, controles, persistência e testes |
| 29 | Lançamento/recolhimento | Parcial / não auditado | Animação de Pokébola documentada | Verificar sincronismo de sprites, raios, transições e bloqueio de ataques |
| 30 | Laboratório 151 | Parcial | Seleção 151 e Mewtwo 50, climas/status e isolamento do save relatados | Shiny, captura isolada e cobertura de todas as transições e VFX |
| 31 | Salvamento seguro | Parcial | Migrações e backups descritos; PR #31 corrige derrota duplicada | Verificar restauração, idempotência e integridade com saves legados |
| 32 | FPS/desempenho | Pendente / não auditado | Meta declarada de 60 FPS e builds de navegador | Medir frame-time real, memória e estabilidade no Android/desktop |
| 33 | Testes obrigatórios | Parcial | Fluxos de CI, testes de unidade/browser e verificação do `c705d0b` | Cobertura completa das 30 verificações e documentação de lacunas |
| 34 | Campanha jogada até o Campeão | **Pendente** | Testes de 13 chefes via **depuração** e 8 batalhas iniciais naturais, não equivalentes | Jogar em fluxo normal até Campeão, conferir cada batalha e save |
| 35 | 10 fases de execução | Parcial | Frentes de correção e integração em andamento | Encerrar fases com critérios objetivos, sem pular regressões |
| 36 | Preservação do projeto | Parcial (política ativa) | Proteções explícitas em `AGENTS.md` e política de golpes | Auditar alterações futuras contra aprovações e integridade dos saves |
| 37 | GitHub/publicação | Parcial (pipeline ativo) | CI e Pages da base `c705d0b` concluíram com sucesso | Para **cada patch futuro**, verificar diff, run, SHA implantado e jogo público |

## Evidências do estado de referência (27/10/2026)

- `main` analisada: `c705d0b84f0d85cf3a4e59d8fa0fc4b75aec964c` — remoção do bloqueio de cinco encontros selvagens; [PR #32](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/32).
- [CI da base: sucesso](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40573480857) e [Pages: sucesso](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/40573532116). Isso **não prova** que as 37 seções foram concluídas ou que a campanha foi jogada inteira.
- Outros commits recentes: `35bbd8f` (AUTO na campanha e velocidade alinhada à Arena), `e77bd4f` (BAG em batalha), `c8223fc` (relatório pós-batalha), `6f85d1d` (Salão da Fama), `10da46d` (derrota/Centro).
- PRs abertas na inspeção: [#30 — progressão natural da campanha](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/30), [#17 — Shiny](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/17), [#16 — Toxic de Koga](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/16). **Consultar novamente** antes de editar: essa situação pode mudar.
- Este registro é uma **auditoria documental**. **Nenhum teste local nem navegador foi executado para criar este arquivo**. A ausência de revalidação deve ser preservada explicitamente.

## Próxima sequência de trabalho recomendada

1. **Base da campanha:** inspecionar o PR #30 e os arquivos da etapa 20; reproduzir no navegador o fluxo natural, com save isolado, sem injetar vitória. Desbloquear Brock sem afetar os resultados dos oito encontros anteriores.
2. **Unificar sem sobrescrever:** revisar PRs #16 (Toxic) e #17 (Shiny) quanto a licença/VFX, casos de teste e compatibilidade; só integrar após validações e revisão da HEAD.
3. **Ampliar percurso natural:** verificar ginásios e rotas até o Campeão, coletando evidências por etapa, evolução, XP, loja, rivais e casos de derrota.
4. **Fechar sistemas parciais:** climatologia visual, status/itens em batalha, 151 movesets nas interfaces, laboratório, som e performance. Corrigir uma família de bugs por vez com testes focados.
5. **Grande patch de design e pixel art apenas após estabilidade:** manter sprites e golpes aprovados intactos; testar desktop e Android.
6. Para cada entrega: registrar `base SHA → commit SHA → testes → link CI → SHA de Pages → percurso real → pendências`. Se não houve alguma das validações, registrar "não verificado".

**Regra de continuidade:** este controle é atualizado **somente com evidências verificáveis**. Não usar a palavra "concluído" para código apenas escrito, fixtures, testes omitidos ou publicação presumida.
