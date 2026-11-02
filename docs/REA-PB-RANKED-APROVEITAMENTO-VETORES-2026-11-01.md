# Auditoria de aproveitamento — REA PB Ranked → Pokémon Torre 2

**Escopo:** reuso de ideias e dados quantitativos derivados da pesquisa já catalogada, com protótipos **originais**, sem copiar assets ou source e sem substituir golpes e sistemas aprovados.

## Matriz de decisão

| Recurso pesquisado | O que de fato foi obtido | O que já existe no Torre 2 | Decisão |
|---|---|---|---|
| 3.815 entradas de animações em 237 sprites | Contagem de quadros, duração em unidades não identificadas, índice de hit/rush/return | Renderização de golpes e sprites nativos | **ALTO:** usar ordinal apenas para prototipar sincronismo de efeitos *novos*; tempo real requer teste |
| 283 golpes estáticos, 246 disponíveis no elenco | Nomes, famílias hipotéticas, indícios estruturais | Biblioteca ampla, 45 nomes explicitamente protegidos pelo baseline | **ALTO para revisão**, **baixo para replicação cega**; cruzar nomes e learnsets antes de criar |
| Colisão entre frames | Não foi extraída como rotina testada do Battlegrounds; é técnica matemática original possível | Efeitos customizados já usam alguns segmentos swept contra alvos estáticos | **ALTO, condicional:** testar hitboxes móveis em protótipo antes de alterar regras |
| Ataque telegrafado | Marcadores de quadros, não gravação do combate | Efeitos de impacto aprovados | **MÉDIO:** protótipo visual sem alterar dano |
| Arco de Pokébola | Referência de interesse; arremesso completo do treinador PB não capturado | `torre2-ball-choreography.js` possui `ballArc`, raios e partículas originais | **REUTILIZAR EXISTENTE**; não inventar equivalência exata com PB |
| Esquiva / avanço | Família e controles relatados; trajetória exata sem vídeos | Esquivas nativas da Arena e campanha | **TESTAR** movimento original, preservar as esquivas aprovadas |
| AUTO / controles | Descrição pública e relatos parciais | `torre2-auto-battle.js` com IA e restrições | **NÃO PORTAR** lógica de IA sem dados medidos |
| Clima, status, cooldown, dano | Regras públicas do PB, não compatíveis por padrão | Gen III, clima customizado +20%/-20% e cooldowns aprovados | **NÃO IMPORTAR PARÂMETROS** |
| 17 nomes de arenas / 28 treinadores | Seletores por nome; layouts e coreografia não documentados | Arte, cidades e ginásios de Kanto próprios | **REFERÊNCIA NOMINAL**; não desenhar mapa “igual” sem evidência |
| Sprites e VFX de terceiros | IDs e estados, sem quadros arquivados/licença universal | PMD SpriteCollab e VFX aprovados | **NÃO IMPORTAR ASSETS** sem licença específica |

## Implementação entregue nesta branch (restrita ao Laboratório)

- `tools/pokearena/torre2-rea-vector-math.js`: curvas Bézier cúbicas, trajetória parabólica esquemática, suavização de esquiva, colisão **contínua** entre dois discos móveis e ordinais de quadros.
- `tools/pokearena/torre2-rea-vector-preview.js`: desenho pixelado original em Phaser/WebGL. Sequência alterna **projétil curvo, dash, arco de Pokébola**, com flash originado por interseção calculada, não por acerto automático. É somente um diagrama animado, não um ataque equipável.
- `tools/pokearena/torre2-laboratory.js`: botão **VER REA** aparece somente no Laboratório e permite abrir/fechar a demonstração. Não altera HP, modificadores, saves, modo AUTO, slots, oponentes, golpes ou VFX nativos.
- `tools/pokearena/build-preview.mjs`: copia os dois módulos para a versão do cliente e atualiza sua impressão digital de conteúdo; impede que cache sirva o módulo antigo.
- `tests/rea-vector-preview.test.js`: valida intervalos da geometria, interseção entre dois quadros, ausência de ataque e limpeza total da UI ao sair.
- `tests/rea-vector-browser.cjs`: abre o Laboratório no Chromium/Phaser, ativa o botão e salva screenshot real em `test-evidence/rea-vetor-laboratorio-real.png`, além de validar que o save permanece byte a byte intacto.

## Parâmetros do cenário de teste (escolhidos por nós)

Os trajetos do laboratório usam coordenadas próprias de **110–500 px** em espaço lógico 640×360, arco de 48 px e três ciclos demonstrativos de 1,8 s. **Esses números não foram medidos no Battlegrounds.** São escolhas de demonstração sujeitas a avaliação visual. Os ordinais de referência vêm do atlas: Attack aproximadamente 33%, Shoot 18%, Swing 63% da *ordem dos quadros* (não do tempo).

A colisão usa o movimento relativo:

`r(u)=a0-b0+u[(a1-a0)-(b1-b0)]`, com `u` de 0 a 1, e menor raiz válida de `||r(u)||²=(ra+rb)²`.

Diferentemente de verificar só as pontas do frame, o teste encontra contatos entre dois estados consecutivos. Para ataques curvos, subdividir em pequenos segmentos (a demonstração usa atualizações sucessivas); uma curva não é geometricamente igual a um único segmento.

## Critérios antes de promover alguma mudança de combate

1. Prova visual real e métricas de FPS/WebGL em laboratório, com screenshot e logs do teste.
2. Não alterar golpes aprovados, dano, tipos, cooldowns, capturas ou saves.
3. Comparar hitboxes móveis com a colisão nativa sob os mesmos cenários de acerto/erro antes de migrar para golpes novos.
4. Sem cópia de animações de jogos de terceiros nem atribuição de autenticidade a protótipos de nossa autoria.
5. Publicação só após testes de unidade e regressão relevantes e revisão da PR. **Esta branch não é publicada em main.**
