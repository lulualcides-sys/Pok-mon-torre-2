# Pokémon Torre 2 — Kanto Battle Engine

## Pokémon Torre 2 Kanto — jogo SOLO (Phaser)
**PATCH 1 CONCLUÍDO E TESTADO:** Bonemerang -50% de escala; Bone Club menor e +10% de alcance; Pay Day com nove moedas; Tri Attack refeito para apresentar três feixes simultâneos de fogo, gelo e eletricidade com uma formação triangular (pesquisa Bulbapedia/Pokémon Database); **Sumário dos golpes redesenhado** no Phaser com 4 slots 2×2, atributos, banco de seis movimentos por página, filtros de tipo e busca por nome. [Relatório](docs/PATCH-1-GOLPES-MENU-2026-10-20.md) · [Testes incluindo batalha e Android](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/39505390551).


**Atualização testada:** quatro efeitos exclusivos novos em Phaser: **Bonemerang, Bone Club, Tri Attack e Pay Day**, Mewtwo de testes **nível 50 na equipe**, banco com **137 golpes selecionáveis (incluindo quatro novos)** e **Sumário interativo** com retrato, HP, ATK, DEF, SPD, quatro botões equipáveis e salvamento persistente. O clique em um Pokémon abre o Sumário. [Relatório e próximos refinamentos](docs/LOTE-4-GOLPES-MEWTWO-LV50.md) e [testes da batalha real e Android](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/39495106150). Golpes existentes no cliente Poké Arena, como Egg Bomb, High Jump Kick e Volt Tackle, não foram redesenhados. Os quatro VFX exclusivos são **primeira versão para aprovação visual**, não promessa de cópia idêntica.


