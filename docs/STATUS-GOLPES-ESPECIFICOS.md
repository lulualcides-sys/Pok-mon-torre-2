# Pokémon Torre 2 — Golpes específicos: controle de conclusão
Data: 21/10/2026

**Alvo deste ciclo:** apenas golpes que não possuem visual original no Poké Arena 2D. Não redesenhar originais. Nada de novas tecnologias globais nesta etapa. **17 golpes específicos aprovados, incluindo Petal Dance. Três novos golpes aguardam avaliação visual: Metronome, Absorb e X-Scissor.**

| Nome | Situação | Base técnica | Próxima ação |
|---|---|---|---|
| Bonemerang | ✅ aprovado | Golpe próprio Torre 2 | Congelar |
| Bone Club | ✅ aprovado | Golpe próprio Torre 2 | Congelar |
| Tri Attack | ✅ aprovado | Golpe próprio Torre 2 | Congelar |
| Pay Day | ✅ aprovado | Golpe próprio Torre 2 | Congelar |
| Shadow Ball | ✅ aprovado | Golpe próprio Torre 2 | Congelar |
| Ice Beam V6 | ✅ aprovado | Chorro nativo, paleta de gelo | Congelar |
| Rock Blast | ✅ aprovado | Pedras pixeladas individuais | Congelar |
| Confuse Ray amarelo | ✅ aprovado | Primeira versão das três luzes | Congelar |
| Soft-Boiled | ✅ aprovado | Ovo e cura pixelados | Congelar |
| Swift | ✅ aprovado | 7 estrelas com trajetória e colisão individuais | Congelar |
| Lovely Kiss | ✅ aprovado | Lábios e cinco corações pixelados | Congelar |
| Sing | ✅ aprovado | Notas musicais pixeladas | Congelar |
| Crabhammer | ✅ aprovado | Pinça pixelada | Congelar |
| Smog | ✅ aprovado | 17 bolhas, impactos individuais | Congelar |
| Hyper Fang | ✅ aprovado | Incisivos grandes de rato | Congelar |
| Guillotine | ✅ aprovado | Duas pinças visíveis fechando no alvo | Congelar |
| Petal Dance | ✅ aprovado | Pétalas pequenas acompanhando a mira manual (Ice Beam) | Congelar |

**Proteções:** nenhum item aprovado muda sem autorização explícita. Original Pokémon Arena 2D: manter 100% do visual pré-existente. Surf permanece oculto/não equipável.

**Adiados:** ajuste global de origem do golpe ao corpo/movimentos até inclusão dos 151 Pokémon de Kanto; iluminação dinâmica mais adiante.

**Avaliação futura de golpes específicos:** comparar catálogo original para confirmar ausência de VFX nativo antes de iniciar qualquer novo ataque; se houver VFX nativo, não fazer outro.

## Próximos golpes após concluir os 11

Triagem inicial e ordem sugerida em [CATALOGO-PROXIMOS-GOLPES-ESPECIFICOS.md](./CATALOGO-PROXIMOS-GOLPES-ESPECIFICOS.md). Cada candidato ainda precisa de conferência visual no cliente atual antes de implementação.

## Menu principal — aprovado em 21/10/2026
O menu inicial com o nome **Pokémon Torre**, logo em pixel art, mesmo layout, fundo, botões, tipografia e navegação foi **aprovado** pelo usuário. **Não modificar** menu, logo, dimensões ou funcionamento sem novo pedido.

## Novo lote sob revisão — 21/10/2026
**Metronome, Absorb e X-Scissor continuam SEM visto de aprovação.** Último feedback: Metronome e Absorb reduzidos aproximadamente 50% (palma/dedo, folha, gotas, retornos e faíscas). X-Scissor foi refeito com **dois cortes diagonais cruzados em X, contorno preto, ponta afiada, interior azul-esverdeado e impacto somente no encontro real**. Todos usam sprites de matriz em Phaser/WebGL. Não alterar golpes aprovados nem o menu.


## Proteção adicional — original Poké Arena / Pokémon Arena 2D
- O usuário também aprova e protege **todas as animações de golpes já existentes no cliente original**, não apenas os 17 efeitos próprios aprovados do Pokémon Torre 2.
- Os vídeos de **Pokémon Arena** e o cliente **Poké Arena 2D (https://www.pokearena2d.com/)** são referências visuais prioritárias para novos golpes realmente ausentes; respeitar autorização/licenças de assets.
- Nunca acrescentar outra entrada de golpe cujo nome canônico já esteja na base, incluindo traduções Português/Inglês; o original tem prioridade.
- Reaproveitar sprites, escala, quadros e padrões de impacto não significa copiar poder, dano, categoria, precisão, estados ou alcance.
- Auditoria automática em `tools/pokearena/audit-moves.mjs` + teste de biblioteca no `tests/solo-kanto-built.test.mjs`, bloqueio na publicação Pages se detectar sobreposição.
- Mesma textura de projétil para **golpes distintos** pode ser uma família visual, mas precisa ter silhueta e comportamento legíveis; não criar recolorações genéricas sem fidelidade.

## Refinamento dos golpes após aprovação de Super Fang (21/10/2026)
- **Super Fang — ✅ APROVADO, CONGELADO:** animação e mecânicas preservadas exatamente; teste de assinatura bloqueia mudanças não autorizadas.
- **Mud-Slap — ✅ APROVADO, CONGELADO:** mantida bolota de lama; splash original ampliado 12,5%; três respingos menores nas laterais, rastro curto com 3 partículas; dano, precisão, tipo, velocidade, alcance e redução de precisão inalterados.
- **Seed Bomb — ✅ APROVADO, CONGELADO:** semente permanece intacta durante o voo; rachadura aparece no impacto, miolo verde claro rapidamente visível; seis fragmentos originais + três microfragmentos de casca; sem danos extras; mecânica e estatísticas inalteradas.
- Nenhuma mudança no menu, sprites do cliente Pokémon Arena 2D ou outros golpes aprovados.

## Requisito permanente — Clash e dissipação (21/10/2026)
- **Todos os ataques com colisão entre golpes compatíveis** devem ter quadro de contato de Clash e animação de dissipação dos dois efeitos (ou do mais fraco, dependendo das regras), com pixel art e fragmentos proporcionais. **Status, cura e golpes sem volume físico** não recebem colisão artificial.
- Aplicar ao encontro real entre ataques oponentes, nunca no lançamento ou por proximidade sem contato. Não causar dano indevido em Pokémon durante dissipação, e não deixar sprite fantasma após encerramento. Rastrear se o ataque sobrevive, cancela ou perde potência conforme os atributos próprios.
- **Origem dos efeitos:** aproveitar o sistema já existente do cliente Poké Arena 2D para projéteis e raios sem alterá-los; criar a mesma interface de colisão para novos movimentos personalizados e avançar por classes (projéteis, feixes, cones, lâminas, área). Preservar estatísticas e as artes de todos os movimentos aprovados.
- Um Clash nunca pode modificar as matrizes dos sprites aprovados: o efeito entra como camada transitória e deve ser testado em batalha (inclusive ao errar, acertar e quando é cancelado por outro ataque).
- Esta regra é **meta de cobertura global**. Registrar quais classes já são realmente cobertas pelos testes, sem marcar prematuramente todos os ataques como finalizados.
