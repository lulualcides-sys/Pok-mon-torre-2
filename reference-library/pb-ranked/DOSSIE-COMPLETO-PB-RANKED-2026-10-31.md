# DOSSIÊ TÉCNICO — Pokémon Battlegrounds → Pokémon Torre 2

**Data:** 31 de outubro de 2026  
**Objetivo:** levantar de forma verificável o máximo de golpes, Pokémon, animações, arenas, treinadores e mecânicas acessíveis, para comparação e futura implementação **original** no Pokémon Torre 2. O modo online/multiplayer está fora do escopo.  
**Ambiente:** branch `research/pb-ranked-rea-20261031`; não tocar em `main`, HUD aprovado da Arena, saves ou Cerulean.

## 1. Resumo quantificado e escopo

| Item | Quantidade verificada | Fonte e cobertura |
| --- | ---: | --- |
| Nomes distintos de golpes declarados no cliente público | **283** | [AST do bundle público](golpes-mecanicas-ast.json) |
| Declarações/variantes de implementação desses golpes | **610** | Mesma fonte; variantes não significam 610 golpes diferentes |
| Nomes de golpes presentes no elenco jogável público | **245** | [Relações do roster](pokemon-movesets-estatisticas.json) |
| Golpes declarados no AST que não aparecem no elenco público | **38** | Diferença de inventários; podem pertencer a modos, NPCs, bosses ou código não usado |
| Pokémon no elenco público | **127** | [Roster completo](pokemon-movesets-completos-publicos.json), espécies/formas específicas |
| Combinações espécie × golpe no conjunto de movimentos | **2.252** | Metadados públicos do roster; NÃO são learnsets oficiais do Torre 2 |
| Golpes iniciais padrão mapeados | **508** | 127 espécies × 4; **zero IDs não resolvidos** |
| Identificadores de sprites animados | **237** | [Manifest de animação](animacoes-marcadores-estados.json) |
| Registros de animação | **3.815** | 237 grupos × estados disponíveis, **não spritesheets copiados** |
| Arenas no seletor público | **17** | [Seletor de arenas e treinadores](arenas-e-treinadores-curados.json) |
| Treinadores no seletor público | **28** | Mesmo arquivo; `trainers.json` confirmou lista |
| Nomes de habilidades no elenco | **72** | [Resumo do roster](pokemon-movesets-estatisticas.json) |
| Famílias de tipos Pokémon | **18** | Catálogo de golpes |

Estes números contam **o que os arquivos públicos contêm**, não o que foi efetivamente demonstrado em batalha ou está autorizado para reprodução.

## 2. Biblioteca de golpes por espécie

O inventário `pokemon-movesets-completos-publicos.json` contém, para cada uma das 127 entradas do elenco: nome, geração, tipos, habilidade, existência de Mega, quatro IDs de golpes iniciais devidamente resolvidos em seus nomes, lista de ataques selecionáveis, tipo, categoria (físico/especial/status), poder, valor numérico de `cd` e descrição curta de alcance. Nenhuma descrição literária de terceiros foi copiada.

A correspondência foi conferida com `golpes-mecanicas-ast.json`, que contém 283 nomes de golpe e suas variantes de execução. O novo [catálogo mestre legível](CATALOGO-MESTRE-283-GOLPES.md) lista esses golpes por tipo e assinala a existência no catálogo anterior de Poké Arena 2D e na baseline histórica do Torre 2.

**Crítica de uso:** `cd` NÃO deve ser interpretado automaticamente como segundos. Poder e cooldown do PB Ranked não são valores homologados para o motor de dano ou de recargas do Torre 2.

## 3. Animações e marcadores de impacto

O inventário `animacoes-marcadores-estados.json` descreve identificadores e estados tais como `Idle`, `Walk`, `Attack`, `Hurt`, `Sleep`, `Charge`, `Rotate`, `Hop`, `Swing`, `Shoot`, `Strike`, `Twirl`, `SpAttack`, `RearUp`, `Cringe` e outros.

Cada registro resume contagem de quadros, dimensões declaradas, duração total em unidades do manifest e índices `rush`, `hit` e `ret`. Por exemplo, `Attack` aparece em aproximadamente 236 grupos; `Shoot` em 229, `Hop` em 234. Isso permite planejar animações próprias com sincronização precisa de golpes e impacto, **sem fazer cópia de spritesheets**.

## 4. Combate real vs. código estático

