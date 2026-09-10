# Continuidade — preview travando e áudio após cortes

Registro: 2026-09-10. Branch conferida: `dev/emanueltk7`.

## Situação ao interromper

**Há correções locais e um novo teste de reprodução aprovado, mas a tarefa ainda não está concluída.** Faltam a checagem TypeScript da última versão, regressões existentes e revisão mais ampla do compartilhamento de mídia. O usuário pediu este registro para continuar em outra sessão.

A migração da interface já estava concluída e suas alterações estavam majoritariamente no staging antes desta tarefa. As correções desta investigação estão fora do staging. Preserve ambos. Não houve commit, push, PR, publicação ou alteração da versão `0.0.1`. Não reiniciar a migração nem descartar a árvore existente.

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
- Não foi mantida nenhuma flag para desligar GPU ou decoder acelerado.
- Não interpretar um teste intermediário aprovado como aprovação da versão final. Houve falhas intermediárias explícitas, que motivaram a aquisição de `VideoFrame`.

## Teste novo e evidência obtida

Arquivo novo, ainda não adicionado ao staging: `tools/test-preview-cuts.cjs`.

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

**Não passaram por nova execução final:** checagem TypeScript completa, build do renderer, suíte do núcleo, testes Electron existentes e smoke/exportação. As últimas tentativas de `check:ui` e `build:renderer` fora do sandbox retornaram `Rejected (rejected by user)` no momento da interrupção. Antes disso, ferramentas de compilação recebiam EPERM no sandbox e funcionavam com execução autorizada fora dele. Não apresentar a interrupção como erro de tipos, nem afirmar que a última versão já foi aprovada por esses comandos.

## O que falta para terminar

1. Ler `AGENTS.md`, `CONTRIBUTING.md`, arquitetura e este registro; conferir branch e diff. Preservar staging da migração. A árvore não está limpa: não sincronizar automaticamente com pull/merge.
2. Revisar o algoritmo de compartilhamento: mudanças de intervalo que criam sobreposição, troca de fonte/proxy, exclusão de proprietários, IDs mantidos ao reabrir projeto e integridade de `members`/`containers`. As buscas sobre os mapas ainda têm custo que pode crescer com muitos clipes; avaliar antes de ampliar o escopo ou prometer escalabilidade.
3. Confirmar que getters e atualizações de UI não criam/repartem registros inesperadamente durante reprodução. Revisar também observadores/listeners na liberação de registros.
4. Rodar `pnpm check:ui`, `pnpm build:renderer` e, quando necessário, `pnpm build:core`. A compilação em `.build/renderer` ainda pode estar anterior à versão final.
5. Executar regressões relevantes existentes: `tools/test-media-lifecycle.cjs`, testes de clipes, sessão, áudio e controlador de exportação; depois os testes Electron `test-renderer-contracts.cjs`, `test-editing-commands.cjs` e `test-alight-xml.cjs`, e `tools/smoke-renderer.cjs` com FFmpeg real. Não iniciar vários testes gráficos simultaneamente.
6. Validar `VideoFrame` na exportação, transparência, efeitos que leem pixels e recuperação de contexto; garantir fechamento dos frames também nos erros. Não assumir que o build do Vite substitui essa validação.
7. Ampliar a regressão de playback com saltos/scrub para trás, cortes não contíguos, velocidades diferentes, reverso, camadas simultâneas, fades/pan/volume, mute global, undo/redo e salvar/reabrir. Testar remoção/extração de áudio também nesses fluxos.
8. Repetir o teste de reprodução final após qualquer correção necessária; se houver intermitência, manter o diagnóstico aberto. Validar, se disponível, o vídeo/projeto real do usuário.
9. Medir pixels do preview e transições de áudio com mais precisão se os testes indicarem dúvida; não aumentar tolerâncias para forçar aprovação.
10. Revisar o diff final e atualizar este registro com o que efetivamente passou. Somente então apresentar a correção como concluída. Commit/push/publicação continuam dependendo de autorização compatível.

## Arquivos para revisão

Alterados nesta investigação: `src/renderer/media-runtime.ts`, `src/renderer/rasterizer.ts`, `src/ui/app-controller.ts`, `src/ui/editing/advanced-controller.ts`, `src/ui/main.ts`, `src/ui/stage/stage-controller.ts`.

Novos nesta investigação: `tools/test-preview-cuts.cjs` e este documento.

Use `git diff` para isolar as correções fora do staging; `git diff --cached` contém principalmente a migração anterior. Não adicionar todos os arquivos indiscriminadamente.
