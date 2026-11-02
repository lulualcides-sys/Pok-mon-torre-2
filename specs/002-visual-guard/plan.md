# Plano — Guardião visual

**Especificação:** [spec.md](spec.md)  
**Complementar:** [Script Mestre](../../docs/SCRIPT-MESTRE-DEFINITIVO-2026-10-27.md), `AGENTS.md`, política integral de golpes.

## Etapa 1 — referência protegida (test-first)
- Testes para SHA de blob, presença/ausência, conteúdo alterado, manifestos malformados e path traversal.
- Guardião Node sem dependências externas e manifesto mínimo com três assets binários/referências rastreáveis.
- Gate leve sem capturar a fonte Poké Arena novamente.

## Etapa 2 — diagnóstico de erro (test-first)
- Testar construção de JSON e Markdown a partir das evidências existentes; mensagem limitada e sem serializar saves.
- Rodar após falhas de jobs e arquivar artifacts, mesmo que o Chromium não chegue a iniciar.

## Etapa 3 — screenshot Phaser real
- Reutilizar Playwright-core e build existente.
- Capturar título desktop/mobile, mapa e combate, verificando UI/scene; classificar explicitamente os estados como fixtures.
- Integrar execução na PR e no pipeline Pages **antes** do deploy, sem segundo build em Pages.

## Etapa 4 — gates e integração
- Testes locais RED→GREEN da lógica pura, validação no GitHub Actions e revisão de diff sem runtime modificado.
- Merge apenas com gates aplicáveis verdes; publicação só confirmada após Pages/HTTP na revisão correta.
- Não criar nova automação horária nem reordenar partes do Script Mestre.
