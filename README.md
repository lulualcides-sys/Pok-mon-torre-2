# Pokémon Torre 2 — Kanto Battle Engine

## 🎮 TESTAR AGORA (sem esperar GitHub Pages)

**[▶ JOGAR POKÉMON TORRE 2 — V0.3 sem cache antigo](https://rawcdn.githack.com/lulualcides-sys/Pok-mon-torre-2/34ccc083d68aa386cb166b4fd2958eaeb4734357/index.html)**

Link da versão V0.3 fixada no commit e verificado em Chromium (desktop e Android simulado). O navegador confirmou a nova interface, os três sprites animados e WebGL.
Na primeira visita, o serviço independente rawgit.hack pode pedir confirmação **Open the page**.

O domínio permanente `https://lulualcides-sys.github.io/Pok-mon-torre-2/` permanece inativo
até habilitar **Settings → Pages → Source: GitHub Actions** no repositório.
Depois disso, `.github/workflows/pages.yml` já está preparado para publicar.

---


Novo jogo independente do Pokémon Torre original.

**Primeiro marco:** batalha jogável no Ginásio de Pewter (Brock), controles mobile/PC, combate 2D em PixiJS/WebGL, quadro de quatro golpes de fogo e testes automatizados.

## Filosofia
- Referências visuais: [capturas reais de Poké Arena 2D — 420 vídeos](https://github.com/lulualcides-sys/Pok-mon-torre/blob/rea-pokearena-all-visible-moves/docs/rea-pokearena/registro-real/evolucoes/INDEX.md), **somente para estudo**.
- Sem copiar spritesheets, código, sons ou outros arquivos do jogo de referência.
- Renderização dos efeitos com WebGL/PixiJS. Não usar Canvas 2D para desenhar golpes; golpes isolados e dano sincronizado.
- Alterações e testes **neste repositório**, não no [Pokémon Torre original](https://github.com/lulualcides-sys/Pok-mon-torre).
- Projeto independente de fã, não oficial. Pokémon e nomes associados pertencem aos respectivos titulares.

## Controles
PC: WASD ou setas para andar; 1–4 para golpes; Espaço para esquiva; mouse para direcionar a mira.
Celular: controles direcionais virtuais e botões de golpes.

## Testes
`npm test` — regras do combate e progressão.
`npm run check` — sintaxe dos módulos.
O GitHub Actions também executa teste real de Chromium com verificação WebGL.

## Estado
Versão visual V0.2: arena tecnológica refeita, sprites animados PMD SpriteCollab creditados, quatro ataques GPU reconstruídos. Ainda não alcança toda a fidelidade visual nem o conteúdo completo do Poké Arena 2D. A primeira batalha é um *vertical slice*, não toda a campanha de Kanto. Nenhum golpe do jogo original é substituído.

## Publicação
GitHub Actions gera e testa o projeto. A publicação no GitHub Pages depende da configuração de Pages deste novo repositório.
