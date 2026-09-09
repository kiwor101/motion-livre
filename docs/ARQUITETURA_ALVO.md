# Arquitetura-alvo do Motion Livre

## Objetivo

Prévia, exportação e futuras interfaces mobile devem interpretar o mesmo projeto, a mesma timeline e o mesmo mapeamento de mídia. Código legado não deve ser preservado quando cria um segundo caminho de renderização, exportação ou estado.

## Limites entre as camadas

```text
Electron + Vue (desktop)       Vue + Capacitor ou UI nativa (mobile)
             \                         /
              comandos e seletores de UI
                         |
                  core TypeScript puro
        projeto, timeline, tempo, keyframes e áudio
                         |
                 motor de composição
              WebGL2 + shaders + textos
                         |
               preview ou exportação
                         |
              FFmpeg / encoder da plataforma
```

O `core` não pode importar Vue, Electron, DOM, Canvas ou APIs específicas do Windows. Ele recebe dados e devolve dados. Essa regra permite testar a lógica sem abrir o aplicativo e reutilizá-la no mobile.

## Estado da migração

1. Concluído: tempo, cortes, velocidade, reverso e intervalos de exportação estão centralizados.
2. Concluído: interpolação, easing, parenting, câmera e avaliação da cena estão no `core` independente.
3. Concluído: a interface é montada por Vue 3 + TypeScript + Vite e dividida por regiões fáceis de localizar.
4. Concluído: `index.html` é somente uma casca; biblioteca, palco, inspector, timeline e diálogos são componentes Vue.
5. Concluído: preview e exportação usam o mesmo compositor WebGL2 por camadas e a mesma cena avaliada.
6. Concluído: a exportação envia frames RGBA determinísticos diretamente ao FFmpeg, sem MediaRecorder ou WebM intermediário.
7. Em evolução: textos, formas e mídias ainda são rasterizados em Canvas antes de virarem texturas; efeitos e geometrias devem migrar para shaders dedicados conforme forem implementados.
8. Validado: proxies locais H.264 sem áudio para vídeos acima de 1280×720; cache de frames e ponte mobile continuam futuros.

## Estratégia mobile

- Reutilizar o formato do projeto, comandos, histórico, keyframes, shaders compatíveis e testes do núcleo.
- Não tentar reutilizar literalmente a interface desktop: mouse, teclado, painéis e timeline precisam de equivalentes próprios para toque.
- Começar com Vue + Capacitor se o desempenho do WebGL2, decodificação e acesso a arquivos atender aos aparelhos-alvo.
- Manter uma ponte de plataforma para arquivos, codecs, encoder, compartilhamento e galeria.
- Permitir trocar essa ponte por implementação nativa sem alterar o `core`.
- Usar preview reduzido, proxies e limites de memória mais agressivos no mobile.

## Organização pretendida da interface Vue

Componentes devem ser pequenos e fáceis de localizar. Cada painel, seção do inspetor, ferramenta de timeline, diálogo e controle reutilizável terá arquivo próprio. Nomes devem refletir o texto e a região visível no aplicativo.

Exemplos:

```text
src/ui/components/controls/PropertySlider.vue
src/ui/components/controls/ColorField.vue
src/ui/panels/EffectsPanel.vue
src/ui/panels/AudioPanel.vue
src/ui/timeline/TimelineRuler.vue
src/ui/timeline/TimelineTrack.vue
src/ui/timeline/TimelineClip.vue
src/ui/dialogs/ExportDialog.vue
```

Os componentes enviam comandos ao núcleo. Eles não contêm a matemática definitiva da timeline nem implementações duplicadas de exportação.

## Núcleo entregue

O núcleo mantém JavaScript independente de runtime para continuar reutilizável no Electron e em uma futura aplicação mobile. TypeScript fica na interface e pode avançar para o núcleo sem acoplá-lo ao Vue:

