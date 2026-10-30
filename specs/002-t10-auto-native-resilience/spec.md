# Spec — T10: AUTO nativo robusto em trocas de adversário

## Evidência e problema
A T20 anterior, run #41109051839, venceu 13 treinadores e o primeiro Pokémon de Brock mas terminou em timeout contra Onix; a execução #41110958613 sofreu quatro derrotas legítimas antes de Brock. Isso demonstra problemas de estabilidade e/ou balanceamento, **não comprova qual subsistema causou cada falha**. A inspeção do código da main `0695045` encontrou riscos concretos: `actor.rival` tem prioridade mesmo quando está desmaiado; o controlador AI é recriado para trocas do jogador, mas não do oponente; disparo básico forçado herda mira possivelmente obsoleta; e `null` no leitor da IA devolve entrada humana durante AUTO ativo.

## Aceite
1. Quando o Pokémon inimigo desmaia ou é substituído, AUTO não seleciona o alvo desmaiado e a IA nativa recebe novo cérebro somente em uma troca real de adversário ou jogador.
2. O disparo básico **que o assistente do AUTO acrescenta** deve apontar para o adversário ativo, respeitando cooldown, energia, calor, status e hitboxes nativos. IA que já escolheu golpes/defesa não deve ser modificada.
3. O modo AUTO nunca executa entrada manual anterior quando a IA não oferece um objeto de comandos. O botão continua alternando para controles manuais imediatamente.
4. Observabilidade limitada a contadores em memória (leituras, mudanças de oponente, assistência de aproximação/LMB, falha de leitura), sem loops/timers próprios e sem persistência no save.
5. Arena/VS, efeitos aprovados, 151 espécies, 227 VFX, sprites, dano, recarga, XP, RNG, captura e saves intocados. Em particular, quando a IA original da Arena retorna null, o leitor humano original continua sendo o fallback preexistente; somente a campanha neutraliza entradas manuais antigas.
6. CI focada + `npm test` + política VFX + build original + Chromium real T10/T19, browser completo e oito treinadores legítimos. Não declarar vitória de Brock, Rocha, TM39 ou desempenho superior antes de T20 integral.

## Regras de liberação
Branch separada; revisão de diff; PR pronta só após CI verde e guardião visual; merge com SHA e verificação de Pages público. Se os testes reais falharem, conservar PR em draft, anexar logs e corrigir a causa.
