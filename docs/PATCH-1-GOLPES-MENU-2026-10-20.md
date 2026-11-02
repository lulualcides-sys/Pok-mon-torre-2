# Pokémon Torre 2 — Patch 1: menu e animações refinadas

Publicado a partir do código-fonte autorizado do **pokearena2d.com** e da implementação Phaser/WebGL do Pokémon Torre 2.

## Movimentos

| Golpe | Ajuste real | Resultado esperado |
| --- | --- | --- |
| **Bonemerang** | Escala da arte reduzida aproximadamente **50%** (`0.86–0.98 → 0.43–0.49`), trilha mais fina | Osso menor com ida e volta e dois impactos preservados |
| **Bone Club** | Escala da arte `0.68 → 0.47`, alcance lógico aumentado **10%** e arco de golpe ligeiramente estendido | Golpe físico menor, acertando um pouco mais longe |
| **Tri Attack** | Pesquisa Bulbapedia + Pokémon Database; substituído efeito de três orbes rotativas por **três feixes simultâneos e vértices triangulares de fogo, gelo e eletricidade** | Um ataque do tipo Normal, contato único no alvo, impacto dos três elementos, 20% total de chance de status representada no efeito |
| **Pay Day** | **5 → 9 moedas** independentes, disparo mais próximo entre moedas, leve variação de trajetória e dano proporcional para não aumentar excessivamente | Mais moedas e brilho, preservando os impactos individuais aprovados |

**Fontes Tri Attack:**
- https://bulbapedia.bulbagarden.net/wiki/Tri_Attack_(move)
- https://pokemondb.net/move/tri-attack

O movimento original é do tipo **Normal / Especial**, poder 80 nos jogos principais, e pode causar queimadura, congelamento ou paralisia. As apresentações das diferentes gerações mostram um triângulo ou três raios de energia; em nosso jogo a identidade de três componentes distintos é essencial. O balanço de dano e as condições de status da campanha ainda precisam de testes comparativos para se aproximarem fielmente das gerações originais.

## Tela de golpes do Sumário

Recriada com Phaser (não imagem estática, Canvas2D nem HTML/CSS improvisado):
- Cartão de identidade com retrato pixelado, tipo, nível e barras HP/ATK/DEF/SPD.
- **Quatro slots de combate** maiores, 2 × 2, destacando seleção, tipo e cooldown.
- **Biblioteca independente**, com seis golpes por página e aparência compacta.
- **Filtro por tipo** usando seletor visual próprio do jogo, essencial para o Mewtwo teste com 137 opções.
- **Busca por nome**, paginação, limpeza de filtro, aviso de golpe já equipado, preservação das escolhas em localStorage.
- Botões de toque com áreas maiores, sem sobreposição no Android horizontal.

## Testes

GitHub Actions: https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/39505390551

O teste em Chromium cobre a cena Phaser original, seleção de personagem, Sumário do Mewtwo nível 50, mudança para filtro Ground, busca por Pay Day, entrada em batalha, quatro ataques reais e navegação pública em Android horizontal. Capturas de tela e relatório técnico disponíveis no artefato do workflow.

**Os quatro golpes continuam em avaliação visual do usuário.** Preservar os demais ataques e as regras de evolução: campanha Kanto evolui só por nível depois da luta; Training, VS CPU e Arena Mode mantêm EVO dinâmico. **Nenhum efeito de golpe do Torre 1 foi reutilizado.**
