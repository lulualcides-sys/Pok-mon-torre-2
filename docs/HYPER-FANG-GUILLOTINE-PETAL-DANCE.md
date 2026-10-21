# Pokémon Torre 2 — Três novos golpes de espécie (sem alterar originais)

- Hyper Fang: Rattata/Raticate. Mandíbulas dentadas de pixel art com fechamento e avanço curto; colisão física real, 90% de acerto, 10% de recuo após impacto.
- Guillotine: Pinsir. Duas pinças com sprites geométricos de pixels que se fecham no alvo; baixa precisão (~30%) e golpe de finalização apenas após contato, sem acerto automático à distância e falha contra alvos de nível superior quando tal nível está disponível.
- Petal Dance: Oddish/Gloom/Vileplume e família Bellsprout/Victreebel. 16 pétalas em espiral colorida; até três contatos separados com o inimigo e confusão no usuário ao final da dança.

Hyper Fang e Guillotine estão ✅ aprovados (21/10/2026) e protegidos. Petal Dance teve a movimentação alterada para vórtice inspirado em Aura Storm e aguarda avaliação visual. Usam Phaser/WebGL e formas próprias em `tools/pokearena/torre2-kanto-signatures-fx.js`; não tocam no renderizador nativo do Poké Arena 2D, nem nos 14 golpes específicos aprovados.

Mewtwo de teste consegue equipar os três. Famílias de Pokémon que ainda não existem no ROSTER podem equipar quando forem integradas.

Documentação e testes no GitHub; publicar somente após CI.

## Correção definitiva — mira manual no padrão Ice Beam (21/10/2026)

O acompanhamento automático da posição do inimigo foi **removido**. O Petal Dance recebe sua direção a cada quadro de `l.ax/l.ay` (mouse/toque/controle), como o `angApunte(l)` do `Chorro` nativo; a velocidade de giro fica limitada a **3,5 rad/s**, igual ao Ice Beam V6 aprovado. As 16 pétalas saem sequencialmente, executam órbitas próprias e seguem **a direção escolhida pelo jogador**, não as coordenadas do rival. O adversário pode esquivar; dano apenas se a projeção tocar, até três impactos independentes. Manter sprites de 2 px, seis tons de rosa, autoconfusão e aprovação pendente. A alteração não modifica VFX nativos nem os 16 golpes já aprovados.