- `core/project-model.js`: valores padrão e normalização de camadas e projetos carregados.
- `src/core/time-mapping.ts`: conversão do tempo da timeline no tempo da mídia e recorte do áudio ao intervalo exportado.
- `core/animation.js`: easing, keyframes, transições existentes, parenting, câmera e avaliação da cena.
- `src/core/history.ts`: histórico limitado e transacional de undo/redo sem dependência da interface.
- `src/core/clip-commands.ts`: divisão, movimento e recorte de clipes, inclusive em reverso.

Esses módulos não acessam DOM, Electron ou Windows e possuem testes executáveis diretamente pelo Node.js.

Os módulos TypeScript são importados pelo bundle da interface. Para testes Node, `pnpm build:core` os compila em `.build/core`; `pnpm test:core` executa essa compilação antes dos testes. Não existem mais implementações JavaScript manuais de histórico, mapeamento de tempo ou comandos de clipe. A exposição dos módulos no global em `src/ui/main.ts` é uma ponte temporária para os adaptadores ainda não migrados.

## Validação local desta etapa (2026-09-09)

- Proxies: geração real de 1920×1080 para 1280×720, formato MP4 explícito no temporário, deduplicação de chamadas concorrentes, reutilização e limpeza após falha. O serviço compartilhado está em desktop/proxy-cache.cjs.
- Preview utiliza proxy; áudio de preview utiliza elemento separado com o original. Exportação utiliza uma cópia do projeto e uma sessão de mídia independente com sourcePath original, sem trocar o preview nem mover seu cursor. Projetos portáteis omitem proxyPath; ao abrir, a geração pode ser solicitada novamente com os metadados salvos.
- WebGL: cache limitado, remoção imediata das texturas fora da composição, perda/restauração real de contexto e destruição do compositor testadas no Electron. Objetos do contexto perdido são esquecidos antes da reconstrução.
- Resolução: smoke exportou um frame MP4 em 2560×1440 e 3840×2160, verificou dimensões pelo FFprobe, luminância e seleção do original com proxy distinto. Isso não constitui teste de estabilidade de exportações longas em 4K.
- Áudio: FFmpeg real verificou duas faixas estéreo, volume relativo, pan, fades, duração e corte de intervalo. Os fades mantêm a posição no clipe quando o intervalo começa depois do início dele.
- core/layer-commands.js passou a receber também inclusão de camadas e seleção das faixas de áudio para exportação; app.js continua sendo um adaptador legado com acesso ao estado global. A migração arquitetural ainda não está concluída.

Comandos: pnpm test:core inclui tools/test-proxy-real.cjs e tools/test-export-mix.cjs. Para resoluções maiores, executar pnpm test:smoke com SMOKE_WIDTH=2560 / SMOKE_HEIGHT=1440 ou SMOKE_WIDTH=3840 / SMOKE_HEIGHT=2160 no ambiente. O smoke inclui perda/restauração WebGL e limites do cache.

Efeitos/shaders adicionais e render graph permanecem fora desta etapa. Versão mantida em 0.0.1.

## Continuação local da validação

- Sessão de projeto: serialização e restauração compartilhadas em `core/project-session.js`; testes cobrem IDs, parenting, biblioteca não utilizada, organização e metadados de áudio. O smoke cobre duplicação, remoção, undo/redo, reabertura e reprodução do áudio original com proxy.
- Composição: um canvas de rasterização é reutilizado entre as camadas. `pnpm test:renderer` verifica orientação dos pixels, alpha RGBA, uso limitado de texturas e isolamento da cópia exportada.
- Recuperação: falhas na preparação e limpeza do controlador liberam seu estado ocupado. Falhas no envio de frames também liberam a sessão no processo principal. Os testes verificam nova tentativa e preservação do erro original quando o cancelamento falha.
- `pnpm test:core` inclui agora os testes de sessão, controlador, IPC e encoder real. O teste de IPC usa processos simulados; `tools/test-frame-export.cjs` e o smoke usam FFmpeg real.
- Ainda existem adaptadores com acesso ao estado global. Esta validação não equivale à conclusão da migração para comandos/seletores nem à implementação de shaders e render graph.
- Exportação 4K concluída: 3840×2160, 30 segundos, 720 frames a 24 fps e áudio, usando encoder de produção. As amostras impressas a cada 120 frames ficaram entre 231 e 265 MB no renderer; o FFmpeg atingiu aproximadamente 911 MB em uma medição separada. Estes números não representam a memória total do aplicativo nem garantem estabilidade de projetos maiores ou mais complexos.
- O encerramento desse teste revelou fechamento repetido de `AudioContext`. A destruição da sessão de mídia agora compartilha uma única promessa e não permite reabrir o áudio depois de destruída. Teste unitário cobre chamadas concorrentes/repetidas; o smoke passou depois da correção em 640×360, 48 frames, sem repetir o erro. O smoke passou a aguardar a limpeza antes de aprovar a execução. Um eventual aviso distinto de processo GPU ainda exige reprodução própria.

