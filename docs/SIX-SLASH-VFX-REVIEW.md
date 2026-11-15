# Seis Slash VFX — revisão visual isolada (2026-11-07)

## Status
**Protótipos gerados e colocados em branch de teste. Não publicados na campanha/arena e não aprovados visualmente.**

Referência: vídeo enviado pelo usuário nesta conversa, com seis variantes de corte. Os **pixels dos efeitos são novos**, não extraídos, convertidos ou traçados do vídeo. Não reutilizamos marca d'água, quadros originais ou propriedade de terceiros.

## Entrega
- 6 PNGs indexados de transparência real em \`reference-assets/vfx/six-slashes\`, cada qual com 12 quadros de 96×96 (spritesheet horizontal 1152×96).
- \`slash-lab.html\` — página visual com reprodução, pausa e velocidade, sem jogo principal.
- \`tools/pokearena/torre2-six-slash-vfx.js\` — adaptador Phaser/WebGL **opt-in** que utiliza os PNGs com filtro NEAREST e limpa sprites ao terminar. Não altera HP, colisão, status, cooldown ou kit nativo.
- \`tests/six-slash-vfx.test.js\` — verifica PNG, transparência, identidade dos seis efeitos e 12 fases realmente preenchidas.

## Integração, sem sobrepor golpes aprovados
A integração com nomes canônicos é **bloqueada** até mapear qual golpe é exclusivo do Torre 2 e verificar a precedência obrigatória do Poké Arena 2D. Para uso futuro dentro de um Scene já configurado:
\`\`\`js
import {preloadSixSlashVfx, playSixSlashVfx} from './torre2-six-slash-vfx.js';
// In preload(): preloadSixSlashVfx(this, './assets/torre2/six-slashes');
// In an authorized hit event after real collision detection:
// playSixSlashVfx(this, 'frost-shatter', target.x, target.y, {scale: 0.8});
\`\`\`
Este exemplo **não foi ligado** à batalha nem aos arquivos de produção. O build precisará copiar os PNGs para \`_site/arena2d/assets/torre2/six-slashes/\` antes de habilitar isso.

## Aprovação e limites
1. Abrir \`slash-lab.html\` no link de homologação e julgar movimento, escala e legibilidade.
2. Ajustar efeitos reprovados individualmente (sem reaproveitar os mesmos 12 quadros recoloridos).
3. Registrar aprovação visual e compatibilidade por golpe.
4. Após aprovar, conectar exclusivamente a golpe novo elegível, testar em batalha real/Chromium e publicar por PR separada.

**Sem evidência de teste de FPS mobile ou combate real nesta etapa.** O visual da referência é uma meta aproximada, não reprodução pixel a pixel.
