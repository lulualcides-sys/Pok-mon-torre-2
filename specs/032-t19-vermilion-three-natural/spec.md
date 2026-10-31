# T19 — Vermilion: treinadores 15 a 17 (checkpoint autêntico)

**Entrada:** artefato `t19-vermilion-four-earned-native` ID 13043696468, workflow verde #41203366086 no SHA `3107c0fd9193f7425f2267245b3496f231d2196f`. Arquivo `t19-vermilion-four-checkpoint.json` com `rawSave`, SHA-256 interno recalculado e vínculo ao SHA-256 anterior `4b17a3508c1d4a044494169dd7acf9623e99d1491175112a30f4b0aa6d3e49b4`. Origem stage2/trainer14, 61 vitórias, 0 derrotas, Rocha+Cascata, sem Lt Surge. O artefato não é save pessoal.

**Prova requerida:** vencer nativamente treinadores índices 14, 15 e 16 em Phaser real, salvar stage2/trainer17 e ao menos 64 vitórias, validar XP e reload byte a byte. Em derrota real, registrar perda, curar no Centro, XP/captura selvagem legítimos, retentar com limite de duas recuperações. Troca nativa após estagnação, máximo três. Sem alterar HP/XP/RNG, badge, VFX, sprites ou runtime. O líder Lt Surge fica para etapa separada após esta prova, com seed autêntico.

**Gates:** npm test, npm run check, check:reuse, build original, Chromium nativo, regressões T19/T25/T31/guardião. CI vermelha impede merge; Pages HTTP somente depois da integração.
