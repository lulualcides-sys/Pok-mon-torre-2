# Contrato T38 — imagem de cenário e Phaser por cima, ginásios de Kanto

## Decisão visual do usuário — 02/11/2026
O interior de cada ginásio é **UMA imagem pixel-art 16:9**, sem NPCs, líder,
Pokémon, rótulos ou botões desenhados nela. O Phaser renderiza como camadas
independentes **por cima**: sprites autênticos dos adversários existentes,
líder de ginásio, Pokémon ace PMD em Idle, sombras, seletor do adversário
atual, zonas de toque, botão de desafiar e botão de retorno.

Não usar mais pedras, árvores, passarelas ou plataformas vetoriais como
**cenário final**. O motor vetorial T36 continua disponível para **calcular e
validar** coordenadas e como fallback seguro caso a arte ainda não exista.

**Pokédex, batalha/Arena, PC, Mart, bolsa, sumário, saves e menus continuam
em suas telas nativas.** Esta implementação só altera o fundo da tela
interior do ginásio e a posição VISUAL dos adversários quando imagem pronta.

## Os oito arquivos de arte

Colocar somente arquivos finalizados e revisados, cada um como PNG RGB/RGBA
8 bits, 640×360 ou 1280×720, sem deformação:

| Estágio | Arquivo em `reference-assets/kanto/gym-interiors/approved/` | Líder + ace |
| --- | --- | --- |
| 0 | `brock-interior.png` | Brock + Onix |
| 1 | `misty-interior.png` | Misty + Starmie |
| 2 | `surge-interior.png` | Lt. Surge + Raichu |
| 3 | `erika-interior.png` | Erika + Vileplume |
| 4 | `koga-interior.png` | Koga + Weezing |
| 5 | `sabrina-interior.png` | Sabrina + Alakazam |
| 6 | `blaine-interior.png` | Blaine + Arcanine |
| 7 | `giovanni-interior.png` | Giovanni + Rhyhorn |

Sem imagens neste diretório => manifest vazio e versão visual anterior
funcional. **Jamais** exibir uma tela fictícia ou afirmar aprovação de arte
que ainda não foi fornecida. O diretório approved significa *arquivo
selecionado para carregamento na branch de revisão*, não aprovação final
do mapa completo. O aceite final continua condicionado ao Kanto inteiro
até a Elite Four, issue #471.

## Canvas lógico e locais exatos dos sprites

O fundo é estendido **somente** de 1280×720 para 640×360, sem recorte de
bordas, sem zoom da câmera e com `nearest-neighbor`. O fundo é renderizado
em `depth=2.4`; os personagens e áreas clicáveis mantêm seus `depth`
originais e ficam por cima.

Áreas que a arte deve respeitar em coordenadas lógicas 640×360:

- `x=66..574, y=68..268`: interior do cenário, sem textos ou HUD.
- `y=0..62`: cabeçalho/estado, **não** desenhar texto na imagem.
- `y=274..360`: controles originais, **não** desenhar botões na imagem.
- Plataforma final: líder com pés em `(290,126)`, ace em `(342,126)`.
- Brock (três adversários, âncoras dos pés): `(160,164)`,
  `(470,184)`, `(188,226)`.
- Misty (quatro): `(160,164)`, `(470,172)`, `(206,224)`,
  `(500,224)`.
- Surge, Erika, Koga, Sabrina, Blaine, Giovanni (quatro):
  `(160,164)`, `(470,172)`, `(206,224)`, `(500,224)`.
- Deixar piso acessível nos círculos de raio ~28 px em torno dos NPCs,
  corredor central perto de `x=304..336`, pontes e acesso à saída.

O artista deve compor o fundo respeitando as posições — o arquivo não
deve conter sprites de treinador, Pokébolas clicáveis ou um ace duplicado.
Composição orgânica e personalizada (água, pedra, eletricidade, jardins,
dojô, labirinto, vulcão, terra), não repetir o mesmo desenho recolorido.

## Integração, proveniência e limites

O instalador `tools/pokearena/install-gym-backgrounds.mjs` lê
**exclusivamente arquivos locais** do diretório acima; valida PNG, CRC,
resolução, tamanho de até 10 MiB e registra SHA-256 em
`assets/ui/gym-interiors/manifest.json` na build. Só a imagem do estágio
atual é carregada; demais texturas do próprio módulo são liberadas na
troca de estágio. Falha/missing asset mantém o cenário anterior.

O código `torre2-gym-image-background.js` lê esse manifest e cria uma
`Phaser.Image` estática. Sob ela não há textura vetorial adicional quando
o modo imagem está ativo. Por cima são reutilizados os módulos
`torre2-gym-intermediates.js` e `torre2-gym-ace.js`, sem mudar
`routeNode`, `TRAINERS_PER_GYM`, recompensas, saves, IA, VFX ou RNG.
Proveniência da imagem fornecida pelo usuário deve ser registrada antes
da integração pública; assets de terceiros não recebem licença inventada.

**Gate para publicação:** revisão visual das oito salas, desktop/mobile
WebGL real, acessibilidade dos pontos de toque e nenhuma colisão ou
ocultação, testes completos/CI do SHA e integração limpa com a PR #421.
A decisão de aprovação global depende da issue #471 (até Elite Four).