[**▶ JOGAR POKÉMON TORRE 2 — CAMPANHA KANTO SOLO**](https://raw.githack.com/lulualcides-sys/Pok-mon-torre-2/195e97767c2625f79dbf191df2195cfc1036b542/index.html)

**Só para um jogador:** menu inicial original do Poké Arena 2D com fontes, cores, logo e navegação preservados. Retirados ONLINE, 2 PLAYERS, bate-papo, Join/Discord, contagem de pessoas online e o botão EVO/MEGA **somente durante a campanha Kanto**. Training, Arena Mode, VS CPU e League mantêm evolução dinâmica sem exigir nível. PLAY → KANTO CAMPAIGN abre ginásios, capturas e evolução exclusivamente por nível após o combate. Botão MENU volta à abertura. Testado no Chromium, batalha original e Android horizontal: [execução verificada, incluindo evolução por modo e teste Android](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/39488444410).

O jogo permite acessar a seleção de Bulbasaur, Charmander ou Squirtle. Reusa os ataques, movimentação, sprites e cenas do motor Phaser de pokearena2d.com, com progressão própria do Torre 1: 13 treinadores antes de Brock e dificuldade crescente, oito líderes, Elite Four, insígnias, EXP, captura após vitória, equipe de 6 e PC, evolução exclusivamente por nível depois do combate e salvamento em localStorage. Sem conta, login, amigos, partidas online ou API de servidor. Testado em navegador Chromium e Android paisagem (landscape): [execução validada](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/39484160116).

**IA corrigida:** na campanha, adversários que alcançarem o limiar de evolução continuam atacando, sem tentar o comando EVO bloqueado. A regressão automatizada forçou Onix elegível a evoluir e observou **26 ataques**, zero tentativas de evolução proibida e evolução preservada em outros modos. [Teste verificado](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/39490102682). 

**Biblioteca NOVA de golpes:** [regras, 14 ataques e 2 status por tipo, e sugestões de exclusivos](docs/EVOLUCOES-MODOS-E-BANCO-DE-GOLPES.md) · [269 efeitos Phaser inéditos planejados, 19 vagas em aberto](data/kanto-new-phaser-moves.json). **Nenhum efeito de golpe do Torre 1 será reutilizado neste projeto.** Todos os novos efeitos devem ser criados no padrão técnico e visual do pokearena2d.com. Os sprites dos Pokémon podem vir do material já disponível ou SpriteCollab com atribuição; nenhuma reenvio obrigatório. 

**Cobertura:** catálogo de 151 Pokémon de Kanto incluído na Pokédex; só as espécies com animações e kits disponíveis no cliente recuperado são liberadas como lutadoras neste estágio. A campanha já usa os lutadores existentes do Poké Arena, ainda não todos os 151. A progressão é independente da versão de laboratório PixiJS V0.8 mantida no ramo principal. No celular, use a tela horizontal. O jogo funciona como página estática, sem serviços multiplayer; para abri-lo por URL é necessário acesso à hospedagem de arquivos estáticos.


## 🎮 TESTAR AGORA (sem esperar GitHub Pages)

**[▶ JOGAR POKÉMON TORRE 2 — V0.8 validada no Android e WebGL](https://rawcdn.githack.com/lulualcides-sys/Pok-mon-torre-2/3badc040242c9117b9c860f795412ac0e310493c/index.html)**

Link fixado no commit V0.8 e verificado com Chromium WebGL e navegador móvel 390 px. Inclui 8 golpes com quadros independentes (4 de fogo e Water Gun, Bubble Beam, Vine Whip e Thunderbolt), colisões de ataques, laboratório com troca de conjuntos e botão de tela cheia.
Na primeira visita, o serviço independente rawgit.hack pode pedir confirmação **Open the page**.

O domínio permanente `https://lulualcides-sys.github.io/Pok-mon-torre-2/` permanece inativo
até habilitar **Settings → Pages → Source: GitHub Actions** no repositório.
Depois disso, `.github/workflows/pages.yml` já está preparado para publicar.

---


**[CONTRATO DA CAMPANHA E EVOLUÇÃO SOMENTE POR NÍVEL](docs/CONTRATO_CAMPANHA.md)**: mesma estrutura de campanha do Pokémon Torre 1, com 13 treinadores antes do primeiro líder e Kanto completo; Poké Arena 2D é o objetivo de reconstrução completa da experiência de batalha; sua progressão não substitui Kanto do Torre 1. Evoluções exclusivamente por nível (inclusive pedra/troca/amizade convertidas para níveis), somente após a batalha, jamais no meio. A V0.8 ainda é laboratório e não implementa essa campanha ou a evolução.

**[Inventário REA e especificação de reconstrução integral das batalhas](docs/REA-IMPLEMENTACAO-INTEGRAL.md)**.

Novo jogo independente do Pokémon Torre original.

**Primeiro marco:** batalha jogável no Ginásio de Pewter (Brock), controles mobile/PC, combate 2D em PixiJS/WebGL, oito golpes de teste e 21 testes unitários aprovados com Chromium real. Não é a campanha completa.

## Filosofia
- Referências visuais: [capturas reais de Poké Arena 2D — 420 vídeos](https://github.com/lulualcides-sys/Pok-mon-torre/blob/rea-pokearena-all-visible-moves/docs/rea-pokearena/registro-real/evolucoes/INDEX.md), **somente para estudo**.
- Sem copiar spritesheets, código, sons ou outros arquivos do jogo de referência.
- Renderização dos efeitos com WebGL/PixiJS. Não usar Canvas 2D para desenhar golpes; golpes isolados e dano sincronizado.
- Alterações e testes **neste repositório**, não no [Pokémon Torre original](https://github.com/lulualcides-sys/Pok-mon-torre).
- Projeto independente de fã, não oficial. Pokémon e nomes associados pertencem aos respectivos titulares.

## Controles
PC: WASD ou setas para andar; 1–4 para golpes; Espaço para esquiva; mouse para direcionar a mira.
Celular: joystick analógico, esquiva, botão de tela cheia e dois conjuntos de quatro golpes (Fogo e Laboratório elemental).

## Testes
`npm test` — regras do combate e progressão.
`npm run check` — sintaxe dos módulos.
O GitHub Actions também executa teste real de Chromium com verificação WebGL.

## Estado
Versão V0.8: estádio gramado, arquibancadas, personagens animados do PMD SpriteCollab com licença/créditos, Flamethrower contínuo, Fire Blast 大, projéteis de pedra do Brock, câmera móvel e joystick analógico; laboratório de oito ataques (incluindo água, planta e elétrico), 12/16 quadros próprios por golpe e colisão entre projéteis. O visual ainda não reproduz integralmente a qualidade, os 153 movimentos e o conteúdo do Poké Arena 2D.

## Publicação
GitHub Actions gera e testa o projeto. A publicação no GitHub Pages depende da configuração de Pages deste novo repositório.

## Cliente real Poké Arena 2D — cópia Phaser (corrigida)

**[▶ TESTAR CÓPIA PHASER SEM TRAVAR NO LOADING](https://raw.githack.com/lulualcides-sys/Pok-mon-torre-2/2f890ea81c5f6a01b9baed2c24a2180303164a97/index.html)**

Captura autorizada pelo usuário do site `pokearena2d.com`, sem ligação com qualquer outro jogo de nome parecido. **1.135 arquivos públicos identificados e recuperados**, 0 faltas no relatório de captura da atualização; inclui todos os sprites declarados no manifesto PMD da versão capturada. Correção no arranque: pré-carregamento inicial reduzido e demais animações carregadas quando necessário. Testes de Chromium para desktop, menu, Training e Android horizontal, além de verificação do link público fixado no commit. [Execução e evidências](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/39481590980).

Este link é **laboratório do cliente original Phaser**, ainda não a campanha Kanto do Pokémon Torre 2. A campanha Kanto e a evolução exclusivamente por nível, depois do combate, seguem em desenvolvimento separado. O jogo de origem requer orientação horizontal no celular. O código servidor e serviços online privados não são parte do pacote público capturado.
