# T63 — patch ampliado: Vermilion, Lavender, Celadon e Fuchsia (somente os 60)

**Regra absoluta:** exclusivamente os 60 WebP originais do atlas. Nenhuma imagem nova ou alternativa, nenhum recorte/reescalonamento dos pixels, nenhum mapa adicional. Os 60 IDs e índices e os hashes de imagem permanecem intactos.

## Rotas originais ligadas
1. A etapa 3, após Lt. Surge, abre **Vermilion** (não Celadon): Rota 11 é uma saída lateral com retorno a Vermilion. A placa “Rota 3” existente no extremo leste da Rota 11 não vira teletransporte falso.
2. O acesso à Lavender segue por **Cerulean → Rota 9 individual (19) → Rotas 9/10 (20) → Lavender (21)**. O grafo recebeu a ligação intermediária antes omitida; Rock Tunnel e Usina Surf são apenas referências visuais porque esses interiores não são parte do pacote individual.
3. Lavender → Pokémon Tower (interior, retorno apenas); Lavender ↔ Rotas 7/8 ↔ Celadon; Celadon ↔ Esconderijo Rocket (interior, retorno apenas).
4. A etapa 4, após Erika, abre **Celadon**. Para Fuchsia, seguem os caminhos alternativos já aprovados: Lavender ↔ Rotas 12–15 ↔ Fuchsia, ou Celadon ↔ Rotas 16–18 ↔ Fuchsia. Sem exigir HM, Surf ou bicicleta.
5. A etapa 5, após Koga, começa em **Fuchsia**. O acesso a Saffron segue pelos caminhos anteriores e pela conexão Celadon ↔ Saffron quando liberado pela etapa.

**Segurança de progressão:** os cliques precisam respeitar simultaneamente o índice máximo permitido e a relação real de vizinhança no grafo. Não basta o desenho conter uma placa: atalhos e recompensas ausentes permanecem bloqueados.

**UI:** “Voltar” fica no canto inferior direito das Rotas 11, 9/10 e 12–15 para não cobrir as placas superiores já pintadas. Os hotspots são delimitados no sistema 1280×720 e validados em escala de tela 640×360.

**Regressões:** clique Phaser para nove cenas, bounds, colisão, adjacência bidirecional, 60 mapas, ausência de atalhos e integridade dos fundos; capturas reais desktop/mobile do caminho em fixture controlada são necessárias antes de qualquer merge ou deploy.

**Limite:** abertura anterior à Rota 2 continua usando o sistema nativo, pois não se pode criar mapas além dos 60. PR deve permanecer DRAFT enquanto QA e saves não estiverem validados.
