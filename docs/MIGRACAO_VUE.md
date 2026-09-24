# Migração Vue do Motion Livre

## Objetivo

Transformar gradualmente a interface do Motion Livre em componentes Vue pequenos, previsíveis e fáceis de alterar individualmente. Cada setor visual deve ter estrutura, comportamento de interface e CSS próximos entre si, reduzindo dependências de folhas globais e controladores imperativos.

A migração deve preservar o funcionamento do editor durante todas as etapas. Não é uma reescrita completa: cada pacote precisa ser pequeno, compatível com o estado atual e verificável isoladamente.

## Visão da arquitetura desejada

- Uma árvore Vue principal para a interface, evitando aplicações Vue independentes montadas repetidamente.
- Componentes de tela compostos por componentes menores e focados.
- Componentes-base reutilizáveis para botões, campos, modais, menus e outros padrões recorrentes.
- Dados enviados por props e alterações comunicadas por emits ou por estado reativo.
- Controladores dedicados às regras de edição e integração com o runtime, sem montar HTML visual.
- CSS específico dentro do próprio arquivo `.vue`, usando `<style scoped>`.
- Folhas globais reservadas para tokens, fontes, reset, layout estrutural superior e compatibilidade ainda não migrada.
- Nenhum dado externo renderizado com `innerHTML`.
- Testes de regressão para contratos legados, comportamento e geometria sensível.

## Parâmetros obrigatórios

### Responsabilidade dos componentes

- Um componente deve representar um setor visual ou uma responsabilidade clara.
- Componentes que concentrem estrutura, cálculos, montagem, eventos e várias áreas independentes devem ser divididos.
- Funções extensas devem ser quebradas em funções menores nomeadas pelo resultado que produzem.
- Componentes agregadores podem organizar filhos, mas não devem repetir a implementação deles.
- Não criar abstrações genéricas sem pelo menos um uso real e uma responsabilidade identificável.

### CSS

- CSS pertencente a um componente deve ficar em `<style scoped>` no próprio `.vue`.
- Ao migrar um estilo, remover a regra equivalente das folhas globais no mesmo pacote.
- Não manter duas fontes concorrentes para altura, posição, cor ou espaçamento.
- Evitar `!important`; mantê-lo apenas enquanto existir uma limitação legada comprovada.
- Valores geométricos compartilhados devem vir de uma única variável ou contrato, como `--timeline-header-width`.
- Usar `:global(...)` somente para estado externo inevitável, como uma classe aplicada ao `body`.
- Usar `:deep(...)` apenas para filhos inseridos por integrações ainda imperativas, documentando implicitamente essa fronteira no componente.
- Fundos de trilhas e painéis devem ser contínuos; espaçamento deve vir de `gap`, padding ou borda, não de faixas simuladas em gradientes.

### Templates e segurança

- Preferir templates Vue, `v-for`, `v-if` e interpolação de texto.
- Não usar `v-html` ou `innerHTML` com nomes de mídia, dados importados ou qualquer conteúdo externo.
- Preservar IDs e atributos `data-*` usados pelos controladores enquanto o contrato legado existir.
- Botões devem declarar `type="button"` quando não forem submissão de formulário.
- Ícones devem usar `AppIcon` ou o sistema local já estabelecido.

### Eventos e estado

- Novos componentes devem declarar props e emits com tipos.
- Evitar handlers redundantes que sejam imediatamente substituídos por controladores legados.
- Listeners globais devem ser registrados no `onMounted` e removidos no `onBeforeUnmount`.
- Aplicações Vue montadas dinamicamente devem ser desmontadas antes de redesenhar ou remover seus hosts.
- Não duplicar estado do editor dentro do componente sem necessidade.
- A migração não pode quebrar desfazer/refazer, seleção, cortes, áudio, mute, pan, volume, velocidade, fades, salvar ou reabrir projetos.

### Compatibilidade durante a migração

- Migrar um setor por vez e manter uma fronteira explícita com o código legado.
- Não substituir filhos gerenciados pelo Vue por `replaceChildren`, `innerHTML` ou manipulação equivalente.
- Quando um controlador ainda precisar inserir canvas, imagens ou inputs, montar o componente primeiro e limitar a inserção a um host específico.
- Não remover um seletor global antes de confirmar qual regra final da cascata ele representa.
- Não fazer refatorações amplas não relacionadas ao setor atual.

