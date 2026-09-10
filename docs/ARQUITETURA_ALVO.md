# Arquitetura-alvo do Motion Livre

## Objetivo

Prévia, exportação e futuras interfaces mobile devem interpretar o mesmo projeto, a mesma timeline e o mesmo mapeamento de mídia. Código legado não deve ser preservado quando cria um segundo caminho de renderização, exportação ou estado.

## Objetivo obrigatório de desempenho e qualidade

O Motion Livre deve adotar a estratégia de motores gráficos móveis eficientes: usar a GPU para processamento visual adequado, reduzir trabalho durante a edição e reservar a qualidade integral para a saída final. Potência bruta de hardware não deve substituir otimização, reutilização de resultados e controle de memória.

O produto deve buscar estes resultados:

- preview responsivo e estável, com degradação temporária e controlada de resolução, amostragem ou FPS quando necessário para manter a interação;
- proxies, cache de frames, pré-carregamento limitado e descarte previsível de recursos, sem alterar a mídia original;
- efeitos visuais de alta qualidade, combináveis e animáveis, processados preferencialmente por shaders e organizados pelo render graph;
- exportação em 2K e 4K a partir das mídias originais, independente da qualidade reduzida usada no preview;
- preservação de resolução, proporção, FPS, duração, ordem dos frames, sincronização audiovisual e parâmetros de cor definidos pelo projeto;
- ausência de ruído, frames repetidos ou perdidos, engasgos incorporados ao arquivo, dessincronização e perda de qualidade causados pelo pipeline do editor;
- processamento progressivo da exportação, com memória limitada, sem manter o vídeo completo ou todos os frames na RAM ou na GPU;
- perfis de codec, pixel format, controle de qualidade e áudio adequados ao formato de saída, pois resolução 2K ou 4K isoladamente não garante qualidade.

Preview fluido e exportação fiel são objetivos diferentes: o preview pode reduzir trabalho visual de forma reversível, enquanto a exportação deve recalcular a cena completa no nível de qualidade solicitado. Nenhuma otimização de preview pode substituir, modificar ou degradar os arquivos de origem usados na exportação.

Esses objetivos devem ser verificados com métricas e testes reproduzíveis: tempo de frame, uso e liberação de memória, frames perdidos ou duplicados, timestamps, sincronização entre áudio e vídeo, equivalência visual entre preview e exportação e inspeção de arquivos 2K/4K produzidos pelo encoder real. Os limites de hardware e complexidade de projeto usados em cada validação devem ser registrados; não declarar desempenho universal sem essas condições.

## Estratégia obrigatória de exportação rápida

A exportação deve possuir uma etapa de planejamento que analise, por trecho, cortes, efeitos, transformações, áudio, codec, resolução, pixel format, keyframes do fluxo comprimido e compatibilidade do contêiner. O planejador deve escolher o caminho mais barato que preserve exatamente o resultado solicitado:

1. copiar ou remultiplexar vídeo compatível quando não houver alteração visual que exija novos pixels;
2. copiar o vídeo e reconstruir somente o áudio quando a imagem permanecer intacta;
3. reutilizar cache de renderização cuja validade tenha sido comprovada pelos dados e parâmetros do projeto;
4. renderizar apenas regiões modificadas quando os trechos resultantes puderem ser unidos com segurança;
5. renderizar a composição completa quando efeitos, transformações, formato ou compatibilidade exigirem;
6. usar decodificação e codificação por hardware quando disponíveis e quando o resultado atender ao perfil de qualidade escolhido, mantendo fallback funcional por software.

Decodificação, composição, codificação e gravação devem operar progressivamente e, quando seguro, em pipeline paralelo com filas limitadas. A busca por velocidade não autoriza cortes imprecisos, mudança silenciosa de codec ou qualidade, junções incompatíveis, perda de frames, timestamps inválidos nem dessincronização. Se a cópia direta ou a renderização parcial não puder garantir o arquivo final, o planejador deve selecionar automaticamente o caminho completo e confiável.

Projetos simples — como cortes, remoção de trechos, música e poucos efeitos localizados — devem ser o principal caso de otimização e buscar exportação muito mais rápida que o tempo real em hardware compatível. O aplicativo deve informar o caminho selecionado e permitir medir tempo total, trechos copiados/renderizados, encoder utilizado e motivos de fallback. Não prometer exportação instantânea para todo projeto 2K/4K.

## Requisito de interoperabilidade com Alight Motion XML

