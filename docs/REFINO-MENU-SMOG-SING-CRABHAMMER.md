# Pokémon Torre 2 — Refinamento UI e Sing/Crabhammer/Smog

Data: 21/10/2026. Atualização solicitada após revisão em Android.

## Interface de campanha
O layout geográfico da campanha foi preservado para refinamento futuro. **Todos os botões da campanha e o botão principal de batalha agora são desenhados pela mesma função `marco` e fonte `texto` em `config.js`/`ui.js` da tela inicial original Poké Arena 2D**; botões azuis com moldura pixelada, realce dourado na ação principal e hover. A tipografia é a mesma fonte Pixelify com a escala/configuração real do menu, não CSS genérico. Fundo do mapa, rotas, progresso e sprites não foram alterados.

## Três golpes
- **Smog**: fumaça original aprovada visualmente pelo usuário permanece igual; adicionados 17 pequenos pixels de bolhas gasosas flutuantes, com tons roxos e brilho. **Smog passa a aprovado ✓**, conforme pedido. Chance de veneno e contato não mudaram.
- **Sing**: 9 notas pixeladas defasadas, tons pastel, trilhas discretas e pequenas estrelas, mantendo o mesmo contato e 55% de chance de sono. **Ainda precisa aprovação visual**.
- **Crabhammer**: removido o desenho grande em polígonos arredondados usado anteriormente; agora há três camadas de **pixel art de garra** composta somente por células de cor (K/D/R/O/L/W/A/B), com contorno escuro, corpo vermelho/laranja típico de Kingler, pinças móveis e gotas de água pixeladas. Não usa Canvas 2D, fillPoints, filtros suavizantes ou CSS. Físico e curto alcance; dano/critico continuam condicionados ao impacto. **Ainda precisa aprovação visual**.

Todos os 11 golpes anteriormente aprovados e os golpes nativos do Poké Arena 2D permanecem intactos.

Arquivos: `tools/pokearena/torre2-campaign-scene.js`, `tools/pokearena/torre2-species-fx.js`, `tools/pokearena/torre2-move-pool.js`.
