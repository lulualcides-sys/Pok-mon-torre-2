# T81 — Pés dos Pokémon sincronizados durante toda a animação Idle

**Escopo:** somente `fix/t81-pmd-idle-frame-ground-lock-20261103`, derivada de `test/homologacao-kanto-20261103`. Sem merge em `main` e sem publicação no Pages.

## Defeito corrigido

O T80 ancorava o Pokémon ao piso pela borda alfa **do primeiro quadro** do SpriteCollab PMD Idle. Outros quadros de uma animação podem conter margens transparentes diferentes; durante a animação o personagem pode parecer subir ou afundar apesar de o centro do sprite e o líder não saírem do lugar.

## Implementação

- `nativePmdFootOrigin(texture, plan, frame)` mede agora os pixels visíveis da célula real do spritesheet, usando `cutX/cutY` de cada quadro Phaser.
- `lockNativePmdIdleFeet` ajusta apenas `originY` em `animationupdate`. Mantém `sprite.y`, sombras, escala, palcos e a imagem aprovada intactos.
- Cache por textura + quadro impede leituras repetidas do canvas em loop.
- Vileplume preserva **26/40** no quadro 0, aprovado em T79b, e corrige quadro a quadro os demais frames. Aplica a Starmie, Vileplume, Onix, Raichu e Weezing.
- Não modifica os 60 WebPs originais nem o override do Lt. Surge do T80, nem encontros, sprites dos treinadores, golpes, HUD, save ou combate.

## Validação e limites

- Testes unitários com frames alfa distintos, reaproveitamento de cache, posição estável e calibração de Vileplume.
- Regressões T80/T79/T41 e Guardião Visual desktop/mobile devem passar antes de considerar T81 apto à homologação.
- A existência de artefatos de screenshot, sem inspeção e sem testes reais, **não é aprovação visual**. Falhas gerais de workflows de browser do pacote T80 continuam pendentes de análise; não marcá-las como resolvidas por este patch.
- A publicação no site oficial requer aprovação expressa do usuário em etapa separada.
