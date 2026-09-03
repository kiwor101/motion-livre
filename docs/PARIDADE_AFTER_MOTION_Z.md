# Paridade com After Motion Z

A versão 0.8.0 foi orientada pela análise estática do APK fornecido e pelas funções públicas descritas em `https://aftermotionz.com/`.

## Implementado

- edição independente de vídeo, áudio, imagem, texto, forma, desenho e caminho vetorial;
- timeline com movimento e trim de clipes, zoom, snapping, marcadores e waveform;
- keyframes por propriedade, cinco modos de easing, curva visual e motion path;
- transições de entrada/saída, velocidade, reverso, recorte e separação de áudio;
- mixer com solo, mute, volume, pan, canais L/R e fades;
- parenting, controle nulo, precomposição e câmera 2.5D simulada;
- máscaras retangular, circular, elíptica e poligonal;
- gradientes, blending, glow, vinheta, blur, nitidez, chroma key, motion blur e canais RGB;
- presets XML compartilháveis;
- MP4, MOV, WebM, GIF, PNG e MP3; qualidade, FPS, bitrate, faixa, transparência e presets até 4K.

## Limites conhecidos

- os pacotes `.ta` do APK são binários proprietários e não são importados diretamente;
- a câmera é 2.5D, não um renderizador 3D completo;
- efeitos GPU exclusivos do APK foram substituídos por equivalentes Canvas/CSS abertos;
- projetos muito longos ou 4K com chroma key podem renderizar lentamente porque o processamento é feito quadro a quadro.
