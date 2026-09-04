# Motion Livre

Editor de vídeo e motion design para Windows, aberto, offline e sem anúncios.

[Baixar o instalador](https://github.com/kiwor101/motion-livre/releases/download/v0.0.0.1/Motion-Livre-Setup-0.0.0.1-x64.exe) · [Baixar a versão portátil](https://github.com/kiwor101/motion-livre/releases/download/v0.0.0.1/Motion-Livre-Portable-0.0.0.1-x64.exe) · [Ver a versão atual](https://github.com/kiwor101/motion-livre/releases/tag/v0.0.0.1)

## Sobre o projeto

O Motion Livre reúne edição por camadas, animação, áudio e exportação em um aplicativo desktop independente. Ele funciona localmente e já inclui o motor FFmpeg necessário para leitura e geração de mídia.

A versão atual é `0.0.0.1` e oferece instalador e executável portátil para Windows 10 e Windows 11 de 64 bits.

## Recursos

### Edição e timeline

- Vídeo, imagem, áudio, texto, formas e desenho vetorial.
- Timeline com arraste, zoom, encaixe, marcadores e waveform.
- Corte pelas bordas do clipe, divisão no cursor, entrada, saída e velocidade.
- Camadas com visibilidade, bloqueio, ordem, agrupamento e precomposição.
- Arrastar e soltar um ou vários vídeos ou imagens diretamente na janela.

### Animação e composição

- Keyframes de posição, escala, rotação, profundidade e opacidade.
- Curvas de easing, caminho de movimento, parenting, objetos nulos e câmera 2.5D.
- Transições de fade, zoom e deslizamento.
- Máscaras geométricas e poligonais, recorte, âncora e espelhamento.
- Composições 16:9, 9:16, 1:1 e 4:5 com resolução e FPS configuráveis.

### Efeitos e áudio

- Brilho, contraste, saturação, matiz, blur, glow, vinheta e nitidez.
- Ajuste RGB, sépia, inversão, chroma key e motion blur.
- Gradientes, contorno, cantos e modos de mesclagem.
- Mixer com volume, panorama, solo, mute, fades e seleção de canal esquerdo ou direito.
- Separação do áudio de uma camada de vídeo.

### Arquivos e exportação

- Projetos editáveis no formato `.motion.json`.
- Presets reutilizáveis no formato `.motion-effect.xml`.
- Importação e exportação de cenas XML compatíveis com o ecossistema Alight Motion.
- Exportação para MP4, MOV, WebM, GIF, PNG e MP3.
- Presets de saída de 720p a 4K.
- Salvamento automático e histórico de desfazer/refazer.

## Instalação

Para uso normal, escolha uma das opções na [página de versões](https://github.com/kiwor101/motion-livre/releases):

- **Instalador:** permite escolher a pasta e cria atalhos no Windows.
- **Portátil:** executa diretamente, sem instalação.

O computador do usuário não precisa ter Node.js, Electron, FFmpeg, Rust, codecs ou ferramentas de desenvolvimento instalados.

## Primeiros passos

1. Abra o Motion Livre e defina o nome e as propriedades da composição.
2. Importe a mídia pelo painel lateral ou arraste os arquivos para o palco.
3. Organize e corte as camadas na timeline.
4. Ajuste propriedades, efeitos, keyframes, transições e canais de áudio.
5. Salve o projeto em `.motion.json` para continuar a edição depois.
6. Abra **Exportar**, escolha o formato e configure resolução, FPS e qualidade.

Atalhos principais:

| Atalho | Ação |
|---|---|
| `Ctrl+N` | Novo projeto |
| `Ctrl+O` | Abrir projeto |
| `Ctrl+S` | Salvar projeto |
| `Ctrl+Z` / `Ctrl+Y` | Desfazer / refazer |
| `Espaço` | Reproduzir / pausar |
| `Delete` | Excluir camada selecionada |

## Desenvolvimento

Pré-requisitos:

- Node.js 20 ou superior;
- pnpm 11;
- PowerShell;
- conexão com a internet na preparação inicial.

Preparação do ambiente:

```powershell
git clone https://github.com/kiwor101/motion-livre.git
cd motion-livre
pnpm install
pnpm setup:ffmpeg
pnpm dev
```

Gerar instalador e versão portátil:

```powershell
pnpm dist
```

Os executáveis são gravados em `dist/`. Dependências, binários do FFmpeg, arquivos temporários e artefatos de compilação não são versionados.

## Organização do código

```text
desktop/                 Processo principal e ponte nativa do Electron
docs/                    Documentação dos formatos XML
tools/                   Preparação do FFmpeg e empacotamento
app.js                   Editor e importação de mídia
advanced.js              Composição, timeline e projetos
pro-editor.js            Keyframes, máscaras, câmera e efeitos
desktop-integration.js   Arquivos locais e exportação
alight-compat.js         Interoperabilidade XML
index.html               Interface do editor
```

## Colaboração

Para evitar conflitos, cada mudança deve sair de uma branch atualizada:

```powershell
git switch main
git pull --rebase origin main
git switch -c feature/nome-da-mudanca
```

Mantenha cada commit concentrado em uma única alteração. Não envie `node_modules/`, `dist/`, `vendor/ffmpeg/` ou arquivos de mídia para o repositório.

## Documentação

- [Compatibilidade de cenas XML](docs/COMPATIBILIDADE_ALIGHT_XML.md)
- [Presets de efeitos XML](docs/PRESETS_XML.md)
- [Licenças de terceiros](THIRD_PARTY_NOTICES.md)

## Privacidade

O Motion Livre funciona offline e não exige conta. Projetos e mídias permanecem no computador do usuário.

## Licença

Distribuído sob a [licença MIT](LICENSE).
