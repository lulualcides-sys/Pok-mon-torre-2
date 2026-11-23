# Exportar a versão nova do Poké Arena 2D pelo navegador do PC

É o caminho mais rápido enquanto o Cloudflare bloqueia servidores. Usa o seu acesso normal de jogador, com a captura autorizada pelos donos. Só funciona no PC, porque o celular não tem DevTools.

1. No Chrome ou Edge do PC, abra **https://www.pokearena2d.com/** e espere o jogo carregar.
2. Aperte **F12** e abra a aba **Console**.
   - Se aparecer um aviso sobre colar código, digite `allow pasting` e aperte Enter.
3. Abra o arquivo **`tools/pokearena/browser-export-console.js`** no GitHub e clique em **Copy raw file**.
4. Cole no Console e aperte **Enter**.
   - O progresso aparece em amarelo (`TORRE2`).
   - No fim aparece `TORRE2 pronto: N arquivos em K parte(s)`.
   - Se o Chrome perguntar sobre vários downloads, clique em **Permitir**.
5. Serão baixados os arquivos `torre2-export-0780-parte-1.json`, `parte-2.json` e assim por diante.
6. No GitHub, abra **Releases → Draft a new release** e configure:
   - **Tag:** `upstream-package-0780`;
   - **Anexos:** todas as partes;
   - depois clique em **Publish release**.
7. Pronto. O workflow **"Poké Arena 2D — importar pacote entregue"** roda sozinho:
   - valida que todos os módulos estão presentes;
   - compara com a 0.77.3;
   - arquiva com SHA-256;
   - avisa na issue #615.

## O que o script faz e não faz

- **Faz:** só leituras (GET) no próprio site, a partir de `main.js`, seguindo os imports. Inclui `index.html`, `version.json`, os módulos `src-*`, os arquivos citados em `assets/...` e todos os sprites do manifesto PMD.
- **Não faz:** não lê cookies nem senhas, não envia nada a lugar nenhum e não altera o jogo nem a sua conta.

**Testado** em Chromium contra a cópia real da 0.77.3 servida localmente:
- os 128 de 128 módulos saíram com SHA idêntico ao original;
- os sprites do manifesto saíram byte a byte iguais;
- a divisão em 5 partes funcionou;
- o importador remontou tudo.
