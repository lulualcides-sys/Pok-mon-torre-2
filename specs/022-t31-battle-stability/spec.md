# T31 — Estabilidade do combate, relatório de equipe e clima (31/10/2026)
## Falhas objetivas na main a343714b
- Full Restore do treinador desreferencia `actor.est` ausente, encerrando a luta com exceção.
- Ticket de item pendente com código inválido acessa `item.heal` de `undefined`; tempo NaN e estoque infinito podem disparar uso ilegítimo.
- Relatório usa índice como fallback mesmo com UIDs diferentes: troca/captura pode aparecer como evolução de outro Pokémon. Uma lista de XP malformada aborta a tela.
- Resíduo de areia com `tipos:null` lança exceção; HP máximo não finito pode virar NaN. Sol expirado ainda muda precisão de Thunder e tenta RNG até o reset.
## Aceite
- Em entradas válidas, preservar quantidade de poções, cooldown real, restauro, cura de status, Gen III e combate nativo.
- Em dados inválidos, falhar sem prêmio/XP/HP inventado, não travar a batalha e não mutar save.
- Relatório casa membro por UID estável; legado sem UID só casa por mesmo índice e mesma espécie, sem evolução fictícia.
- Clima ativo mantém duração 20 s, afinidades +/-20%, 5 ticks residuais, imunes Gen III; clima expirado tem efeitos neutros.
- Não alterar interface, arte, golpes, efeitos aprovados, slots, IA ofensiva, Arena/VS nem PRs T19 #403/#405 e T10 #381.
- Exigir testes unitários RED/GREEN, suíte `npm test`, `npm run check`, `check:reuse`, build Phaser, Chromium/guardião visual; CI e Pages por SHA antes de merge/publicação.
## Estado
Teste de regressão versionado. CI, revisão, merge e publicação não homologados até resultado das ferramentas.
