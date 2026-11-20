# Captura do Poké Arena 2D Alpha 0.77.3 (20/11/2026)

**Estado: CAPTURADO e guardado. NÃO publicado.** O jogo no Pages continua sobre a 0.76.2. Esta captura não altera a Arena, os kits nativos nem a campanha.

## Autorização

Em 20/11/2026, o dono do Torre 2 informou que **os donos do Poké Arena 2D liberaram a captura** para ele. O uso continua o mesmo: projeto pessoal, gratuito e sem vendas, mantendo a proveniência e os créditos do site. O registro também está em `docs/CREDITOS-E-LICENCAS.md` e no campo `authorization` de `data/alpha0773-source-modules.json`.

## O que foi capturado

- **Origem:** `https://www.pokearena2d.com/`. O `version.json` público mostra `0.77.3` e `src-712ba03dbb`.
- **Método:**
  - foram usados apenas GETs públicos comuns, pelo mesmo `tools/pokearena/public-client-http.mjs` do resto do projeto;
  - não houve login, cookies nem contorno de 403;
  - o JavaScript foi só gravado em disco, nunca executado na captura.
- **128 módulos com SHA-256 fixado** em `data/alpha0773-source-modules.json`:
  - 120 módulos ES, alcançados a partir de `main.js` pelos imports estáticos e dinâmicos;
  - 4 idiomas: `idiomas/es|pt|vi|it.js`. O inglês está embutido;
  - 4 músicas: `musica/mewtwo_origins|arceus|rayquaza|rayquaza_mega.js`.
  - Nenhum módulo falhou.
- O `index.html` ao vivo também foi capturado.
- **Cópia de segurança permanente:** release `torre2-upstream-source-alpha0773-20261120`. Contém o pacote `.tar.gz` e o `.sha256`. Ele é criado pelo workflow `.github/workflows/torre2-upstream-0773-archive.yml`. O workflow baixa de novo os 128 módulos com `tools/pokearena/archive-upstream-capture.mjs` e só arquiva se todos os SHA-256 baterem com o pin. Se o site mudar algum arquivo antes, ele falha em vez de guardar outra coisa.

## Bloqueado (não contornado)

`/assets/*` responde **HTTP 403** pela Cloudflare do site ("Sorry, you have been blocked"). Isso inclui `assets/pmd/manifest.json`, `assets/vfx/*` e `assets/comunicado/*`. A permissão dos donos não muda o bloqueio técnico. Para obter as imagens, há dois caminhos:

1. os donos liberam o acesso na Cloudflare;
2. os donos enviam os arquivos diretamente. Eles entram no repositório com hash e proveniência.

Continuam faltando as 6 folhas de efeito já pendentes desde a 0.76.2: `fuegofatuo`, `punohielo`, `hojafilo`, `hojatormenta`, `xtijera` e `detect`. Também faltam os sprites novos de Grimer/Muk e Staryu/Starmie e as artes das arenas dos ginásios.

## Comparação com a 0.76.2 (a base atual do Torre 2)

| Item | 0.76.2 | 0.77.3 |
| --- | --- | --- |
| Módulos ES | 114 | 120 (+6, nenhum removido) |
| Módulos iguais byte a byte | — | 53 |
| Módulos alterados | — | 61 |
| Linhas de espécies em `datos.js` | 48 | 50 |

**Módulos novos:**
- `arena_viva.js` e `arena_viva_hojas.js`: fundos vivos das arenas;
- `filtro_rol.js`: filtro FÍSICO/HÍBRIDO/DISTÂNCIA;
- `jefes/hoopa.js`: desafio HOOPA UNBOUND;
- `lodo.js`: rastro de lodo do Muk;
- `mensajes.js`: botão MENSAGENS na tela de título.

**Espécies nativas novas:**
- **Grimer → Muk**: Acid Armor, Venoshock, Rest, Poison Jab, Acid Spray, Minimize, Curse e Sludge Wave, com veneno grave e rastro tóxico;
- **Staryu → Starmie**: Water Gun, Swift, Rapid Spin, Recover e a ULT Hydro Spin.

**Kits nativos alterados:** só o Hoopa. O ATK psíquico perdeu `estado:"CONFUSION"`. Nenhum golpe ou espécie nativa foi removido.

**Notas do site** (`comunicado_texto.js`):
- desafio do Hoopa;
- uma arena por ginásio;
- CPU mais agressiva;
- skin BETA do Arceus;
- favoritos na conta.

## Impacto para uma futura porta (não feito agora)

- **Grimer, Muk, Staryu e Starmie já existem no Torre 2 como espécies adicionadas** da Kanto 151 (`torre2-all-kanto-species.js`, `torre2-move-pool.js`). Pela regra global de 06/11/2026, ao portar para a 0.77.3 elas passam a ser **nativas**:
  - na Arena, na Pokédex e no Training, vale o kit nativo;
  - os injetores do Torre 2 precisam pular essas espécies.
  - Isso muda a jogabilidade delas e precisa de aprovação do dono antes.
- O botão **MENSAGENS** novo faz o mesmo papel da aba News que o dono mandou remover. Numa porta, ele deve ser removido também.
- As adaptações `*-0713.mjs` e as âncoras `torre2-alpha0762-anchors.mjs` precisam ser conferidas contra os 61 módulos alterados.
- Os sprites dos 4 Pokémon novos e as artes de arena dependem da liberação de `/assets` (ver acima).
