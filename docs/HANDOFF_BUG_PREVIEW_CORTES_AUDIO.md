# Continuidade — preview travando e áudio após cortes

Registro: 2026-09-10. Branch conferida: `dev/emanueltk7`.

## Situação atual

**A correção foi concluída e validada em 2026-09-11.** O diagnóstico histórico e as limitações permanecem registrados abaixo para futuras melhorias do decoder acelerado.

A migração e a primeira versão destas correções foram incluídas no commit `bf0d36b` da branch `dev/emanueltk7`. A conclusão de 2026-09-11, incluindo o fallback estável do decoder, permanece como alteração local até nova autorização compatível para commit/push. Não houve PR, merge, publicação ou alteração da versão `0.0.1` nesta conclusão.

## Relato e objetivo

O usuário importou um vídeo simples, dividiu em cinco pedaços e observou preview muito lento ou parado, com atualização intermitente de quadros. Depois de remover o áudio de um corte, grande parte do restante também ficou sem som. Ainda não havia verificado o vídeo sem cortes.

A exigência é investigar o algoritmo antes de corrigir: preview fiel e rápido, sem mascarar atraso, depender de carregamentos constantes ou introduzir soluções improvisadas. O arquivo original do usuário não foi usado nesta investigação; a reprodução foi feita com mídia sintética real gerada pelo FFmpeg.

## Problemas encontrados

1. **Eventos de mídia reconstruíam a interface.** `onChange` do runtime chamava `renderLayers()` e `setTime()` em eventos como `loadeddata` e `seeked`. Isso reconstruía a timeline e movimentava elementos no DOM sem uma alteração estrutural do projeto. Foram observadas centenas de mutações no teste inicial; na versão final testada não houve reconstrução de faixas/régua durante a reprodução.
2. **Sincronização repetia trabalho nos clipes inativos.** O runtime buscava tempos também fora do intervalo ativo e pausava elementos enquanto estavam buscando um quadro. A reprodução podia entrar em novas buscas para recuperar o atraso. A velocidade também era atribuída a cada ciclo, mesmo sem mudança.
3. **Um decoder por corte do mesmo arquivo.** Cinco cortes sequenciais alocavam elementos/decoders independentes, apesar de não exigirem posições simultâneas. A sincronização precisava tratar cada um separadamente.
4. **Atualização temporal do palco diferente no Play e no scrub.** O controlador avançado substituía `setTime`, mas o relógio de reprodução continuava usando a função local original. A decoração temporal das camadas não seguia o mesmo caminho nos dois casos.
5. **Entrega de quadros dependente da apresentação do elemento de vídeo.** Com vídeos-fonte ocultos, foram reproduzidos quadros parados e buscas que permaneciam em `seeking`, inclusive no vídeo sem cortes. Exibir temporariamente os vídeos no teste eliminou o sintoma. Desativar somente a decodificação acelerada também alterou o resultado. Isso aponta para interação com a entrega/decodificação de frames do Chromium neste ambiente; não foi provado um defeito universal de driver ou limite fixo de decoders.
6. **Áudio e vídeo acoplados no original.** Sem proxy, o áudio usava o próprio elemento de vídeo; com proxy, já havia um elemento de áudio separado usando o original. No teste inicial, o estado `muted` não vazou para os demais cortes; a falta de som apareceu na reprodução, junto das buscas travadas. Isso não exclui outros bugs de áudio ainda não testados.

## Soluções presentes no código

### `src/renderer/media-runtime.ts`

- Separação entre `onChange` de mídia pronta/quadro e `onSourceChange` de troca de fonte/proxy.
- Reutilização de um registro de mídia por vídeos da mesma fonte visual e sonora, do mesmo tipo, com intervalos sem sobreposição. Camadas sobrepostas precisam de registros distintos.
- Parâmetros de edição continuam pertencendo a cada camada. A sincronização escolhe o proprietário ativo do registro compartilhado e aplica volume, pan, canal, fades, mute e velocidade desse clipe.
- Áudio original separado para todo vídeo com áudio, inclusive sem proxy; vídeo visual permanece mudo.
- Buscas de sincronização restritas ao clipe ativo; velocidade só é atribuída se mudou; reprodução normal não é pausada só porque há uma busca em andamento.
- A tolerância original de sincronização não foi aumentada para esconder atraso.
- `attach` evita reinserção desnecessária; `reconcile` preserva registros ainda usados e religa elementos quando o primeiro proprietário é removido.
- `pause`/`destroy` deduplicam registros compartilhados. `size` agora informa registros únicos, não quantidade de IDs de camada.
- O compartilhamento não é aplicado à sessão de exportação (`exporting`).

### `src/renderer/rasterizer.ts`

