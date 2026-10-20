# Pokémon Torre 2 — Kanto Battle Engine

## 🎮 TESTAR AGORA (sem esperar GitHub Pages)

**[▶ JOGAR POKÉMON TORRE 2 — V0.6 estádio gramado (link sem cache)](https://rawcdn.githack.com/lulualcides-sys/Pok-mon-torre-2/aa63860e199031ee25e40d229017ff474c295559/index.html)**

Link V0.6 verificado em Chromium (WebGL e toque no celular). Confira a nova arena de gramado, arquibancada vermelho/azul e o Flamethrower com quadros conectados.
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
Versão visual V0.5: arena tecnológica refeita com profundidade por posição, personagens PMD SpriteCollab animados com durações oficiais e escala ajustada, ataques de fogo GPU e Rock Throw visível de Brock com impacto e esquiva reais, além de câmera de batalha quase quadrada no celular e mira ajustada ao enquadramento. Ainda não alcança toda a fidelidade visual nem o conteúdo completo do Poké Arena 2D. A primeira batalha é um *vertical slice*, não toda a campanha de Kanto. Nenhum golpe do jogo original é substituído.

## Publicação
GitHub Actions gera e testa o projeto. A publicação no GitHub Pages depende da configuração de Pages deste novo repositório.
