# T71 — Retorno pós-batalha sem perder o mapa aprovado

**Somente homologação** de Pokémon Torre 2. A branch `feat/t71-homologacao-retorno-batalha-checkpoint-20261103` deriva de `test/homologacao-kanto-20261103` e não pode ser publicada em `main`/GitHub Pages sem aprovação final do usuário.

## Bug verificado no código
A cena apagava incondicionalmente `__torre2ApprovedReturn` ao receber `completed`, inclusive derrota e vitória comum que mantêm a mesma etapa. Depois do relatório de batalha, o jogador caía na antiga HUD de rotas, perdendo a continuidade visual da cidade/rota aprovada. O código já tinha retorno seguro T69 para menus, mas não o usava após as batalhas.

## Correção
1. `approvedPostBattleReturnMapId` é um predicado de leitura: só devolve o último mapa se o resultado foi efetivamente confirmado e a etapa anterior é exatamente a atual, com revalidação das insígnias e demais portões T68.
2. Em `Campanha.create`, o resultado somente marca `battleOutcomeCommitted=true` após resolver/confirmar o checkpoint. Resultado obsoleto, etapa alterada, save inválido ou mapa bloqueado descartam a referência anterior.
3. A tela de relatório permanece **obrigatória** e vem antes da restauração. Ao tocar **Continuar**, a escolha pendente de evolução de Eevee tem prioridade; caso contrário, retorna à arte original já autorizada, sem executar o resolver pela segunda vez.
4. Vitória de líder/campeão que aumenta a etapa não pode usar o mapa antigo. A nova etapa e seus requisitos são decididos apenas pelo jogo nativo.

## Testes adicionados
- `tests/t71-approved-battle-return.test.mjs`: derrota válida, vitória de treinador sem avanço, avanço de ginásio/Liga, save inválido, quests e badges, política pura imutável.
- `tests/approved-map-real-browser.cjs`: cenário **controlado de derrota**, declarado como fixture e não uma luta natural. Usa o resolver existente, verifica exatamente +1 derrota sem dinheiro/vitória/insígnia, clica de verdade no botão **Continuar** desktop/mobile e confirma `vermilion-city` com hotspots ativos e sem nova escrita de save. Reinicia a cena para comprovar que o mesmo resultado não foi reaplicado.

**Limites:** os testes não simulam uma vitória real de treinador ou uma jornada completa Pallet → Elite/Sevii. Não alteram 60 WebPs, saves antigos, golpes, sprites ou recompensas. Persistem as pendências de mapas e quests documentadas na T68.

**QA obrigatório**: T41, Guardião Visual e build de homologação completos em PASS; somente depois fast-forward para branch de testes. Nunca realizar merge ou deploy em `main` até autorização final expressa.
