# Pokémon Torre 2 — Correções de quatro golpes novos (V2)

Apenas efeitos criados para o Torre 2. Os movimentos oficiais capturados do Poké Arena 2D, o Swift, Lovely Kiss (cinco corações), Shadow Ball, Bonemerang, Bone Club, Tri Attack e Pay Day não foram alterados.

- **Ice Beam:** projétil angular de energia gelada no estilo de Aura Sphere, núcleo facetado, quatro cristais orbitais, rastro em pixel art, mira fixa, colisão real e 10% de chance de gelo apenas no contato.
- **Rock Blast:** seis ou sete pedras em sequência, com sete silhuetas irregulares e facetas distintas. Cada uma tem trajetória, colisão e dano individual e pode errar.
- **Confuse Ray:** três chamas espectrais ondulantes em pixel art e rastro luminoso; exige colisão, com 85% de chance de confusão *após* contato válido. Não há acerto garantido.
- **Soft-Boiled:** ovo pixelado forma-se, balança, racha e abre antes de curar. Cura limitada a 30% do HP máximo, apenas ao conjurador vivo e após 0,77 segundo. Não é projétil e não precisa acertar um inimigo.

O patch usa somente Phaser 3 Graphics/WebGL; nenhum efeito aprovado foi substituído. Há testes de colisões, falhas, quantidades de pedras e cura retardada em `tests/source-client-smoke.cjs`.
