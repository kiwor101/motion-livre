# Motion Livre

Editor aberto de vídeo e motion design para Windows, com funcionamento local, sem anúncios e sem conta obrigatória.

> O projeto está em desenvolvimento. Mantenha cópias dos projetos e das mídias importantes.

## Download para Windows

**Versão 0.0.1 · Windows 10/11 · 64 bits**

| Pacote | Download | Indicado para |
|---|---|---|
| **Portable** | **[Baixar Portable](https://github.com/kiwor101/motion-livre/releases/download/v0.0.1/Motion-Livre-Portable-0.0.1-x64.exe)** | Abrir diretamente, sem instalar o aplicativo. |
| **Setup** | **[Baixar instalador](https://github.com/kiwor101/motion-livre/releases/download/v0.0.1/Motion-Livre-Setup-0.0.1-x64.exe)** | Instalar e criar atalhos no Windows. |

[Notas, data da build e SHA256](https://github.com/kiwor101/motion-livre/releases/tag/v0.0.1) · [Página simplificada de downloads](BAIXAR_MOTION_LIVRE.md)

Os pacotes incluem Electron, FFmpeg e FFprobe. Quem apenas utiliza o programa não precisa instalar Node.js, pnpm, Rust ou ferramentas de desenvolvimento. Os arquivos “Source code” gerados pelo GitHub não são os executáveis.

O Portable não instala o aplicativo, mas utiliza o perfil do Windows para configurações, recuperação, arquivos temporários e proxies. O processamento das mídias acontece localmente.

## Como usar

1. Abra o Portable ou instale pelo Setup.
2. Importe vídeo, imagem ou áudio no painel **Mídia**. Também é possível arrastar arquivos para a janela.
3. Organize os clipes na timeline. Arraste as bordas para recortar ou use **Dividir no cursor**.
4. Ajuste posição, escala, rotação, opacidade, áudio, efeitos e keyframes.
5. Salve o projeto como `.motion.json`.
6. Abra **Exportar** e escolha formato, resolução, FPS, qualidade e intervalo.

O projeto mantém referências aos caminhos das mídias e não incorpora automaticamente vídeos e áudios. Ao transferi-lo, leve também os arquivos utilizados.

## Recursos atuais

### Edição e timeline

- Camadas de vídeo, imagem, áudio, texto, formas e desenhos vetoriais.
- Faixas, miniaturas, waveform, zoom, snapping e rolagem.
- Seleção múltipla com Ctrl, Shift ou caixa de seleção.
- Divisão, trim, velocidade, reverso, espelhamento e congelamento de quadro.
- Duplicação, renomeação, reordenação, visibilidade e bloqueio.
- Marcadores manuais e Beat Sync com BPM, fase e estimativa pela waveform.
- Intervalo In/Out e remoção de espaços vazios.
- Histórico transacional de desfazer e refazer.

### Áudio, animação e efeitos

- Extração do áudio do vídeo para uma faixa independente.
- Volume, pan, estéreo, canais esquerdo/direito, mute, solo e fades.
- Keyframes, easing, parenting, nulos, câmera 2.5D, grupos e precomposição.
- Cor, blur, glow, vinheta, nitidez, chroma key, máscaras, gradientes, contornos e transições.
- Presets em `.motion-effect.xml`.
- Importação e exportação de cenas XML compatíveis com partes do formato Alight Motion.

Efeitos externos ainda não implementados podem ser preservados no XML sem aparecer visualmente. Consulte [Compatibilidade Alight Motion XML](docs/COMPATIBILIDADE_ALIGHT_XML.md).

### Preview e exportação

- Preview adaptativo e compositor WebGL2 compartilhado com a exportação.
- Proxy local para vídeos acima de 1920×1080, com opção de usar o original.
- MP4/MOV em H.264/AAC, além de WebM, GIF, PNG e MP3.
- Exportação segmentada: trechos compatíveis usam FFmpeg diretamente.
- Tentativa de NVENC, Quick Sync ou AMF, com fallback por software.
- Cancelamento, limpeza da sessão e nova tentativa após falhas cobertas.

## Estado do projeto

O legado baseado em sete scripts globais foi substituído por módulos TypeScript. A interface usa Vue 3 e Vite; a componentização planejada está em aproximadamente 76%. O núcleo de projeto, timeline, histórico, tempo e áudio não depende da interface nem do Electron.

Ainda são evoluções futuras:

- render graph completo e mais efeitos com shaders dedicados;
- conclusão da migração dos painéis e estilos restantes para Vue;
- recuperação automática quando o decoder acelerado deixa de entregar frames;
- validação contínua com projetos longos, 4K, reverso e efeitos complexos;
- assinatura, atualização automática e versão mobile.

A decodificação acelerada de vídeo do Chromium permanece desativada por padrão devido a uma instabilidade reproduzida no Windows. Isso não desativa a composição WebGL. O projeto é independente e não é uma conversão direta do APK do Alight Motion.

## Desenvolvimento

Requisitos: Windows x64, PowerShell, Git, Node.js 22.12 ou superior e pnpm 11.19.0.

```powershell
git clone https://github.com/kiwor101/motion-livre.git
cd motion-livre
pnpm install --frozen-lockfile
pnpm setup:ffmpeg
pnpm dev
```

No clone existente, preserve alterações locais e trabalhe na branch pessoal descrita em [CONTRIBUTING.md](CONTRIBUTING.md).

### Testes

```powershell
pnpm check:ui
pnpm test:core
pnpm test:renderer
pnpm test:smoke
pnpm exec electron tools/test-timeline-layout.cjs
```

Os testes cobrem núcleo, persistência, cortes, áudio, XML, interface, preview, FFmpeg e exportação. Eles não substituem QA com projetos reais ou instalação em máquina limpa.

### Gerar os executáveis

```powershell
pnpm dist
```

Saídas:

- `dist/Motion-Livre-Portable-0.0.1-x64.exe`
- `dist/Motion-Livre-Setup-0.0.1-x64.exe`

Executáveis, dependências, FFmpeg, mídias e saídas temporárias não são versionados. Os pacotes públicos ficam nas Releases.

## Estrutura

| Caminho | Responsabilidade |
|---|---|
| `src/core/` | Modelo, comandos, tempo, keyframes, histórico e planos de áudio/vídeo. |
| `src/renderer/` | Mídia, preview, rasterização, WebGL e exportação. |
| `src/ui/components/` | Componentes Vue do editor. |
| `src/ui/` | Controladores da interface, timeline, edição e plataforma. |
| `desktop/` | Electron, IPC, proxies e FFmpeg. |
| `assets/` | Fontes e ícones locais com licenças. |
| `tools/` | Preparação, empacotamento e testes mantidos. |
| `docs/` | Arquitetura, formatos, migrações e diagnósticos históricos. |

O ponto de entrada da interface é `src/ui/main.ts`. O `index.html` é apenas a casca do aplicativo compilado.

## Colaboração

- `dev/kiwor101`: branch do mantenedor.
- `dev/emanueltk7`: branch do Emanuel.
- `main`: versão integrada exclusivamente por Pull Request.

As branches pessoais são permanentes. Cada atualização deve ser validada e entregar Setup e Portable em uma pré-release da própria branch; após o merge, um colaborador publica a build oficial integrada.

[Guia de colaboração e publicação](CONTRIBUTING.md) · [Instruções para agentes](AGENTS.md)

## Documentação

- [Arquitetura e limites técnicos](docs/ARQUITETURA_ALVO.md)
- [Migração da interface Vue](docs/MIGRACAO_VUE.md)
- [Resumo da migração TypeScript](docs/RESUMO_MIGRACAO_INTERFACE.md)
- [Compatibilidade Alight Motion XML](docs/COMPATIBILIDADE_ALIGHT_XML.md)
- [Presets XML](docs/PRESETS_XML.md)
- [Licenças de terceiros](THIRD_PARTY_NOTICES.md)

Código sob [licença MIT](LICENSE). Motion Livre não possui afiliação ou endosso da Alight Creative.
