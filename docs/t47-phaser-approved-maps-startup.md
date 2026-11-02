# T47 — Ativação de cenário no Phaser (sem liberar versão incompleta)

A cena campanha, após escolher inicial ou carregar um save existente, deve abrir a cidade da etapa usando a arte WebP aprovada **somente** quando o pacote completo de 60 imagens já estiver instalado, a flag `APPROVED_MAP_ASSETS_READY` estiver ligada e a textura tiver sido realmente carregada. Se houver erro no carregamento, permanece o mapa nativo antigo; os saves, batalhas, itens e progressão não são alterados.

A interface do cenário traz o botão **ROTAS** (canto superior disponível), que abre a tela de treinadores e suas batalhas tradicionais. Dentro de ginásios e do S.S. Anne, **VOLTAR** retorna à rota existente. Captura, inventário e troca continuam disponíveis na tela nativa. Após concluir a primeira bateria de mapas, os próximos cenários receberão interações nativas equivalentes.

Ordem já preparada: Pewter/Brock; Cerulean/Misty; Vermilion/Surge/S.S. Anne. O atlas completo ainda está disponível como ZIP em Library (22,7 MB). Esta branch **não** contém os arquivos binários e não altera a flag de autorização. Não declarar os novos fundos publicados.

Para finalizar, instale o ZIP por `python3 tools/pokearena/install-approved-maps.py /caminho/atlas-60-mapas-phaser.zip`, valide os bytes e SHA-256, execute CI e screenshots reais da navegação. Mantenha PR em rascunho e `main` intacta até a aprovação final.
