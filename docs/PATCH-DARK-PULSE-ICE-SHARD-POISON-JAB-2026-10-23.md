# Pokémon Torre 2 — Finalização de Dark Pulse, Ice Shard e Poison Jab (23/10/2026)

## Pedido exato

- **Dark Pulse:** aumentar o desenho já aprovado pelo usuário *um pouco mais* e salvar. Os anéis do efeito anterior passaram da escala principal `1.52` para `1.76` (~16%). Nenhum dano, alvo ou trajetória foi alterado. O catálogo `dark-pulse.js` e o registro `data/move-reuse-policy.json` foram marcados como `user-approved`, conforme o aceite explícito do usuário. Quando revisado, não alterar mais a função `darkPulse`.
- **Ice Shard:** somente cristais de gelo pequenos e reconhecíveis. O mesmo spritesheet `iceDagger` de azul, ciano e branco foi reduzido de `1.15` para `.68` na renderização; reflexo secundário `.39` → `.24`, fragmentos menores. **A animação de sete projéteis, o movimento, a mira, a colisão e o dano por cristal permanecem absolutamente iguais**; o arquivo de runtime conserva suas constantes do padrão Pay Day `count=7`, `delay=.075`, `spread=.09` e `damageScale=1/7`.
- **Poison Jab:** um único golpe **físico de contato** com uma ponta pequena e nada de projétil. Quando `strike()` informa impacto genuíno, desenhar **um só brilho violeta translúcido e discreto**, largura inferior a 20 pixels, dissipando em `0.19s`. Excluir explosão genérica e oito raios roxos que anteriormente poluíam o efeito; o estado, chance de envenenamento, dano, direção e alcance continuam iguais. Ataques errados não desenham a faísca.

## Efeitos aprovados e protegidos

O próprio usuário pediu para salvar Dark Pulse nesta conversa; agora são **20 movimentos novos visualmente aprovados e 3 pendentes** no lote de 23 (Ice Shard, Poison Jab e Ancient Power). Os três Steel FX antigos foram aprovados separadamente. As sete funções aprovadas do pacote anterior têm hash FNV bloqueado em `tests/batch24-visuals.test.js`; a função Dark Pulse aprovada também recebe seu hash de proteção. Não alterar os golpes já aceitos, não clonar ou duplicar Dragon Pulse do motor nativo.

## Origem e testes

Dark Pulse reaproveita **apenas a máscara original de anel** `MAPAS['p-pulsoAgua']` do Poké Arena 2D, recolorida em preto/violeta — não há alegação de acesso ao Dark Pulse nativo porque ele não está no cliente capturado. Ice Shard reaproveita a trajetória do Pay Day que já havia sido implementada; Poison Jab reutiliza os golpes de contato reais via Phaser/WebGL. Os algoritmos MIT do Emerald Arena continuam usados no sistema de partículas. Zarza foi somente referência técnica, sem portar código/arte.

Os testes verificam 12 quadros de pixel art, nenhum frame inválido, tamanho máximo do brilho roxo, deslocamento/vida útil, não alteração da física dos sete cristais, nenhuma explosão sem dano, registro de aprovação e integridade dos movimentos aprovados. CI final: unitários, integração no Chromium, GH Pages e confirmação do fingerprint remoto.