A importação e a exportação de cenas XML compatíveis com o ecossistema Alight Motion fazem parte da arquitetura e devem ser preservadas. A importação deve validar o documento antes de substituir o projeto e aplicar a troca de forma atômica, sem deixar estado parcial em caso de erro.

Identificadores internos e originais, ordem, duplicatas, flags, atributos, keyframes e metadados de efeitos externos devem ser preservados quando representáveis. Recursos desconhecidos devem produzir relatório de compatibilidade e conservar dados suficientes para round-trip sempre que possível, sem fingir suporte visual inexistente. Mídias externas ausentes devem poder ser religadas; referências próprias de pacotes Alight não devem ser tratadas como arquivos locais disponíveis.

O parser deve manter limites de tamanho e quantidade, rejeitar `DOCTYPE` e entidades externas e não buscar automaticamente mídia HTTP/HTTPS. O Motion Livre deve implementar interoperabilidade de forma independente, sem depender de shaders, bytecode ou código proprietário do Alight Motion. O contrato detalhado permanece em `docs/COMPATIBILIDADE_ALIGHT_XML.md` e deve continuar coberto por testes de importação atômica, preservação e round-trip.

## Política obrigatória de formatos do projeto

O modelo TypeScript validado é a fonte de autoridade do Motion Livre. JSON e XML são serializações desse modelo ou adaptadores de intercâmbio; nenhuma regra definitiva de edição, efeitos, timeline ou exportação deve existir somente no leitor ou escritor de um formato.

- `.motion.json` é o formato nativo de projetos completos. Deve preservar todo o estado editável do Motion Livre, ter versão explícita e passar por validação e migração antes de substituir o projeto aberto.
- XML é usado para interoperabilidade com o Alight Motion e para artefatos em que estrutura extensível e round-trip tragam vantagem, como efeitos e presets compartilháveis.
- Sempre que o Motion Livre escrever XML referente a cenas, camadas, propriedades, keyframes ou efeitos que possuam equivalente no Alight Motion, deve usar a mesma organização estrutural, nomes e semântica do esquema compatível documentado, em vez de criar uma segunda representação equivalente.
- Recursos exclusivos do Motion Livre devem usar extensões identificáveis e documentadas, preferencialmente com namespace próprio, sem alterar o significado dos elementos compatíveis. Leitores devem ignorar extensões desconhecidas com segurança e preservá-las quando o round-trip exigir.
- A compatibilidade deve se apoiar em documentação pública e comportamento validado por arquivos de teste. Não copiar código, shaders ou componentes proprietários, nem declarar compatibilidade para campos ou efeitos que ainda não tenham sido verificados.
- Formatos antigos já produzidos pelo Motion Livre devem continuar importáveis ou passar por migração explícita; a adoção da estrutura XML compatível não autoriza quebrar presets e projetos existentes silenciosamente.

A escolha entre JSON e XML deve considerar fidelidade, interoperabilidade, validação, tamanho e manutenção. Não transformar XML no estado interno do editor: ambos os formatos devem entrar e sair pelo mesmo modelo central tipado.

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

## Requisito obrigatório para efeitos visuais

Toda implementação nova de efeito visual deve integrar o caminho gráfico compartilhado por preview e exportação. O efeito deve ser representado no render graph, com entradas, parâmetros, ordem e saídas explícitas, e deve usar shader dedicado quando o processamento for adequado à GPU.

Não criar um caminho de efeito exclusivo no Canvas, no DOM, somente na prévia ou somente na exportação. Canvas pode continuar como etapa de rasterização de fontes que ainda precisem dele, mas não deve se tornar uma implementação paralela do efeito. Preview e exportação devem avaliar a mesma cadeia de efeitos e produzir o mesmo resultado para o mesmo projeto e instante.

A implementação de efeitos deve seguir esta ordem:

1. Definir o contrato serializável do efeito e validar seus parâmetros no núcleo.
2. Registrar entradas, ordem e dependências no render graph.
3. Implementar o processamento em shader quando aplicável.
4. Conectar o mesmo resultado ao preview e à exportação.
5. Adicionar testes de ordem, parâmetros, persistência e equivalência entre preview e exportação.

Efeitos existentes baseados em Canvas devem migrar gradualmente para esse caminho. Exceções técnicas precisam ser documentadas neste arquivo com justificativa, limites e plano de remoção antes de serem aceitas.

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

