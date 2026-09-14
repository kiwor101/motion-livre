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

Build e testes executáveis visuais devem ser feitos quando o pacote for autorizado para entrega. Enquanto houver orientação para trabalhar somente localmente, não executar build, commit, push, release ou alterações no GitHub.

## Estado atual

Progresso estimado: **76% da componentização planejada**.

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

### Auditoria já realizada

- Timeline recente: dentro do padrão estabelecido.
- Overlays e modais: revisados e divididos.
- Componentes-base: revisados; seis campos compartilham `BaseField`.
- `TimelineMarker` e `BeatSyncPanel`: corrigidos retroativamente para CSS scoped.

### Auditoria ainda pendente

- `ToolSidebar` e `ToolButton`.
- Barra superior e ações antigas.
- Preview e componentes de stage.
- Painéis da biblioteca.
- Painel de camadas criado por `timeline-tracks-controller.ts`.
- Pilha de efeitos criada por `professional-effects-controller.ts`.
- Menu de contexto da timeline.
- Regras globais relacionadas a esses setores.

## Ponto de atenção principal

`studio-controller.ts` move a raiz de `ToolSidebar` para a barra superior e substitui filhos que deveriam continuar sob controle do Vue. Esse setor não deve receber apenas uma transferência mecânica de CSS. A próxima pessoa deve migrar comportamento e estilo juntos, preservando seleção de painel, ícones, responsividade e os contratos `data-panel`.

## Ordem recomendada para retomada

1. Terminar a auditoria dos componentes antigos antes de criar novos setores.
2. Corrigir `ToolSidebar`/`ToolButton` e remover a substituição imperativa de filhos.
3. Revisar preview e stage, identificando CSS global duplicado.
4. Revisar os painéis da biblioteca e consolidar padrões repetidos.
5. Migrar o painel de camadas e a pilha de efeitos ainda montados com `innerHTML`.
6. Migrar lane, waveform e limites de renderização restantes da timeline.
7. Reduzir handlers baseados em IDs em favor de props, emits e estado reativo.
8. Unificar aplicações Vue independentes sob uma única raiz quando os contratos restantes permitirem.

## Validação mínima durante o trabalho local

Executar conforme os arquivos alterados:

```powershell
pnpm check:ui
node --check tools/test-ui-components.cjs
node --check tools/test-timeline-layout.cjs
git diff --check
```

Não declarar validação visual ou build como concluída se ela não foi executada. As alterações atuais permanecem locais e ainda precisam de uma futura rodada autorizada de build e teste visual antes de qualquer entrega.

## Documento de acompanhamento

O histórico resumido e a porcentagem também estão em `docs/HANDOFF_COMPONENTIZACAO.md`. Ao avançar a migração, atualizar os dois documentos no mesmo pacote para que progresso, pendências e ordem de retomada não divirjam.
