# SpriteCollab — auditoria das 19 formas faltantes (Alpha 0.71.3)

Esta candidata está em **DRAFT**, sem merge e sem autorização para publicar imagens substitutas.

A auditoria `tools/pokearena/audit-collab-19-forms.mjs` consulta somente os `credits.txt` públicos do [SpriteCollab](https://github.com/PMDCollab/SpriteCollab), por HTTPS normal, agrupando pedidos repetidos. Ela **não copia sprites para o cliente**, não altera o build e não contorna HTTP 403/404. Não confundir integridade ou disponibilidade de uma espécie-base com fidelidade à variante Squirtle Squad, cores de Gengar ou Moltres.

Arte de referência, por família, na execução GitHub Actions:
`site-capture/substitutes-quarantine/<alpha>/<src>/<index-sha>/{candidatos,pendentes,bloqueados}/<familia>/<forma>.json`

- **3 Squirtle Squad:** bases de Squirtle/Wartortle/Blastoise com subpastas alternativas do Collab.
- **13 Gastly/Haunter/Gengar:** bases de cada espécie; nenhuma das 13 recolorações é presumida equivalente.
- **3 Moltres:** duas alternativas e um terceiro diretório cuja arte tem crédito não esclarecido ou retrato ausente.

O classificador exige créditos `CUR` para `Idle`, `Attack` e `Normal`. O status `CC_BY_NC_CREDITED` é apenas evidência para revisão não comercial. `PMDCollab_1/2` exige análise própria; `CHUNSOFT/Unspecified`, ausência de `credits.txt` ou falha de rede **não autoriza** reutilização. Mesmo a classe `candidatos` continua `NOT_A_RELEASE_ASSET`: a arte original da forma especial e os outros golpes continuam sem adaptação, e direitos de personagens/franquias podem existir.

O caminho correto para conclusão: obter ou criar as variantes legalmente utilizáveis, validar cada animação do manifesto e dimensões oficiais, creditar autores e só então revisar o release gate, com Chromium, combate e saves.

**Não modificar** a pasta de artes aprovadas, os 11 conjuntos da pesquisa anterior, a branch principal ou o Pages a partir dessa auditoria.