## Prioridade de encerramento do legado

Primeiro pacote: comandos de edição e integridade do histórico (pontos 1 e 3 do plano).

- `core/project-commands.js` centraliza propriedades básicas, parenting, edição de canais de keyframe, cortes pelos botões In/Out, restauração de corte, composição, intervalos, geração de beats e remoção de espaço vazio. O módulo opera com dados, sem DOM ou Electron.
- Atualizar uma propriedade de keyframe mantém os outros canais e seu easing. Cortes pelos botões respeitam reverso e preservam volume, pan, mute, velocidade, origem, fades e organização.
- A composição é validada antes de alterar o projeto. Encurtar a duração para antes do início de uma camada é rejeitado; camadas que cruzam o novo fim têm o recorte da mídia ajustado.
- O histórico saiu do objeto de dados do editor e recebeu transações. Arraste de posição no palco gera uma única ação de undo; cancelamento restaura a posição. Outros gestos ainda precisam ser conectados a esse mecanismo.
- Removidos os handlers antigos de split e keyframe em `advanced.js` que eram substituídos depois da inicialização. A interface ainda possui adaptadores e não foi declarada migrada.
- Validação: núcleo, TypeScript, build da interface, smoke com mídia real, teste Electron de edição e testes existentes de timeline, seleção/intervalos, áudio/beat sync e organização/reabertura de faixas.

Sequência restante:

1. Concluir a propriedade exclusiva do estado pelo núcleo, separar projeto/reprodução/seleção e migrar os escritores diretos restantes para comandos e consultas.
2. Transferir os comportamentos dos adaptadores para Vue e eliminar a injeção sequencial de scripts.
3. Conectar todos os gestos a transações e concluir comandos de seleção, faixas, máscaras, curvas, agrupamento e mídia.
4. Fechar recuperação, mídias ausentes, cancelamento de carregamentos e troca de projeto.
5. Implementar o grafo de renderização e migrar efeitos existentes para o caminho gráfico definitivo.
6. Auditar reprodução/áudio/exportação e encerramento em todos os caminhos de falha.
7. Consolidar contratos tipados e importações explícitas entre módulos.
8. Remover os arquivos e entradas de empacotamento antigos, validar projetos complexos e o aplicativo empacotado offline.

### Progresso da substituição por TypeScript

- [x] Histórico: interfaces explícitas, transações, validação de limite, reset inválido sem perda de dados e disponibilidade correta de undo/redo durante uma edição.
- [x] Mapeamento de tempo: contratos de clipe/intervalo compartilhados por preview e seleção do áudio exportado.
- [x] Comandos de clipe: mover, dividir e recortar em TS, usados também pelo arraste da timeline; implementações antigas removidas.
- [x] Correções encontradas na migração: movimento não compartilha objetos internos dos keyframes, cortes respeitam os limites da mídia e valores não finitos são rejeitados nos comandos.
- [ ] Migrar modelo de projeto, comandos restantes e propriedade do estado para TS.
- [ ] Substituir a ponte global por dependências explícitas nos adaptadores/componentes.

Essas conclusões são subtarefas dos pontos 1, 3 e 7; não encerram os oito itens principais.
