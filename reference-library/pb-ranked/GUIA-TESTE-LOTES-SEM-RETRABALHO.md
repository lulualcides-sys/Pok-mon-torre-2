# Procedimento de pesquisa em lotes — Pokémon Battlegrounds (Practice vs Bot)

**Atualizado em 31/10/2026.** O objetivo é continuar a coleta de golpes sem repetir tarefas e sem confundir **execução de ataque** com **captura de todos os quadros do VFX**.

## Estado retomável

- Biblioteca do cliente público: **283 nomes distintos**, **245** listados no pool de 127 espécies, **38** apenas no AST.
- Plano de custo de edição menor: **191 nomes** presentes em algum moveset padrão, **54** nomes que exigem edição; [plano validado em CI](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41240014748).
- Os testes recentes em partidas contra bot contabilizam **21 nomes de golpes usados segundo o agente**. São **21/245**, não 245/245.
- **Nenhuma animação 1:1** arquivada quadro a quadro neste repositório.
- Equipe mais recente vista: **Pikachu / Arcanine / Lapras**; a última batalha terminou em derrota em Mt. Silver Summit. Não assumir que o Team Builder ainda guarda a equipe sem verificar.
- Próximos cinco golpes específicos desta equipe que não foram executados naquele lote: **Ice Beam, Sing, Body Slam (Lapras), Iron Tail e Volt Tackle (Pikachu)**. Outros golpes de homônimos em outras espécies podem ter evidência prévia, mas estes cinco não foram registrados nessa sessão.

## Procedimento de acesso e configuração

1. Usar somente o **perfil autenticado previamente salvo pelo próprio usuário** no TinyFish. Não pedir senha nem gravar cookies no GitHub, log ou arquivo de pesquisa.
2. Abrir `ranked.pokemonbattlegrounds.com` e verificar se há uma equipe 3/3; **não limpar o time** sem necessidade.
3. Quando for necessário mudar Pokémon, usar o **filtro de busca pelo nome exato**, clicar no resultado da espécie e confirmar a mensagem `[Name] joined your team (N/3)`. Em uma sessão, clicar na aba de geração não adicionou a espécie; isso levou a uma falha evitável.
4. Usar apenas **PLAY → Practice vs Bot → 1 EASY**, nunca Ranked/humanos. A fila de servidor pode existir mesmo para bot; se houver aviso de manutenção, registrar o bloqueio e encerrar a tentativa em vez de gastar créditos em reconexões repetidas.
5. Na batalha, conferir se o controle está em `MANUAL` ou `AUTO` e **registrar qual dos dois executou cada golpe**.

## Corrigir o principal erro de navegação: botão desatualizado

Durante [o teste de Lapras/Arcanine](https://agent.tinyfish.ai/runs/21383781-c0bc-46e8-be68-157dcbeede01), vários botões foram identificados com referências transitórias e ficaram `stale` quando o estado da batalha mudou. O agente não conseguiu clicar em cinco golpes antes da derrota.

- **Não reutilizar IDs de botões** depois de um golpe, troca, dano, desmaio ou mudança no HUD.
- Buscar novamente, pelo **nome legível da ação**, o botão `Use <MoveName>` ou o slot de golpe, no estado da UI mais recente.
- Se a ação falhar por stale element, renovar o elemento e tentar no máximo uma vez, enquanto o Pokémon estiver vivo; depois seguir ao próximo golpe para economizar créditos.
- Priorizar golpes ainda sem evidência; não deixar o AUTO repetir o mesmo ataque indefinidamente.
- Registrar por golpe: `visível`, `clicado`, `uso relatado`, `impacto textual`, `VFX identificado`, `quadros arquivados`. Os seis campos são **independentes**.

## Classificação de prova

| Nível | Definição | O que autoriza afirmar |
| --- | --- | --- |
| A — AST | Nome, tipo, atributos e chamadas do JavaScript público | O golpe está declarado no cliente |
| B — Elenco | O Pokémon tem aquele golpe nos defaults/pool do roster público | O golpe é configurável para a espécie conforme o arquivo |
| C — HUD | Botão aparece em partida | Aparece no menu de combate |
| D — Execução | Cliques ou AUTO relatados pelo agente e mudança visível no combate | Ação executada/referida naquela batalha |
| E — Visual | Morfologia concreta, trajetórias e impactos documentados com prova de cena | Referência visual para redesenho original |
| F — Quadros | Spritesheets/frames com origem/licença e sequência verificada | Pode alimentar implementação dependendo da licença |

**Estado atual do log recente:** 21 nomes em nível D relatado pelo navegador (nem todos com morfologia E detalhada), **0 arquivos de quadros F**. Não declarar 21 animações idênticas prontas.

## Arquivos para retomar sem ler dezenas de relatórios

- [Progresso atualizado dos 283 nomes](PROGRESSO-GOLPES-283-2026-10-31.json).
- [Log das partidas em lote](LOG-PARTIDAS-EM-LOTES-2026-10-31.json).
- [Plano padrão-primeiro (37 partidas propostas)](PLANO-PADROES-PRIMEIRO-245-GOLPES.json).
- [Matriz das 610 variantes / 283 nomes](golpes-mecanicas-ast.json).
- [45 nomes protegidos contra alteração](PRESERVAR-GOLPES-APROVADOS.md).

**Regra final:** estudar e catalogar em branch de pesquisa. Não sobrescrever golpes já aprovados, não modificar a Arena HUD, Cerulean, saves ou a versão publicada, não copiar código/sprites proprietários sem licença e aprovação específica.
