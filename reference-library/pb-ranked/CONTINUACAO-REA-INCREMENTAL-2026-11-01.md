# Continuação REA PB Ranked — plano incremental e validação (01/11/2026)

## Resultado executado nesta etapa

Foi criado um plano incremental **validado contra o inventário existente**, sem usar a carteira TinyFish, sem editar o código executável do Pokémon Torre 2 e sem alterar o progresso do jogador. O arquivo de execução é [PLANO-INCREMENTAL-175-PENDENTES-2026-11-01.json](PLANO-INCREMENTAL-175-PENDENTES-2026-11-01.json).

### Números conferidos

| Indicador | Valor | Evidência |
|---|---:|---|
| Golpes no AST público | 283 | catálogo de pesquisa |
| Golpes disponíveis no elenco público | 245 | roster de 127 entradas |
| Golpes com algum uso relatado pelo navegador | 70 | matriz de progresso; **não** são VFX integralmente verificados |
| Pendentes de relato de uso | **175** | complemento dos 245 |
| Pendentes presentes em slot padrão | **121** | roster/defaults, sem editar moveset |
| Pendentes exigindo troca de golpe | **54** | roster/plano de edição existente |
| Pendentes sobrepostos à política de proteção Torre 2 | **31** | preservar golpe/VFX aprovado |
| Plano anterior para todos os 245 | 37 partidas | cronograma teórico ainda não executado |
| Novo plano incremental | **30 partidas**: 22 com defaults e 8 com edições | cobertura exata validada por nomes e IDs |
| Golpes programados repetidos | **0** | teste de cobertura |
| IDs de golpes configurados verificados | **360/360** | conferidos com o pool de cada Pokémon |
| VFX arquivados quadro a quadro | **0** | nenhum registro confiável adicional |

A redução de **37 para 30 partidas planejadas** significa sete partidas a menos no roteiro **teórico**, não sete partidas reais economizadas. As 70 utilizações relatadas permanecem com a qualificação original, e não equivalem a 70 animações verificadas.

## Primeiros lotes calculados (somente plano)

1. **Altaria / Scream Tail / Talonflame** — candidatos como Double Team, Moonblast, Play Rough, Hyper Voice, Brave Bird, Steel Wing.
2. **Umbreon / Ampharos / Armaldo** — candidatos como Iron Tail, Moonlight, Power Gem, Dragon Pulse, Water Pulse, Ancient Power.
3. **Empoleon / Feraligatr / Golurk** — candidatos como Aqua Cutter, Ice Spinner, Dragon Dance, Shadow Punch, Dynamic Punch e Heavy Slam.

A última equipe salva no navegador era **Malamar / Noivern / Pikachu**. Ela pode ser reutilizada primeiro, se a sessão e o jogo ainda estiverem disponíveis; isso altera a ordem real de execução, não a validade do inventário. Recomenda-se testar primeiro **Iron Tail** e **Volt Tackle**, depois voltar à cobertura incremental; evitar montar equipes repetidas.

## Regra de evidência por golpe

Para alterar o status de um movimento, registrar espécie, golpe, sessão, tipo de comando, estado anterior e posterior, frame ou vídeo da execução, animação/alcance observado, impacto/efeito no alvo e cooldown medido externamente em segundos. Se apenas a tecla mudou de estado ou o agente afirmou um uso, registrar **uso relatado**, não animação comprovada.

A REA analisou os recursos públicos; o navegador autenticado TinyFish constituiu investigação separada. Não declarar que REA executou os golpes dentro da sessão autenticada.

## Obstáculos e ação correta

- **Servidor/fila:** não contar partida não iniciada como teste; uma fila interrompida não valida golpe algum.
- **Custos:** saldo TinyFish confirmado de **US$ 0,488** ao consultar. O serviço cobra por passo, portanto campanhas extensas sem prova visual podem gastar o saldo sem resolver a lacuna. Não foram executadas novas partidas pagas nesta atualização.
- **Identificadores de tela:** preferir atalhos efetivamente testados, T, Z/X/C e 1–4, conferindo configuração de teclas em cada sessão.
- **Dados dinâmicos:** roster e IDs refletem a captura pública em 31/10/2026; conferir se os golpes ainda aparecem antes de usar.
- **Direitos/qualidade:** manter esta coleta apenas como pesquisa. Criar artes originais ou usar material licenciado; não copiar assets proprietários, não reescrever os VFX aprovados do Torre 2 e não publicar patches sem teste de Phaser/WebGL.
- **Pokébola do treinador:** o arremesso completo não foi observado nas partidas documentadas. Não descrever como copiado ou implementado; a alternativa é prototipar coreografia original e testar.

## Gate de consistência

O teste [pb-ranked-incremental-plan.test.cjs](../../tests/pb-ranked-incremental-plan.test.cjs) confirma conjuntos disjuntos, os 175 alvos, 360 IDs de pool por Pokémon, 3v3, 30 partidas planejadas, 54 substituições e ausência de declarações de batalhas executadas. Rodar com:

~~~bash
node --test tests/pb-ranked-incremental-plan.test.cjs
~~~

**Estado:** arquivos de pesquisa preparados; **nenhuma nova luta efetuada** e **nenhum patch de gameplay integrado**.