O núcleo é TypeScript puro, independente de runtime, para continuar reutilizável no Electron e em uma futura aplicação mobile. A compilação CommonJS em `.build/core` atende aos testes Node e ao processo principal; a interface importa as mesmas fontes TS pelo Vite:

- `src/core/project-model.ts`: contratos, valores padrão e normalização de camadas.
- `src/core/time-mapping.ts`: conversão do tempo da timeline no tempo da mídia e recorte do áudio ao intervalo exportado.
- `src/core/animation.ts`: easing, keyframes, transições existentes, parenting, câmera e avaliação da cena.
- `src/core/history.ts`: histórico limitado e transacional de undo/redo sem dependência da interface.
- `src/core/clip-commands.ts`: divisão, movimento e recorte de clipes, inclusive em reverso.
- `src/core/project-commands.ts` e `src/core/layer-commands.ts`: propriedades, composição, marcadores, efeitos, vetores, agrupamento, precomposição, faixas e extração de áudio.
- `src/core/selection-commands.ts`: seleção única, aditiva, por intervalo e por faixa sem gravações diretas da timeline.
- `src/core/editor-state.ts`: estado de projeto com seleção e reprodução armazenadas em fatias distintas.
- `src/core/project-session.ts`: serialização, validação e restauração portátil.
- `src/core/media-commands.ts`: normalização de descritores, biblioteca e metadados de mídia.
- `src/core/export-settings.ts` e `src/core/preview-quality.ts`: contratos de saída e política adaptativa da prévia.
- `src/core/audio-export-plan.ts`: plano FFmpeg tipado, com alinhamento em samples e suporte à faixa completa de velocidades do projeto.
- `src/renderer/webgl-presenter.ts`, `src/renderer/rasterizer.ts` e `src/renderer/composition-engine.ts`: apresentação WebGL2, rasterização e composição compartilhada por preview/exportação, importadas explicitamente pelo bundle.
- `src/renderer/media-runtime.ts`, `src/renderer/export-controller.ts` e `src/renderer/preview-engine.ts`: ciclo de vida e sincronização das mídias, sessão isolada de exportação e agendamento adaptativo da prévia. As implementações JavaScript anteriores foram removidas.

Esses módulos não acessam DOM, Electron ou Windows e possuem testes executáveis diretamente pelo Node.js.

Os módulos TypeScript são importados pelo bundle da interface. Para testes Node e uso no processo principal, `pnpm build:core` os compila em `.build/core`; desenvolvimento e distribuição compilam o núcleo antes de iniciar. Não existem implementações JavaScript manuais paralelas desses módulos. Os controladores recebem dependências do bootstrap; a API pública tipada `window.motionEditor` permanece para integração e testes.

## Validação local desta etapa (2026-09-09)

- Proxies: geração real de 1920×1080 para 1280×720, formato MP4 explícito no temporário, deduplicação de chamadas concorrentes, reutilização e limpeza após falha. O serviço compartilhado está em desktop/proxy-cache.cjs.
- Preview utiliza proxy; áudio de preview utiliza elemento separado com o original. Exportação utiliza uma cópia do projeto e uma sessão de mídia independente com sourcePath original, sem trocar o preview nem mover seu cursor. Projetos portáteis omitem proxyPath; ao abrir, a geração pode ser solicitada novamente com os metadados salvos.
- WebGL: cache limitado, remoção imediata das texturas fora da composição, perda/restauração real de contexto e destruição do compositor testadas no Electron. Objetos do contexto perdido são esquecidos antes da reconstrução.
- Resolução: smoke exportou um frame MP4 em 2560×1440 e 3840×2160, verificou dimensões pelo FFprobe, luminância e seleção do original com proxy distinto. Isso não constitui teste de estabilidade de exportações longas em 4K.
- Áudio: FFmpeg real verificou duas faixas estéreo, volume relativo, pan, fades, duração e corte de intervalo. Os fades mantêm a posição no clipe quando o intervalo começa depois do início dele. Cortes consecutivos sem mudanças são reunidos antes da exportação e um teste com AAC a 48 kHz verifica que não há queda de volume nas junções. O timestamp final é regenerado pela contagem de samples; um MP4 de produção com três segmentos fracionários é inspecionado pacote a pacote para impedir DTS repetido ou regressivo.
- `src/core/layer-commands.ts` concentra inclusão, remoção, duplicação, reorganização e movimentação entre faixas, extração e seleção das faixas de áudio para exportação. A movimentação valida destino, bloqueio, sobreposição, intervalo, nome e ordem antes de substituir a lista.
- Presets XML agora são convertidos em dados e aplicados por um único comando do núcleo. Efeitos, propriedades, ordem e pontos de máscara são validados em uma cópia da camada antes da substituição; reordenação e reset da pilha de efeitos também deixaram de escrever diretamente no adaptador.

