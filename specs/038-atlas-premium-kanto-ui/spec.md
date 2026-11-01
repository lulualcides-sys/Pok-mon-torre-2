# UI Atlas premium — referências de 4 imagens (01/11/2026)

**Usuário:** solicitou implementar os quatro conceitos visuais no código do Pokémon Torre 2, mantendo pixel art detalhada (Opção C) e o jogo real. Nenhuma screenshot conceitual pode ser usada como textura de fundo pronta.

## Requisitos visuais e entregas desta branch (PR #443)

| Referência | Direção visual | Patch presente | Pendente |
| --- | --- | --- | --- |
| 1. HUD + insígnias + Mart + recompensas | azul-marinho, moldura pixel clara, badges FRLG grandes, equipe e dinheiro REAIS, preços desbloqueados, recompensas do último combate | Estojo de 8 insígnias clicáveis e Poké Mart redesenhados, ambos usando save + sprites originais | Layout completo do hub em uma única tela e redesenho do relatório de batalha (já existente) |
| 2. Brock e Onix | rocha autêntica, líder/sprite ace proporcional, texto do ginásio, badge/TM e CTA | Entrada de líder no Phaser mostra sprite FRLG do treinador, retrato PMD do ace real, sala com rocha/água/etc, gate de confronto preservado | revisão artística e alinhamento com PR #421 dos ginásios interiores completos |
| 3. Sumário Bulbasaur | retrato grande, tipos, HP, barras de estatísticas, evoluções, golpes/TM navegáveis | Nova FICHA visual conectada ao editor original, com dados da equipe e botões funcionais; editor de 4 slots intacto | retratos e evolução visual lado a lado, TM compatibilidade com painel completo, tabs de 'Seen/Caught' |
| 4. Lorelei, Bruno, Agatha, Lance e Campeão | salas realmente distintas por gelo/rocha/fantasma/dragão/centro azul, pixel art coerente | Cinco fundos/arquiteturas próprias na apresentação oficial de estágio 8–12 | interiores exploráveis completos + validação artística desktop/mobile |

## Critérios inegociáveis

- **Usar dados reais:** saldo `state.money`, insígnias `state.badges`, loja `martItemUnlocked`, recompensas `GYM_TM_REWARDS`, `STAGES[stage].boss`, equipe e `pokemonStats`; nunca usar valores dos mockups como fake saves (por exemplo, 12.540, Charmeleon 33 ou insígnias aleatórias).
- **UX em Phaser, não imagens coladas**: modelos puros de apresentação + elementos gráficos dinâmicos, sprites FRLG/PMD já presentes e zonas de clique reais.
- **Nunca modificar mecânica**: stages/treinadores/rival/Rocket, XP, insígnias, recompensa, loja, HP/RNG, captura, moveset/ULT, cooldowns, IA, Arena VFX, HUD de batalha, schema de save.
- **Mapa e ginásio:** este patch é da interface de apresentação, NÃO altera as PRs #421/#426–#435 de mundo e ginásios exploráveis; não merge sem conferir conflitos.
- **Identidade C:** acabamento comum, ambientes diferentes, não salas idênticas recoloridas. Teste de geometria compara cinco salas da Liga.
- **Evidência real:** unitários + build original + Chromium WebGL 1280×720 e 854×480; 8 badges, compra não disparada no teste, retorno, sumário, ace Onix e save byte idêntico. Capturas só são «reais» após artefato gerado pelo runner e inspecionado. Teste mobile viewport NÃO é Android físico.
- **Não integrar sem gate verde e aprovação artística.** PR permanece DRAFT.

## Auditoria de compatibilidade

O cliente externo vem alterando `escenas/carga.js` e o preload opcional `ui-balls`. Para este teste foi reaproveitada a função de compatibilidade estrita da PR #436 com seus testes; é uma correção técnica isolada que não deve apagar outros recursos. Caso outras origens HTTP 404 bloqueiem, registrar motivo e não inventar capturas.

## Próximas frentes distintas

1. Inspecionar screenshot real do novo Badge Case/Mart/Gym/Ficha/Liga, ajustar proporções e sobreposição; nunca confundir compilação com estética aprovada.
2. Redesenhar o **Battle Rewards** com dados retornados por `makeBattleReport`, mantendo os eventos de XP/nível/novos golpes verdadeiros.
3. Unificar o cabeçalho do hub e a navegação de PC/Pokédex/TM mantendo todos os hotspots e dados reais, com screenshots desktop/mobile.
4. Integrar com mapa Cerulean/rotas e ginásios interiores existentes após resolução de branches e aprovação visual da Opção C.
