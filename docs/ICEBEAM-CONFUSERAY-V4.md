# V4 — Ice Beam e Confuse Ray

Data: 21/10/2026. Apenas os dois efeitos ainda não aprovados foram alterados.

**Ice Beam:** reutiliza como referência direta o desenho e dinâmica de `Chorro.pintarHaz` do Poké Arena 2D recuperado, empregado por Hyper Beam e Aura Storm: cinco camadas de feixe luminoso contínuo, bordas irregulares animadas, núcleo branco e pequenos pontos móveis. Adaptação fiel em Phaser Graphics/WebGL para azul e ciano de gelo, cristais pixelados e impacto gelado. Não é bolinha nem um trapézio quadrado. Requer acerto pela trajetória e tem 10% de chance adicional de gelo ao atingir.

**Confuse Ray:** três e somente três pequenas esferas amarelas pixeladas, juntas na trajetória de mira. Ao atingir com sucesso, verificam 85% de chance de confusão e, caso aplicada, as três esferas orbitam por 1,7 segundo acima da cabeça do alvo, acompanhando sua movimentação. Sem lasers ou chamas. Se errar ou falhar o efeito, não surge órbita.

**Preservados:** o código de Rock Blast (aprovado) e Soft-Boiled (aprovado) foi mantido byte a byte. Nenhum ataque original do Poké Arena 2D foi modificado.
