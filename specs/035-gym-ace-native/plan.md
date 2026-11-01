# Plano de execução T35

1. Ler GYMS em campaign-core, descobrir a origem do atlas PMD Idle no instalador existente e o ponto gymScreen no Phaser.
2. Criar módulo isolado para derivar espécie do boss vigente, validar manifesto Idle, carregar sob demanda e renderizar sprite, líder e sombra sem input.
3. Reutilizar interior original FireRed como recorte independente e preservar botões/bloqueios. Não alterar cena da cidade nem renderBattlePath.
4. Testar 8 espécies, falha de manifesto, ausência de efeitos sobre save e cancelamento do carregamento após saída.
5. Capturar quatro screenshots Chromium WebGL e verificar sobreposição, retorno, vazamentos e FPS diagnóstico; não confundir fixture com campanha vencida.
6. Não mesclar enquanto qualquer gate estiver vermelho ou as capturas não tiverem inspeção visual.
