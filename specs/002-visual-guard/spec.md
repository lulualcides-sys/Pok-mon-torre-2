# Spec 002 — Guardião visual e diagnóstico econômico

**Objetivo:** reduzir reanálises no Pokémon Torre 2 com proteção de referências aprovadas, capturas do Phaser real e relatório automático em falhas. **Complemento**, sem alterar o Script Mestre, decisões e aprovações.

## Aceite
- Checksum Git blob de assets estáticos explicitamente protegidos deve detectar conteúdo alterado, ausente, vazio, hashes inválidos e travessia de diretórios, sem build.
- Screenshot do título desktop/mobile, mapa e primeira batalha no Phaser/WebGL real, com verificações estruturais de logo, botões, canvas, espécie e golpes. O cenário é **fixture de produção**, não vitória natural ou Android físico.
- Testes falhos geram JSON/Markdown contendo etapa, SHA, erro resumido e caminhos das capturas que existirem; não armazenar saves/tokens no relatório.
- PRs executam guarda leve e Chromium; Pages reutiliza seu build e roda a guarda antes da publicação; artifacts de curta retenção.
- Nenhuma alteração do runtime, VFX, sprites, saves, catálogos, política de golpes, regras do Script Mestre ou dependências de produção.

## Fora do escopo
- Comparação pixel-perfect bloqueante de frames animados sem baseline realmente aprovado; avaliação estética automatizada; homologação de 151 Pokémon em jogo real.

## Segurança de aprovação
O manifesto começa com três **referências estáticas existentes** e não interpreta qualquer arquivo não incluído como “aprovado”. Alterações intencionais precisam de revisão do usuário; não atualizar hashes só para fazer o teste passar.
