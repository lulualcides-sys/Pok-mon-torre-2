# T19 — continuidade natural Brock → Cerulean (31/10/2026)

## Objetivo verificável
Retomar **os bytes exatos do save conquistado** no Chromium/Phaser de T20
(Pallet, 13 treinadores, capturas genuínas, Brock, insígnia Rocha e TM39),
sem construir fixture de nível, vitória, equipe, XP, RNG ou insígnia.

## Implementação em validação
- `tests/section20-natural-team-brock-browser.cjs`: somente quando
  `T20_PRODUCTION_START=1` e `T19_EXPORT_EARNED_SAVE=1`, após Brock,
  exporta `test-evidence/t19-earned-brock-save.json` com o localStorage
  original, SHA-256 e resumo. Não altera o save.
- `tests/t19-earned-brock-to-cerulean-browser.cjs`: importa esses bytes
  no **novo navegador**, verifica SHA-256, insígnia, TM39, equipe sem
  Mewtwo de fixture, cura no Centro pelo controle nativo e enfrenta o
  primeiro treinador de Cerulean com AUTO nativo; exige vitória real,
  XP, persistência, UID e reload. Em derrota real, falha com screenshot
  e diagnóstico; não concede vitória nem recupera HP por script.
- `.github/workflows/master-t19-earned-brock-cerulean.yml`: um percurso
  T20 de origem para produzir a prova, seguido pelo teste incremental T19
  no mesmo job e artefatos; evitar repetir a corrida de ~53 minutos
  em verificações rotineiras.

## Limites
- **Código enviado não significa CI aprovada.** Registrar run, HEAD e
  resultados apenas após execução real.
- Um treinador pós-Brock **não** homologa Misty, Cascata, TM03, o caminho
  inteiro ou Android físico. Expandir de forma incremental usando a
  mesma origem legítima, sem fixtures artificiais.
- Nenhuma alteração no runtime, golpes, VFX, sprites, IA, RNG, economia
  ou saves dos jogadores. T10 #381 permanece fora desta frente.
- PR #397 T25 tem arquivos independentes; não sobrepor seu trabalho.
