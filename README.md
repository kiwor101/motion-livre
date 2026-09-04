# Motion Livre

Editor de motion design aberto, offline e sem anúncios para Windows.

## Instalação

Downloads oficiais:

- [Baixar instalador 0.9.0 para Windows](https://github.com/kiwor101/motion-livre/releases/download/v0.9.0/Motion-Livre-Setup-0.9.0-x64.exe)
- [Baixar versão portátil 0.9.0](https://github.com/kiwor101/motion-livre/releases/download/v0.9.0/Motion-Livre-Portable-0.9.0-x64.exe)
- [Ver notas da versão 0.9.0](https://github.com/kiwor101/motion-livre/releases/tag/v0.9.0)

O arquivo [BAIXAR_MOTION_LIVRE.md](BAIXAR_MOTION_LIVRE.md), visível na raiz do projeto, também leva diretamente aos executáveis.

O instalador permite escolher a pasta e cria atalhos. A versão portátil funciona diretamente, sem instalação.

### Requisitos do usuário final

- Windows 10 ou Windows 11, 64 bits;
- aproximadamente 500 MB livres.

Não é necessário instalar Node.js, Rust, Electron, FFmpeg, codecs ou Visual Studio. O runtime e o motor de mídia estão incorporados.

O Windows SmartScreen pode exibir um aviso porque o projeto ainda não possui certificado comercial. Confira a origem e o hash do arquivo antes de executar.

## Como usar

1. Abra o Motion Livre e defina o nome do projeto.
2. Em **Mídia**, importe imagens ou vídeos.
3. Use **Texto**, **Forma** ou **Desenho** para criar camadas.
4. Em **Corte**, defina entrada/saída ou divida o clipe no cursor; ajuste velocidade, volume e fades.
5. Em **Efeitos**, use presets ou controles de brilho, contraste, saturação, matiz, blur, sépia e outros.
6. Arraste os elementos no palco e ajuste suas propriedades.
7. Posicione o cursor da timeline e adicione **Keyframes**.
8. Configure resolução, FPS, duração e fundo em **Projeto**.
9. Use **Salvar projeto** para gravar um `.motion.json`.
10. Em **Projeto**, use o XML compatível para trocar cenas e presets com ferramentas do ecossistema Alight Motion.
11. Clique em **Exportar** e escolha MP4, MOV, WebM, GIF, PNG ou MP3.

Atalhos:

- `Ctrl+S`: salvar;
- `Ctrl+O`: abrir;
- `Ctrl+N`: novo projeto;
- `Ctrl+Z` / `Ctrl+Y`: desfazer/refazer;
- `Espaço`: reproduzir/pausar;
- `Delete`: excluir a camada selecionada.

## Recursos atuais

- imagem, vídeo, áudio, texto, formas e desenho;
- timeline, corte por entrada/saída, divisão de clipes e keyframes lineares;
- mixer com canais separados para vídeos e áudios, solo, mute, volume, panorama, canal esquerdo/direito e fades;
- camadas com visibilidade, bloqueio, âncora, recorte, espelhamento, ordem e edição temporal;
- velocidade de vídeo de 0,5× a 2× com áudio sincronizado;
- transformações, cor, contorno e cantos;
- máscaras simples, grupos, ordem e blending;
- presets e controles ajustáveis de brilho, contraste, saturação, matiz, blur, escala de cinza, sépia e inversão;
- salvar e importar presets de efeitos em arquivos `.motion-effect.xml`;
- importar e exportar cenas Alight Motion XML com composição, formas, textos, gradientes, marcadores, transformações, keyframes, curvas Bézier, blending e efeitos reconhecidos;
- preservar metadados e efeitos XML ainda não renderizados pelo Motion Livre para reduzir perdas ao reexportar;
- timeline arrastável com alças de corte, zoom, encaixe, marcadores e waveform;
- easing por propriedade, gráfico de curva, caminho de movimento e transições;
- parenting, objetos nulos, precomposições e câmera 2.5D;
- máscaras geométricas/poligonais, gradientes e caneta Bézier;
- glow, vinheta, nitidez, chroma key, motion blur e ajuste RGB;
- exportação MP4, MOV, WebM, GIF, PNG e MP3 com presets até 4K;
- autosave, undo/redo e projetos JSON;
- exportação MP4/H.264, WebM, GIF e PNG com FFmpeg incorporado.

Consulte [docs/COMPATIBILIDADE_ALIGHT_XML.md](docs/COMPATIBILIDADE_ALIGHT_XML.md), [docs/FUNCOES_APK.md](docs/FUNCOES_APK.md) e [docs/ROADMAP_DESKTOP.md](docs/ROADMAP_DESKTOP.md).

## Desenvolvimento

Pré-requisitos: Node.js 20+, pnpm e Visual Studio Build Tools/Windows SDK.

```powershell
pnpm install
powershell -ExecutionPolicy Bypass -File tools/setup-ffmpeg.ps1
pnpm dev
```

Gerar os executáveis autônomos:

```powershell
pnpm dist
```

Os artefatos finais são gravados em `dist/`. Binários, caches e dependências locais não são versionados.
Após cada compilação, a limpeza automática mantém em `dist/` somente o instalador e a versão portátil da versão atual.

## Privacidade

O editor funciona offline. A versão aberta não inclui anúncios, pagamentos, contas, analytics ou telemetria.

## Licença

Motion Livre sob licença MIT. FFmpeg e demais componentes mantêm suas respectivas licenças.