Sessões de navegador autenticadas no [TinyFish](https://agent.tinyfish.ai/), com perfil Google fornecido pelo próprio usuário, acessaram **Practice vs Bot**, testaram modo AUTO, MANUAL, DODGE e trocas. Os relatos anteriores registraram golpes de Tyranitar, Crobat e Snorlax, além de efeitos de dano e mensagens de efetividade.

Uma [sessão adicional com Charizard](https://agent.tinyfish.ai/runs/352a0387-8aed-4333-bf02-da22ee9b183b) relatou Charizard ativo em batalha usando `Flamethrower`, `Fire Blast`, `Dragon Claw` e `Air Slash`, com efeitos respectivamente alaranjados, explosão amarela, garra roxa e corte/vento azul. O agente também relatou Body Slam e Earthquake em Snorlax. **Esses são relatos visuais da automação, não quadros do vídeo arquivados no GitHub.**

O **REA** foi executado no navegador público em GitHub Actions; não se conectou à sessão autenticada do TinyFish. Portanto, esta pesquisa combina **dois métodos independentes**; não afirmar que o REA capturou diretamente todas as animações autenticadas.

## 5. Arenas e treinadores

Os 17 nomes de arena foram registrados em [arenas-e-treinadores-curados.json](arenas-e-treinadores-curados.json). Sessões reais observaram N's Castle, Mt. Silver e outras cenas sem atribuição conclusiva. Os 28 nomes de treinadores foram confirmados em `trainers.json`.

A extração pública de metadados de terreno recuperou uma estrutura de tile atlas de **Meteor Falls** com campos `step`, `size` e `ids`. **Não há mapa completo nem atlas original das 17 arenas neste repositório**. Mapas originais exigem criação artística licenciada/independente.

## 6. Pokébola do treinador — requisito de prova

O objetivo prioritário é compreender a **coreografia de lançamento de Pokébola**: preparação do personagem, gesto do braço, arco da esfera, abertura, raio/energia, materialização, fechamento e retorno/troca. Até então, as sessões mostraram ícones de Pokébolas e trocas em combate, **mas não provaram a sequência completa**. Não deduzir um arremesso apenas de um botão `Switch`, nem confundir a animação de **captura de selvagens** com a troca de Pokémon treinados.

O próximo protótipo, se aprovado, deve ser **original em pixel art Phaser/WebGL**, reaproveitando o que já existe e sem quebrar a captura Gen III aprovada.

## 7. Priorização crítica para o Pokémon Torre 2

| Prioridade | Sistema | Critério de aceite |
| --- | --- | --- |
| 1 | **Entrada/troca do Pokémon e Pokébola do treinador** | Pesquisa visual suficiente, animação original, sincronismo da esfera com troca, preservação da captura existente |
| 2 | **Movimento/ataque/sincronismo de impacto** | Distância, animação, posição, `hit` no quadro correto, dano sem atraso, 60 FPS alvo testado |
| 3 | **Feedback de golpes** | `MISS`, efetividade, cooldown e hit sparks discretos, sem substituir VFX aprovados |
| 4 | **Cenários** | Criar arenas originais de qualidade profissional; sem tirar prioridade de Cerulean e cidades de Kanto |
| 5 | **Repertório de golpes** | Consultar 283 nomes como fonte adicional, sem duplicar o que existe; checar learnsets oficiais, ULT e balanceamento |
| 6 | **AUTO e DODGE** | Só ampliar a IA e esquiva onde há melhoria demonstrável; preservar interface aprovada da Arena |

## 8. Arquivos e testes

- [Catálogo mestre por tipo — 283 nomes](CATALOGO-MESTRE-283-GOLPES.md)
- [Metadados AST de 610 variantes](golpes-mecanicas-ast.json)
- [127 Pokémon e 508 golpes iniciais / 2.252 combinações](pokemon-movesets-completos-publicos.json)
- [237 IDs de sprites e 3.815 estados animados](animacoes-marcadores-estados.json)
- [Esquemas públicos de terrenos, treinadores, roster](fontes-cenarios-treinadores-resumo.json)
- [Observações reais contra bot anteriores](AUDITORIA-COMBATE-AUTENTICADO-2026-10-31.md)
- [CI análise profunda de movimentos](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41236832937)
- [CI indexação de animações](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41237060476)
- [CI matriz espécie × golpe](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41237321628)

**Status de implementação:** pesquisa e documentação salvas na branch isolada. **Zero alterações validadas ou publicadas no jogo por este dossiê.**
