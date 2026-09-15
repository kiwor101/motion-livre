# Handoff — componentização e Beat Sync

As regras permanentes, a visão arquitetural e os critérios de conclusão estão em `docs/MIGRACAO_VUE.md`.

## Meta

Transformar gradualmente o front-end do Motion Livre em microcomponentes Vue fáceis de localizar, estilizar e substituir, preservando o funcionamento do editor durante a migração. O CSS específico deve ficar junto do componente com `<style scoped>`; folhas globais devem permanecer apenas para tokens, fontes, reset, layout superior e compatibilidade ainda não migrada.

## Progresso estimado

**76%** da componentização planejada.

Essa porcentagem considera estrutura Vue, controles reutilizáveis, CSS encapsulado e retirada gradual da criação imperativa de DOM. Ela não significa que 24% das linhas do projeto ainda precisem ser alteradas.

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

## Validação executada

- `pnpm build:core`
- `pnpm build:ui`
- `pnpm check:ui`
- `node tools/test-beat-detection.cjs`
- `node tools/test-project-commands.cjs`
- `pnpm exec electron tools/test-ui-components.cjs`
- `pnpm exec electron tools/test-editing-commands.cjs`
- `git diff --check`

Na continuação de 2026-09-14 também passaram `pnpm check:ui`, `pnpm build:ui` e `pnpm exec electron tools/test-ui-components.cjs` após a migração das ações reutilizáveis.

Na revisão local da timeline passaram `pnpm check:ui`, `node --check tools/test-timeline-layout.cjs` e `git diff --check`. Build e execução visual foram deliberadamente adiados a pedido do mantenedor.

Os testes específicos passaram. `tools/test-studio.cjs` não pôde ser iniciado porque o Playwright não está disponível no caminho padrão deste ambiente. Uma execução de `tools/test-renderer-contracts.cjs` alcançou o aplicativo, mas parou numa verificação preexistente de playback/render range que não pertence às áreas alteradas.

## Onde parou

A auditoria retroativa chegou aos componentes-base. Timeline, overlays e campos reutilizáveis recentes seguem o padrão de CSS scoped. A barra de ferramentas agora pertence à árvore Vue da barra superior, sem movimentação ou substituição de filhos pelo `studio-controller.ts`; a seleção de painel e os ícones são definidos pelos componentes. Seu CSS global e a conferência visual responsiva ainda estão pendentes. Preview e vários painéis antigos também dependem de estilos globais.

## Próximos passos

1. Migrar o CSS de `ToolSidebar`/`ToolButton` para estilos scoped e conferir a barra em larguras menores.
2. Continuar a revisão dos painéis Vue em `src/ui/components/library`, migrando campos repetidos para os componentes-base.
3. Migrar o conteúdo dinâmico ainda criado por `innerHTML` ou `document.createElement` nos painéis de camadas, efeitos e menus de contexto.
4. Migrar lane, waveform e limites de renderização restantes da timeline para componentes focados.
5. Substituir gradualmente handlers por IDs por props, emits e estado reativo.
6. Unificar as aplicações Vue independentes sob uma única raiz quando os contratos legados restantes permitirem.

## Cuidados

- Preservar IDs e atributos `data-*` enquanto controllers legados ainda dependem deles.
- Migrar estrutura, comportamento e CSS em etapas testáveis, não simultaneamente numa reescrita ampla.
- Testar com músicas reais antes de considerar a detecção de BPM concluída, especialmente faixas com introdução silenciosa, andamento variável ou ataques pouco definidos.
