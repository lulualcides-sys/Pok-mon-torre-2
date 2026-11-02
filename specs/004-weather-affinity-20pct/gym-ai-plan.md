# T19 — IA dos líderes decide trocas pelo clima real (30/10/2026)

## Diagnóstico
O cálculo de dano aplica afinidade da espécie: +20% em clima favorável,
−20% em clima adverso. O seletor de trocas dos líderes consultava apenas
a tabela de tipos, não o clima visível na batalha.

## Alteração autorizada
- Integrar o mesmo estado meteorológico de batalha ao seletor tático.
- Valorizar reservas vivas que ganham vantagem climática sem piorar a
  cobertura contra o Pokémon ativo do jogador.
- Preservar o limite de **3 trocas**, intervalo de **16 segundos** e os
  critérios existentes para treinadores que não são líderes.
- Evitar forçar básico assistido contra oponente sob Fly/Bounce, respeitando
  o instante de fim da invulnerabilidade.
- Nenhum cálculo de dano, experiência, nível, RNG, save, sprite, VFX,
  recarga ou ULT recebe alteração neste lote.

## Homologação exigida
Testes unitários de clima, confronto e invulnerabilidade; captura/build
original Phaser; navegador testando decisões reais de líderes e regressão
integral. T20 Pallet→Brock segue em PR #369 com vitórias naturais.
