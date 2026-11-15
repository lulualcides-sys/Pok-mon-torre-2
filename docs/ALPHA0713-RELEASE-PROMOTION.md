# Promoção auditada da Alpha 0.71.3

Somente publica o artefato de GitHub Actions previamente homologado: [execução #43657903565](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/43657903565), commit `7c89fb0`, digest SHA256 fixo.

O workflow `pokearena-alpha0713-promote.yml` confirma versão oficial via o diretório compilado indicado em `arena2d/version.json` e seu `config.js`, identidade da fonte `src-5ccc174cb8`, Phaser, cobertura das animações e créditos dos 30 conjuntos alternativos. Só o pacote de produção previamente testado é usado; não recaptura o upstream e não instala artes novas durante a publicação.

`pages.yml` legado (Alpha 0.65.8) fica manual para rollback, evitando que o antigo workflow sobrescreva a nova publicação. A aprovação da PR e seus testes são separados do deploy da Pages.

**Importante:** jogo não comercial de fã; as licenças de colaboradores SpriteCollab não autorizam automaticamente a franquia Pokémon/Nintendo nem comprovam igualdade visual das versões. Os créditos dos artistas acompanham o site.

## Atualização da Pokédex (14/11/2026)

Artefato aprovado no Chromium, execução #43657903565: 278 fichas individuais; Uxie/Mesprit/Azelf separados; Tauros com Horn Attack, Take Down, Headbutt e Giga Impact da transformação de Ditto (Dodge preservado); sprites e retratos de todos os 100 Pokémon de Johto carregados localmente, incluindo Chikorita, Bayleef e Meganium. A Pokédex foi alterada sem modificar o roster de batalha ou os saves. O artefato permanece fixado por SHA256.

## Batalhas e famílias evolutivas verificadas

A execução [#43657903565](https://github.com/lulualcides-sys/Pok-mon-torre-2/actions/runs/43657903565) terminou com SUCCESS: 534 testes Node, Phaser/Chromium verificou 145 famílias para 278 espécies, abas Chikorita/Bayleef/Meganium e Magby/Magmar/Magmortar, Arena e League iniciando batalhas reais com dois lutadores, e cooldown Stone Edge 3,5 s. A falha crítica do cliente base era a variável inexistente `ids` em `Combate.preload`, corrigida para `dexs.has("0133")`. Artefato fixo SHA256: `sha256:130f60e5a9a5687d56f814fff7a92c55e3c960d48ecffe01362f7b4077507903`. Não modifica o workflow manual de rollback.
