# Correções locais da timeline — 2026-09-15

Sintomas: um clique no clipe podia alterar sua posição por arredondamento antes do arrasto; miniaturas demoravam a aparecer e esticavam visualmente ao restaurar bordas; waveform e conteúdo das demais faixas não seguiam a mesma âncora visual.

Mudanças: o gesto só edita depois de deslocamento real; quadros do vídeo usam posições fixas na régua, captura JPEG pequena, fila progressiva com prioridade ao playhead e descarte de pedidos obsoletos; áudio redesenha a waveform pelo tempo da timeline; texto, efeitos e outras faixas sem frames usam marcas fixas, mantendo títulos e keyframes na posição ao estender bordas.

Validação realizada: `pnpm build:ui`, `pnpm check:ui`, `tools/test-timeline-click.cjs`, `tools/test-timeline-thumbnails.cjs`, `tools/test-timeline-extension-visuals.cjs`, `tools/test-timeline-layout.cjs` e `tools/test-preview-cuts.cjs` passaram. `tools/test-renderer-contracts.cjs` ainda falha na condição já registrada no README sobre o limite de saída do scrubber.

Os testes de áudio, texto e efeito cobrem a âncora visual e o desenho da onda; não substituem um smoke manual com um projeto do usuário. A compilação e a publicação de Setup/Portable foram adiadas por pedido explícito do usuário.
