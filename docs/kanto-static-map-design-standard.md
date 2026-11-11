# Kanto — padrão de imagem única + interface interativa

REGRA DE APROVAÇÃO: esta PR não importa nem integra arte alguma no jogo.
O usuário aprova cada cidade, rota e caverna visualmente antes da integração com Phaser.
Os saves, combates, progressão, golpes e o jogo publicado permanecem inalterados.

CONVENÇÕES
- Nome do mapa em destaque no canto superior esquerdo.
- Texto em cima dos prédios: PC, Loja e Ginásio + tipo correto.
- Pewter: Ginásio de Pedra (Brock). Viridian: Ginásio de Terra (Giovanni), bloqueado até sete insígnias.
- Botões, menus, títulos e placas são Phaser Text/Zone reais, separados da imagem-base, nunca somente pixels estáticos.
- Gramas altas: áreas clicáveis; o pool inicial pré-Misty exclui Abra. Abra na área de Cerulean por escolha do usuário.
- Entradas e saídas permitem voltar; restrições originais aplicadas à campanha quando essa integração for aprovada.

USO FUTURO (APÓS APROVAÇÃO)
1. Salvar em formato otimizado a imagem-base aprovada, sem placas nem HUD pintados.
2. Carregar a textura em Phaser num fundo único, coordenadas internas 640x360.
3. Ajustar metadados normalizados de áreas com base na arte APROVADA.
4. Ligar callbacks em handlers existentes para PC, Mart, Gym, encontros e navegação.
5. Validar com screenshots reais desktop/mobile e preservar os bytes do save.
6. Somente mesclar/publicar após aprovação explícita e CI verde.

ARQUIVOS
- tools/pokearena/torre2-static-map-design-standard.js (7 mapas e overlay Phaser)
- tests/kanto-static-map-design-standard.test.js (regressões e geometria)

Os hotspots dos mapas ainda não desenhados são provisórios, não funcionais em produção.
Próxima arte em sequência: ROTA 2, depois VIRIDIAN FOREST e PEWTER CITY.
Este material não equivale a screenshots do jogo nem a implementação publicada.
