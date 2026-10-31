# Auditoria técnica — Pokémon Battlegrounds Ranked → Pokémon Torre 2

Data: 2026-10-31. Referência: https://ranked.pokemonbattlegrounds.com/ (sem parâmetros de rastreamento).

## Fontes, evidências e grau de confiança

1. **CONFIRMADO PELO TEXTO PÚBLICO DO JOGO:** regras publicadas em `How battles work` e `How stats and moves work` no próprio site, mais rótulos de interface.
2. **CONFIRMADO NO NOSSO REPOSITÓRIO:** nomes e contratos de módulos abaixo, inspecionados em `main` em 31/10/2026. Não significa que todos estejam visualmente aprovados em jogo real.
3. **PENDENTE DE REA EXECUTADO:** renderização visual, sprites, listas integrais de golpes, nomes e quantidade de arenas, trajetórias, tempos reais de lançamento de Pokébola, efeitos vistos em combate, comportamento da IA, observações WebGL e desempenho Android.
4. **NÃO AUTORIZADO:** copiar integralmente pacotes JS, sprites exclusivos, texturas, animações, áudio ou a aplicação do Battlegrounds. A leitura de arquivos entregues publicamente pelo navegador **não é** uma licença de redistribuição. A declaração de autorização para outro site (Poké Arena 2D) não se estende a este jogo.

### Mecânicas verificadas na documentação pública do PB Ranked

| Sistema | Evidência pública | Destino prioritário no Torre 2 |
| --- | --- | --- |
| Movimento | AUTO luta sozinho; MANUAL permite dirigir o Pokémon; arrastar na arena | Avaliar opção manual **somente em modo compatível**, sem alterar a Arena e HUD aprovadas |
| AUTO híbrido | É possível manter movimento/esquiva automáticos e controlar manualmente só os golpes | Alto valor: opção desacoplada de IA de locomoção e IA ofensiva |
| Esquiva | Dash direcional manual, recarga anunciada de 1,5 s; AUTO esquiva sozinho | Comparar com ESP nativa e cooldowns existentes; **não copiar 1,5 s sem balancear** |
| Golpes | Quatro botões, recarga individual; aura/glow apenas quando golpe pronto e alvo no alcance; golpes chamados aguardam a animação corrente | Implementar feedback de elegibilidade se ainda faltar, preservar ULT/slots |
| Precisão real | Feixes, projéteis e investidas podem errar se alvo se move; alguns ataques são não-esquiváveis | Melhorar detecção espacial e dano no impacto sem atingir VFX aprovado |
| Alcance | Classes perto / médio / longo | Reutilizar `alcance` da biblioteca e manter validação da IA |
| Atributos | Dano físico ATK/DEF; especial Sp.Atk/Sp.Def; STAB 1,5×; crítico informado 5%, 1,5× | Revisar conflitos com regras FRLG/Gen III antes de portar qualquer valor |
| Velocidade | Move-se mais rápido e aumenta chance de desvio; **não reduz cooldown** | Preservar separação `speed` × `cooldown` |
| Buffs | +1 multiplicador informado 1,5×; buffs terminam após troca; boosts limitados a 2 usos por entrada | Não trocar automaticamente as regras aprovadas da campanha |
| Clima | Rain Dance/Sunny Day: água/fogo; Sandstorm/Hail: dano periódico; duração publicada 15 s | Comparar com nosso sistema de clima, status e multiplicadores já existentes |
| Status | Burn, Poison/Toxic, Paralysis, Sleep, flinch e Double Team com iscas | Comparar contra implementação Gen III sem impor durações alheias |
| Transformação | Mega Evolution ou Battle Bond uma vez por batalha | **Futuro**, separado da captura e evolução de campanha |
| Regras online | 3×3 4 min, 6×6 7 min; último quarto em sudden death até 4× | Não transpor sudden death para líderes de ginásio; eventual modo especial |
| Batalha | Preview de equipe, troca no banco, KO, rematch, replay e até gravação 9:16/16:9 | Replays: candidato para sistema opcional; requer estudo de licenças/armazenamento |
| Metajogo | Prática vs bot, amigo, torneio, ranking, equipes salvas, histórico | **Baixa prioridade** frente à campanha existente |
| Arena | Há seletor de arenas em partida amistosa | Quantidade, dimensões, layouts e tilemaps **não verificados** |
| Treinadores/Pokébola | Existem seleção e nome de treinador; **arremesso visual de Pokébola não está documentado no material acessado** | Só estudar referências em vídeo/screenshot real antes de propor novo lançamento |

Fontes externas de referência: https://ranked.pokemonbattlegrounds.com/ e https://pokemonbattlegrounds.com/. O segundo afirma que seus golpes animados em pixel art são feitos individualmente, e identifica PMD SpriteCollab como origem de sprites (CC BY-NC 4.0).

