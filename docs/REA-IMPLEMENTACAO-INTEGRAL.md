# Pokémon Torre 2 — execução do inventário REA (Poké Arena 2D)

## Intenção aprovada
**Manter a campanha do Pokémon Torre 1** e reconstruir **a experiência inteira de combate do Poké Arena 2D**, não um estilo livre inspirado nele. Implementar controles, posicionamento, arenas, zoom, câmera, personagens, efeitos, comportamento, timings e impacto com fidelidade visual e funcional onde tecnicamente possível. Não declarar cópia integral pronta enquanto recursos não estiverem implementados, testados e comparados com as capturas.

Não incorporar scripts/arte/áudio protegidos do Poké Arena sem autorização/licença; implementar mecânicas e desenhos próprios ou com licença adequada.

## O REA já coletou (20/10/2026)

| Evidência | Levantamento | Limitação |
|---|---|---|
| [Inventário técnico](https://github.com/lulualcides-sys/Pok-mon-torre/blob/rea-pokearena-all-visible-moves/docs/rea-pokearena/PLANO-RECONSTRUCAO.md) | 59 recursos JS inventariados, 58 analisados por AST; Phaser encontrado; 90 declarações de spritesheet; 53 chaves de comportamento em habilidades.js | Catálogo de código público, não prova de todos os efeitos ativados em combate |
| [Auditoria de arena](https://github.com/lulualcides-sys/Pok-mon-torre/blob/rea-pokearena-all-visible-moves/docs/rea-pokearena/PLANO-RECONSTRUCAO.md) | 4 arenas observadas: Stadium, Neon, Crater, Ruins | Replicar composição e dinâmica via assets com direitos adequados |
| [Registro de evolução e golpes](https://github.com/lulualcides-sys/Pok-mon-torre/blob/rea-pokearena-all-visible-moves/docs/rea-pokearena/registro-real/evolucoes/INDEX.md) | 26 linhas de Pokémon, 78 perfis regulares, 6 formas extras e 420 gravações MP4 de estágio×comando; 153 nomes únicos | Gravação de comando não comprova ativação correta de cada golpe |
| [Auditoria visual](https://github.com/lulualcides-sys/Pok-mon-torre/blob/rea-pokearena-all-visible-moves/docs/rea-pokearena/registro-real/evolucoes/AUDITORIA-VIDEO.md) | 420 arquivos MP4 íntegros auditados em oito lotes | Flash/movimento não substituem a verificação semântica de cada ataque; artefatos têm retenção limitada |
| [Análise de Flamethrower/Fire Blast](https://github.com/lulualcides-sys/Pok-mon-torre/blob/rea-pokearena-all-visible-moves/docs/REA-POKEARENA-REFERENCIA.md) | Phaser, vfx.js, habilidades.js, arena.js, controles.js, quadros/fps declarados, controles RMB/E | Os FPS são cadências de atlas, não FPS geral do jogo |

## Plano de reconstrução (sistemas, não mero moodboard)

1. **Arena e câmera.** Quatro ambientes com camadas, sombras, piso, arquibancadas/ruínas/cratera/neon, escala correta, profundidade e câmera centrada com controles de zoom/recorte responsivos. Nas fases de Kanto, associar ambientes aos líderes/regiões; não substituir a campanha.
2. **Lutadores e controles.** Sprites de múltiplas direções e ações (idle, andar, atacar, hit, dash, knockback, KO, entrar/sair), com estado por espécie, colisão e animações iguais em ritmo e legibilidade aos registros. Toque/joystick/teclado e compatibilidade Android.
3. **Habilidades.** Implementar núcleos distintos inspirados nas 53 formas de comportamento identificadas: projéteis, jatos/raios, corpo a corpo, investidas, área, persistentes, status, defesa, ambiente e alterações de fase. Cada golpe passa pelo esquema startup→travel/contact→impact→recovery, com dano sincronizado.
4. **Catálogo por espécie e evolução.** Mapear os 153 nomes do REA e as diferenças de kit entre fases; registrar versões com nome em inglês, tipo, alcance, custo, animação, colisão, áudio autorizado, escala e requisitos de nível. A quantidade de capturas não equivale ao número de efeitos confirmados nem ao número de efeitos implementados.
5. **Interface e feedback.** HUD de vida/energia, cooldown, texto de acerto/efetividade, hit stun, invulnerabilidade, knockback, câmera, feedback de botão e transições, com tempo visual medido em batalhas.
6. **Campanha própria do Torre.** Treinadores, líderes, Elite Four, captura, equipe e persistência seguindo o Torre 1, separados do modo laboratório. **Evolução exclusivamente por nível, sempre após o combate**, inclusive espécies que normalmente evoluiriam por outros meios (usar tabela própria de níveis).
7. **Qualidade.** Comparações por vídeo em cena real e testes automatizados para movimento, colisões, cooldown, dano no impacto, resolução de tela, desempenho, troca de inimigo e evolução fora de combate. Não classificar como implementado aquilo que só existe no material REA.

## Lacuna entre dados de estudo e jogo executável

A V0.8 implementa **oito golpes e uma batalha laboratorial com Brock**. Não implementa 153 golpes, as quatro arenas completas, os 26 personagens da auditoria, nem a campanha/evolução. Essa diferença deve ser comunicada claramente até ser resolvida.

## Links de trabalho
- [Auditoria original e vídeos](https://github.com/lulualcides-sys/Pok-mon-torre/actions/runs/39428271235)
- [Resumo estruturado do lote de 420](https://github.com/lulualcides-sys/Pok-mon-torre/blob/rea-pokearena-all-visible-moves/docs/rea-pokearena/registro-real/evolucoes/RESUMO.json)
- [Regras da campanha](CONTRATO_CAMPANHA.md)