Comandos: pnpm test:core inclui tools/test-proxy-real.cjs e tools/test-export-mix.cjs. Para resoluções maiores, executar pnpm test:smoke com SMOKE_WIDTH=2560 / SMOKE_HEIGHT=1440 ou SMOKE_WIDTH=3840 / SMOKE_HEIGHT=2160 no ambiente. O smoke inclui perda/restauração WebGL e limites do cache.

Efeitos/shaders adicionais e render graph permanecem fora desta etapa. Versão mantida em 0.0.1.

## Continuação local da validação

- Sessão de projeto: serialização e restauração compartilhadas em `src/core/project-session.ts`; testes cobrem IDs, parenting, projetos mínimos antigos, biblioteca não utilizada, organização e metadados de áudio. O smoke cobre duplicação, remoção, undo/redo, reabertura e reprodução do áudio original com proxy.
- Composição: um canvas de rasterização é reutilizado entre as camadas. `pnpm test:renderer` verifica orientação dos pixels, alpha RGBA, uso limitado de texturas e isolamento da cópia exportada.
- Recuperação: falhas na preparação e limpeza do controlador liberam seu estado ocupado. Falhas no envio de frames também liberam a sessão no processo principal. Os testes verificam nova tentativa e preservação do erro original quando o cancelamento falha.
- `pnpm test:core` inclui agora os testes de sessão, controlador, IPC e encoder real. O teste de IPC usa processos simulados; `tools/test-frame-export.cjs` e o smoke usam FFmpeg real.
- Os adaptadores JavaScript foram removidos; os controladores recebem dependências do bootstrap. Esta etapa não encerra todos os objetivos de comandos/seletores nem implementa shaders dedicados e render graph.
- Exportação 4K concluída: 3840×2160, 30 segundos, 720 frames a 24 fps e áudio, usando encoder de produção. As amostras impressas a cada 120 frames ficaram entre 231 e 265 MB no renderer; o FFmpeg atingiu aproximadamente 911 MB em uma medição separada. Estes números não representam a memória total do aplicativo nem garantem estabilidade de projetos maiores ou mais complexos.
- O encerramento desse teste revelou fechamento repetido de `AudioContext`. A destruição da sessão de mídia agora compartilha uma única promessa e não permite reabrir o áudio depois de destruída. Teste unitário cobre chamadas concorrentes/repetidas; o smoke passou depois da correção em 640×360, 48 frames, sem repetir o erro. O smoke passou a aguardar a limpeza antes de aprovar a execução. Um eventual aviso distinto de processo GPU ainda exige reprodução própria.

## Prioridade de encerramento do legado

Primeiro pacote: comandos de edição e integridade do histórico (pontos 1 e 3 do plano).

