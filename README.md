# Motion Livre

Editor de vídeo e motion design para Windows. Aberto, offline, sem anúncios e sem conta obrigatória.

## Baixar para Windows

**Versão 0.0.1 · Windows 10/11 · 64 bits**

| Pacote | Download direto | Uso |
|---|---|---|
| **Portable** | **[Baixar Portable.exe](https://github.com/kiwor101/motion-livre/releases/download/v0.0.1/Motion-Livre-Portable-0.0.1-x64.exe)** | Abra o arquivo, sem instalar o aplicativo. |
| **Setup** | **[Baixar Setup.exe](https://github.com/kiwor101/motion-livre/releases/download/v0.0.1/Motion-Livre-Setup-0.0.1-x64.exe)** | Instale e use os atalhos do Windows. |

[Arquivos, data da build, commit e SHA256](https://github.com/kiwor101/motion-livre/releases/tag/v0.0.1) · [Página de downloads](BAIXAR_MOTION_LIVRE.md)

Os dois pacotes incluem Electron, FFmpeg e FFprobe. Para **usar** o programa, não é necessário instalar Node.js, pnpm, Rust ou ferramentas de desenvolvimento. Os arquivos “Source code” do GitHub não são os executáveis.

O Portable dispensa instalação, mas precisa de espaço para extração temporária, configurações, recuperação e proxies no perfil do Windows; não guarda necessariamente tudo ao lado do executável. Edição e exportação funcionam localmente, sem enviar suas mídias para um serviço.

Este projeto está em desenvolvimento. Preserve cópias dos projetos e mídias importantes. A versão permanece **0.0.1** neste ciclo; confira a data e o commit da release para identificar a atualização.

## Começar a editar

1. Abra o Portable ou o programa instalado pelo Setup.
2. Importe vídeos, imagens e áudio pelo painel **Mídia**, ou arraste os arquivos para a janela. A primeira mídia de vídeo pode definir a composição automaticamente.
3. Posicione os clipes na timeline. Arraste as bordas para recortar e use **Dividir no cursor** para separar um clipe na mesma faixa.
4. Selecione uma camada para ajustar posição, escala, rotação, opacidade, áudio, efeitos e keyframes. O botão direito abre as ações do clipe.
5. Salve em `.motion.json` para continuar editando.
6. Abra **Exportar**, escolha MP4 ou outro formato e confira resolução, FPS, qualidade e intervalo.

**O projeto não embute automaticamente os arquivos de mídia.** Vídeos e áudios locais continuam vinculados aos caminhos originais. Ao transferir o trabalho, leve também as mídias e confira os vínculos. Salvar o projeto editável e exportar um vídeo são operações diferentes.

O intervalo In/Out salvo também limita a reprodução. Se o preview parar antes do final esperado, confira os marcadores de início/fim da renderização.

## Recursos atuais

### Timeline e edição

- Vídeo, imagem, áudio, texto, formas e desenho/caminhos vetoriais.
- Faixas agrupadas, miniaturas locais, waveform centralizada, zoom, encaixe e rolagem.
- Seleção com Ctrl, Shift ou caixa; exclusão e movimentação horizontal conjunta.
- Divisão no cursor, trim, velocidade, reverso, espelhamento e congelamento de quadro.
- Duplicação em faixa acima, reordenação por arraste, nomes, visibilidade e bloqueio.
- Marcadores manuais e Beat Sync por BPM/deslocamento; estimativa opcional pela waveform.
- Intervalo In/Out e remoção de espaço vazio no início/final.
- Histórico transacional para reunir eventos de um mesmo gesto em uma ação de desfazer/refazer.

### Áudio, animação e efeitos

- Extração do áudio de um vídeo para uma faixa independente.
- Volume, pan, canais esquerdo/direito/estéreo, mute, solo e fades.
- Cortes preservam origem e propriedades; o plano de áudio alinha samples e timestamps para reduzir falhas nas emendas.
- Keyframes, easing, parenting, nulos, câmera 2.5D, agrupamento e precomposição.
- Ajustes de cor, desfoque, glow, vinheta, nitidez, chroma key, máscaras, gradientes, contornos e transições existentes.
- Presets de camada em `.motion-effect.xml` e cenas XML compatíveis com Alight Motion.

Compatibilidade XML **não significa reprodução idêntica de todos os efeitos** do Alight Motion. Efeitos externos desconhecidos podem ser preservados como dados e reexportados sem implementação visual no Motion Livre. [Limites da compatibilidade](docs/COMPATIBILIDADE_ALIGHT_XML.md).

### Preview e exportação

- Preview adaptativo com composição WebGL2, recuperação de contexto e limites de recursos.
- Proxies locais para aliviar a edição; áudio e exportação usam as mídias originais.
- MP4/MOV com H.264 e AAC; também há saídas WebM, GIF, PNG e MP3.
- Planejamento por segmentos: cópia compatível, recorte direto, processamento FFmpeg e composição apenas dos intervalos que exigem novos pixels.
- Sobreposições estáticas elegíveis podem ser rasterizadas uma vez e aplicadas pelo FFmpeg.
- Sondagem funcional de NVENC, Quick Sync e AMF; software quando nenhum encoder selecionado é aprovado. Ganhos dependem do hardware, formato e edição.
- Cancelamento e limpeza da sessão, permitindo nova tentativa após falhas cobertas pelos testes.

## O que mudou no motor

Os sete scripts globais antigos foram substituídos por módulos TypeScript e uma interface montada com Vue e Vite. Projeto, tempo, cortes, histórico e áudio ficam separados da interface e da ponte do Windows.

O preview e os trechos compostos da exportação usam o mesmo avaliador de cena e compositor. A exportação analisa o projeto antes de decidir quais intervalos precisam desse compositor: um efeito localizado não deve obrigar todo o vídeo a passar pelo caminho mais caro.

Isso facilita manutenção, testes e colaboração. **Não é uma conversão direta do APK nem um motor totalmente concluído.**

### Limites e próximos passos

- Render graph completo, shaders dedicados e transferência de baixa cópia entre GPU e encoder ainda são evoluções futuras. Parte da rasterização permanece em Canvas.
- Mesclagens não normais usam temporariamente o rasterizador compartilhado para preservar o fundo; isso pode custar mais processamento que o blend normal.
- A decodificação acelerada de vídeo do Chromium fica desativada por padrão por um problema de estabilidade reproduzido no Windows. A composição WebGL continua acelerada; recuperação automática do decoder ainda é trabalho futuro.
- Preview sem proxy, reverso, projetos complexos e equivalência visual em diferentes GPUs precisam de validação contínua. Não há promessa de exportação instantânea ou desempenho universal em 4K.
- A interface de composição permite até 600 segundos e a abertura de projetos normaliza a duração para esse limite. Esta base não garante suporte a projetos mais longos.
- Testes antigos de navegador que dependem de `state`, `addLayer` e outras funções globais precisam migrar para `window.motionEditor`. São preservados, mas não equivalem à suíte atual aprovada.
- Assinaturas, atualização automática e versão mobile não estão implementadas nesta entrega.

## Desenvolvimento

Requisitos **somente para programar/compilar**: Windows x64, PowerShell, Git, Node.js **22.12 ou superior**, pnpm **11.19.0** e internet na preparação inicial. Build validada com Node.js 24.18.0. Node 20 não atende a todas as dependências atuais.

Se ainda não houver um clone:

```powershell
git clone https://github.com/kiwor101/motion-livre.git
cd motion-livre
```

No clone existente, preserve seu trabalho e selecione sua branch conforme [CONTRIBUTING.md](CONTRIBUTING.md). Não crie outra cópia para desenvolver ou compilar.

```powershell
pnpm install --frozen-lockfile
pnpm setup:ffmpeg
pnpm dev
```

Execute um comando por vez e pare no erro. `setup:ffmpeg` prepara os componentes quando ausentes. `npm run dev` também inicia o editor; o pnpm precisa estar disponível porque o script o utiliza internamente. O desenvolvimento compila o núcleo, gera a interface e acompanha alterações da UI.

### Validar

```powershell
pnpm check:ui
pnpm build:ui
pnpm test:core
pnpm test:renderer
pnpm test:smoke
pnpm exec electron tools/test-timeline-layout.cjs
```

O núcleo cobre comandos, persistência, áudio, plano de exportação e FFmpeg real. A suíte Electron cobre composição, edição, XML e reprodução com cortes. O smoke exercita mídia sintética, proxies, histórico e exportação. O teste de timeline verifica alturas das faixas e dinâmica da waveform. Alguns testes abrem janelas temporárias; usam perfis isolados.

Esses comandos não substituem QA com projetos reais, todas as combinações de efeitos ou instalação do Setup em uma máquina limpa. Informe quais passaram; não declare todos os scripts de `tools/` aprovados sem executá-los.

### Gerar Setup e Portable

```powershell
pnpm dist
```

Saídas:

- `dist/Motion-Livre-Setup-0.0.1-x64.exe`
- `dist/Motion-Livre-Portable-0.0.1-x64.exe`

O empacotamento compila o núcleo e a interface e usa `.build/runtime/` temporariamente. Após sucesso, `dist/` mantém apenas os dois executáveis atuais. `.build/core/`, `.build/renderer/` e `ui-dist/` são saídas locais de compilação, não cópias alternativas do código-fonte.

Executáveis são anexos de Releases, não arquivos commitados. Dependências, FFmpeg, caches, mídias e resultados temporários ficam fora do Git.

## Mapa do código

| Pasta/arquivo | Responsabilidade |
|---|---|
| `src/core/` | Modelo, comandos, tempo, keyframes, histórico, sessão e planos de áudio/vídeo; sem DOM ou Electron. |
| `src/renderer/` | Mídias, preview, rasterização, composição WebGL e controlador de exportação. |
| `src/ui/components/` | Componentes Vue dos painéis e regiões do editor. |
| `src/ui/` | Controladores TypeScript de edição, timeline, importação e plataforma. |
| `desktop/` | Processo principal Electron, IPC, proxies e FFmpeg. |
| `assets/` | Fontes e ícones locais, com suas licenças. |
| `tools/` | Preparação, empacotamento e testes. |
| `docs/` | Arquitetura, formatos e registros históricos de migração/bugs. |
| `index.html` | Casca que carrega a interface compilada. |

Comece em `src/ui/main.ts` para entender a montagem. Não recrie `app.js`, `timeline.js` ou as pontes globais removidas. Registros datados em `docs/` descrevem aquela sessão; use o Git e este README para o estado atual.

## Colaboração e publicação

- `dev/kiwor101`: desenvolvimento do mantenedor.
- `dev/emanueltk7`: desenvolvimento do Emanuel.
- `main`: código integrado por Pull Request, somente por `kiwor101`.

Cada pessoa mantém uma pasta local no próprio computador. Antes de um pacote, preserve alterações existentes e sincronize sua branch com a `main`. Combinem as áreas afetadas: branches não impedem conflitos na mesma função.

Cada entrega do aplicativo inclui testes, Setup e Portable. Prévias usam releases separadas, marcadas **Pre-release**. Só após a integração são publicados os executáveis oficiais, com um publicador por vez. Use merge commits e mantenha as branches pessoais. A versão segue `0.0.1` até autorização do mantenedor.

[Guia de colaboração e publicação](CONTRIBUTING.md) · [Instruções para agentes](AGENTS.md)

### Prévia anterior do Emanuel

A [pré-release `preview-emanueltk7-2294f32`](https://github.com/kiwor101/motion-livre/releases/tag/preview-emanueltk7-2294f32) é um snapshot de QA do commit `2294f32530b10d82ad70d54689f575f9992d0861`, anterior ao ajuste de waveform `9b9cf74` e à revisão de integração. Não é o download oficial atualizado.

## Documentação e licença

- [Arquitetura-alvo e limites do motor](docs/ARQUITETURA_ALVO.md)
- [Resumo da migração](docs/RESUMO_MIGRACAO_INTERFACE.md)
- [Registro de migração do legado](docs/HANDOFF_MIGRACAO_LEGADO.md)
- [Diagnóstico histórico de preview e cortes](docs/HANDOFF_BUG_PREVIEW_CORTES_AUDIO.md)
- [Compatibilidade Alight Motion XML](docs/COMPATIBILIDADE_ALIGHT_XML.md)
- [Presets de efeitos XML](docs/PRESETS_XML.md)
- [Licenças de terceiros](THIRD_PARTY_NOTICES.md)

Código do Motion Livre sob [licença MIT](LICENSE). Fontes, ícones, Electron e FFmpeg mantêm suas próprias licenças. Projeto independente, sem afiliação com Alight Creative; código e shaders proprietários do APK não são distribuídos aqui.
