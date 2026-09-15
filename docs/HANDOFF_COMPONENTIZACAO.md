# Handoff — componentização e Beat Sync

As regras permanentes, a visão arquitetural e os critérios de conclusão estão em `docs/MIGRACAO_VUE.md`.

## Meta

Transformar gradualmente o front-end do Motion Livre em microcomponentes Vue fáceis de localizar, estilizar e substituir, preservando o funcionamento do editor durante a migração. O CSS específico deve ficar junto do componente com `<style scoped>`; folhas globais devem permanecer apenas para tokens, fontes, reset, layout superior e compatibilidade ainda não migrada.

## Progresso estimado

**100%** da componentização planejada no código; entrega de executáveis e QA com mídias reais ainda pendentes.

Essa porcentagem considera a estrutura Vue planejada, controles reutilizáveis, CSS encapsulado e retirada da montagem visual imperativa. Não inclui processamento de mídia, QA de entrega ou modernização futura dos handlers por ID.

## Registro da sessão local de 2026-09-15

### Entregue nesta sessão

- Ferramentas, preview, stage, transporte, resolução e guias passaram a estruturas Vue estáticas com CSS scoped.
- Lista de mídia, mixer de áudio, camadas, pilha de efeitos e menu de contexto passaram a renderização declarativa e segura para textos externos.
- Foram removidas todas as atribuições a `innerHTML` em `src/ui`; o caminho SVG reutiliza nós tipados.
- Timeline passou a usar `TimelineToolbar`, `TimelineRuler`, `TimelineRenderRange` e `TimelineTrack`, reduzindo montagens independentes e removendo a criação manual de toolbar, limites, linhas e lanes.
- Cabeçalhos de faixa usam `AppIcon` e renomeiam dentro do componente; foram removidos o observador de decoração e a troca manual por input.
- `StudioTooltip` usa `Teleport`, e `BeatSyncPanel` pertence a `AppOverlays`; ambos deixaram de criar hosts isolados.
- O cabeçalho de áudio ganhou margem e fundo opaco sobre a waveform, mantendo nome e ícone ancorados ao restaurar a borda esquerda cortada.
- Contratos foram adicionados ou atualizados em `tools/test-ui-components.cjs`, `tools/test-renderer-contracts.cjs` e `tools/test-timeline-extension-visuals.cjs`.
- O progresso documentado foi atualizado de 76% para 98%.

### Trabalho de entrega e evolução posterior

1. Fazer QA interativo com mídias reais e projetos salvos antes da entrega do aplicativo.
2. Executar Setup, Portable, smoke isolado e pré-release quando a entrega for autorizada.
3. Reduzir handlers por ID em pacotes independentes; os nós de canvas/imagem e filtros permanecem no runtime de mídia.

### Estado operacional

- Alterações permanecem somente no clone e na branch atuais.
- O trabalho local e os arquivos já staged que existiam antes desta continuação foram preservados; esta sessão não reorganizou o índice do Git.
- Não houve fetch, pull, merge, commit, push, PR, release ou qualquer outra operação no GitHub.
- Não houve build de Setup ou Portable nesta sessão, conforme pedido do mantenedor. A interface foi compilada localmente na continuação posterior.
- Passaram durante esta sessão: `pnpm check:ui`, verificações `node --check` dos arquivos e testes alterados e `git diff --check`.
- Os testes Electron pertinentes passaram na continuação posterior; a conferência visual interativa continua pendente.

## Concluído