- O compositor adquire explicitamente `new VideoFrame(video)` ao desenhar vídeo e fecha o frame em `finally`.
- A rasterização e as rotinas que usam dimensões/chroma aceitam esse frame. O fluxo continua compartilhado por preview e exportação.
- Essa foi a mudança que passou no teste com o layout original e os vídeos ocultos, sem flags para desativar aceleração.
- Não há cache ilimitado de frames, cópia integral do vídeo ou nova prévia DOM. Revisar ainda o efeito desta alteração nos testes de exportação e falhas.

### Interface

- `src/ui/app-controller.ts`: eventos comuns só atualizam o tempo; mudança de fonte também refaz as camadas.
- `src/ui/editing/advanced-controller.ts` e `src/ui/main.ts`: atualização temporal do palco assinada por `playback.onTimeChange`, em vez de substituir `setTime`.
- O controle básico de áudio/velocidade do inspector chama a sincronização pelo estado em vez de gravar diretamente no elemento de vídeo.
- `src/ui/stage/stage-controller.ts`: evita recolocar no palco uma camada que já está montada.

## Tentativas descartadas e cuidados para interpretar os resultados

- Execução inicial com janela oculta não era adequada para medir fluidez: houve limitação de atualização. O teste final abre janela visível, com `backgroundThrottling:false` e `alwaysOnTop:true`.
- Exibir os vídeos-fonte por CSS foi somente diagnóstico. O CSS artificial foi removido do teste.
- Houve tentativa de criar um contêiner de decoders atrás de um canvas opaco. Ela passou uma vez e falhou em repetição; foi removida. **Não recriar essa tentativa como se fosse a solução final.**
- As alterações temporárias em `renderer/preview-engine.css` foram revertidas ao conteúdo anterior; pode aparecer aviso de finais de linha, mas o último diff não tinha mudança funcional nesse CSS.
- Nenhuma tentativa desliga a GPU ou o compositor WebGL. A decisão final sobre a decodificação de vídeo está registrada logo abaixo.
- Não interpretar um teste intermediário aprovado como aprovação da versão final. Houve falhas intermediárias explícitas, que motivaram a aquisição de `VideoFrame`.

Após novas repetições em 2026-09-11, o caminho acelerado voltou a travar inclusive no vídeo sem cortes, chegando a aproximadamente 4,7 segundos de atraso enquanto o áudio continuava. A conclusão acima foi revisada: o produto mantém WebGL/GPU para composição, mas desativa somente a decodificação acelerada de vídeo em `desktop/main.cjs`. O fallback por software passou cinco execuções consecutivas do teste específico. `MOTION_LIVRE_HARDWARE_VIDEO_DECODE=1` permite reativar o caminho acelerado para desenvolvimento e futura validação; ele ainda não deve ser usado como padrão sem detecção de falha e fallback automático.

## Teste novo e evidência obtida

O teste permanente está em `tools/test-preview-cuts.cjs` e faz parte de `pnpm test:renderer`.

Executar:

```powershell
pnpm exec electron tools/test-preview-cuts.cjs
```

O teste gera MP4 H.264/AAC de 640×360, 30 fps, 10 segundos, com padrão visual em movimento e seno de 440 Hz. Também gera proxy de 320×180 sem áudio. Abre a interface real no Electron e testa:

1. Vídeo sem cortes.
2. Cinco cortes, com terceiro corte silenciado pelo inspector, sem proxy.
3. Cinco cortes com proxy, extração do áudio do terceiro corte e exclusão da faixa extraída.

Mede callbacks de frames do decoder, diferença entre tempo da mídia e timeline, estado de reprodução e energia real do sinal no grafo Web Audio. Confere silêncio somente no intervalo escolhido, ausência de reconstrução de faixas/régua, um decoder nos cortes sequenciais, decoder separado numa duplicação sobreposta e preservação do compartilhado ao excluir duplicata/primeiro corte.

**Última execução aprovada com o layout original:** aproximadamente 60 callbacks por intervalo de dois segundos, exceto o primeiro intervalo do vídeo sem cortes (52). Nas amostras fora das bordas, todos os trechos ficaram reproduzindo; áudio presente em todas as amostras esperadas e ausente no terceiro corte dos cenários editados. Maior diferença de tempo amostrada ficou abaixo de 40 ms no original e aproximadamente 14 ms no proxy. Nenhuma reconstrução de faixas/régua durante a reprodução.

Limitações do teste:

