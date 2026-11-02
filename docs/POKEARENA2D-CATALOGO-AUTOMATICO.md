# Catálogo automático — Poké Arena 2D

**Origem exclusiva:** https://www.pokearena2d.com/ (não confundir com Poke2D Arena, Empress ou outras franquias/sites similares).

A rotina diária em .github/workflows/pokearena-native-moves-watch.yml consulta primeiro a versão do cliente publicado. Só faz uma captura maior quando o identificador da versão é novo, está indisponível ou ainda não existe catálogo. Utiliza os scripts de captura, build e auditoria já existentes; **não substitui o cliente original nem altera golpes aprovados**.

## Dados publicados pela rotina

- data/pokearena2d-source-moves.json: inventário de movimentos realmente declarados nos kits da versão capturada, renderizadores/formas citados, exemplos de espécies e compatibilidade Kanto por learnset de nível nas tabelas FRLG (Gen III), HGSS (IV), B2W2 (V) e Let's Go (VII).
- data/pokearena2d-source-changes.json: resultado da comparação com o catálogo anterior, indicando golpes adicionados, retirados, metadados alterados e novas espécies de origem. Na primeira execução, o resultado é marcado como **baseline inicial**, não como descoberta comprovada de novidades.
- O relatório completo da captura fica temporariamente em GitHub Actions → Artifacts, não é publicado no jogo.
- Os testes automatizados cobrem inicialização, diferença entre versões e preservação do acervo anterior quando a captura estiver incompleta.

**Deoxys:** será registrado como espécie de origem se aparecer nos kits inspecionados. Isso **não** significa que Deoxys foi adicionado à campanha de Kanto (151), nem que todo golpe do seu kit é compatível com os 151.

## Regra para distribuir golpes

O inventário **não é a equipagem automática da campanha**. Para usar uma novidade em um Pokémon do Torre 2, exigir: correspondência canônica (incluindo aliases); renderer/animação existente e licença/permissão válida; compatibilidade por aprendizado ou TM documentada; desbloqueios de nível corretos; três golpes adequados no nível 5; ULT apenas no slot exclusivo a partir do nível 8; golpes mais fortes progressivamente até o nível 50; testes de dano, colisão, interface, persistência e Chromium. Priorizar componentes nativos já existentes e nunca substituir VFX/sprites aprovados.

Quando a integração exigir código novo, aplicar docs/agentes/POLITICA-GOLPES-INTEGRAL.md e trabalhar em branch isolada. A integração visual **não é considerada concluída** só porque um nome apareceu no JSON. Atualizações da biblioteca de metadados não modificam dados salvos, efeitos, sprites, motores de batalha ou as funções da Pokédex.

**Observação operacional:** alterações no GitHub via GITHUB_TOKEN feitas pelo próprio workflow podem não disparar outros workflows de push; portanto a sincronização do catálogo não afirma que houve novo deploy do jogo. Validação da publicação é uma etapa separada.
