# Roadmap do motor desktop

## Entregue na 0.3.0

- Aplicativo Electron para Windows com isolamento de contexto.
- Instalador NSIS e executável portátil x64.
- Menu nativo, abrir/salvar projeto e autosave.
- Editor por camadas, timeline, keyframes lineares, desenho, filtros, blending e máscaras simples.
- Modelo de projeto JSON versionado.

## Próximo marco: motor de mídia

- Integrar FFmpeg distribuído com o aplicativo.
- Exportar MP4/H.264, WebM, GIF, sequência PNG e áudio.
- Waveform, trim preciso, velocidade, reverso e retiming.
- Progresso/cancelamento de render e presets de exportação.

## Marco: vetores e animação

- Editor Bézier com nós e alças.
- Motion paths, easing e editor de curvas.
- Gradientes, strokes avançados, clipping e parenting.
- Precomposições e câmera 2.5D.

## Marco: efeitos GPU

- Pipeline WebGPU com shaders encadeáveis.
- Blur, glow, distorção, chroma key, displacement, color grading e motion blur.
- Presets parametrizados e preview em tempo real.

## Marco: produto

- Biblioteca de projetos e thumbnails em SQLite.
- Fontes locais, templates abertos e recuperação de sessão.
- Atualização automática opcional, testes de regressão visual e assinatura de código.