## Critério de conclusão de um setor

Um setor é considerado migrado quando:

1. Sua estrutura visual é declarativa em Vue.
2. Seus dados externos são interpolados com segurança.
3. Seu CSS específico está scoped no componente.
4. As regras globais equivalentes foram removidas.
5. Eventos e ciclos de montagem/desmontagem estão definidos.
6. O controlador restante executa regras de negócio ou integração, não montagem visual genérica.
7. Existe validação para os contratos que podem quebrar.
8. `pnpm check:ui`, verificações de sintaxe relevantes e `git diff --check` passam.

Build dos executáveis e publicação devem ocorrer somente quando o pacote for autorizado para entrega. A compilação da interface e os testes locais podem validar o trabalho sem gerar Setup ou Portable. Commit, push, release e alterações no GitHub permanecem suspensos nesta etapa.

## Estado atual

Progresso estimado: **100% da componentização planejada no código**. A entrega do aplicativo ainda depende da rodada autorizada de executáveis e publicação.

### Concluído ou consolidado

- Componentes-base para botões, ícones, campos, modais, menus e rótulos de campos.
- Barra superior dividida em componentes menores.
- Inspector usando campos-base.
- Overlays divididos em componentes focados.
- Toast, menus, modais, exportação, relatório de compatibilidade e arraste de mídia com CSS scoped.
- Relatório XML e mapa de recursos sem montagem por `innerHTML`.
- Marcadores e Beat Sync em Vue com CSS scoped.
- Régua, agulha, cabeçalhos de trilha e clipes da timeline componentizados.
- Geometria da agulha e da régua consolidada, com alinhamento único de 260 px.
- Fundo das lanes contínuo, sem bandas escuras artificiais.
- CSS de cabeçalhos e clipes removido das folhas globais.
- Clipes com filmstrip, waveform, handles, seleção, tipos de mídia e keyframes encapsulados.
- Montagens Vue dinâmicas da timeline são desmontadas antes de cada renderização.
- Testes adicionados para geometria, contratos DOM e segurança de textos externos.
- Barra de ferramentas com CSS scoped e ícones declarativos via `AppIcon`, sem decoração visual pelo controlador.
- Controles de fim, guias, proporção das guias e tela cheia do preview declarados em Vue, sem `createElement`, `innerHTML` ou movimentação posterior dos componentes.
- Painel de camadas, pilha de efeitos e menu de contexto da timeline renderizados por componentes Vue com dados externos interpolados como texto e CSS scoped.
- Mixer de áudio dividido em lista e canal Vue, preservando gestos de histórico e propriedades de volume, pan, fonte, mute e solo sem montagem por HTML.
- Lista de mídia declarativa em Vue e renderização de caminhos vetoriais por nós SVG reutilizáveis; não restam atribuições a `innerHTML` em `src/ui`.
- Guias de alinhamento e ferramentas auxiliares do preview com CSS scoped, sem regras equivalentes nas folhas globais.
- Estrutura e CSS de stage, viewport, resolução e transporte encapsulados nos componentes responsáveis; as únicas regras globais de `.stage` preservadas pertencem ao renderer de mídia.
- Barra da timeline declarada integralmente por `TimelineToolbar`, com grupos, ações, zoom, encaixe e status estáticos; o controlador apenas consulta os contratos e associa regras de edição.
- Delegação das ações da timeline resolve o botão ancestral, permitindo clicar com segurança nos ícones internos renderizados por Vue.
- Limites de entrada e saída da renderização declarados por `TimelineRenderRange` dentro de `TimelineRuler`; régua, marcadores e limites compartilham uma única montagem Vue.
- Cada faixa agora é uma árvore `TimelineTrack` única, contendo cabeçalho, lane e clipes; foram eliminadas a criação manual de linhas/lanes e as aplicações Vue independentes por cabeçalho e clipe.
- Geometria, waveform e filmstrip continuam acoplados após a montagem por serem integrações de canvas e mídia, sem assumir a estrutura visual da faixa.
- Controles do cabeçalho da faixa usam `AppIcon` diretamente; foi removido o observador que reescrevia botões depois de cada renderização.
- Cabeçalho dos clipes de áudio possui margem inicial e fundo opaco sobre a waveform; sua âncora permanece estável quando uma borda cortada é restaurada.
- Tooltip global implementado como overlay Vue com `Teleport`, incluindo posicionamento, acessibilidade, foco, ponteiro e suporte à tela cheia sem criação ou movimentação manual pelo controller.
- Painel de Beat Sync incorporado à árvore de overlays, removendo sua aplicação Vue e host criados isoladamente.
- Renomeação de faixa renderiza o campo pelo próprio `TimelineTrackHeader`; o controller não substitui mais o título por um input imperativo.
- Campos de desenho e composição reutilizam os componentes-base de cor, range, número e select, preservando IDs e valores iniciais usados pelos controladores.
- Campos de corte, animação e texto também reutilizam os componentes-base; a seleção de camada pai recebe opções e valor por evento tipado e é renderizada pelo Vue.
- As seis áreas estáticas da interface compartilham uma única aplicação `AppRoot`, com `Teleport` para preservar seus hosts e contratos de layout.
- Marquee, guia de movimento e indicador de destino da timeline são overlays Vue com estilos scoped; os controladores emitem somente sua geometria e texto.
- Caminhos de movimento e máscaras selecionadas usam SVG declarativo em `StageVectorOverlays`; os controladores enviam pontos calculados.
- Faixas e régua da timeline usam montagens síncronas de nós Vue ligadas ao contexto da única aplicação principal; cada host é desmontado antes do redesenho.
- Camadas, paths Bézier e handles do stage possuem estrutura Vue. O runtime continua anexando mídias, calculando estilo e executando gestos nos hosts declarativos.
- Formas, presets, separadores, gráfico de easing, imports e estilos das camadas foram retirados das folhas globais e colocados nos componentes responsáveis.
- A opção de proporção personalizada é declarada em `CompositionAspectSelect`; o controlador envia apenas o valor por evento.

