# Importar os 60 mapas aprovados — PR T47

O acesso GitHub desta sessão pode escrever código, mas **não** transferir os bytes do ZIP pelo conector disponível.

A branch está preparada para a transferência em **um único arquivo**:
1. Baixe o ZIP `atlas-60-mapas-phaser.zip` da pasta Biblioteca / Pokemon Torre 2 / Mapas Aprovados 2026-11-02.
2. Abra esta pasta `assets/import` na branch `feat/t47-phaser-approved-map-default-20261102`.
3. Use GitHub **Add file → Upload files** para adicionar o ZIP de 22,7 MB com o nome exato `atlas-60-mapas-phaser.zip` nesta pasta.

O GitHub Actions `T47 — instalar 60 artes e validar Phaser real` verifica o SHA-256 **572e35cc530cf25e1c0551953a0f59034e5ed53d33cac09e1b0fd5b3f288e21c**, confere mapa e destino, instala 60 WebP, ativa o renderer, testa o Phaser e capta screenshots no Chromium. Somente se tudo passar, cria um commit com os WebP no mesmo branch de rascunho. A main nunca será mesclada ou publicada por esse workflow.

**Não enviar outros ZIPs:** diferentes bytes serão rejeitados. Não enviar senhas nem credenciais.