## Estado e oportunidades reais no nosso jogo

| Área que já existe | Arquivos de início | Trabalho útil e limites |
| --- | --- | --- |
| AUTO agressivo | `tools/pokearena/torre2-auto-battle.js` | Não reimplementar; medir pausa, caça de alvos, distância e agressividade |
| Esquiva por golpes | `tools/pokearena/torre2-campaign-native-dodges.js`, `torre2-arena-native-dodges.js` | Comportamento novo isolado; ataques/ESP aprovados permanecem |
| Captura/pokébola | `tools/pokearena/torre2-ball-choreography.js`, `torre2-capture-mechanics.js` | Manter arco, abertura, raio, balanços e GOTCHA que já foram aprovados |
| Climas e status | `tools/pokearena/torre2-weather.js`, `torre2-gen3-status.js` | Verificar diferenças com referência em testes, não trocar regra da campanha |
| Cenários e combate | `src/arena-v03.js`, `tools/pokearena/torre2-campaign-scene.js` e cliente Phaser em `tools/pokearena/` | Não substituir HUD ou renders da Arena; cenas novas exigem aprovação e testes |
| Golpes e efeitos | `data/move-reuse-policy.json`, biblioteca `torre2-*-fx.js` | Reuso primeiro; efeitos novos somente na engine autorizada e com proveniência |
| Controles | `tools/pokearena/` e testes `tests/arena-real-touch-browser.cjs` | Testar Android/touch e 16:9 antes de mudanças em produção |

## Ordem técnica recomendada

1. **P0 — REA e prova visual:** coletar domínios públicos, DOM, opções do seletor de arena, metadados, capturas da interface e inventário de módulos com `REA`. Separar `observado`, `inferido`, `inacessível`. O pipeline está em `.github/workflows/pb-ranked-rea-audit.yml`, relatório de execução é um *artifact* GitHub Actions, nunca declarado concluído antes de logs.
2. **P1 — Movimento e esquivas reais:** cena-protótipo independente; IA autônoma com distanciamento tático, trajetória lateral, recuperação após golpe, esquiva reativa por projétil e invulnerabilidade medida. Dano somente após colisão. Sem alterações simultâneas na campanha.
3. **P2 — Feedback de golpe:** botão com indicação `cooldown + energia + alcance + estado do ator`, enfileiramento seguro enquanto outra animação termina, indicação clara quando ação é inviável.
4. **P3 — Animações de treinador/Pokébola:** registrar pose e sequência a partir de jogo/vídeos comprovados; adaptar **apenas** nova pose de arremesso que seja original. Não modificar a captura aprovada nem prometer que o Ranked possui arremesso até ser visto.
5. **P4 — Arenas:** inventariar layouts acessíveis (luz, sombras, camadas, colisões e câmera). Criar cenários originais sem asset de terceiros. Priorizar a campanha Kanto e Cerulean já autorizada.
6. **P5 — catálogo de golpes:** confrontar técnicas realmente observadas com nosso catálogo e as quatro fontes existentes; mapear categoria, espécie elegível, startup, deslocamento, impacto, som e duração; criar apenas lacunas de alto valor.
7. **P6 — modos online/replay/ranking:** só depois de estabilizar combate e saves; custo de servidores, segurança e manutenção não se justificam durante correções da campanha.

## Critérios para aceitar um patch posterior

- Não mexer em `main`/Pages sem suite focal + CI real + preservação de dados, HUD e VFX aprovados.
- Sempre atribuir a origem e identificar o que foi *inspirado* versus código/arte com licença. **Não incorporar scripts e assets deste terceiro.**
- Testar dash quando há projétil, colisão na borda, pausa durante recarga, ataques após troca/desmaio e frame rate mobile.
- Dois perfis devem ser avaliados: AUTO normal e AUTO agressivo já aprovados; sem dar bônus oculto de ataque/vida à IA.
- Auditoria REA de página inicial **não** prova que entrou na partida, leu toda arena, registrou cada golpe ou capturou uma Pokébola sendo lançada.

## Roteiro REA

O workflow usa Chrome com perfil descartável; `rea inspect-web-page` e `rea analyze-web-bundle` em sessão CDP local. Guarda relatórios derivados, diagnóstico e screenshot público por 7 dias. Não entra com usuário, não abre endpoints privados, não coleta valores de storage e não copia JavaScript de origem. Se o site exigir cadastro, bloqueio ou não expuser o jogo, declara cobertura parcial e **não tenta contornar isso**.

Documentação de REA: https://github.com/morluto/rea/blob/main/docs/browser-observation.md
