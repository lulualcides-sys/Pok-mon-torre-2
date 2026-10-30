# T19 — Líderes de ginásio desafiadores sem trapaça

## Problema e escopo
Usuário relatou 30/10/2026 que os líderes Kanto estão fáceis. Modificar somente as **oito equipes de ginásio** na campanha, mantendo os 13 times e níveis canônicos de FireRed/LeafGreen, Surf VFX aprovado/sem HM grátis, golpes oficiais/catálogos aprovados, saves e Arena intactos. Elite Four, Campeão e treinadores normais permanecem sem mudança neste lote.

## Comportamento aceito
1. Líder avalia troca mais cedo (5s versus 8s), a cada 3s versus 4s; cooldown de troca 16s versus 20s, máximo 3 trocas; ainda respeita HP do próprio Pokémon, oponentes, cooldown, ataque ativo, itens e animação.
2. IA nativa decide todos os golpes e esquivas. Apenas quando o controlador não escolheu golpe/esquiva e há ataque básico nativo pronto, o líder pode iniciar um ataque com 1,2s de intervalo mínimo, respeitando custo de energia, recarga, calor, stun, fuga e invulnerabilidade.
3. Aproximação moderada somente quando HP >=60%, nenhum projétil hostil próximo, sem ordem de recuo da IA. Não altera velocidade/HP/dano/tempo real.
4. Até duas substituições de golpes por espécie entre HAB2/HAB3/ULT, escolhidas exclusivamente de availableMoves no nível real, com gate campaignMoveSlotReason; não duplicar nome, não mudar ataque básico, Dodge, VFX, CDs, PP, XP ou unlock TM/HM. Lt. Surge mantém as quatro técnicas aprovadas.
5. Apenas grupos identificados como gymLeader em createPartyMatch; não afeta treino, arena, wild, rival, rocket, Liga ou replays.
6. Testar 8 ginásios/32 Pokémon (na verdade quantidade real derivada da lista), suas espécies/níveis, seleção legal, regressões de cooldown, novas cenas Phaser/Chromium e build. Validar CI, guardião e navegação real antes de merge.

## Evidência e limite
Não afirmar dificuldade calibrada sem batalhas naturais com equipe equilibrada, inclusive Brock/Misty/Surge. Benchmarks e taxas de vitória dependem dos jogadores; sem reescrever resultados. Preservar script mestre, política integral de golpes e VFX aprovados. Nenhum golpe/VFX novo foi introduzido, logo o procedimento de portabilidade das quatro fontes para efeitos novos não se aplica.
