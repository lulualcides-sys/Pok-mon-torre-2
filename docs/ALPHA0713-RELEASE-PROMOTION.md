# Promoção auditada da Alpha 0.71.3

Somente publica o artefato de GitHub Actions previamente homologado: [execução #43650310612](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/43650310612), commit `f9e859c`, digest SHA256 fixo.

O workflow `pokearena-alpha0713-promote.yml` confirma versão oficial via `src-88d688408b/config.js` do artefato compilado, identidade da fonte `src-5ccc174cb8`, Phaser, cobertura das animações e créditos dos 30 conjuntos alternativos. Só o pacote de produção previamente testado é usado; não recaptura o upstream e não instala artes novas durante a publicação.

`pages.yml` legado (Alpha 0.65.8) fica manual para rollback, evitando que o antigo workflow sobrescreva a nova publicação. A aprovação da PR e seus testes são separados do deploy da Pages.

**Importante:** jogo não comercial de fã; as licenças de colaboradores SpriteCollab não autorizam automaticamente a franquia Pokémon/Nintendo nem comprovam igualdade visual das versões. Os créditos dos artistas acompanham o site.
