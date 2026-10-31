# Biblioteca de pesquisa — Pokémon Battlegrounds Ranked

**Origem:** https://ranked.pokemonbattlegrounds.com/  
**Objetivo:** preservar um inventário consultável de golpes, movimentos, animações, arenas, personagens e mecânicas **antes** de decidir o que vale implementar no Pokémon Torre 2.

**Escopo solicitado:** exclusivamente conteúdo de gameplay individual, sem PvP online, ranking ou multiplayer humano; a autenticação foi efetuada legitimamente pelo usuário no perfil privado do TinyFish para o treino contra bot. O titular do projeto informou autorização de acesso e uso **não comercial** para estudo. Não publicar arquivos brutos do jogo nem misturar ativos de terceiros no GitHub Pages sem comprovação do alcance dessa licença.

## STATUS CONSOLIDADO — 31/10/2026 (substitui o histórico antigo abaixo)

**Pesquisa concluída nesta rodada:** 283 nomes distintos de golpes em 610 variantes, 127 Pokémon no roster, 508 golpes iniciais mapeados, 2.252 entradas espécie × golpe, 237 IDs de sprites e 3.815 registros de animação. Há 17 arenas e 28 treinadores no catálogo público. A sessão autenticada permitiu observar golpes em combate.

**Consulta prioritária:** [Dossiê técnico e decisões para o Torre 2](DOSSIE-COMPLETO-PB-RANKED-2026-10-31.md).

- [283 golpes por tipo](CATALOGO-MESTRE-283-GOLPES.md) e [610 variantes técnicas (JSON)](golpes-mecanicas-ast.json).
- [127 Pokémon, quatro golpes iniciais, pools e valores por espécie](pokemon-movesets-completos-publicos.json).
- [3.815 registros de animação e marcadores de impacto](animacoes-marcadores-estados.json).
- [Dados das arenas/treinadores](arenas-e-treinadores-curados.json), [resumo das fontes públicas](fontes-cenarios-treinadores-resumo.json).
- [Combates autenticados observados](AUDITORIA-COMBATE-AUTENTICADO-2026-10-31.md), [Cerulean Cave e trocas/Pokébola](CERULEAN-CAVE-TROCA-POKEBOLA-OBSERVADA.json).
- [Resumo estatístico dos pools](pokemon-movesets-estatisticas.json).

**Limitações:** REA/AST analisou arquivos públicos, enquanto as partidas autenticadas foram operadas pelo TinyFish; não são a mesma sessão. São catálogos de metadados, não cópias de sprites ou código. Em Cerulean Cave a entrada e duas trocas **não mostraram arremesso de Pokébola**; isso não prova ausência global em outros modos.

---

## Arquivos do coletor de 31/10/2026

| Arquivo | Conteúdo | Como interpretar |
| --- | --- | --- |
| `catalogo-geral.json` | Totais e cobertura da coleta | Não representa conteúdo completo do jogo |
| `golpes-candidatos.json` | Objetos estáticos com atributos de poder, tipo, dano, recarga, alcance | Podem incluir itens desativados ou auxiliares; exigem checagem |
| `movimentacoes-animacoes.json` | Estados do ator, controles e caminhos animados | Nome de função/animação não prova execução |
| `arenas-e-cenarios.json` | Nomes de cenário e recursos de arte do ambiente | Não equivale a mapa extraído |
| `treinadores-pokebolas.json` | Referências visíveis a treinadores e coreografias | Não prova lançamento de Pokébola |
| `analise-js-rea.json` | Inventário por módulo, SHA-256, tamanho, estados, estruturas e candidatos | Metadados produzidos por AST, não código do terceiro |
| `recursos-publicos.json` | URLs de recursos públicos observados no carregamento | Lista de origem, não cópia dos assets |
| `navegacao-e-acesso.json` | Telas de teste, ações tomadas e limitação de acesso | Permite saber se chegamos à batalha |

A geração dos arquivos é feita por `tools/research/pb-ranked-deep-catalog.cjs` e `.github/workflows/pb-ranked-deep-catalog.yml` em branch isolada. Screenshots e evidência REA ficam em artefato temporário do Actions; o repositório guarda somente **catálogos derivados**.

## Como aproveitar no Torre 2

1. Confrontar primeiro com os golpes e animações *já aprovados*, usando `docs/agentes/POLITICA-GOLPES-INTEGRAL.md` e as quatro fontes obrigatórias anteriores. Este novo site é **referência adicional**, nunca substituto.
2. Para cada candidato, registrar `id/nome`, espécie válida, tipo, fórmula, alcance, recarga, duração, animação, trajetória, impacto, VFX, áudio e proveniência. Deixar `não observado` em campos sem evidência.
3. Preferir *movimentação + esquiva + sincronismo de impacto* como primeiro protótipo independente. Nenhuma mudança na HUD da Arena, nos ataques aprovados, na campanha Cerulean ou nos saves durante a catalogação.
4. Testar um candidato em Phaser/WebGL antes de qualquer integração. Distinguir `inspirado`, `recriado`, `reutilizado com licença`.
5. Não substituir os cooldowns, status/clima, slots ULT ou equilíbrio atuais pelos valores do site automaticamente.

## Cobertura e limitações

A primeira coleta [REA pública em 31/10](../../docs/REA-PB-RANKED-RESULTADO-2026-10-31.md) confirmou apenas a página e os metadados públicos: 17 nomes de arena e categorias de animação. O novo coletor tenta **treino contra bot** e indexa os scripts públicos, mas não tenta login ou contornar permissões. Se nenhuma partida for aberta, os dados continuam sendo **análise estática**, não gravação de gameplay.

**Não chamar a biblioteca de completa** enquanto faltarem demonstrações em partida, validação de golpes e análise de conteúdo que só existe após autenticação.
