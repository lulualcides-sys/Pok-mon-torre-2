# REA × Torre 2 — revisão da integração de vetores (02/11/2026)

## Estado real do protótipo

Branch: `feat/rea-vector-lab-preview-20261101`. PR rascunho: [#459](https://github.com/lulualcides-sys/Pok-mon-torre-2/pull/459). Nenhuma publicação na `main`.

**Aprovado:** execução de `node --test tests/rea-vector-preview.test.js` e `node --check` dos arquivos envolvidos no [CI #41383191795](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41383191795) e [CI #41382899956](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41382899956). Colisões com centros móveis, trajetória original, início/fim dos movimentos e limpeza do overlay foram validados em mocks do Phaser.

**Ainda não aprovado:** o build `node tools/pokearena/build-preview.mjs` do cliente externo atualizado. Como o build não conclui, não foi executado o teste `tests/rea-vector-browser.cjs` e **não existe screenshot real confirmada** da nova demonstração nesta branch. Não afirmar suporte real ao botão nem ausência de regressões visuais em navegador.

## Compatibilidade do cliente externo — correções aplicadas e limites

1. `escenas/carga.js`: o cliente substituiu o antigo pedido opcional de `balls20.png` por `balls10.png`. Preservar o novo arquivo, sem removê-lo.
2. `escenas/titulo.js`: literais de posicionamento/proteção de sprites e controles sociais foram alterados. As compatibilizações preservam a versão nativa quando a alteração é meramente decorativa e os links já foram desabilitados.
3. `datos.js`: `ROSTER` agora filtra também Pokémon locais por `EN_LOCAL`. A injeção da coleção Kanto foi adaptada **sem retirar** a condição específica do cliente.
4. `habilidades.js`: o import de configuração mudou. O import do módulo próprio de efeitos foi separado para não modificar o restante das importações nativas.
5. `escenas/titulo.js`: a descrição da opção de perfil em Ajustes mudou, com tratamento isolado da entrada offline, sem substituir o menu todo.
6. `luchador.js`: **bloqueio atual**. O instalador procura um ramo antigo de regeneração de HP, identificado pelo prefixo `if(t-this.ultimoDano>=REGLAS.curaTras...`, para desativar passivamente a regeneração apenas na campanha. O cliente atualizado mudou esse ramo. **Não foi aplicado nenhum patch especulativo**: é preciso validar a expressão/AST atual para não alterar involuntariamente HP, dano, cura ou a Arena.

O pipeline CI foi otimizado para refazer até três vezes apenas downloads transitórios do cliente. Erros determinísticos do código-fonte agora encerram o build na primeira tentativa, evitando capturas repetidas.

## Próxima implementação segura

Antes de alterar `luchador.js`, identificar o contexto do método atual e testar duas condições: na **campanha**, cura passiva do modo Arcade bloqueada, enquanto itens e golpes de cura funcionam; na **Arena original**, regeneração e mecânicas nativas preservadas. Só após esse teste é permitido retomar a compilação de sandbox e o Chromium. Evitar executar ou publicar a branch em produção enquanto o teste end-to-end não concluir.

A coleta REA disponibiliza dados de contagem de quadros, marcadores ordinais e famílias estruturais hipotéticas; **não** disponibiliza timings reais, quadros completos nem licença para copiar VFX. O protótipo deve continuar original e opcional, sem alterar efeitos aprovados.
