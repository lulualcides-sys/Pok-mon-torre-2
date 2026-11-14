# Promoção auditada da Alpha 0.71.3

Somente publica o artefato de GitHub Actions previamente homologado: [execução #43653866323](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/43653866323), commit `76a776f`, digest SHA256 fixo.

O workflow `pokearena-alpha0713-promote.yml` confirma versão oficial via o diretório compilado indicado em `arena2d/version.json` e seu `config.js`, identidade da fonte `src-5ccc174cb8`, Phaser, cobertura das animações e créditos dos 30 conjuntos alternativos. Só o pacote de produção previamente testado é usado; não recaptura o upstream e não instala artes novas durante a publicação.

`pages.yml` legado (Alpha 0.65.8) fica manual para rollback, evitando que o antigo workflow sobrescreva a nova publicação. A aprovação da PR e seus testes são separados do deploy da Pages.

**Importante:** jogo não comercial de fã; as licenças de colaboradores SpriteCollab não autorizam automaticamente a franquia Pokémon/Nintendo nem comprovam igualdade visual das versões. Os créditos dos artistas acompanham o site.

## Atualização da Pokédex (14/11/2026)

Artefato aprovado no Chromium, execução #43653866323: 278 fichas individuais; Uxie/Mesprit/Azelf separados; Tauros com Horn Attack, Take Down, Headbutt e Giga Impact da transformação de Ditto (Dodge preservado); sprites e retratos de todos os 100 Pokémon de Johto carregados localmente, incluindo Chikorita, Bayleef e Meganium. A Pokédex foi alterada sem modificar o roster de batalha ou os saves. O artefato permanece fixado por SHA256.
