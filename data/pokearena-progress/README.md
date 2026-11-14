# Poké Arena 2D → Pokémon Torre 2: checkpoint incremental

Relatórios da candidata **NÃO são o jogo publicado**.

As execuções de [GitHub Actions](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions) organizam os dados temporários sob:

`site-capture/native-progress/<Alpha>/<src-...>/<hash do índice>/`

- `verificados/formas.json`: formas com arquivos locais encontrados e hashes SHA-256. Integridade local **não** comprova licença, fidelidade visual nem teste Phaser.
- `pendentes/formas.json`: formas sem pacote gráfico completo ou PNGs suficientes.
- `bloqueados/http.json`: caminhos públicos que retornaram HTTP 403/404, sem contornar negações.
- `resumo.json`: totais e fingerprint da mesma versão.

Os arquivos JSON são anexados ao artifact `pokearena-verified-pending-blocked` (retenção 30 dias). Os binários de pacotes públicos com proveniência e SHA-256 validados ficam **apenas** no cache privado do workflow, separados pelo fingerprint Alpha+src+#paq, não no repositório nem no Pages.

HTTP 403/404 registrado para o mesmo hash não é repetido na execução seguinte quando o cache correspondente é recuperado; o lote público novo é limitado. Versão/hash diferente invalida o reaproveitamento.

**Publicação:** nenhum resultado deste checkpoint dispensa testes Node, build Phaser, Chromium/WebGL, Guardião e saves. Nada nesta automação mescla main ou publica o jogo.


## 19 variantes — fontes SpriteCollab

Veja [COLLAB-19.md](./COLLAB-19.md) para as fontes, licenças e pastas de quarentena.