- Ele comprova esses cenários curtos neste ambiente, não desempenho universal ou estabilidade de projetos longos/4K.
- A contagem é de entrega de frames do vídeo, não uma análise completa de todos os pixels apresentados no canvas final.
- As amostras de áudio/atraso excluem aproximadamente os primeiros 400 ms e os últimos 200 ms de cada intervalo; medir transições precisamente continua necessário.
- A última parte do cenário com proxy registrou algumas buscas de vídeo, apesar de manter fluidez e baixo atraso. Investigar se há sincronizações evitáveis antes de declarar continuidade perfeita.
- O teste abre uma janela visível no topo e não está incluído num script de `package.json`.

## Validações realizadas e pendentes

Passaram:

- `pnpm build:ui` depois da implementação final de `VideoFrame` e da remoção da tentativa de layout.
- O teste novo na versão final descrita acima.
- `git diff --check` e `node --check tools/test-preview-cuts.cjs` após as últimas alterações de código.
- `pnpm check:ui` e `pnpm build:renderer` numa versão intermediária, **anterior** à mudança final de `VideoFrame`.

Em 2026-09-11 também passaram `pnpm check:ui`, `pnpm build:renderer`, `pnpm test:core` e `pnpm test:renderer`, agora incluindo o teste específico além dos três testes Electron existentes. O cenário de preview passou cinco vezes consecutivas usando o fallback aplicado ao aplicativo. O smoke final passou em 640×360, 2 segundos e 48 frames, cobrindo áudio original com proxy, recuperação do contexto WebGL e encoder de produção.

## Resultado final e trabalho futuro

O defeito relatado está corrigido e coberto por teste reproduzível. O aplicativo usa um decoder por fonte para cortes sequenciais, mantém decoders separados para camadas simultâneas, separa o áudio original da superfície visual e não reconstrói a timeline por eventos de mídia. A composição continua na GPU pelo WebGL2; somente a decodificação acelerada de vídeo usa fallback por software, porque o caminho acelerado falhou de forma repetível e intermitente neste ambiente.

Como evolução, implementar uma verificação de saúde do decoder que detecte ausência de novos frames e reinicie o aplicativo automaticamente no fallback. Somente depois de essa troca automática passar pelos mesmos testes o decoder acelerado deve voltar a ser o padrão. Também convém ampliar os testes para scrub para trás, cortes não contíguos, velocidades diferentes, reverso, múltiplos vídeos simultâneos e transições exatas de fades. Essas ampliações não bloqueiam a correção do cenário relatado.

## Arquivos para revisão

Alterados nesta investigação: `desktop/main.cjs`, `desktop/runtime-switches.cjs`, `src/renderer/media-runtime.ts`, `src/renderer/rasterizer.ts`, `src/ui/app-controller.ts`, `src/ui/editing/advanced-controller.ts`, `src/ui/main.ts`, `src/ui/stage/stage-controller.ts` e `tools/smoke-renderer.cjs`.

O teste específico e este documento já constam no commit `bf0d36b`; `desktop/runtime-switches.cjs` foi acrescentado na conclusão de 2026-09-11.

Use `git diff` para revisar as alterações posteriores ao commit `bf0d36b`. Não adicionar todos os arquivos indiscriminadamente.

## Fullscreen e continuidade vertical da exportação — 2026-09-11

O fullscreen mantinha `24px` de margem lateral e reservava `110px` da altura para os controles, embora os controles já sejam sobrepostos ao vídeo. `studio.css` agora permite que o palco ocupe toda a largura ou toda a altura disponível, preservando a proporção da composição. Em uma tela com a mesma proporção da composição, o palco preenche as duas dimensões.

Também havia uma divergência no limite dos cortes: o preview considera o fim de cada clipe exclusivo, mas `src/renderer/rasterizer.ts` ainda desenhava o clipe quando `time === end`. Assim, no instante exato de um corte, dois clipes adjacentes podiam ser enviados juntos ao quadro exportado. A rasterização agora usa o intervalo `start <= time < end`, igual ao preview e aos comandos de edição.

`tools/test-renderer-contracts.cjs` passou a verificar que o palco em fullscreen preenche ao menos uma dimensão da viewport e que cinco trechos contíguos com a mesma posição mantêm o centro vertical idêntico em todos os dez quadros exportados. Passaram `pnpm build:renderer`, `pnpm test:renderer`, `node --check` nos JavaScript alterados e `git diff --check`. A primeira execução da suíte Electron dentro da sandbox falhou antes de carregar a interface porque o processo de GPU encerrou; a repetição fora da sandbox passou integralmente.

A reserva de espaço no fullscreen e a sobreposição no instante do corte estão confirmadas e corrigidas. O salto vertical persistente descrito no arquivo exportado não se reproduziu no cenário sintético de cinco cortes. Se ele continuar no projeto original, será necessário testar o arquivo de projeto correspondente para verificar valores de `y`, keyframes, câmera, parentesco ou diferenças entre os trechos; não há evidência suficiente para atribuir uma dessas causas sem esse estado salvo.
