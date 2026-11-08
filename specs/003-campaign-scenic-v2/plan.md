# Campanha scenic v2 — plano de implementação

Execução direta autorizada pelo usuário, que rejeitou o resultado quadrado e pediu pesquisa real e melhoria profunda. Base publicada 0d289a1e. Sem perguntas repetidas.

## Direção e pesquisa
- FireRed/Cerulean: água contrastando com margens claras, vegetação volumosa, caminhos legíveis. Fonte local reference-assets/kanto/maps/cities/cerulean-city.png; referência apenas.
- Tuxemon: screenshot oficial https://www.tuxemon.org/images/featurette-01.png inspecionado; contraste, objetos reconhecíveis e separação de janela/cenário. Não copiar arte/licença GPL por inferência.
- Valyria Tear: data/story/common/locations/mountain_village.png inspecionado; planos de vegetação e arquitetura. Referência, sem redistribuir imagem.
- Godot OpenRPG inspecionado e descartado como direção estética: banner atual vetorial.
- Puny World (Shade, CC0): atlas testado e descartado neste lote por definição insuficiente na escala dos cards.
- Arte final efetivamente reutilizada: [LPC] Trees Mega-Pack, bluecarrot16 e autores listados integralmente em reference-assets/scenic-v2/CREDITS.txt, CC-BY-SA 3.0. Fonte https://opengameart.org/content/lpc-trees. PNG intacto, SHA256 694e19b641cb2b2ade5864e9a7bbf145a6c23103361324943b4e1f47a6d83ea2. Seleção de frames em Phaser; licença/autoria acessíveis pelo menu de créditos.
- Arsenal: kit pokemon-campanha-design, skills create-game-assets, game-ui-ux e level-design. Não instalar engines/editor pesado.

## Implementação
- [ ] Redesenhar os painéis dos cards com cantos recortados, menos molduras aninhadas e cenário contextual para todos os estágios.
- [ ] Criar funções visuais reutilizáveis em premium-art.js: cenário regional, panorama e ícones; atlas LPC carregado somente nos cards, callbacks removidos quando a camada morrer.
- [ ] Redesenhar detalhe de treinador e opções com o mesmo sistema. Manter grid, hitboxes, nomes, rosters, IDs, paginação e callbacks.
- [ ] Verificar layout desktop, tablet, mobile vertical (aviso nativo) e paisagem; atlas real e fallback; navegação repetida sem crescimento de callbacks.
- [ ] Comparar código protegido e fonte nativa; rodar testes focados, suite completa, CI e revisão independente.
- [ ] Entregar evidências reais e registrar publicação exata se os gates passarem.

## Limites
Nenhuma mudança em batalha, HUD, golpes, sprites nativos, balanceamento, progressão ou saves. Não reativar mapas legados. PR 604 de batalha e PR 600 de paginação não serão incorporadas. O lote atual melhora a seleção de toda a campanha e os detalhes externos, não declara toda a campanha concluída.

## Riscos a verificar
Carregamento tardio do atlas após sair da tela; sprites invadindo texto; contraste dos bloqueados; legibilidade na escala mobile; callbacks e progresso preservados.

## Decisões e evidência de execução
- Retirar a moldura vertical completa; manter bolso inferior de informações e estados por texto/cor. Grid e alvos de toque preservados, para evitar perda de navegação e conflito com PR 600.
- Árvore 16px ampliada do Puny World foi rejeitada na revisão visual. Atlas LPC maior preservado, sem editar seus pixels; custo 185501 bytes e textura RGBA 1024² (aproximadamente 4 MiB na GPU).
- Loader possui chave privada e callbacks por container, removidos ao sair. Testes cobrem cinco consumidores, retorno após erro e saída antes da resposta.
- Invalidação do diretório de módulos agora inclui cards, arte externa e o PNG; sem isso o cache poderia esconder uma mudança exclusivamente visual.
- Script inicial de capturas aguardava estado antigo entre reinícios e tocava uma coluna vazia na Liga; corrigido para aguardar estágio + root ativos e tocar primeiro card existente. Não era falha do jogo.
- Proxy local precisou NODE_USE_ENV_PROXY=1 para assets fora do cache. Capturas anteriores sem atlas não contam como aprovação visual.
- Revisão fresca independente solicitada após teste das regiões. Nenhuma publicação deste lote até terminar gates.

## Compatibilização com trabalho concorrente
A main recebeu #609 (Alpha 0.65.8) enquanto o lote estava em revisão. Rebase limpo sobre f079d9c7fc7794a21e45198d423af23c3271c9d8. Nenhum patch desse cliente foi criado por esta frente. Novo guardião check-scenic-boundary.mjs compara contra essa base, preservando inclusive campaign-scene inteiro, rosters e diálogo importado pelo VS. Capturas finais devem usar cache separado da versão antiga.
