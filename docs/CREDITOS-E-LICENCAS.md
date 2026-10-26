# Créditos e fontes — Pokémon Torre 2

## Projeto e finalidade

Pokémon Torre 2 é um projeto de fã independente, gratuito e sem comercialização, desenvolvido para uso pessoal. A campanha e a progressão seguem a ideia do Pokémon Torre 1, com **evolução exclusivamente por nível e somente após a batalha**.

## Fontes de análise técnica

**Fonte única da engenharia reversa e do projeto-alvo:** [https://www.pokearena2d.com/](https://www.pokearena2d.com/). Toda referência técnica de código e comportamento deste projeto é desse site, nunca de produtos com nome semelhante.

**Autorização informada pelo responsável do projeto:** foi concedida permissão para aproveitar o código-fonte e arquivos disponíveis do site para este projeto particular, gratuito e sem vendas. Os arquivos transferidos devem manter identificação de proveniência e os créditos presentes no site; isso não atribui direitos de terceiros ao desenvolvedor do Pokémon Torre 2.

**Evidências REA:** [inventário](https://github.com/lulualcides-sys/Pok-mon-torre/blob/rea-pokearena-all-visible-moves/docs/rea-pokearena/PLANO-RECONSTRUCAO.md) e [vídeos de golpe/estágio](https://github.com/lulualcides-sys/Pok-mon-torre/actions/runs/39428271235).

**Captura técnica adicional:** [workflow que recupera arquivos públicos e os guarda como artefato, sem publicá-los diretamente no Pages](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/workflows/pokearena-source-snapshot.yml). O inventário antigo era só metadados; a captura nova permite conferir arquivos reais.

## Arte e tecnologia efetivamente usadas no jogo

- **PMD SpriteCollab** — sprites animados comunitários licenciados sob CC BY-NC 4.0; crédito e autores por espécie em [CREDITS_SPRITECOLLAB.md](../CREDITS_SPRITECOLLAB.md).
- **PixiJS/WebGL** — motor gráfico usado no Pokémon Torre 2, com seus termos próprios.
- **Arte e código implementados neste repositório** — módulos de combate, efeitos, regras da campanha e progressão são desenvolvidos no próprio projeto, exceto dependências e recursos indicados nos créditos.

## Autorização de uso declarada

O responsável pelo Pokémon Torre 2 declarou que recebeu autorização do autor do site para usar os recursos e código-fonte acessíveis do site **pokearena2d.com** exclusivamente no projeto pessoal sem vendas. A cópia técnica respeita essa declaração e preserva créditos da origem. Os termos escritos da autorização não foram fornecidos aqui; não atribuir autorização a outras obras, serviços externos ou proprietários de marcas além do escopo informado.

O repositório do Pokémon Torre 2 está atualmente público: a captura original é guardada primeiro em artefato de CI para evitar publicar arquivos de terceiros acidentalmente sem revisar o escopo de redistribuição.

### Insígnias de Kanto — Trainer Card FRLG
Folha original: https://github.com/pret/pokefirered/blob/master/graphics/trainer_card/badges.png.
Arte Nintendo/Game Freak/Creatures, sem alegação de licença MIT/CC0. Proveniência e hash em `reference-assets/kanto/ui/badges/README.md`. Build preserva pixels, adicionando transparência do índice zero; Phaser distingue conquistadas/bloqueadas por tint.
