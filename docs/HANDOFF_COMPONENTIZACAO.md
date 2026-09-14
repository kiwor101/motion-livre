# Handoff — componentização e Beat Sync

## Meta

Transformar gradualmente o front-end do Motion Livre em microcomponentes Vue fáceis de localizar, estilizar e substituir, preservando o funcionamento do editor durante a migração. O CSS específico deve ficar junto do componente com `<style scoped>`; folhas globais devem permanecer apenas para tokens, fontes, reset, layout superior e compatibilidade ainda não migrada.

## Progresso estimado

**44%** da componentização planejada.

Essa porcentagem considera estrutura Vue, controles reutilizáveis, CSS encapsulado e retirada gradual da criação imperativa de DOM. Ela não significa que 44% das linhas do projeto foram alteradas.

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

## Validação executada

- `pnpm build:core`
- `pnpm build:ui`
- `pnpm check:ui`
- `node tools/test-beat-detection.cjs`
- `node tools/test-project-commands.cjs`
- `pnpm exec electron tools/test-ui-components.cjs`
- `pnpm exec electron tools/test-editing-commands.cjs`
- `git diff --check`

Os testes específicos passaram. `tools/test-studio.cjs` não pôde ser iniciado porque o Playwright não está disponível no caminho padrão deste ambiente. Uma execução de `tools/test-renderer-contracts.cjs` alcançou o aplicativo, mas parou numa verificação preexistente de playback/render range que não pertence às áreas alteradas.

## Onde parou

Os campos do inspector já usam CSS scoped e o bundle CSS do Vue está carregado. Ainda existem regras equivalentes ou sobrepostas em `styles.css`, `advanced.css` e `studio.css`. Elas devem ser removidas gradualmente somente após comparar o estilo computado, para evitar regressão causada pela cascata histórica.

## Próximos passos

1. Migrar e deduplicar o CSS do inspector nas folhas globais.
2. Revisar os painéis Vue já existentes em `src/ui/components/library` e quebrar blocos repetidos.
3. Migrar overlays e menus criados por `innerHTML` ou `document.createElement`.
4. Criar componentes Vue para track, cabeçalho de track, clip, handles, waveform e régua.
5. Substituir gradualmente handlers por IDs por props, emits e estado reativo.
6. Unificar as aplicações Vue independentes sob uma única raiz quando os contratos legados restantes permitirem.

## Cuidados

- Preservar IDs e atributos `data-*` enquanto controllers legados ainda dependem deles.
- Migrar estrutura, comportamento e CSS em etapas testáveis, não simultaneamente numa reescrita ampla.
- Testar com músicas reais antes de considerar a detecção de BPM concluída, especialmente faixas com introdução silenciosa, andamento variável ou ataques pouco definidos.