- Criados componentes-base para botão, ícone, range, cor, texto, número, checkbox e select.
- Barra superior separada em marca, identificação do projeto, histórico e ações.
- Barra de ferramentas separada em `ToolSidebar` e `ToolButton`.
- Preview separado em toolbar, proporção, presets de resolução, formulário personalizado, viewport e transporte.
- Painel de efeitos separado em presets, controles e ações.
- Inspector migrado para os campos-base reutilizáveis.
- CSS produzido pelos componentes Vue passou a ser carregado por `index.html`.
- Beat Sync passou a detectar ataques recorrentes em vez de correlacionar amplitude bruta e usar somente o maior pico.
- Cálculo de Beat Sync considera corte da fonte, velocidade e reprodução reversa.
- Magnetismo centralizado: marcadores usam raio de 18 px; bordas e outros pontos usam 10 px.
- Agulha da timeline encaixa em marcadores manuais e de Beat Sync; `Alt` desativa temporariamente o encaixe.
- Grupos em movimento não encaixam nas próprias bordas.
- Marcadores e painel de Beat Sync migrados para componentes Vue.
- Ações largas dos painéis de biblioteca e inspector unificadas em `BaseButton`, preservando IDs e classes usados pelos controladores legados.
- `AppOverlays` reduzido a um agregador; arraste de mídia, toast, menus, exportação, recursos e relatório de compatibilidade agora ficam em componentes focados.
- Aparência de botões largos e da variante destrutiva movida para o CSS scoped de `BaseButton`; espaçamento das ações do inspector ficou no próprio `InspectorPanel`, sem as regras equivalentes nas folhas globais.
- Toast isolado com todo o seu CSS scoped em `ToastMessage`, sem regras residuais em `styles.css` ou `studio.css`.
- Menus de projeto e exportação compartilham `PopupMenu`; estrutura e aparência comum ficaram no componente-base, e o posicionamento específico da exportação ficou no seu próprio componente.
- Modais compartilham `BaseModal`, incluindo backdrop, cartão, fechamento e empilhamento; grades de recursos/exportação e progresso mantêm CSS scoped nos componentes responsáveis.
- Overlay de importação por arraste possui CSS scoped em `MediaDropOverlay`; somente o estado externo do `body` é referenciado com `:global`.
- Mapa de recursos renderizado declarativamente por `FeatureModal`, removendo dados de interface e montagem por `innerHTML` do controlador de edição.
- Relatório de compatibilidade XML recebe dados por evento tipado e renderiza listas no Vue, sem `innerHTML` nem escape manual no controlador.
- Ticks e canto fixo da régua da timeline renderizados por `TimelineRuler`, preservando scrub, marcadores e limites nos controladores existentes.
- Agulha isolada em `TimelinePlayhead` com uma única geometria scoped; removidas definições globais conflitantes e o antigo handle duplicado. Lanes usam fundo contínuo, sem bandas escuras de 3 px.
- Régua, canto e início das trilhas compartilham a mesma largura de cabeçalho; o CSS da régua ficou no componente Vue e o teste de layout protege o alinhamento do segundo zero.
- Cabeçalho de trilha migrado para `TimelineTrackHeader`, removendo do renderer o `innerHTML` e os handlers manuais de seleção, visibilidade, bloqueio, mute e multisseleção.
- Estrutura, título, renomeação e espaçamento do cabeçalho de trilha possuem CSS scoped em `TimelineTrackHeader`; todas as regras globais `.track-name` foram removidas. A montagem do cabeçalho também saiu do fluxo principal do renderer para uma função focada.
- Estrutura do clipe, handles, rótulo, filmstrip e pontos de keyframe migrados para `TimelineClip`; a montagem ficou em função própria, preservando waveform e previews imperativos enquanto seus subsistemas ainda não foram migrados. Nomes agora são interpolados pelo Vue, sem `innerHTML` ou escape manual.
- Aparência por tipo de mídia, seleção, arraste, handles, filmstrip, waveform e keyframes consolidada no CSS scoped de `TimelineClip`; removidas das folhas globais mais de 70 regras sobrepostas do clipe.
- Auditoria retroativa iniciada pelos componentes antigos: `TimelineMarker` e `BeatSyncPanel` agora possuem CSS scoped completo, sem seletores equivalentes nas folhas globais.
- Rótulo e espaçamento comuns de range, número, texto, select, cor e checkbox centralizados em `BaseField`, removendo seis cópias locais do mesmo CSS sem alterar o contrato DOM dos campos.
- `ToolSidebar` e `ToolButton` concluídos com estilos scoped, responsividade local e `AppIcon`; removidas as regras `.tools`/`.tool` das folhas globais.
- Botão de fim, controles de guias, seletor de proporção, tela cheia e marcação das guias do preview passaram a componentes Vue; o controlador não cria nem reposiciona mais esses elementos.
- Painel de camadas e pilha de efeitos recebem dados por eventos e renderizam listas declarativamente, preservando seleção, renomeação, reordenação e ações de efeito sem `innerHTML`.
- Menu de contexto da timeline passou a `TimelineContextMenu`, com fechamento, posicionamento e estilos scoped; o controlador conserva apenas a escolha das ações de edição.
- Mixer de áudio dividido em `AudioMixer` e `AudioChannel`, com nomes interpolados como texto e controles reativos; o controlador mantém comandos, histórico e atualização do editor.
- Lista de mídia migrada para `MediaList`, preservando título e inclusão de camada sem criação manual de elementos.
- O último `innerHTML` de `src/ui`, usado no caminho Bézier, foi substituído pela criação e atualização tipada de nós SVG reutilizáveis.
- `AlignmentGuides` e `PreviewTools` agora carregam seus estilos scoped; as regras globais correspondentes foram removidas.
- Stage, viewport, controles de resolução e transporte agora concentram seu CSS estrutural nos próprios componentes; seletores globais remanescentes de `.stage` são contratos do renderer de mídia.
- `TimelineToolbar` passou a declarar os seis grupos de ferramentas, botões de ação, marcadores, encaixe, zoom e status. `timeline-toolbar.ts` apenas valida e entrega referências tipadas aos controladores.
- A delegação de cliques da timeline usa o botão ancestral com `closest`, preservando ações quando o clique acontece no `AppIcon` interno.
- `TimelineRenderRange` declara os handles de entrada e saída com CSS scoped. Ele foi incorporado a `TimelineRuler` com os marcadores, removendo a montagem Vue secundária e os elementos criados manualmente pelo renderer.
- `TimelineTrack` passou a declarar linha, cabeçalho, lane e clipes como uma árvore única. O renderer deixou de criar esses contêineres e de abrir aplicações Vue separadas para cada cabeçalho e clipe.
- O renderer prepara modelos de visualização, aplica geometria e conecta filmstrip/waveform somente depois da montagem da faixa; os contratos de mídia permanecem isolados.
- Botões de visibilidade, bloqueio, áudio e multisseleção do cabeçalho usam `AppIcon`; o `MutationObserver` que os decorava depois da montagem foi removido.
- O rótulo de áudio reserva margem antes do ícone e cobre a waveform com fundo opaco. O teste de extensão protege a posição do nome, ícone e largura ao restaurar a borda esquerda cortada.
- `StudioTooltip` usa `Teleport` e concentra ciclo de eventos, acessibilidade, posicionamento e troca de destino em tela cheia; o controller de apresentação deixou de criar e mover esse nó.
- `BeatSyncPanel` passou a fazer parte de `AppOverlays`, sem host nem aplicação Vue criados pelo controller.
- O modo de renomeação pertence a `TimelineTrackHeader`, que alterna título e input declarativamente e emite o novo nome; o controller de faixas mantém apenas reordenação e comandos de projeto.
- Desenho e composição passaram a reutilizar `ColorField`, `RangeField`, `NumberField` e `SelectField`; os campos mantêm IDs e valores iniciais do contrato legado.
- Corte, animação e texto reutilizam os campos-base; a seleção de camada pai recebe dados do controlador e renderiza as opções no Vue.
- `AppRoot` reúne as seis áreas estáticas em uma única aplicação Vue e usa `Teleport` para preservar os hosts originais.
- Marquee de seleção, guia de arraste e indicador de destino da timeline agora são componentes Vue; os controladores emitem dados transitórios por eventos.
- Caminhos de movimento e máscaras usam `StageVectorOverlays`, com nós SVG e CSS scoped; os controladores emitem os pontos.

