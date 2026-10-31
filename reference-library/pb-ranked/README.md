# Biblioteca de pesquisa — Pokémon Battlegrounds Ranked

**Origem:** https://ranked.pokemonbattlegrounds.com/  
**Objetivo:** preservar um inventário consultável de golpes, movimentos, animações, arenas, personagens e mecânicas **antes** de decidir o que vale implementar no Pokémon Torre 2.

**Escopo solicitado:** exclusivamente conteúdo de gameplay individual, sem PvP online, ranking ou multiplayer humano; a autenticação foi efetuada legitimamente pelo usuário no perfil privado do TinyFish para o treino contra bot. O titular do projeto informou autorização de acesso e uso **não comercial** para estudo. Não publicar arquivos brutos do jogo nem misturar ativos de terceiros no GitHub Pages sem comprovação do alcance dessa licença.

## RESULTADO DA PESQUISA ACELERADA — 31/10/2026 (leia primeiro)

- **283/283 nomes** do cliente público classificados por família técnica de ataque e sinais de áudio/VFX; [biblioteca de famílias](FAMILIAS-ESTRUTURAIS-283-GOLPES.json).
- **245 nomes** correspondem ao elenco público de 127 Pokémon; **38** só estão no JavaScript de origem.
- **70 nomes** apresentam algum relato de uso em partidas contra bot nos testes desta pesquisa; **175 ainda não têm uso relatado**. **10 desses 70 foram incluídos apenas pelo relatório agregado de baixa confiança de Muk/Exeggutor/Heracross**. Distinguir nível de evidência individual.
- **8 golpes de Kanto** foram disparados por teclado e mostraram alterações de recarga [na sessão testada](ATALHOS-CONFIRMADOS-KANTO-8-ATAQUES.json). **0 animações completas arquivadas quadro a quadro**.
- **Atalhos de teclado descobertos e testados** contornaram os botões instáveis: `1–4` golpe, `Z/X/C` troca, `T` modo. [Guia para uso futuro](ATALHOS-TECLADO-E-METODO-LOTE.md).
- Última equipe montada: **Malamar / Noivern / Pikachu**. A [sessão](ULTIMA-TENTATIVA-MALAMAR-NOIVERN-PIKACHU.json) ficou na fila #21 e terminou **sem golpes testados**.
- TinyFish tem saldo baixo (**US$0,488** consultados no encerramento); interromper tentativas pagas para não gastar créditos em partidas que não começam. **Não foi criada recarga nem automatização paga.**
- Todos os dados estão somente na branch de pesquisa. Nenhum VFX aprovado do Torre 2, jogo publicado ou save foi alterado. Nada de sprites/código proprietários foi copiado.

**Decisão técnica:** é inviável declarar os 245 golpes visualmente confirmados dentro desta rodada. A catalogação estática dos 283 foi concluída; a verificação visual individual depende de novas partidas com atalhos e evidência melhor.

---

## Histórico: ATUALIZAÇÃO — lote de 45 golpes com uso relatado (31/10/2026)

**Cobertura atual dos testes recentes:** **45/245 nomes de golpes** tiveram uso relatado dentro de partidas Practice vs Bot. Restam **200/245 sem uso relatado**. O cliente público contém **283 nomes**, sendo **38 fora do elenco público**; o número de VFX completos extraídos é **zero**.

### Novas partidas realizadas
- [Magnezone, Torkoal, Toxicroak — 11 golpes diferentes usados, 10 nomes inéditos](RESULTADO-QUINTA-PARTIDA-MAGNEZONE-TORKOAL-TOXICROAK.json). `Mud Bomb` não foi lançado. O agente relatou vitória **e** desmaio de toda a equipe, resultados inconsistentes: não registrar como vitória verificada.
- [Rillaboom, Scyther, Tauros — 12 usos diferentes relatados, 11 nomes inéditos](RESULTADO-SEXTA-PARTIDA-RILLABOOM-SCYTHER-TAUROS.json). O agente relatou oito cliques manuais e quatro usos no AUTO. Resultado final não informado. Sem confirmação quadro a quadro.
- [Estado cumulativo por nome, tipo e proteção de VFX aprovado](PROGRESSO-GOLPES-283-2026-10-31.json) e [log cronológico](LOG-PARTIDAS-EM-LOTES-2026-10-31.json).
- [Pesquisa do código público explicou o rótulo Unranked durante fila de Practice vs Bot](ROTAS-PRACTICE-E-UNRANKED-VERIFICADAS.md). O botão Practice envia modo `practice` e dificuldade; a etiqueta Unranked pode ser genérica.