- `src/core/project-commands.ts` centraliza propriedades básicas, parenting, edição de canais de keyframe, cortes pelos botões In/Out, restauração de corte, composição, intervalos, marcadores, geração de beats, efeitos, vetores, agrupamento, precomposição e remoção de espaço vazio. O módulo opera com dados, sem DOM ou Electron.
- Atualizar uma propriedade de keyframe mantém os outros canais e seu easing. Cortes pelos botões respeitam reverso e preservam volume, pan, mute, velocidade, origem, fades e organização.
- A composição é validada antes de alterar o projeto. Encurtar a duração para antes do início de uma camada é rejeitado; camadas que cruzam o novo fim têm o recorte da mídia ajustado.
- O histórico saiu do objeto de dados do editor e recebeu transações. Arraste de posição no palco e edições de pontos de máscara/caminho geram uma única ação de undo; cancelamento restaura a posição ou a edição vetorial completa. Outros gestos ainda precisam ser conectados a esse mecanismo.
- Removidos os handlers antigos de split e keyframe em `advanced.js` que eram substituídos depois da inicialização; posteriormente, os adaptadores restantes também foram eliminados.
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
- [x] Modelo, animação, sessão, configurações de exportação e qualidade de preview migrados para TS; fontes JavaScript paralelas removidas.
- [x] Comandos de projeto, camada e mídia migrados para TS, incluindo efeitos, marcadores, vetores, faixas, precomposição, extração de áudio e biblioteca.
- [x] Armazenamento de seleção, reprodução e opções transitórias de UI separado dos dados persistentes; todos os acessores planos de compatibilidade foram removidos.
- [x] WebGL presenter, rasterizador e compositor migrados para TS e suas fontes JavaScript antigas removidas; o render graph e shaders dedicados ainda estão pendentes.
- [x] Runtime de mídia, controlador de exportação e motor de preview migrados para TS; testes importam a compilação dessas fontes e os scripts antigos não são mais injetados sequencialmente.
- [x] Seleção múltipla e congelamento de quadro passaram para comandos tipados; o freeze preserva propriedades, efeitos, tempo de origem, reverso e desloca clipes/keyframes posteriores de forma atômica.
- [x] Plano de áudio do FFmpeg migrado de JavaScript para TypeScript; segmentos consecutivos equivalentes são consolidados e recortes/atrasos usam uma grade comum de samples.
- [x] Reorganização e movimentação de clipes entre faixas centralizadas em comandos tipados; `timeline.js` não grava mais `trackId`, `trackName` nem reordena `state.layers` diretamente.
- [x] Aplicação de presets XML e escritores da pilha de efeitos centralizados; presets inválidos não deixam alterações parciais na camada.
- [x] Importação Alight substitui o projeto por um comando atômico do núcleo e preserva identificador interno/original, ordem, duplicatas, flags, atributos e keyframes dos efeitos externos sem exigir implementação visual.
- [x] Criação de câmera/controle nulo, atribuição de waveform e reset completo de projeto centralizados em comandos tipados; câmeras bloqueadas não são desativadas implicitamente.
- [x] Escritores de curvas auditados: seleção de easing e criação de keyframes usam comandos do núcleo, e o gráfico atual é somente leitura.
- [x] Campos avançados, faixa configurada de exportação e extensão da duração pela timeline deixaram de gravar o projeto diretamente; a apresentação calcula o filtro visual sem alterar a camada e o handler antigo duplicado de presets foi removido.
- [x] Edição de pontos de máscara e caminho conectada ao histórico transacional, incluindo undo/redo em uma etapa e cancelamento completo por Escape.
- [x] Controles contínuos persistentes do inspector, corte, efeitos e mixer conectados a transações; múltiplos eventos de um mesmo arraste ou edição geram uma única entrada no histórico.
- [x] Acessores planos de compatibilidade removidos; adaptadores e testes consomem `state.selection` e `state.playback` explicitamente.
- [x] Ponte global substituída por dependências explícitas; o bootstrap e os serviços públicos do editor são tipados.

### Encerramento incremental dos adaptadores

