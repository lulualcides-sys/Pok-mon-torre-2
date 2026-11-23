# Liberação no Cloudflare para a captura do Pokémon Torre 2

**Para o administrador do Poké Arena 2D (`www.pokearena2d.com`).**
A captura automática do Pokémon Torre 2 que vocês autorizaram roda no GitHub Actions e hoje recebe **HTTP 403 "Sorry, you have been blocked"** do Cloudflare de vocês. Exemplos de Ray ID: `a5ec39603840586e` e `a5ec8a843daf9c2a-IAD`, de 23/11/2026. O pedido abaixo libera **somente** essas requisições, por meio de um cabeçalho secreto que só vocês e o Torre 2 conhecem.

## 1. Descobrir qual regra está bloqueando (1 minuto)

1. Abra **Security → Events** no painel do Cloudflare.
2. Filtre pelo Ray ID `a5ec39603840586e`.
3. O campo **Service** mostra quem bloqueou:
   - **Custom rules**, **IP Access rules** ou **Managed rules**: a regra do passo 2 resolve.
   - **Bot Fight Mode**: ele não aceita exceções. Nesse caso, desligue em **Security → Bots** ou use o Super Bot Fight Mode, que aceita Skip e existe a partir do plano Pro.

## 2. Gerar o token

Gere um valor aleatório. Exemplo em qualquer terminal:

```
openssl rand -hex 32
```

Envie esse valor ao dono do Torre 2 por um canal privado. Ele nunca é publicado.

## 3. Criar a regra de exceção (Skip)

Abra **Security → WAF → Custom rules → Create rule** e preencha:

- **Nome:** `Torre 2 — captura autorizada`
- **Expressão:** use **Edit expression** e troque `TOKEN_AQUI` pelo token:

```
(http.host eq "www.pokearena2d.com"
 and http.request.method eq "GET"
 and any(http.request.headers["x-torre2-capture"][*] eq "TOKEN_AQUI")
 and (http.request.uri.path eq "/"
      or http.request.uri.path eq "/index.html"
      or http.request.uri.path eq "/version.json"
      or starts_with(http.request.uri.path, "/src-")
      or starts_with(http.request.uri.path, "/assets/")))
```

- **Ação:** **Skip**. Marque:
  - **All remaining custom rules**;
  - **All rate limiting rules**;
  - **All managed rules**;
  - **All Super Bot Fight Mode rules**, se aparecer.
- **Posição:** **primeira da lista** (*First*). Uma regra de bloqueio que fique acima dela encerra a requisição antes da exceção.

**Escopo:** só GET, só o host `www`, só os caminhos do jogo e só com o token. Qualquer outra requisição continua sujeita às proteções normais. Para revogar, basta apagar ou desativar a regra, ou trocar o token.

## 4. Do lado do Torre 2 (já implementado)

- O token fica **somente** no segredo do GitHub Actions `TORRE2_CAPTURE_TOKEN` (Settings → Secrets and variables → Actions). Ele não fica no código e não aparece nos logs: o GitHub mascara o valor, e as mensagens de erro do projeto registram só `auth-header=sent|absent`.
- O cabeçalho `X-Torre2-Capture` só é enviado para `https://www.pokearena2d.com`. Redirecionamentos para outra origem são recusados, para o token nunca vazar.
- Erros temporários (rede, 429 e 5xx) têm até 3 tentativas com espera de 1 s e 3 s. **403 e 404 nunca são repetidos.**
- Cada bloqueio registra status, `cf-ray`, `server`, `cf-mitigated`, a saída do `/cdn-cgi/trace` (IP, colo e local) e o horário UTC no resumo do run. Isso é suficiente para vocês localizarem o evento.
- Workflows que enviam o cabeçalho:
  - `pokearena-auto-capture.yml` (a cada 4 h, captura e arquiva versões novas);
  - `pokearena-upstream-watch.yml` (monitor);
  - `pokearena-source-snapshot.yml` (verificação diária).
- O GitHub Actions **não tem IP fixo**. Por isso a liberação é feita pelo cabeçalho, e não por IP.

## Pendente

- [ ] Administrador do Poké Arena 2D: criar a regra do passo 3 (e, se necessário, desligar o Bot Fight Mode) e enviar o token.
- [ ] Dono do Torre 2: salvar o token como segredo `TORRE2_CAPTURE_TOKEN` e rodar **Actions → "Poké Arena 2D — captura automática de versão nova" → Run workflow** para o teste real.

## Caminho alternativo, sem Cloudflare: pacote entregue (pronto)

Se for mais simples para os donos, eles podem mandar o pacote direto, sem criar regra nem token:

1. Fazer um ZIP (ou `.tar.gz`) da pasta publicada do site. Ela deve conter `src-XXXXXXXXXX/` (com `main.js` e `config.js`), `assets/` e `index.html`.
2. Anexá-lo a um release deste repositório com tag que comece por **`upstream-package-`** (ex.: `upstream-package-0780`).

O workflow `pokearena-import-package.yml` dispara sozinho e faz o seguinte:
- baixa só esse anexo;
- recusa o pacote se faltar qualquer módulo importado, se não houver `VERSION` ou se houver links simbólicos;
- compara com a 0.77.3;
- arquiva o resultado num release permanente com SHA-256;
- avisa na issue #615.

O importador foi validado com o pacote real da 0.77.3: 128 de 128 módulos, com pin idêntico. Um pacote sem `lodo.js` foi recusado.
