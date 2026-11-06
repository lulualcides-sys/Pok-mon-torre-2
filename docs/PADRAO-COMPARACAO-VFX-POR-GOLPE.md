# Padrão global por golpe — pesquisa e comparação de VFX

Decisão do usuário em 05/11/2026: **não usar PixelFX automaticamente**. Para criar, refazer ou melhorar qualquer golpe, pesquisar primeiro como a habilidade funciona no Pokémon da geração usada, depois COMPARAR todas as 10 fontes da biblioteca adicionada ao projeto e escolher a melhor base individual por golpe. Composição de duas ou mais fontes é permitida quando o resultado melhorar, com licenças compatíveis e contribuição real. Comparar 10 fontes não significa copiar/usar as 10.

## Precedência dos golpes iguais — decisão final 06/11/2026

Antes de criar/refazer um VFX, verificar o golpe no **cliente-base original Poké Arena 2D**. Se houver animação executável com o mesmo nome canônico, **o Torre 2 usa o VFX original P2**, independentemente de antiga aprovação de uma versão caseira. Inclui Peck, Double Kick e todos os overlaps. **Não alterar Pokémon/kits originais** (como Ho-Oh, Crobat, Steelix); não preencher slots nativos. Os VFX exclusivos aprovados do Torre 2 continuam intocados. A comparação das dez fontes aplica-se a golpes efetivamente novos/exclusivos sem equivalente nativo. Esta regra revoga a preferência anterior por VFX caseiros de mesmo nome.

## Processo obrigatório

1. Identificar ID e mecânica canônica: categoria, alvo, origem, trajetória, precisão, colisão, multi-hit, danos, status e sequência de dissipação. Documentar fonte oficial ou técnica verificável (por exemplo, página individual de Pokémon Database, PokéAPI ou dados de jogos). FireRed/Gen III é a base da campanha.
2. Conferir e preservar a biblioteca de efeitos aprovados. Fazer a auditoria de T2, Poké Arena 2D, Zarza e Emerald Arena da POLITICA-GOLPES-INTEGRAL. Registrar exatamente o que foi inspecionado/reaproveitado, sem supor permissão de redistribuição.
3. Buscar em reference-library/vfx-sources/catalog.json. Rodar node tools/dev/vfx-source-search.mjs "Steel Wing" --json e consultar --all para ver os dez projetos. Comparar PixelFX, Sprite Fusion, Pixelbolt, Pixel Ability FX Generator, Spellbook GD, Foozle, CodeManu, DevWizard, cs5475 e PixelDust. Para cada fonte, documentar efeito/arquivo, ou indisponibilidade e seu motivo, condições de uso e notas de semântica, pixel art, compatibilidade Phaser e desempenho (0–5).
4. Gerar ficha em branco usando node tools/dev/vfx-review-policy.mjs --draft "Steel Wing". Preencher o objeto do golpe dentro de data/vfx-selection-decisions.json, com dez comparações e quatro fontes anteriores. O rascunho contém pending e nunca passa sozinho. Deixar clara a escolha, as alternativas descartadas, o caminho efetivamente usado e a justificativa.
5. Escolher a fonte mais adequada à identidade do golpe, não à ordem do catálogo. Exemplos: Spider Web exige fios prendendo o alvo, Octazooka exige projétil de tinta escura e Steel Wing precisa de asa metálica; uma esfera recolorida não substitui uma coreografia adequada. O vencedor pode ser PixelFX, Pixelbolt, pacote CC0 ou composição legalmente permitida.
6. Bloquear fontes sem licença ou licença contraditória; não copiar seus arquivos. Fontes download-required só viram candidato reutilizável depois de importação e checagem de hash/licença; links-only são referência até os arquivos/licenças serem examinados. Godot/Canvas de referência devem ser portados, nunca executados no runtime Phaser.
7. Implementar Phaser/WebGL em pixel art nearest-neighbor com spritesheets e movimentação individual, hitbox/dano/status no contato real e FPS mobile. Preservar todos os efeitos aprovados, incluindo Powder Snow, Whirlpool, Zap Cannon, Surf e os três metálicos já homologados.
8. Validar com node tools/dev/vfx-review-policy.mjs --check, node --test tests/vfx-selection-policy.test.js, npm test, testes de navegador e screenshots reais. Só informar que o golpe está pronto quando testes e aprovação visual estiverem completos. PR/commit não significa publicação no GitHub Pages.

## Guarda automática

- Qualquer golpe novo cadastrado em data/move-reuse-policy.json e não presente entre os 40 IDs históricos requer ficha específica. A comparação é validada por npm test.
- Os 43 VFX de Johto (15 reworks + 28 protótipos) serão cobrados assim que o catálogo da PR #565 for integrado ao ramo. Os três aprovados permanecem fora da refação.
- Refazer um golpe histórico também exige ficha, embora o teste automático não detecte toda mudança artística; o checklist de PR e o agente devem exigir manualmente.
- A validação confirma estrutura e licenças registradas, NÃO prova que as dez fontes foram efetivamente estudadas nem que a arte é boa. Revisor humano deve validar evidências e screenshots.

## Situação da biblioteca

O catálogo tem 10 fontes, mas somente 4 têm amostras locais. Sprite Fusion está em links-only; Foozle, DevWizard e cs5475 precisam de download; CodeManu e PixelDust estão bloqueados por licença. Não registrar materiais não obtidos como integrados. Escolher e combinar apenas recursos realmente disponíveis e autorizados.