### Auditoria já realizada

- Timeline recente: dentro do padrão estabelecido.
- Overlays e modais: revisados e divididos.
- Componentes-base: revisados; seis campos compartilham `BaseField`.
- `TimelineMarker` e `BeatSyncPanel`: corrigidos retroativamente para CSS scoped.

### Fronteiras mantidas no runtime

- Waveform usa canvas no host de clipe; o callback de desenho ignora clipes já desconectados.
- Filmstrip usa imagens no host `.filmstrip`; tiles desconectados são descartados antes da captura e os slots fora da faixa são removidos.
- Captura de quadros, probes de mídia e filtros SVG usam nós do navegador como parte do processamento de mídia/efeitos.
- Estilos globais restantes de `.path-layer` e `.stage.unified-renderer > .layer` pertencem aos contêineres do renderer, não aos painéis da interface.

## Ponto de atenção principal

`ToolSidebar` é filho de `AppTopBar`; `studio-controller.ts` não move sua raiz nem substitui seus filhos. Seleção, ícones, responsividade e CSS pertencem aos componentes Vue, preservando `data-panel` e `data-material-icon`. Os contratos Electron, o smoke do renderer e uma captura visual local passaram após compilar somente a interface. QA interativo com mídias reais continua necessário para a entrega do aplicativo.

## Depois da componentização

1. Fazer QA interativo com vídeos e áudios reais, incluindo cortes, zoom, waveform, filmstrip, tela cheia, salvar/reabrir e desfazer/refazer.
2. Reduzir gradualmente os handlers por ID em pacotes independentes, preservando os contratos legados enquanto existirem.
3. Quando a entrega for autorizada, executar o fluxo de Setup, Portable, smoke isolado e pré-release da própria branch.

## Validação mínima durante o trabalho local

Executar conforme os arquivos alterados:

```powershell
pnpm check:ui
node --check tools/test-ui-components.cjs
node --check tools/test-timeline-layout.cjs
git diff --check
```

Não declarar validação visual interativa ou build dos executáveis como concluída se elas não foram executadas. As alterações atuais permanecem locais; `pnpm build:ui`, os contratos Electron e o smoke do renderer passaram sem gerar Setup ou Portable.

## Documento de acompanhamento

O histórico resumido e a porcentagem também estão em `docs/HANDOFF_COMPONENTIZACAO.md`. Ao avançar a migração, atualizar os dois documentos no mesmo pacote para que progresso, pendências e ordem de retomada não divirjam.
