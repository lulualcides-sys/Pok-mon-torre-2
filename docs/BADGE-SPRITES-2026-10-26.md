# Insígnias com sprites

Substitui oito glifos desenhados por Graphics pela folha Trainer Card FRLG (quadros 16×16), carregada uma vez no Phaser. Escala inteira, transparência indexada e cores de conquista; seleção, detalhes e saves preservados.

Regressão de navegador verifica os oito quadros e dimensões reais, seleção de cada líder/TM, bloqueadas, retorno mobile e ausência de alteração do save. A suíte unitária de 140 testes e `npm run check` passaram localmente. Build, navegador e publicação ainda dependem da validação desta branch.

A recuperação do workspace reconstruiu este lote de sprites; os remédios que estavam apenas no ambiente anterior ainda precisam ser reconstruídos e testados. Não representa conclusão do Script Mestre nem campanha jogada normalmente até o Campeão.
