# Pokédex — auditoria integral de movesets, 29/10/2026

## Causa-raiz e reparo

A Pokédex misturava `stage.kit` de Arena/VS CPU (alguns golpes nativos estão disponíveis apenas via TM, outros slots não existem) com `resolveLoadout` da campanha em nível 100. Isso mostrava **Locked** em Mew, Scyther, Mr. Mime, Cubone e Doduo, e indicava Blizzard/Hyper Beam como habilidades equipadas sem TM em Marowak. A correção usa o MESMO resolvedor de combate da campanha, em **prévia de nível 50 sem TM**, cruzada com `campaignLearnset` somente para `method === 'LEVEL'`.

Esta é uma **prévia demonstrativa do kit avançado**, não o loadout de um save real. Na campanha, o Pokémon mantém seus próprios níveis e escolhas, 3 ataques fracos no nível 5, ULT com medidor a partir do 8, e técnica forte apenas após desbloqueio. O modo Arena e os kits nativos continuam intactos. Mewtwo (laboratório irrestrito) e Pokémon não-Kanto (por exemplo Deoxys) mostram seu kit nativo, para evitar Struggle fabricado.

## Varredura e gatilhos de falha

`tests/pokedex-151-legal-kit-browser.cjs` abre o cliente Phaser real no Chromium e verifica 151 espécies Kanto no resolvedor, todos os estágios encontrados no roster, quatro slots selecionáveis, efeitos com renderer, congruência da Pokédex com o loadout real, TMs não ensinadas, evolução, ULT, Deoxys, persistência de save e seis fichas fotografadas. A suíte já existente valida nível 5→50, assinatura das ULTs, status, TMs e evolução. O arquivo de evidências do CI contém `pokedex-151-legal-slot-audit.json` e captura de tela de Mew.

### Exceção explícita e não ocultada

**Caterpie** normalmente evolui no nível 7. A simulação hipotética de um Caterpie que permanece até o nível 50 mostra apenas três técnicas distintas instaladas e legais; a prévia energética da ULT usa Bug Bite, também usado em um slot normal. A auditoria registra isso separadamente como exceção de escassez, **sem inventar um quarto golpe, quebrar a evolução ou alterar um VFX aprovado**. Ditto permanece exceção previamente documentada para Transform não implementado.

### Proteções

- Não adicionar TM ao save, não autoensinar TM, não equipar golpes no jogador ao ler a Pokédex.
- Não alterar sprites, hitboxes, efeitos aprovados nem alterar o cliente nativo.
- Se um slot real ficar sem renderer ou não constar do learnset, o teste de navegador falha e bloqueia o merge.
- Mudanças no `move-pool` tratam apenas de nomes repetidos entre um golpe normal e ULT de treino em níveis avançados; todas as 151 espécies são testadas novamente antes de publicar.
- O pipeline de Pages necessita também de sua própria validação e confirmação do SHA no site público. Não confundir sucesso do CI de PR com deploy concluído.
