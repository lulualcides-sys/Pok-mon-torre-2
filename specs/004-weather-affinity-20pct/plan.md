# T16 — Auditoria de equipamento real dos golpes de clima

## Diagnostico
O motor `torre2-weather.js` reconhece Sunny Day, Rain Dance, Sandstorm e Hail, mas isso nao significa que existam entradas equipaveis na biblioteca compilada. Em `torre2-finale13-catalog.js` foi localizado Rain Dance com `approved:true` e VFX `torre2_finale_raindance`. Os demais tres nao foram localizados no `TEST_LIBRARY` de origem.

## Escopo isolado
Adicionar somente `tests/t16-weather-equipment-built.test.mjs` e CI `.github/workflows/t16-weather-catalog-equipment.yml`. Inspecionar o cliente montado de verdade e testar a liberacao de Rain Dance para Squirtle e Lapras Lv25, selecao pelo mesmo editor de batalha e ativacao do estado global de 20s. Manter todos os outros tres climas no motor, mas jamais inventar formas nem liberar tecnicas inexistentes.

## Requisitos
- Preservar todos os VFX aprovados, efeitos de tipo, status, saves, golpes de Arena e TM/HM.
- Seguir a politica integral de quatro fontes antes de introduzir ou alterar qualquer VFX em outro lote.
- Gates: `npm test`, `npm run check`, `check:reuse`, build Phaser com asset real, teste compilado e laboratorio Chromium de clima.
- Rollback: remover apenas os dois arquivos novos de teste/CI; este lote nao modifica runtime nem saves.
- Resultado esperado: evidencia do inventario real, sem confundir motor com disponibilidade nos 151 ou jogabilidade natural.

## Independencia
Branch isolada da `main` 8908e9d. Nao tocar T20 PR #369, T10 PR #374 nem Phoenix outras frentes. Nao marcar clima inteiro concluido so por aprovar uma entrada.

## Extensao de equipamento autorizada (30/10/2026)

- Recursos já aprovados: apenas Rain Dance (`torre2_finale_raindance`) em Phaser/WebGL. O patch não altera nem recria suas partículas, nem `weather-pixels.js`.
- Acrescentar Rain Dance como opção manual Lv25 a 40 espécies WATER/ELECTRIC compatíveis com TM18 no arquivo de metadados FRLG; bloquear níveis inferiores e não alterar ULT.
- A política de quatro fontes bloqueia a fabricação de efeitos novos. Manter Sunny Day (TM11), Sandstorm (TM37) e Hail (TM07) como estados de motor não equipáveis até comprovar VFX próprio com proveniência/autorizações.
- Alterações exclusivamente em `torre2-move-pool.js`, teste compilado, CI isolada e planos Spec Kit. Nenhuma migração de saves, nenhuma alteração ao modo Arena/VS.
- Verificações: Node unit, check, check:reuse, build do cliente original, teste de equipamentos compilado de 40 espécies, contrato de slot/U LT e laboratório real Chromium do clima.
- Rollback: reverter alteração da lista `KANTO_RAIN_DANCE_SPECIES` e a nova CI/teste; preservar todos os módulos de clima existentes.
