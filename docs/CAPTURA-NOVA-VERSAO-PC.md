# Captura de uma versão nova do Poké Arena 2D pelo PC do dono (23/11/2026)

**Estado: ferramenta pronta. Captura da 0.78 ainda NÃO feita. Porta para o Torre 2 ainda NÃO feita.**

## Por que pelo PC

- Os donos do Poké Arena 2D liberaram a captura (registrado em 20/11/2026 e reconfirmado pelo dono do Torre 2 em 23/11/2026).
- Mesmo assim, desde 21–22/11 a Cloudflare do site responde **HTTP 403** para servidores de nuvem, inclusive para a página inicial. Isso vale para os containers do Claude e para o GitHub Actions. Prova: monitor run 45043668238, tentativa 2 (23/11).
- A permissão não remove esse bloqueio técnico, e ele não é contornado. A captura roda numa rede que o site aceita, como o PC do dono, com o mesmo GET público do resto do projeto.

## Como rodar (Windows, macOS ou Linux, com Node 18 ou mais novo)

1. Baixe o repositório: **Code → Download ZIP** na branch `claude/clever-hamilton-g6ejax`, e descompacte.
2. Abra um terminal dentro da pasta e rode:

   ```
   node tools/pokearena/discover-upstream-capture.mjs captura-nova
   ```

3. No fim, o script imprime `UPSTREAM_DISCOVER {"alpha":"0.78.x","src":"src-...","modules":N,"assets":N,"failures":N}`.
4. Compacte a pasta `captura-nova`. No Windows: botão direito → **Compactar para arquivo ZIP**.
5. Envie o ZIP. O caminho mais simples é anexá-lo a um release novo no GitHub: **Releases → Draft a new release**, que aceita até 2 GB por arquivo. Depois avise o Claude.

## O que o script faz

- Lê `index.html`, acha `src-XXXX/main.js` e segue todos os imports estáticos, dinâmicos e com template, como idiomas e músicas.
- Pega a Alpha somente do `VERSION` do `config.js` oficial, nunca do hash.
- Baixa os assets citados no código e todos os arquivos do manifesto PMD.
- Grava o pin `alphaNNN-source-modules.json`, com o SHA-256 de cada arquivo, além de `MANIFEST.txt` e `FALHAS.txt`.
- O JavaScript baixado é só gravado, nunca executado. Não usa cookies nem login. Se o `main.js` responder 403, o script para e avisa.

**Validado:** o script foi rodado offline contra a cópia permanente da 0.77.3 (release `torre2-upstream-source-alpha0773-20261120`) e recuperou os **128 de 128** módulos, com SHA-256 idêntico ao pin `data/alpha0773-source-modules.json`. A descoberta dos assets não pôde ser validada contra o site real, porque `/assets` estava bloqueado. Cada asset que faltar fica listado em `FALHAS.txt`.

## Depois que o ZIP chegar (porta)

Seguir o mesmo rito da 0.77.3 (`docs/CAPTURA-ALPHA-0773.md` e o publicador `torre2-alpha0762-publish.yml`):

1. Conferir os hashes, arquivar no release permanente e comparar os módulos com a 0.77.3.
2. Identificar espécies e kits nativos novos. Pela regra de 06/11, o kit nativo prevalece. Se espécies do Torre 2 virarem nativas, isso muda a jogabilidade e exige aprovação do dono.
3. Reancorar os adaptadores, montar o build e rodar `npm test`, o guardião visual e os testes Chromium de Arena, Pokédex, Liga e campanha.
4. Publicar, deixando a 0.77.3 como rollback, e confirmar o SHA servido no Pages.
