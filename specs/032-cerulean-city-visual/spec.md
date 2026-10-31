# T32 — Cerulean City: base visual aprovada e protótipo jogável

**Objetivo aprovado pelo usuário em 31/10/2026:** tornar Kanto uma jornada de pixel art detalhada, começando por Cerulean, com barra de cidade, objetivos, pontos interativos, equipe e menus. A ilustração gerada na conversa é conceito de qualidade e **não** deve ser colada no jogo como imagem de fundo.

**Regra inegociável:** manter o HUD da arena/batalhas exatamente como está. Não tocar no controlador da luta, VFX, cooldowns, sprites/slots de ataques, saves, dinheiro, XP, chances de captura ou dificuldade.

## Etapa de implementação T32 (primeira entrega, não acabamento final)
- No fluxo normal de Cerulean (stage=1), o botão **EXPLORAR CIDADE** abre um mapa de exploração Phaser/WebGL nativo, sem retirar a rota de 15 treinadores que já funciona.
- Cidade renderizada com o mapa local **já carregado** (`frlg-location-cerulean`), mantendo `NEAREST`, recorte proporcional do mesmo atlas, sem download extra ou nova textura no navegador. Não afirmar que essa arte original é asset livre para distribuição comercial.
- Projeta pontos do Centro Pokémon, Loja, Ginásio e Bicicletas sobre os prédios reais via `buildingInteractions` e `getSourceMainBounds`. Os botões executam os mesmos callbacks já aprovados da campanha.
- Barra com título, número real de treinadores, próximo desafio (sem bypass do líder), equipe real com níveis e HP e cinco ações da campanha. Voltar à rota é imediato.
- Protótipo isolado: nenhum mapa de outra cidade é modificado. Sem alteração de HUD/IA de batalha.
- Performance: 1 imagem de mapa reutilizada, no máximo 4 zonas de hotspots, sem loop de partículas e sem cenas persistentes extras.

## Critérios de aceite e riscos
- Node `--check`, gates de fonte `npm test`, `npm run check`, `npm run check:reuse`.
- Chromium nativo desktop e mobile: abrir por toque real, confirmar textura FRLG presente, abrir Centro real e retornar para rota, sem alterar `localStorage`, e screenshots em `test-evidence`.
- O teste usa estado artificial **só para escolher a tela Cerulean**, sem inventar vitórias.
- O conceito ilustrativo é mais rico que a fonte FRLG atual. Se a prova de navegador mostrar que a cidade ficou básica, a próxima etapa deve construir cenário original em tiles/sprites licenciados; não ampliar a imagem de referência para simular um mundo explorável.
- **Não mesclar/publicar** sem CI verde e inspeção visual do screenshot real. Prova de gameplay da campanha e demais pendências continuam em branches separadas.
