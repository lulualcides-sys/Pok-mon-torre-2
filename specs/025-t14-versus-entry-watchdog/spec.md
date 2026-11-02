# T14 — VS 2.5 s: anti-freeze de entrada de combate

## Defeito observado
No Chromium real da CI de captura T06, após duas capturas aprovadas, a terceira entrada no combate deixou a introdução VS ativa por mais de 20s, sem instalação de atores: `versusActive=true`, `combatActive=false`. Execução: #41194150698, job #124516810342.

## Escopo
Manter 2500ms de VS nativo Phaser (sprites, transição, posição, efeitos) e fornecer um *único* watchdog com tolerância de 900ms caso o Phaser Scene Clock pare. Phaser segue autoritário e normalmente encerra exatamente aos 2500ms. Em caso de shutdown, cancelar ambos os relógios; nunca iniciar combate duas vezes. Sem ajustes em saves, golpes, IA, VFX, captura, cronograma ou cenas externas.

## Testes
Quatro cenários determinísticos RED→GREEN (Phaser normal; relógio parado; shutdown; cena inativa), teste de contrato, compilação, navegador Chromium de VS e captura recorrente. Nenhum gate verde é presumido antes de CI.