- `desktop-integration.js` foi substituído por `src/ui/platform/desktop-controller.ts`. O controlador importa diretamente os comandos de preset e o controlador de exportação, recebe a ponte Electron por contrato tipado e não usa símbolos `Motion*` globais.
- `studio.js` foi substituído por `src/ui/presentation/studio-controller.ts`. O controlador importa o estado transitório da interface e usa eventos e observação do DOM para decoração visual, sem substituir funções globais de reprodução, composição ou timeline.
- `alight-compat.js` foi substituído por `src/ui/compat/alight-controller.ts`. O codec e o controlador agora são compilados em TypeScript estrito, importam diretamente o modelo e o comando atômico de projeto e preservam os contratos de round-trip XML.
- `advanced.js` foi substituído por `src/ui/editing/advanced-controller.ts`. Histórico, composição, propriedades avançadas, efeitos básicos, mixer, desenho e arquivos de projeto usam imports tipados; o mixer deixou de criar variáveis globais implícitas.
- A configuração de formato, resolução, FPS, qualidade, áudio, transparência e intervalo de exportação saiu de `pro-editor.js` para `src/ui/export/export-settings-controller.ts`, com contratos explícitos do núcleo e da ponte de exportação. O restante do adaptador profissional também foi extraído por domínios, conforme os registros abaixo.
- A importação profissional de vídeo/áudio e a geração limitada de waveform saíram de `pro-editor.js` para `src/ui/editing/professional-media-controller.ts`; o controlador fecha o `AudioContext` também nos caminhos de falha e recebe estado, histórico, ponte de arquivo e operações de UI por contrato.
- Propriedades profissionais, parenting, easing, criação de keyframes e exibição do caminho de movimento saíram de `pro-editor.js` para `src/ui/editing/professional-properties-controller.ts`; o controlador usa comandos e tipos do núcleo e mantém os gestos contínuos ligados ao histórico.
- Máscaras poligonais, caminhos Bézier e alças de escala/rotação saíram de `pro-editor.js` para `src/ui/editing/vector-editing-controller.ts`; começo, conclusão e cancelamento desses gestos continuam transacionais.
- Filtros visuais, estilos profissionais e ordenação/reset da pilha de efeitos saíram de `pro-editor.js` para `src/ui/editing/professional-effects-controller.ts`.
- Marcadores, zoom/snap, camadas nulas e câmera, precomposição e extração de áudio saíram de `pro-editor.js` para `src/ui/editing/professional-actions-controller.ts`; com isso, `pro-editor.js` foi removido da carga e do pacote.
- O cache e a fila de miniaturas da timeline saíram de `timeline.js` para `src/ui/timeline/timeline-media-preview.ts`, mantendo carregamento e busca serializados e o limite de 80 entradas.
- O controle de tela cheia do palco saiu de `timeline.js` para `src/ui/timeline/preview-fullscreen-controller.ts`.
- Seleção simples, aditiva, por intervalo e por marquee saiu de `timeline.js` para `src/ui/timeline/timeline-selection-controller.ts`, usando diretamente os comandos de seleção do núcleo.
- Agrupamento, seleção e renomeação de faixas, reordenação por drag e o painel de camadas saíram de `timeline.js` para `src/ui/timeline/timeline-tracks-controller.ts`.
- Beat sync, geração por BPM e estimativa por waveform saíram de `timeline.js` para `src/ui/timeline/timeline-beat-controller.ts`.
- Pontos In/Out, trims da composição e arraste transacional das bordas de renderização saíram de `timeline.js` para `src/ui/timeline/timeline-range-controller.ts`.
- Arraste, snapping, remoção e menu de contexto de marcadores/clipes saíram de `timeline.js` para `src/ui/timeline/timeline-context-controller.ts`.
- Duplicação, exclusão, divisão, movimentação entre faixas, reverso, espelhamento e freeze frame saíram de `timeline.js` para `src/ui/timeline/timeline-actions-controller.ts`.
- O gesto contínuo de mover e recortar clipes saiu de `timeline.js` para `src/ui/timeline/timeline-clip-gesture-controller.ts`, incluindo snapping, autoscroll, criação de faixa, cancelamento e transação única de histórico.
- A construção da barra de ferramentas da timeline saiu de `timeline.js` para `src/ui/timeline/timeline-toolbar.ts`.
- Scrub, posição do playhead, zoom ancorado, cabeçalho fixo e atualização por resize saíram de `timeline.js` para `src/ui/timeline/timeline-navigation-controller.ts`.
- A renderização da régua, faixas, clipes, keyframes, waveforms, marcadores e limites saiu de `timeline.js` para `src/ui/timeline/timeline-renderer.ts`.
- O bootstrap da timeline foi transferido para `src/ui/timeline/timeline-controller.ts`, que instala os controladores por contratos tipados; `timeline.js` foi removido da carga e do pacote.
- Relógio de reprodução, play/pause, posicionamento temporal, sincronização do runtime de mídia e controles básicos de transporte saíram de `app.js` para `src/ui/playback/playback-controller.ts`.
- Importação visual, metadados, descritores, biblioteca, restauração, proxies e drag-and-drop saíram de `app.js` para `src/ui/media/media-library-controller.ts`; o controlador profissional acrescenta waveform e áudio sobre esse contrato.
- Criação e renderização de camadas no palco, estilos básicos, seleção, propriedades principais e arraste transacional saíram de `app.js` para `src/ui/stage/stage-controller.ts`.
- O bootstrap restante foi transferido para `src/ui/app-controller.ts`. `app.js`, `loadScript()`, `window.motionLegacyContext` e a publicação global dos módulos `Motion*` foram removidos; os testes de integração usam a API tipada `window.motionEditor`.
- Não permanecem scripts adaptadores na carga ou no pacote.

Essas conclusões são subtarefas dos pontos 1, 3 e 7; não encerram os oito itens principais.

## Conferência do encerramento — 2026-09-10

A substituição dos sete adaptadores foi conferida no código local. Passaram a checagem TypeScript, o build da UI, a suíte do núcleo, os três testes Electron de integração e o smoke com FFmpeg (640×360, 2 segundos, 48 frames). Comandos e limitações estão em [HANDOFF_MIGRACAO_LEGADO.md](HANDOFF_MIGRACAO_LEGADO.md). As alterações continuam sem commit.
