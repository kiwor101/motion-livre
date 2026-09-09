# Motion Livre

Editor de vídeo e motion design para Windows, aberto, offline e sem anúncios.

**Downloads — versão 0.0.1 · Windows 10/11 de 64 bits**

| Versão | Download | Como usar |
|---|---|---|
| Portátil | [Baixar Portable.exe](https://github.com/kiwor101/motion-livre/releases/download/v0.0.1/Motion-Livre-Portable-0.0.1-x64.exe) | Baixe e abra, sem instalação. |
| Instalador | [Baixar Setup.exe](https://github.com/kiwor101/motion-livre/releases/download/v0.0.1/Motion-Livre-Setup-0.0.1-x64.exe) | Instale na pasta desejada e use os atalhos do Windows. |

Os dois pacotes incluem Electron, FFmpeg e FFprobe. [Ver arquivos e notas da versão](https://github.com/kiwor101/motion-livre/releases/tag/v0.0.1).

Estes são os downloads **oficiais**. Atualizações ainda nas branches dos colaboradores podem ter builds separadas, marcadas como **Pre-release** para testes; elas não substituem automaticamente estes arquivos.

## Sobre o projeto

O Motion Livre reúne edição por camadas, animação, áudio e exportação em um aplicativo desktop independente. Ele funciona localmente e já inclui o motor FFmpeg necessário para leitura e geração de mídia.

A versão atual é `0.0.1` e oferece instalador e executável portátil para Windows 10 e Windows 11 de 64 bits. Esta é a base da nova organização do projeto, preservando as funcionalidades e correções já implementadas. A numeração foi padronizada, sem apagar o histórico de contribuições.

## Recursos

### Edição e timeline

- Vídeo, imagem, áudio, texto, formas e desenho vetorial.
- Timeline com arraste, zoom, encaixe, marcadores e waveform.
- Seleção múltipla de clipes com Ctrl, Shift ou seleção por arraste.
- Marcadores de batida (Beat sync), separados dos marcadores manuais.
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
- Faixa de renderização para exportar somente o trecho escolhido.
- Salvamento automático e histórico de desfazer/refazer.

## Instalação

Para uso normal, escolha uma das opções na [página de versões](https://github.com/kiwor101/motion-livre/releases):

- **Instalador:** permite escolher a pasta e cria atalhos no Windows.
- **Portátil:** executa diretamente, sem instalação.

O computador do usuário não precisa ter Node.js, Electron, FFmpeg, Rust, codecs ou ferramentas de desenvolvimento instalados.

Na página da versão, escolha um dos arquivos `.exe`. Os links **Source code (zip/tar.gz)** são destinados ao desenvolvimento e não contêm o programa pronto para uso. Projetos e mídias devem ser salvos em uma pasta própria; mantenha os arquivos de mídia nos caminhos usados pelo projeto.

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

Use a própria pasta clonada do repositório para editar, executar e compilar. Abra essa pasta no Codex e no terminal; não é necessário manter uma segunda cópia do projeto. Dependências e componentes locais ficam em `node_modules/` e `vendor/ffmpeg/`, fora do versionamento.

Na raiz do projeto, `npm run dev` também inicia o editor depois da preparação acima.

Gerar instalador e versão portátil:

```powershell
pnpm dist
```

Os dois executáveis de 64 bits são gravados em `dist/`. O empacotamento usa temporariamente `.build/runtime/`, dentro do próprio projeto. Quando os dois pacotes são gerados com sucesso, os arquivos intermediários e executáveis antigos de `dist/` são removidos, mantendo somente o instalador e o portátil da versão atual.

Os executáveis são distribuídos pelos anexos da Release no GitHub. Dependências, binários do FFmpeg, dados locais e artefatos de compilação não são versionados.

## Organização do código

### Edição na timeline

- Interface com ícones Lucide e fonte Inter incluídos localmente, sem CDN. O CSS próprio define os componentes e espaçamentos do editor.
- Régua com escala fixa de 40 pixels por segundo no zoom inicial, traços a cada segundo e números a cada 5 segundos. Use a rolagem horizontal, o controle de zoom ou **Alt/Shift + roda do mouse**. Redimensionar a janela não altera a escala temporal.
- A barra sob o preview oferece reprodução, início/fim, navegação temporal, volume, guias e tela cheia. Os controles continuam disponíveis em tela cheia; Esc sai.
- O botão de grade ativa guias de alinhamento em 9:16, 16:9, 1:1, 4:5 ou na proporção da composição. As guias não alteram a mídia e não são exportadas.
- Faixas de texto e áudio são compactas; áudio mostra sua forma de onda, respeitando o trecho recortado. Botões com ícones exibem dicas ao passar o mouse ou receber foco pelo teclado.

- Dividir no cursor mantém as duas partes do clipe na mesma faixa.
- As setas **↑ / ↓** movem o clipe selecionado para a faixa vizinha; nas extremidades, criam uma nova faixa. Intervalos ocupados não são sobrescritos.
- Arraste a régua ou o cursor branco para navegar pelo vídeo. Arraste o centro de um clipe para movê-lo e suas bordas para ajustar entrada e saída.
- Durante o movimento, a faixa de destino é destacada e uma guia mostra o intervalo. Segure **Alt** para ignorar o encaixe; o posicionamento respeita os quadros da composição.
- Vídeos exibem miniaturas geradas localmente. As faixas são preservadas no projeto JSON; cada clipe mantém seus próprios efeitos e keyframes.
- **⧉ Duplicar** cria uma faixa acima, mantendo a posição visual do conteúdo. Arraste um clipe para a borda superior/inferior de uma faixa para criar outra faixa; a guia indica o destino.
- Arraste o nome de uma faixa na timeline ou no painel **Camadas** para reordenar a faixa inteira. Dê duplo clique no nome para renomear; confirme com Enter ou cancele com Esc.
- Projetos salvam a biblioteca de mídia (inclusive arquivos sem clipes), os nomes e a organização das faixas. Arquivos locais continuam vinculados pelos seus caminhos originais.

```text
desktop/                 Processo principal e ponte nativa do Electron
docs/                    Documentação dos formatos XML
tools/                   Preparação do FFmpeg e empacotamento
app.js                   Editor e importação de mídia
advanced.js              Composição, timeline e projetos
pro-editor.js            Keyframes, máscaras, câmera e efeitos
desktop-integration.js   Arquivos locais e exportação
alight-compat.js         Interoperabilidade XML
timeline.js              Faixas, clipes, miniaturas e interação temporal
index.html               Interface do editor
```

## Colaboração

Cada pessoa mantém uma única pasta clonada no próprio computador e trabalha na sua branch:

| Branch | Responsável | Uso |
|---|---|---|
| `main` | `kiwor101` | Código integrado; recebe Pull Requests, não pushes diretos. |
| `dev/kiwor101` | `kiwor101` | Desenvolvimento do mantenedor. |
| `dev/emanueltk7` | `emanueltk7` | Desenvolvimento do colaborador. |

Somente `kiwor101` integra Pull Requests na `main`. Cada branch de desenvolvimento aceita atualizações apenas da respectiva conta. As três branches têm bloqueio de exclusão e force push no GitHub.

O ciclo é: **atualizar sua branch com a `main` → implementar um pacote pequeno → testar → commit/push na sua branch → abrir PR → `kiwor101` revisa e integra**. Depois do merge, os dois atualizam suas branches antes do próximo pacote. Usem **Create a merge commit**, mantendo as branches pessoais; não usem squash/rebase nessas branches permanentes.

Branches separam o trabalho, mas não eliminam conflitos na mesma função. Abram o PR em rascunho assim que houver o primeiro commit e indiquem o objetivo e as áreas afetadas. Se ambos precisarem alterar o mesmo comportamento, combinem a ordem dessa parte.

[Guia de colaboração e comandos para os dois computadores](CONTRIBUTING.md) · [Orientações para IAs](AGENTS.md)

A versão oficial continua `0.0.1` durante este ciclo. Ao concluir cada pacote que altera o aplicativo, **os dois colaboradores devem compilar e conferir Setup e Portable**, publicar uma prévia de teste da própria branch e atualizar os links de teste na documentação e no PR. Isso vale também para o chat de desenvolvimento do Emanuel; enviar somente código não conclui a entrega. Não é necessário compilar cada commit intermediário ou uma mudança exclusivamente documental.

Depois da integração por `kiwor101`, qualquer um dos dois pode publicar os executáveis oficiais do código integrado e validado, coordenando um publicador por vez. Pré-releases nunca substituem os downloads oficiais antes do merge. Veja o [fluxo completo de compilação e publicação](CONTRIBUTING.md#setup-e-portable-fazem-parte-da-entrega). `package.json` continua sendo a fonte da versão; essas orientações não são uma automação de build do GitHub.

## Documentação

- [Compatibilidade de cenas XML](docs/COMPATIBILIDADE_ALIGHT_XML.md)
- [Presets de efeitos XML](docs/PRESETS_XML.md)
- [Licenças de terceiros](THIRD_PARTY_NOTICES.md)

## Privacidade

O Motion Livre funciona offline e não exige conta. Projetos e mídias permanecem no computador do usuário.

## Licença

Distribuído sob a [licença MIT](LICENSE).
