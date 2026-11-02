# Auditoria de golpes — Pokémon Torre 2 / Poké Arena 2D

**Realizada em 20/10/2026 diretamente no cliente Phaser de pokearena2d.com.** Foram percorridas as 26 linhas de Pokémon do código, todos os kits, suas evoluções e Megas, incluindo espécies que ainda não aparecem na campanha Kanto. Nenhum efeito do Pokémon Torre 1 entrou nesta verificação.

## Resultado real

- **160 golpes distintos** declarados no código do Poké Arena 2D recuperado.
- **4 golpes novos próprios** do Pokémon Torre 2: Bonemerang, Bone Club, Tri Attack, Pay Day.
- **137 opções no Mewtwo de testes** antes de corrigir a diferença de cobertura entre o leitor de kits e a biblioteca completa (137 **não** significa o total existente no original).
- Dentro das **269 propostas** existentes na nossa lista 14 ataques + 2 status por tipo, **99 já estão no Poké Arena 2D**; **170 ainda não constam nos kits capturados**. Além disso, **19 vagas da meta de 288** continuam sem nome escolhido.
- Contagem de presença no **código**, não homologação visual de cada animação. O relatório completo identifica formas, slots e as espécies com cada ataque.

## Confirmados como já existentes — não recriar

**ROCK:** Rock Slide (chuva de pedras `lluvia`), Rock Throw, Stone Edge, Smack Down, Rollout.

**Outros exemplos importantes:** Psybeam, Confusion, Psywave, Volt Tackle, Egg Bomb, High Jump Kick, Fire Blast, Flamethrower, Water Gun, Water Pulse, Bubble Beam, Waterfall, Dragon Dance, Draco Meteor, Hypnosis, Leech Seed, Razor Leaf, Splash, Seismic Toss, Thunderbolt, Thunder, Discharge e Hyper Beam.

Não importa se a espécie de origem é de outra geração: **um efeito já implementado no cliente é reutilizável** em qualquer Pokémon compatível sem redesenhar o mesmo golpe.

## Inventário por tipo do nosso banco inicial (14 ataques + 2 status)

| Tipo | Já existem no site | Ainda faltam no banco selecionado |
| --- | ---: | ---: |
| Normal | 7 | 9 |
| Fogo | 11 | 5 |
| Água | 8 | 8 |
| Elétrico | 11 | 4 |
| Planta | 5 | 11 |
| Gelo | 2 | 13 |
| Lutador | 9 | 7 |
| Veneno | 2 | 14 |
| Terra | 2 | 14 |
| Voador | 7 | 9 |
| Psíquico | 6 | 8 |
| Inseto | 4 | 12 |
| Pedra | 5 | 8 |
| Fantasma | 6 | 7 |
| Dragão | 6 | 8 |
| Sombrio | 3 | 13 |
| Aço | 3 | 11 |
| Fada | 2 | 9 |
| **Total** | **99** | **170** |

As 19 vagas não preenchidas ficam fora da contagem de 269 movimentos já propostos. Por exemplo, não precisamos inventar ataques do tipo Fantasma só para cumprir uma quota numérica.

## Próximos quatro recomendados: inexistentes no cliente capturado

| Golpe | Tipo | Justificativa de uso |
| --- | --- | --- |
| **Surf** | Água | Animação de onda ampla e contínua; útil para Blastoise, Lapras, Golduck, Vaporeon e outros |
| **Swift** | Normal | Estrelas com trajetória clara; efeito compartilhável e relativamente econômico |
| **Shadow Ball** | Fantasma | Projétil de energia espectral com rastro e impacto próprio; útil para Gengar e diversos psíquicos |
| **Lovely Kiss** | Normal (status) | Movimento característico de Jynx, com lógica de sono e efeito visual diferenciado |

**Reservas também ausentes:** Soft-Boiled (cura da Chansey), Ice Beam, Rock Blast, Moonblast, Confuse Ray, Thunder Wave, Poison Jab e Acid. **Leech Seed já existe** no cliente e não deve ser recriado. Verificar novamente o relatório para cada novo lote.

Os efeitos inéditos devem seguir **Phaser/WebGL e a pixel art do Poké Arena 2D**, com dano e estado sincronizados com os quadros de impacto. Nenhum ataque Pixi/Canvas do Torre 1 será reutilizado.

## Correções visuais ainda pendentes do lote anterior

- Tri Attack: melhorar os três elementos e o impacto visual sem abandonar o conceito triangular original.
- Pay Day: distribuir as moedas em leque/arco, deixando de voar todas em uma fileira.
- Bonemerang e Bone Club: **aprovados pelo usuário, não alterar**.

## Como reproduzir e conferir todos os nomes

Script versionado em `tools/pokearena/audit-moves.mjs`. Ele é executado pelo workflow de captura da fonte e produz:
- `site-capture/POKEARENA-MOVE-AUDIT.json`: todos os 160 golpes, formas, espécies, slots e comparação com o banco 14+2.
- `site-capture/POKEARENA-MOVE-AUDIT.md`: tabela dos movimentos já existentes e os que faltam nos 18 tipos.

**GitHub Actions com verificação concluída:** https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/39510275655

Este relatório corresponde à versão `src-3e751f1895` do site recuperado. Novas atualizações do jogo original podem adicionar ou alterar golpes; a auditoria deve ser executada novamente antes de um novo lote.
