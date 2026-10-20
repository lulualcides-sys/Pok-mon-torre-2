# Pokémon Torre 2 — Kanto Battle Engine

## 🎮 TESTAR AGORA (sem esperar GitHub Pages)

**[▶ JOGAR POKÉMON TORRE 2 — V0.8 validada no Android e WebGL](https://rawcdn.githack.com/lulualcides-sys/Pok-mon-torre-2/3badc040242c9117b9c860f795412ac0e310493c/index.html)**

Link fixado no commit V0.8 e verificado com Chromium WebGL e navegador móvel 390 px. Inclui 8 golpes com quadros independentes (4 de fogo e Water Gun, Bubble Beam, Vine Whip e Thunderbolt), colisões de ataques, laboratório com troca de conjuntos e botão de tela cheia.
Na primeira visita, o serviço independente rawgit.hack pode pedir confirmação **Open the page**.

O domínio permanente `https://lulualcides-sys.github.io/Pok-mon-torre-2/` permanece inativo
até habilitar **Settings → Pages → Source: GitHub Actions** no repositório.
Depois disso, `.github/workflows/pages.yml` já está preparado para publicar.

---


**[CONTRATO DA CAMPANHA E EVOLUÇÃO (FireRed)](docs/CONTRATO_CAMPANHA.md)**: mesma estrutura de campanha do Pokémon Torre 1, com 13 treinadores antes do primeiro líder e Kanto completo; Poké Arena 2D é referência visual das batalhas, não de progressão. Evoluções por nível somente após a batalha, jamais no meio. A V0.8 ainda é laboratório e não implementa essa campanha ou a evolução.

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
