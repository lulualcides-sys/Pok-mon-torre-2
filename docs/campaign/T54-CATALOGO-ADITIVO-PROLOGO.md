# T54 — Catálogo adicional da abertura, sem alterar as 60 artes

Os 60 WebP existentes continuam com os mesmos IDs, hashes e manifesto. A PR T54 cria `tools/pokearena/torre2-approved-prologue-assets.js` para incorporar **somente após aprovação** as imagens individuais de Pallet Town, Rota 1, Viridian City, Viridian Forest (Rota 22 opcional).

Nenhuma imagem candidata foi autorizada ainda. O catálogo complementar permanece **vazio** e o estágio 0 mantém a interface antiga. Nenhum mapa é fabricado, reaproveitado como outra cidade ou ativado por padrão.

Para incorporar futuramente uma arte, o registro precisa de:
- ID exato entre `pallet-town`, `route-1`, `viridian-city`, `viridian-forest`, `route-22`;
- arquivo individual `assets/ui/kanto-approved-prologue/<id>.webp` 1280×720, com SHA-256 próprio;
- índice adicional acima de 60, sem sobrescrever a ordem histórica do acervo original;
- `hotspots_status: 'validated'`, hotspots normalizados medidos e entradas reais em `destinations`.

O build exige WebP RIFF válido, resolução exata, hash igual ao registrado, caminho seguro e ausência de ID duplicado. Só então copia a imagem ao jogo Phaser. Ligações do prólogo aparecem no grafo apenas quando os dois mapas de uma conexão existem. A trava T53 exige ainda todas as saídas de ida/volta auditadas antes de liberar a campanha visual desde Pallet.

**Aviso:** uma arte antiga com menus ou nomes de locais errados não deve ser tratada como aprovada. Os 60 originais e os saves devem continuar intocados.
