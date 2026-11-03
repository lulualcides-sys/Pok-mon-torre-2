# Pokémon Torre 2 — homologação isolada (03/11/2026)

## Decisão do usuário — regra de bloqueio

**Não publicar no jogo oficial antes de todas as tarefas estarem concluídas e o usuário emitir aprovação final explícita.** Esta decisão substitui toda autorização genérica anterior para publicar automaticamente.

- **Produção:** branch `main`; URL oficial `https://lulualcides-sys.github.io/Pok-mon-torre-2/`. Não atualizar o site, mesclar na main nem disparar `pages.yml` ou qualquer outro deploy do Pages.
- **Homologação:** `test/homologacao-kanto-20261103`, inicialmente copiada do HEAD `82692abd02b09f0fa5810f536698a5875496a070` da PR T67 #514 (DRAFT). Nenhum merge efetuado.
- **Pacote testável:** workflow `.github/workflows/homologacao-kanto.yml`, acionado por push apenas nessa branch; gera o cliente Phaser em `_site/arena2d/` e salva ZIP como artefato GitHub Actions, sem deploy.
- **Link de jogo online de testes:** NÃO configurado. Não dizer que há site de teste navegável; um artefato ZIP não equivale a site hospedado.

## Como testar o artefato

1. Na aba **Actions**, abrir a execução do workflow **Pokémon Torre 2 — Homologação isolada (SEM DEPLOY)** e obter o artefato `pokemon-torre-2-HOMOLOGACAO`, quando produzido.
2. Extrair o ZIP e, dentro da pasta extraída, executar `python3 -m http.server 4173` (ou servidor HTTP estático local equivalente).
3. Abrir `http://localhost:4173/` em navegador compatível com WebGL. Abrir `index.html` por `file://` não substitui um servidor HTTP.

## Portões de qualidade

- Preservar as **60 imagens WebP originais**, sem alterações ou duplicações e sem mudar IDs/proveniência.
- Verificar transições/hotspots, saves sem perda, progressão legítima, desktop e mobile.
- Registrar o SHA exato e as execuções T41, Guardião Visual, testes de navegador e testes completos aplicáveis. Falhas de QA não são aprovação.
- Testes com estado artificial de campeão não provam vitória natural na campanha.
- Conter na branch de teste apenas patches verificados e rastreáveis; branches/PRs de desenvolvimento permanecem independentes.
- Só após **aprovação final explícita do usuário**, propor merge e publicação como operação separada. Não inferir aprovação por silêncio ou pedidos de continuar.

## Estado inicial

Branch de teste originada da T67, ainda em validação visual. A existência da branch ou do workflow **não** significa que o artefato foi gerado, que a campanha completa funciona ou que os testes passaram.
