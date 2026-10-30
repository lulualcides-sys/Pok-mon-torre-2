# T10/T20 — Espelho Beedrill com AUTO: pressão de golpes compatíveis

## Reprodução real
A CI T20 [#41141874165](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41141874165) venceu 12 treinadores no mesmo save de produção, capturou e evoluiu Weedle→Beedrill, depois entrou no 13º Rival. Após quatro minutos de combate NATIVO, Player Beedrill e Rival Beedrill continuavam vivos; ambos usavam Poison Sting (movimento Poison pouco efetivo contra Bug/Poison), e a luta não concluía dentro do timeout. Não houve comprovação de bug de reload, vitória ou KO.

## Alteração isolada no AUTO da campanha
- Avaliar SOMENTE golpes ofensivos já EQUIPADOS em RMB/Q, efetividade Gen III real e disponibilidade de custo/recarga.
- Se um deles tiver vantagem ofensiva substancial sobre o básico, aproximar-se para alcance natural quando seguro, sem ignorar recuo intencional ou projétil ameaçador.
- Escolher o golpe secundário somente quando o nativo não escolheu outro ataque/esquiva, alvo real está no alcance, cooldown zerado, energia adequada, sem bloqueio e sem invulnerabilidade do rival.
- Nenhum poder, dano, VFX, energia, HP, RNG, ULT, cooldown, IA dos inimigos, modo Arena ou persistência alterados.

## Gate de aceitação
Testes Node, segurança VFX/reuse, compilação Phaser, Chromium de batalha e 8 vitórias com inicial real. O teste de treze treinadores e Brock na PR #369 permanece obrigatório e separado; não homologar Brock sem evidência.
