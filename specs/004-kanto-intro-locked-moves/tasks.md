# Tarefas 004 — evidências

- [x] Verificar HEAD `a5cff40ea1fab273ea725409cc126f4568e655a0`, PRs #270/#329, Pages #41054058050 e auditoria pública integral #41055385370.
- [x] Ler AGENTS.md, política integral de quatro fontes, constituição Spec Kit, Script Mestre, fila e controle.
- [x] Localizar causa no filtro de prévias e no seletor de assinatura; acrescentar regressão de locks sem alterar renderizadores.
- [ ] CI completa (Node/check/reuse/build/Chromium) verde no SHA deste patch.
- [ ] Revisão de diff, merge somente após CI verde.
- [ ] Confirmar Pages público pelo SHA/versão após integração.
- [ ] Validar ULT com energia natural e campanha até Brock (PRs concorrentes; fora do escopo deste patch).

## Diagnóstico e correção adicional (30/10)
- [x] RED confirmado: CI #41066647123 encontrou `144 !== 149`, com Caterpie, Metapod, Weedle, Kakuna e Eevee sem assinatura.
- [x] Causa localizada: `pendiente:true` herdado de placeholders nativos para Bug Bite, Bite e Swift apesar do renderer Torre 2 aprovado.
- [x] Patch no agregador da biblioteca: limpar apenas flag herdada de assinatura aprovada, sem modificar VFX, kits Arena ou saves; regressão compilada adicionada.
- [ ] GREEN integral: todas as CIs do novo SHA (incluindo 149 ULTs e Chromium) devem passar.
- [ ] Revisão, merge e confirmação de Pages HTTP do SHA exato.
