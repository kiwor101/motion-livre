# Motion Livre

Editor de motion design aberto, offline e sem anúncios para Windows.

## Instalação

Execute `Motion-Livre-Setup-0.4.0-x64.exe`. O instalador permite escolher a pasta e cria atalhos. A versão `Motion-Livre-Portable-0.4.0-x64.exe` funciona diretamente, sem instalação.

### Requisitos do usuário final

- Windows 10 ou Windows 11, 64 bits;
- aproximadamente 500 MB livres.

Não é necessário instalar Node.js, Rust, Electron, FFmpeg, codecs ou Visual Studio. O runtime e o motor de mídia estão incorporados.

O Windows SmartScreen pode exibir um aviso porque o projeto ainda não possui certificado comercial. Confira a origem e o hash do arquivo antes de executar.

## Como usar

1. Abra o Motion Livre e defina o nome do projeto.
2. Em **Mídia**, importe imagens ou vídeos.
3. Use **Texto**, **Forma** ou **Desenho** para criar camadas.
4. Arraste os elementos no palco e ajuste suas propriedades.
5. Posicione o cursor da timeline e adicione **Keyframes**.
6. Configure resolução, FPS, duração e fundo em **Projeto**.
7. Use **Salvar projeto** para gravar um `.motion.json`.
8. Clique em **Exportar** e escolha MP4, WebM, GIF ou PNG.

Atalhos:

- `Ctrl+S`: salvar;
- `Ctrl+O`: abrir;
- `Ctrl+N`: novo projeto;
- `Ctrl+Z` / `Ctrl+Y`: desfazer/refazer;
- `Espaço`: reproduzir/pausar;
- `Delete`: excluir a camada selecionada.

## Recursos atuais

- imagem, vídeo, áudio, texto, formas e desenho;
- timeline, entrada/saída e keyframes lineares;
- transformações, cor, contorno e cantos;
- máscaras simples, grupos, ordem e blending;
- filtros e preview sincronizado;
- autosave, undo/redo e projetos JSON;
- exportação MP4/H.264, WebM, GIF e PNG com FFmpeg incorporado.

Consulte [docs/FUNCOES_APK.md](docs/FUNCOES_APK.md) e [docs/ROADMAP_DESKTOP.md](docs/ROADMAP_DESKTOP.md).

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

## Privacidade

O editor funciona offline. A versão aberta não inclui anúncios, pagamentos, contas, analytics ou telemetria.

## Licença

Motion Livre sob licença MIT. FFmpeg e demais componentes mantêm suas respectivas licenças.
