# Fontes de batalhas oficiais — Pokémon Battlegrounds

Fonte primária: https://pokemonbattlegrounds.com/ — seção **Latest battles**, verificada em 31/10/2026. A descrição oficial afirma: combate em tempo real, Pokémon deslocando-se, esquivando-se, defendendo-se e atacando, golpes próprios feitos em pixel art, treinadores escolhendo golpes e trocas. **Descrição do autor não equivale a quadros vistos por auditoria.**

| Referência | Cenário descrito pelo site | Link |
| --- | --- | --- |
| Brendan vs Steven | Batalha 6v6 em Meteor Falls | https://www.youtube.com/watch?v=J_CxwaMNjmk |
| Red vs Gold | Batalha 6v6 em Mt. Silver | https://www.youtube.com/watch?v=XQy0APLPCL8 |
| Sceptile vs Gengar | Duelo em Mt. Pyre | https://www.youtube.com/watch?v=Fq1z0wXktLE |

## Execução técnica verificada

- [GitHub Actions #41230396307](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/41230396307) executou `yt-dlp` para coletar amostras de vídeo e `ffmpeg` para gerar imagens.
- **Nenhuma das três gravações foi baixada**: YouTube respondeu `Sign in to confirm you’re not a bot`. Os três logs estão no artefato da execução, que possui apenas textos de erro, sem quadros nem vídeos.
- Este resultado **não autoriza declarar animações vistas**, duração de ataques, posição, velocidade, efeitos de Pokébola, VFX, colisões ou cronologia real do duelo.
- Não serão usados cookies inventados, contas descartáveis, falsificação de sessão, ou credenciais do usuário em CI.

## Próximo uso válido no Pokémon Torre 2

1. Preservar estes três URLs como referências audiovisuais verificadas no próprio site oficial, sem dizer que foram inspecionados quadro a quadro.
2. Manter o catálogo estático de golpes, parâmetros, símbolos de combate e 17 arenas em `reference-library/pb-ranked/`.
3. Implementar somente recursos originais que já tenham requisitos claros (movimentação, auto/manual, esquiva, feedback de impacto) sem confundir com reprodução de animação do site.
4. Registrar observação real apenas quando houver evidência visual acessível e verificável, sem violar autenticação.

## Licença / propriedade intelectual

O site identifica seus sprites como PMD SpriteCollab, sob **CC BY-NC 4.0**. Essa informação não significa que todo o conteúdo do jogo ou dos vídeos esteja sob a mesma licença. Verificar a licença de cada recurso antes de copiá-lo, atribuir autoria quando necessário e preservar os efeitos já aprovados do Torre 2.
