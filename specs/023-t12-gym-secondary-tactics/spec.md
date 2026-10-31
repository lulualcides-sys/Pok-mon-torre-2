# T12 — Líderes usam golpes secundários reais quando IA nativa fica ociosa
**Base:** main a343714b5d0e215ead337e19d0566891d6b39b71; branch isolada de T19 #403/#405 e T31 #406.
## Problema
O helper `pressureGymLeaderInput` auxilia com LMB, mas não considera RMB/Q já equipados e legalmente disponíveis. Em luta prolongada, líderes com vantagens de tipo no arsenal podem continuar usando somente o básico. Nenhum bônus oculto será permitido.
## Contrato
- Apenas líderes Kanto em combate da campanha; Arena, VS, treinadores comuns, jogador manual, selvagens e AUTO do usuário permanecem idênticos.
- Quando o leitor da CPU não escolheu ataque ou esquiva, pode acionar somente uma técnica RMB/Q **já instalada e aprovada**, com forma existente, dano >0, desbloqueio/recarga, energia, calor, alcance, alvo e imunidades Gen III respeitados.
- Seleção determinística considera dano, STAB e efetividade, priorizando golpes significativamente mais úteis que o básico; não usa E/ULT nem novos ataques, nunca força acerto nem calcula dano.
- Cast auxiliar é ritmado pelo relógio nativo, adicional ao cooldown próprio do golpe; evitar repetir status e uso de técnicas de clima sem objetivo.
- Não ativar durante intro, pausa, transições de troca/bolsa, dano iminente, HP <40%, voo/invulnerabilidade, golpe nativo, esquiva, status incapacitante.
- Preservar autoria Surge, 8 equipes, itens e limite 3 trocas, 151 movesets, VFX/sprites/saves, 20s de clima, experiência, recompensas e Pokédex.
## Critérios
Unit testes com imunidades, energia, alcançe, trava, alternância, defesa. CI: npm test/check/check:reuse, build original, Chromium cenário real e regressão Phaser. Não declarar combate natural Misty ou campanha completa por fixture.
