# Practice vs Bot e fila Unranked — semântica verificada no cliente público

Data da observação: **31/10/2026**. Origem: `https://ranked.pokemonbattlegrounds.com/app.js`, script público, observado por busca focada sem republicar o código.

## Achado principal

O botão visível **Practice vs Bot** contém seu próprio handler e, após a seleção de dificuldade, constrói uma solicitação de fila com **modo `practice` e nível numérico**. Isso é diferente do botão **Find unranked battle**, utilizado para fila casual.

A interface de espera utiliza uma lógica genérica que exibe **Unranked** para todos os casos que não estejam no estado `ranked`. Assim, o texto **Unranked** na fila **não é prova** de redirecionamento para partidas contra pessoas quando a navegação começou pelo botão Practice vs Bot.

O aviso de servidor cheio (número de posição da fila) é genérico e pode aparecer antes de partidas práticas. Ele não prova falha de autenticação nem mudança de modalidade.

## Evidência e limites

- [GitHub Actions — inspeção de rotas públicas, sucesso](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41242578564).
- [Catálogo de ocorrências, posições e contexto sem cópia do JS](SEMANTICA-FILA-PRACTICE-VS-UNRANKED.json).
- [Tentativa da equipe Magnezone/Torkoal/Toxicroak](https://agent.tinyfish.ai/runs/930d1dac-f18f-4bd1-8e27-eee88a968709): equipe montada e botão **Find unranked battle** acionado por engano. **Não conta como prática contra bot**; nenhuma animação vista.
- [Tentativa corrigida](https://agent.tinyfish.ai/runs/766f7a3c-57ca-4eda-a38c-1d0cee39de2d): botão **Practice vs Bot → Easy** realmente clicado, mas fila `#32` e campo de batalha não iniciado dentro da sessão. O chip Unranked pode ser apenas um rótulo genérico.

**Conclusão:** o modo solicitado é `practice` quando se clica em Practice vs Bot; entretanto, o cliente público sozinho não comprova qual servidor tratou a solicitação nem que a partida foi iniciada. Confirmar pela arena e adversário bot em execução.

## Procedimento corrigido

1. Reutilizar equipe salva, não reconstruir a cada execução.
2. Clicar apenas **Practice vs Bot → 1 EASY**. Jamais substituir por **Find unranked battle**.
3. Se aparecer Unranked na tela de espera, **não concluir** que houve redirecionamento humano — o cliente usa esse rótulo genérico.
4. Aguardar fila até abrir batalha com adversário bot. Se não abrir dentro do limite definido, registrar que houve **fila/lotação**, sem inventar golpes realizados.
5. Diferenciar cada nome visível no HUD, clique, uso relatado, VFX isolado, vídeo/quadros completos.

Preservar toda a pesquisa na branch `research/pb-ranked-rea-20261031`, sem alterar golpes aprovados nem publicar artes de terceiros.