## Validação histórica anterior a esta sessão

- `pnpm build:core`
- `pnpm build:ui`
- `pnpm check:ui`
- `node tools/test-beat-detection.cjs`
- `node tools/test-project-commands.cjs`
- `pnpm exec electron tools/test-ui-components.cjs`
- `pnpm exec electron tools/test-editing-commands.cjs`
- `git diff --check`

Na continuação de 2026-09-14 também passaram `pnpm check:ui`, `pnpm build:ui` e `pnpm exec electron tools/test-ui-components.cjs` após a migração das ações reutilizáveis.

Na revisão local atual da timeline passaram `pnpm check:ui`, verificações `node --check` dos arquivos tocados e `git diff --check`. Build e execução visual foram deliberadamente adiados a pedido do mantenedor.

As execuções Electron listadas acima pertencem a etapas anteriores; nesta continuação, os contratos pertinentes foram executados após `pnpm build:ui`. O teste Playwright antigo de estúdio foi removido anteriormente porque dependia das APIs globais eliminadas; seus contratos atuais são cobertos pelas suítes Electron mantidas no projeto.

## Onde parou

A componentização planejada no código foi concluída: biblioteca, overlays, timeline e stage têm estrutura Vue, e existe uma única aplicação principal. Faixas e régua usam nós Vue síncronos com o mesmo contexto da aplicação; camadas, paths e handles do stage também renderizam nós Vue. Waveform, filmstrip, captura e filtros continuam imperativos por serem integrações de mídia. Não restam atribuições a `innerHTML` em `src/ui`. A interface foi compilada, testada e inspecionada em uma captura local, sem gerar executáveis.

## Próximos passos

1. Fazer QA interativo com mídias reais e projetos salvos antes da entrega do aplicativo.
2. Quando autorizado, compilar e publicar Setup e Portable conforme `CONTRIBUTING.md`.
3. Tratar a redução de handlers por ID como evolução posterior em pacotes separados.

Nesta continuação passaram `pnpm check:ui`, `pnpm build:ui`, `git diff --check`, os testes Electron de componentes, edição, gestos, navegação, contratos do renderer, extensão visual e `tools/smoke-renderer.cjs`. Uma captura local mostrou biblioteca, stage, inspector e duas faixas após a atualização do editor. Nenhum Setup ou Portable foi gerado, e não houve commit/push.

## Cuidados

- Preservar IDs e atributos `data-*` enquanto controllers legados ainda dependem deles.
- Migrar estrutura, comportamento e CSS em etapas testáveis, não simultaneamente numa reescrita ampla.
- Testar com músicas reais antes de considerar a detecção de BPM concluída, especialmente faixas com introdução silenciosa, andamento variável ou ataques pouco definidos.
