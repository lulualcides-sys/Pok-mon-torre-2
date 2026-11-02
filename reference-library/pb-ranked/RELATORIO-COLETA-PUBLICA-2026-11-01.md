# PB Ranked — coleta pública incremental (01/11/2026)

## Novidade verificável

O [workflow #41377576123](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41377576123) comparou com sucesso quatro fontes públicas. **Grassy Glide passou a constar do elenco disponível de 127 Pokémon**; já aparecia no código AST anterior. Também foi detectada alteração no conjunto inicial de golpes de Greninja, mas os IDs atuais desse conjunto ainda precisam de conferência.

| Indicador | Antes | Leitura pública bem-sucedida |
|---|---:|---:|
| Nomes no AST | 283 | 283 |
| Nomes do elenco público | 245 | **246** |
| Nomes fora do elenco | 38 | **37** |
| Uso relatado em Practice vs Bot | 70 | 70 (sem novas partidas) |
| Nomes do elenco sem uso relatado | 175 | **176** |
| Pokémon | 127 | 127 |
| Treinadores | 28 | 28 |
| Estados de animação registrados | 3.815 | 3.815 |

**Nenhum golpe novo foi reproduzido ou confirmado em vídeo nesta etapa.** O plano incremental de 30 partidas cobre os 175 golpes originais, mas NÃO cobre Grassy Glide. Precisa ser replanejado quando o Pokémon que aprendeu o movimento for identificado e o slot padrão for confirmado.

A consulta de confirmação seguinte encontrou HTTP 502 em todos os endpoints públicos; não declarar o portador do golpe, nem presumir que Greninja seja responsável.

## Mapeamento de recursos aproveitáveis

A página oficial [PB Ranked](https://ranked.pokemonbattlegrounds.com/) informa controles AUTO/MANUAL, dash, acerto físico, distância, cura, clima, status, Protect e replay. O arquivo [CONTRATOS-PUBLICOS-COMBATE-2026-11-01.json](CONTRATOS-PUBLICOS-COMBATE-2026-11-01.json) classifica 30 regras como referências, separando os valores que não devem ser importados para o nosso balanceamento.

O Pokémon Torre 2 já tem módulos próprios de AUTO, esquiva, clima, coreografia de Pokébola e introdução VS. Usar primeiro os elementos aprovados; não duplicar golpes ou copiar VFX de terceiros.

## Estado dos ativos e evidências

- **Inventário estático existente:** 283 nomes, 127 Pokémon, 17 arenas por nome, 28 treinadores, 3.815 estados/entradas de animações.
- **Visual ainda pendente:** 176 golpes sem relatos dos lotes, animações quadro a quadro, coreografia completa de arremesso, layouts exatos das 17 arenas, trajetórias e colisões.
- **Automação de pesquisa sem créditos:** script de auditoria pública, testes e workflow em branch isolada; o relatório gerado no Actions fica disponível temporariamente como artefato. O script não autentica e não executa partidas.
- **Dano e clima do Torre 2:** regras aprovadas continuam prevalecendo, inclusive bônus próprios, cooldowns e progressão Gen III.

**Status:** pesquisa e comparação arquivadas na branch; nenhuma alteração de gameplay publicada, nenhuma nova batalha executada e nenhum ativo proprietário incorporado.