**Qualidade da evidência:** `uso relatado pelo agente` não é `animação exata reproduzida`. As 45 entradas não autorizam copiar sprites/efeitos proprietários, nem alterar os 45 efeitos sobrepostos à política de aprovação do Pokémon Torre 2. **Nenhuma mudança na versão publicada.**

---

## Última partida contra bot — Lapras (registro histórico anterior) —  (31/10/2026)

A [sessão autenticada mais recente](https://agent.tinyfish.ai/runs/bd5f2e7f-c581-49b4-b8a3-0cdc26eceb32) observou três ações manuais de Lapras: **Ice Beam**, **Sing** e **Body Slam**. A partida ainda estava em andamento quando o agente saiu; não foi registrada vitória nem derrota. A descrição de partículas de gelo no Body Slam **não é prova do VFX desse golpe**, pois pode haver sobreposição de efeitos de ataques concorrentes.

**Progresso dos lotes recentes: 24/245 nomes com uso relatado, 221 sem uso relatado, zero arquivos de VFX completos.** Faltam nesta equipe **Iron Tail** e **Volt Tackle** do Pikachu, bloqueados porque o navegador não conseguiu acionar a troca com os IDs dinâmicos do banco.

- [Resultado da partida](RESULTADO-QUARTA-PARTIDA-LAPRAS-3-GOLPES.json)
- [Matriz de progresso atualizada](PROGRESSO-GOLPES-283-2026-10-31.json)
- [Log cumulativo](LOG-PARTIDAS-EM-LOTES-2026-10-31.json)

## Progresso real e retomar sem retrabalho — atualização final de 31/10

**24 nomes de golpes tiveram uso relatado durante partidas contra bot na coleta recente.** A cobertura técnica da biblioteca é 283 nomes; 245 estão no elenco público. Esses números não equivalem a animações 1:1 copiadas nem a implementação no Torre 2.

- [Status por golpe (283 registros, com 21 usos relatados)](PROGRESSO-GOLPES-283-2026-10-31.json)
- [Guia para sessões de navegador e correção de botões `stale`](GUIA-TESTE-LOTES-SEM-RETRABALHO.md)
- [Primeiro combate: Greninja/Aegislash/Ribombee — 12 usos](RESULTADO-PRIMEIRA-PARTIDA-12-GOLPES.json)
- [Segundo combate: Pikachu/Arcanine — vitória, nove usos, só quatro nomes distintos](RESULTADO-SEGUNDA-PARTIDA-9-USOS-4-GOLPES.json)
- [Terceiro combate: Lapras/Arcanine — derrota, três ataques manuais e cinco pendentes](RESULTADO-TERCEIRA-PARTIDA-3-GOLPES-MANUAIS.json)
- [Plano de menor esforço de edição — 37 partidas e 54 alterações planejadas](ESTRATEGIA-LOTES-SEM-RETRABALHO.md)
- [45 nomes com proteção documental por aprovação anterior](PRESERVAR-GOLPES-APROVADOS.md)

**Faltam registros de uso para 221 nomes do elenco público nesse acompanhamento de lotes.** Nenhum vídeo quadro-a-quadro nem recurso proprietário foi copiado.

---

## PESQUISA EM LOTES — todos os 283 nomes

O catálogo possui **283 nomes** analisados estaticamente, dos quais **245 pertencem ao roster público** de 127 Pokémon. Para evitar pesquisar golpe por golpe, os 245 nomes estão organizados em **21 lotes**, cada um com três Pokémon e quatro golpes por espécie, sem repetição de cobertura planejada. Os outros 38 aparecem no AST mas não num pool público do elenco.

- [Plano de 21 lotes](PLANO-EXECUCAO-EM-LOTES.md)
- [Plano estruturado 245 golpes](PLANO-LOTES-245-GOLPES.json)
- [Sinais de VFX de todos os 283 nomes](MATRIZ-EFEITOS-283-GOLPES.json)
- [Log das primeiras partidas/tentativas em lotes](LOG-PARTIDAS-EM-LOTES-2026-10-31.json)

**Não confundir:** a cobertura estática de todos os nomes é real; as 21 partidas são planejadas, não executadas. No primeiro combate em lote, só Petal Blizzard e Hydro Pump foram identificados como explicitamente acionados. Os demais nomes do HUD não foram considerados animações comprovadas.

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
