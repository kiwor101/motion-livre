# Correções locais da timeline — 2026-09-15

Sintomas: um clique no clipe podia alterar sua posição por arredondamento antes do arrasto; miniaturas demoravam a aparecer e esticavam visualmente ao restaurar bordas; waveform e conteúdo das demais faixas não seguiam a mesma âncora visual.

Mudanças: o gesto só edita depois de deslocamento real; quadros do vídeo usam posições fixas na régua, captura JPEG pequena, fila progressiva com prioridade ao playhead e descarte de pedidos obsoletos; áudio redesenha a waveform pelo tempo da timeline; texto, efeitos e outras faixas sem frames usam marcas fixas, mantendo títulos e keyframes na posição ao estender bordas.

O cabeçalho dos clipes de áudio agora reserva 4 px antes do ícone e usa uma superfície opaca sobre a waveform. Ao restaurar a borda esquerda de uma mídia cortada, nome, ícone e largura permanecem na âncora anterior enquanto somente o conteúdo de áudio é revelado.

Validação realizada: `pnpm build:ui`, `pnpm check:ui`, `tools/test-timeline-click.cjs`, `tools/test-timeline-thumbnails.cjs`, `tools/test-timeline-extension-visuals.cjs`, `tools/test-timeline-layout.cjs` e `pnpm test:renderer` passaram na revisão de integração. Os três testes novos agora fazem parte da suíte permanente `test:renderer`.

Os testes de áudio, texto e efeito cobrem a âncora visual e o desenho da onda; não substituem um smoke manual com um projeto do usuário. Setup e Portable são gerados e publicados pelo fluxo de integração do mantenedor.
