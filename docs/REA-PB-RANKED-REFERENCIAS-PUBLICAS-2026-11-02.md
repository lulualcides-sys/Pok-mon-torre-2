# REA — PB Ranked: referências públicas complementares (02/11/2026)

## Escopo e evidência

Esta revisão relaciona o material **público** acessível em 02/11/2026 com a branch `feat/rea-vector-lab-preview-20261101` e a PR [#459](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/459). Não houve login, partida autenticada, extração/redistribuição de arquivos de terceiros ou acesso aos quadros das animações.

### Páginas públicas verificadas

- [PB Ranked](https://ranked.pokemonbattlegrounds.com/) — título `PB Ranked`, apresentação de combate em tempo real, interfaces públicas com texto de equipe, arena, formato, prévia de equipe, leaderboard, replay, e a mensagem de que replays são removidos 24 h após a batalha. **Importante:** a página contém textos de vários estados da aplicação; a presença de um texto de erro/login no DOM **não** prova que aquele erro ocorreu nesta sessão. Nenhuma batalha foi iniciada.
- [Pokémon Battlegrounds](https://pokemonbattlegrounds.com/) — página de apresentação de batalhas em pixel art, movimento/esquivas/defesas, ataques individuais e IA. Seu site público lista três vídeos abaixo com títulos de batalhas.

### Três referências audiovisuais apontadas pela página oficial

| Link publicado pelo site | Identificação textual do site | Estado de observação | Uso sugerido |
| --- | --- | --- | --- |
| [Brendan vs Steven](https://youtu.be/J_CxwaMNjmk) | Luta 6v6 em Meteor Falls | Link e descrição pública identificados; **quadros não inspecionados** | Futura avaliação de entrada, câmera, colisões e tempo de VFX |
| [Red vs Gold](https://youtu.be/XQy0APLPCL8) | Luta 6v6 em Mt. Silver | Link e descrição pública identificados; **quadros não inspecionados** | Futura avaliação de composição de cenário e posicionamento |
| [Sceptile vs Gengar](https://youtu.be/Fq1z0wXktLE) | Duelo em Mt. Pyre | Link e descrição pública identificados; **quadros não inspecionados** | Futura avaliação de legibilidade de golpe e esquiva |

Esses vídeos **não** confirmam movimentos, timings, sprites ou arenas do PB Ranked: o site de vídeos apresenta exemplos de PB Battlegrounds e não se declarou equivalência de cliente. A enumeração anterior de 17 nomes de arenas é um inventário de opções do DOM, **não** uma coleção de 17 mapas recuperados.

## Aproveitamento correto no Torre 2

1. **Prova atual e reproduzível:** demonstrador autoral na PR #459, com curva de projétil, dash e arco de Pokébola; sem dano e sem mudanças nos saves.
2. **Colisão:** manter solver de discos móveis e subdivisão de curvas **somente no laboratório**, antes de testar migração isolada em novas habilidades.
3. **Visual de Pokébola:** preservar `torre2-ball-choreography.js` e a captura aprovada; não substituir por uma sequência supostamente idêntica ao PB sem evidência própria.
4. **Esquiva/IA:** aproveitar observações como ideias de design; não importar cooldown, fórmulas de dano ou controles do Battlegrounds para a campanha Gen III.
5. **Arenas:** usar características observáveis como referência para cenários originais, respeitando Kanto e a arte já aprovada, sem copiar tilemaps, sprites ou VFX de terceiros.

## Métrica e liberação

O teste `tests/rea-vector-browser.cjs` agora registra **sete janelas sequenciais** na mesma luta e resolução 1280×720: OFF/ON/OFF/ON/OFF/ON/OFF (~2,6 s cada). Guarda FPS e p50/p95 de duração dos quadros por janela e a **mediana** de FPS por condição. Essas amostras usam Chromium headless e renderização por software SwiftShader, sofrem com efeitos de ordem/cache/CPU e **não estabelecem ganho causal nem FPS em Android**.

Medição de GPU real ou Android e regressões da campanha continuam obrigatórias. Revisar screenshots e JSON gerados **somente depois de um CI bem-sucedido para o SHA exato**. Não mesclar/publicar a PR enquanto a prova de navegador, saves, HUD e FPS não for suficiente.

## Critérios de integridade

- Ausência de login/cookies pessoais, segredos ou bypass de autenticação; nenhum asset de terceiro incluído.
- Não alterar `main`, golpes, sprites e efeitos aprovados, inventário, IA, captura ou save.
- Registrar separadamente **observado**, **inferido**, **não observado** e **protótipo autoral**.
