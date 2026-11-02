# Pokémon Torre 2 — V5 (21/10/2026)

Apenas dois efeitos próprios alterados:

- Ice Beam: efeito fluido de gelo preservado da V4. A cada atualização do Phaser, a direção converge para a mira corrente usando o modelo de giro limitado do Chorro (Aura Storm / Hyper Beam): até 2,8 rad/s, canalização ativa durante 1,16 segundo. Ponta formada por lança facetada com duas aletas laterais animadas e partículas de gelo que avançam para além da extremidade. Sem auto-hit: o dano único só acontece se o raio direcionado atravessar o rival, e chance de congelar de 10% após acertar.
- Confuse Ray: recuperados os três pixels espectrais entrelaçados do primeiro script de 21/10/2026 (commit 2236950), com mesma velocidade e movimento, mas paleta transformada de roxo para amarelo/dourado. Mantém a verificação atual de colisão real e 85% de aplicar confusão — não se aplica 100% e não surgem órbitas modernas no alvo.
- Rock Blast e Soft-Boiled: arquivos de efeito preservados byte a byte.
- Nenhum ataque original do cliente Poké Arena 2D foi alterado.

Teste regressivo no cliente Phaser inclui direção de feixe em movimento e paleta da primeira versão de Confuse Ray.
