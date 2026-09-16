# Plano de refatoração TypeScript

Registrado em: 16/09/2026
Branch de trabalho: `dev/emanueltk7`

## Objetivo

Refatorar gradualmente o código TypeScript para que cada arquivo, módulo, classe e função tenha uma responsabilidade clara. A organização deve favorecer leitura manual, manutenção, testes e trabalho simultâneo em branches diferentes.

A quantidade de arquivos e funções não deve ser artificialmente reduzida. Quando duas responsabilidades puderem evoluir, falhar ou ser testadas separadamente, elas devem ser separadas por uma interface pequena e explícita.

A migração anterior do núcleo e da interface de JavaScript para TypeScript já separou responsabilidades e removeu caminhos legados em várias áreas. Por isso, a presença de um arquivo antigo, extenso ou citado neste plano não significa automaticamente que ele precise ser dividido novamente. Cada caso deve ser avaliado pelo comportamento e pelo acoplamento atuais.

## Regras obrigatórias

Cada pacote desta refatoração deve:

- verificar primeiro se a migração para TypeScript já deixou o módulo coeso e com responsabilidades bem definidas;
- localizar arquivos e funções extensos que misturam regras de negócio, acesso a estado, DOM, Electron, mídia, serialização ou apresentação;
- dividir responsabilidades em módulos coesos, com nomes que revelem o papel de cada parte;
- reduzir acoplamento, dependências implícitas, estado global e conhecimento desnecessário entre módulos;
- verificar se o comportamento existente pode ser simplificado ou tornado mais seguro durante a extração;
- remover gambiarras, remendos, duplicações e caminhos temporários quando a intenção original estiver comprovada;
- preservar as regras de edição, histórico, áudio, tempo, mídia, projetos e exportação já documentadas;
- melhorar indentação, espaçamento e quebras de linha dos trechos tocados;
- manter imports, tipos e contratos explícitos;
- adicionar comentários curtos e diretos somente onde explicarem uma decisão, uma restrição ou um comportamento que o código sozinho não deixa evidente;
- validar o comportamento antes e depois da mudança com os testes pertinentes.

Não serão usados limites rígidos de linhas como substituto de análise. Tamanho elevado, muitos parâmetros, condicionais profundas, efeitos colaterais misturados e dependências numerosas são sinais de que a unidade precisa ser revista.

Quando a análise não encontrar responsabilidade misturada, acoplamento indevido, duplicação ou remendo, não deve haver extração apenas para aumentar a quantidade de arquivos. Nesse caso, a melhoria pode se limitar a indentação, quebras de linha, nomes locais e comentários simples que realmente facilitem a leitura. Se o código já estiver claro, ele deve permanecer como está.

## Organização desejada

- Funções devem executar uma tarefa reconhecível e manter o mesmo nível de abstração.
- Orquestradores devem coordenar operações; regras de domínio devem permanecer em funções puras ou serviços próprios.
- Leitura, validação, transformação e gravação de dados devem ser separadas quando tiverem motivos diferentes para mudar.
- A interface deve depender de contratos tipados, sem conhecer detalhes internos do núcleo ou do runtime.
- Dependências devem ser recebidas explicitamente. Evitar importações circulares, singletons ocultos e mutação distante.
- Tipos compartilhados devem ficar próximos ao domínio que representam, sem arquivos genéricos usados como depósito.
- Extrações pequenas e coesas são preferíveis a novos módulos genéricos que apenas deslocam a complexidade.

## Legibilidade e formatação

O projeto ainda não possui uma configuração comum de ESLint, Prettier ou `.editorconfig`. A primeira etapa deve definir uma convenção mínima compatível com o estilo atual antes de aplicar uma formatação ampla.

Até essa convenção ser validada:

- usar indentação consistente e quebras de linha que mantenham condições, chamadas e objetos fáceis de percorrer;
- evitar linhas que escondam múltiplas operações ou efeitos colaterais;
- ordenar e agrupar imports de forma previsível;
- formatar apenas o módulo em refatoração e seus arquivos diretamente relacionados;
- não misturar uma reformatação geral do repositório com mudança de comportamento.

A formatação por módulo reduz diffs extensos e conflitos com o trabalho feito em outras branches. Quando uma padronização global for aprovada, ela deve ser isolada em um pacote próprio.

## Comentários no código

Comentários devem explicar o motivo, o contrato ou uma limitação relevante. Não devem repetir literalmente o que a linha seguinte já diz.

Exemplos adequados:

```ts
// Mantém o tempo de origem para que o undo restaure o mesmo quadro.
// O exportador exige segmentos ordenados antes de consolidar intervalos.
```

Comentários desatualizados devem ser corrigidos ou removidos no mesmo pacote que alterar o comportamento descrito.

## Método por pacote

1. Escolher um domínio e registrar o comportamento que precisa ser preservado.
2. Conferir o que já foi resolvido durante a migração para TypeScript e identificar apenas responsabilidades, dependências, efeitos colaterais, duplicações e remendos que ainda existam.
3. Definir os módulos e contratos de destino antes de mover código.
4. Fazer extrações pequenas, mantendo o aplicativo funcional durante a transição.
5. Melhorar nomes, fluxo, tipos, tratamento de falhas e comentários no trecho tocado.
6. Executar checagem TypeScript e os testes específicos do domínio.
7. Revisar o diff para retirar mudanças acidentais e confirmar que a divisão reduziu o acoplamento.
8. Atualizar este plano com o pacote concluído e o próximo ponto de retomada.

Cada pacote deve permanecer pequeno o suficiente para revisão e integração sem bloquear o trabalho da outra branch. Arquivos compartilhados de bootstrap e contratos centrais exigem atenção especial porque geram mais conflitos.

## Primeiros candidatos observados

Esta lista é um ponto de partida, não uma autorização para dividir arquivos apenas pelo tamanho:

1. `src/core/project-commands.ts` — 370 linhas; revisar a separação entre comandos de composição, camadas, efeitos, marcadores, vetores e agrupamento.
2. `src/ui/compat/alight-controller.ts` — 367 linhas; revisar a separação entre codec XML, validação, conversão do modelo e integração com a interface.
3. `src/core/layer-commands.ts` — 194 linhas; verificar sobreposição com comandos de projeto e limites do domínio de camadas.
4. `src/core/project-model.ts` — 183 linhas; separar tipos, criação, normalização e validação se essas responsabilidades estiverem misturadas.
5. `src/renderer/media-runtime.ts` — 178 linhas; revisar ciclo de vida, carregamento, reprodução e tratamento de falhas.
6. `src/ui/main.ts` e controladores de UI — revisar se o bootstrap apenas compõe dependências ou ainda concentra regras de comportamento.

## Critérios de conclusão

A refatoração geral estará concluída quando:

- não houver arquivos ou funções extensos concentrando responsabilidades independentes sem justificativa documentada;
- regras de domínio, orquestração e detalhes de infraestrutura estiverem separadas por contratos tipados;
- não restarem gambiarras ou caminhos temporários conhecidos sem uma pendência explícita;
- o código tocado seguir uma convenção consistente de indentação e quebras de linha;
- comentários relevantes forem curtos, corretos e voltados ao motivo das decisões;
- as validações específicas e as suítes afetadas passarem;
- a arquitetura e os handoffs indicarem claramente o que foi concluído e o que ainda falta.

## Estado inicial

Progresso estrutural estimado: **100%**. A validação executável permanece pendente.

### Etapa 1 — comandos temporais da timeline

Concluída em 16/09/2026:

- marcadores manuais e de beat, intervalo de renderização, extensão da duração, geração de beats e remoção de espaço vazio foram extraídos de `project-commands.ts` para `timeline-commands.ts`;
- `project-commands.ts` continua exportando a mesma API, evitando mudanças nos consumidores durante esta etapa;
- validações repetidas e acesso aos dois tipos de marcador foram centralizados dentro do novo módulo;
- a lógica extraída recebeu indentação e quebras de linha consistentes e um comentário curto sobre a preservação da fase dos beats;
- `project-commands.ts` passou de 370 para 296 linhas;
- a checagem TypeScript do núcleo passou com `tsc -p tsconfig.core.json --noEmit`.

### Etapa 2 — importação e validação externa

Concluída em 16/09/2026:

- a aplicação atômica de projetos importados foi extraída para `project-import-commands.ts`;
- a validação de efeitos externos, propriedades, keyframes e atributos foi isolada em `external-effect-validation.ts`;
- a validação das camadas e a normalização dos marcadores foram divididas em funções com responsabilidades explícitas;
- o estado continua sendo substituído somente depois que composição, camadas, parenting, efeitos, marcadores e metadados foram validados;
- `project-commands.ts` preserva a exportação existente de `applyImportedProject` e do tipo `ImportedProject`;
- `project-commands.ts` passou de 296 para 244 linhas;
- a checagem TypeScript do núcleo passou com `tsc -p tsconfig.core.json --noEmit`.

### Etapa 3 — propriedades e keyframes de camada

Concluída em 16/09/2026:

- a atualização validada de propriedades e a criação de keyframes foram extraídas para `layer-property-commands.ts`;
- propriedades permitidas, canais animáveis, validação numérica, bloqueio de camada e detecção de parenting circular ficaram encapsulados no novo módulo;
- a validação completa continua ocorrendo antes da mutação da camada;
- `project-commands.ts` preserva as exportações existentes e usa internamente o novo comando de propriedades ao aplicar presets;
- `project-commands.ts` passou de 244 para 196 linhas;
- a checagem TypeScript do núcleo passou com `tsc -p tsconfig.core.json --noEmit`.

### Etapa 4 — efeitos, presets e pontos vetoriais

Concluída em 16/09/2026:

- atualização e restauração de efeitos foram extraídas para `layer-effect-commands.ts`;
- validação e aplicação atômica de presets, incluindo a ordem dos efeitos, foram extraídas para `layer-preset-commands.ts`;
- atualização e acréscimo de pontos de máscara e caminho foram extraídos para `layer-vector-commands.ts`;
- a aplicação de preset continua usando uma camada temporária e só substitui a original depois que efeitos, propriedades, ordem e máscara foram validados;
- a fachada `project-commands.ts` preserva todas as exportações usadas pela interface e pelos testes;
- o código restante da fachada recebeu indentação e quebras de linha consistentes, sem linhas acima de 100 caracteres;
- os três novos módulos têm entre 71 e 153 linhas, também sem linhas acima de 100 caracteres;
- a checagem TypeScript do núcleo passou com `tsc -p tsconfig.core.json --noEmit`.

### Etapa 5 — encerramento da fachada de comandos do projeto

Concluída em 16/09/2026:

- controles, grupos e precomposição foram extraídos para `layer-hierarchy-commands.ts`;
- corte e restauração de corte foram extraídos para `layer-trim-commands.ts`, mantendo `trimClip` como algoritmo compartilhado;
- reset e configuração da composição foram extraídos para `project-lifecycle-commands.ts`;
- waveform foi movida para `media-commands.ts`, que já concentra normalização e aplicação de metadados de mídia;
- `project-commands.ts` tornou-se uma fachada estável de 25 linhas, sem regras de negócio próprias;
- os novos módulos têm entre 68 e 128 linhas e não possuem linhas acima de 100 caracteres;
- a checagem TypeScript do núcleo passou com `tsc -p tsconfig.core.json --noEmit`.

### Etapa 6 — utilitários do XML Alight

Concluída em 16/09/2026:

- limites de segurança, tags conhecidas, blends e valores padrão do formato foram extraídos para `alight-xml-utils.ts`;
- validação e parsing seguro de XML, incluindo bloqueio de `DOCTYPE` e entidades externas, foram isolados da interface;
- conversões de cor, vetor, easing, URI local, tipo de mídia, atributos e propriedades externas foram transformadas em funções nomeadas e formatadas;
- fragmentos XML preservados continuam sendo analisados pelo mesmo caminho seguro;
- `alight-controller.ts` preserva nesta etapa a conversão de camadas, importação, exportação e integração com a interface;
- o novo módulo tem 231 linhas coesas, sem linhas acima de 100 caracteres;
- a checagem Vue/TypeScript passou com `vue-tsc --noEmit`.

### Etapa 7 — estrutura da importação Alight

Concluída em 16/09/2026:

- travessia da hierarquia de camadas e preservação do identificador original do grupo foram extraídas para `alight-import-structure.ts`;
- criação e consulta do catálogo `<media>` foram separadas do controlador;
- resolução de URI, caminho local, nome e tipo da mídia importada ficou centralizada;
- conversão de dados de caminho para pontos percentuais foi isolada e mantém o limite de 1.000 pontos;
- definições de mídia continuam excluídas da lista de camadas e o limite de 5.000 camadas permanece validado;
- o novo módulo tem 128 linhas e nenhuma linha acima de 100 caracteres;
- a checagem Vue/TypeScript passou com `vue-tsc --noEmit`.

### Etapa 8 — animações e efeitos da importação Alight

Concluída em 16/09/2026:

- criação e atualização de keyframes importados foram extraídas para `alight-animation-import.ts`;
- valores estáticos, canais animados e easing por propriedade passaram a ter um fluxo próprio e formatado;
- leitura e preservação de efeitos externos foram extraídas para `alight-effect-import.ts`;
- o mapeamento dos efeitos Alight suportados para efeitos nativos ficou separado da conversão geral da camada;
- efeitos não suportados continuam preservados integralmente e registrados no relatório de compatibilidade;
- `AlightReport` tornou-se um contrato compartilhado em `alight-types.ts`;
- os novos módulos têm entre 7 e 93 linhas e nenhuma linha acima de 100 caracteres;
- a checagem Vue/TypeScript passou com `vue-tsc --noEmit`.

### Etapa 9 — conversão de camadas Alight

Concluída em 16/09/2026:

- a conversão completa de uma camada foi extraída para `alight-layer-import.ts`;
- determinação do tipo, criação da camada, transformações, aparência, texto, propriedades/stroke e preservação de metadados foram divididas em funções próprias;
- mídia ausente, IDs originais, tags, shapes, atributos desconhecidos, filhos extras e propriedades externas continuam preservados;
- normalização de blend, gradiente, anchor, path, duração e origem de mídia mantém as regras anteriores;
- a ordem do cálculo do ângulo do gradiente foi conferida para preservar exatamente o arredondamento existente;
- o novo módulo tem 292 linhas distribuídas em sete funções coesas, sem linhas acima de 100 caracteres;
- `alight-controller.ts` caiu para 178 linhas e ficou concentrado na orquestração da cena, exportação e interface;
- a checagem Vue/TypeScript passou com `vue-tsc --noEmit`.

### Etapa 10 — propriedades e efeitos da exportação Alight

Concluída em 16/09/2026:

- geração de propriedades XML, incluindo keyframes, easing e atributos externos, foi extraída para `alight-effect-export.ts`;
- serialização de efeitos preservados e seus fragmentos adicionais foi isolada da montagem da camada;
- conversão de efeitos nativos para efeitos Alight passou a usar funções e objetos formatados por efeito;
- IDs originais, ordem, duplicatas, flags e propriedades de efeitos externos continuam preservados;
- fragmentos adicionais inválidos continuam sendo ignorados sem impedir a exportação, com comentário explicando essa decisão;
- o novo módulo tem 183 linhas e nenhuma linha acima de 100 caracteres;
- `alight-controller.ts` caiu para 151 linhas;
- a checagem Vue/TypeScript passou com `vue-tsc --noEmit`.

### Etapa 11 — geração XML de camadas Alight

Concluída em 16/09/2026:

- geração completa de uma camada XML foi extraída para `alight-layer-export.ts`;
- animação de transformações, anchor, preenchimento, gradiente, mídia, texto, path, efeitos, stroke e blend foram divididos em funções próprias;
- atributos, elementos adicionais e IDs de efeitos preservados continuam no round-trip;
- resolução de URI, nome e MIME da mídia exportada ficou disponível para a montagem da cena;
- fragmentos externos inválidos continuam sem bloquear a exportação e a razão está comentada no código;
- o novo módulo tem 352 linhas distribuídas em sete funções coesas, sem linhas acima de 100 caracteres;
- `alight-controller.ts` caiu para 104 linhas;
- a checagem Vue/TypeScript passou com `vue-tsc --noEmit`.

### Etapa 12 — montagem da cena Alight

Concluída em 16/09/2026:

- montagem do XML raiz, catálogo de mídias, bookmarks e relatório foi extraída para `alight-scene-export.ts`;
- organização dos grupos e camadas no XML passou a ter funções próprias, separadas da interface;
- o vínculo entre filhos e grupos agora usa o índice original da camada, evitando deslocamento quando uma camada não possui identificador;
- `alight-controller.ts` ficou concentrado na importação da cena, integração com arquivos, eventos e relatório visual;
- as rotinas restantes do controlador foram formatadas para facilitar leitura e alterações simultâneas;
- o novo módulo tem 173 linhas e nenhuma linha acima de 100 caracteres;
- a checagem Vue/TypeScript passou com `vue-tsc --noEmit`.

### Etapa 13 — montagem da importação Alight

Concluída em 16/09/2026:

- parsing da cena, metadados, composição, bookmarks e relatório foi extraído para `alight-scene-import.ts`;
- criação das camadas e resolução posterior da hierarquia por IDs originais ficaram separadas da interface;
- escolha do aspecto visual foi transformada em uma função pequena e explícita;
- o controlador passou a apenas aplicar o projeto importado, atualizar a interface e registrar o histórico;
- o novo módulo tem 118 linhas e nenhuma linha acima de 100 caracteres;
- `alight-controller.ts` caiu para 164 linhas e nenhuma linha acima de 100 caracteres;
- a checagem Vue/TypeScript passou com `vue-tsc --noEmit`;
- o teste específico passou no Electron com `pnpm exec electron tools/test-alight-xml.cjs`.

### Etapa 14 — comandos de organização de faixas

Concluída em 16/09/2026:

- regras de consulta, validação, movimentação, criação, reordenação e edição de faixas foram extraídas para `layer-track-commands.ts`;
- `layer-commands.ts` continua como fachada pública, evitando alterações desnecessárias nos controladores da timeline;
- validações de destino, sobreposição e bloqueio foram formatadas sem alterar as regras existentes;
- o novo módulo tem 209 linhas coesas e nenhuma linha acima de 100 caracteres;
- `layer-commands.ts` caiu de 194 para 130 linhas;
- `project-model.ts` foi mantido inteiro porque seu tamanho vem principalmente do contrato único de `Layer` e de sua normalização;
- `media-runtime.ts` permanece como candidato real: o módulo reúne ciclo de vida da mídia, proxies, áudio e sincronização de reprodução;
- as checagens passaram com `tsc -p tsconfig.core.json --noEmit` e `vue-tsc --noEmit`.

### Etapa 15 — infraestrutura Web Audio da mídia

Concluída em 16/09/2026:

- criação e retomada do `AudioContext` foram extraídas para `media-audio-runtime.ts`;
- construção, configuração e liberação do grafo estéreo ficaram isoladas do ciclo de vida dos elementos de mídia;
- ganho, pan e seleção dos canais esquerdo, direito e estéreo passaram a ter uma interface pequena e explícita;
- encerramento do contexto e desconexão dos nós foram centralizados no novo módulo;
- `media-runtime.ts` continua responsável por elementos, proxies, sincronização temporal e escolha da camada ativa;
- o novo módulo tem 103 linhas e nenhuma linha acima de 100 caracteres;
- a checagem passou com `vue-tsc --noEmit`.

### Etapa 16 — sincronização de reprodução da mídia

Concluída em 16/09/2026:

- escolha do clipe proprietário de decoders compartilhados foi extraída para
  `media-playback-runtime.ts`;
- cálculo de fade, ganho, mute, solo, pan, canal, velocidade e instante de mídia ficou isolado
  do ciclo de vida dos elementos;
- seek, pré-carregamento do próximo clipe, play, pause e espera do áudio antes do vídeo foram
  divididos em funções nomeadas;
- consulta do relógio da mídia ativa passou a usar o mesmo módulo de reprodução;
- `media-runtime.ts` preserva a fachada pública e ficou concentrado em elementos, proxies,
  reconciliação, carregamento e liberação de recursos;
- `git diff --check` passou;
- a checagem TypeScript não pôde ser executada porque as dependências locais não estão
  instaladas e `tsc` não está disponível; nenhuma dependência foi baixada nesta etapa.

### Etapa 17 — registro e ciclo de vida dos elementos de mídia

Concluída em 16/09/2026:

- criação de imagens, vídeos, áudios e listeners foi extraída para
  `media-record-registry.ts`;
- associação entre camadas, elementos e containers passou a ter uma interface própria;
- reutilização de decoder entre cortes não sobrepostos e isolamento de clips sobrepostos foram
  preservados no registro;
- reconciliação, pausa e liberação dos elementos e listeners ficaram centralizadas;
- resolução de mídia original ou proxy continua no orquestrador, sem acoplar o registro à ponte
  do Electron;
- `media-runtime.ts` preserva a fachada pública e coordena registro, proxy, reprodução, áudio e
  preparação para renderização;
- `git diff --check` passou;
- a checagem TypeScript permanece indisponível porque as dependências locais não estão
  instaladas; nenhuma dependência foi baixada.

### Etapa 18 — preparação assíncrona de mídia

Concluída em 16/09/2026:

- espera por carregamento e seek, timeout e cancelamento por `AbortSignal` foram extraídos para
  `media-preparation.ts`;
- preparação de imagens e vídeos passou a ter fluxos separados e funções nomeadas;
- retry único de vídeo com recarga do elemento e posicionamento pelo tempo de origem foram
  preservados;
- seleção das camadas visuais ativas e preparação paralela ficaram isoladas da reprodução;
- o novo módulo depende somente de contratos para reconciliar e obter elementos, sem conhecer
  proxies, áudio ou a ponte do Electron;
- `media-runtime.ts` preserva o método público `prepare` como fachada;
- `git diff --check` passou;
- a checagem TypeScript permanece indisponível porque as dependências locais não estão
  instaladas; nenhuma dependência foi baixada.

### Etapa 19 — coordenação de proxies de mídia

Concluída em 16/09/2026:

- elegibilidade por resolução, cache de caminhos e deduplicação de tarefas foram extraídos para
  `media-proxy-runtime.ts`;
- ativação e desativação do uso de proxies e publicação do estado disponível ficaram
  centralizadas;
- geração assíncrona continua ignorando resultados concluídos depois da destruição do runtime;
- exportação continua usando mídia original, enquanto o preview escolhe o proxy somente quando
  ele está disponível e habilitado;
- os contratos públicos `ProxyMetadata`, `ProxyResult` e `MediaBridge` permanecem exportados por
  `media-runtime.ts` para não alterar consumidores;
- `media-runtime.ts` ficou concentrado na composição dos quatro serviços de mídia e na fachada
  pública;
- `git diff --check` passou;
- a checagem TypeScript permanece indisponível porque as dependências locais não estão
  instaladas; nenhuma dependência foi baixada.

### Etapa 20 — revisão da fachada do runtime de mídia

Concluída em 16/09/2026:

- `media-runtime.ts` foi formatado integralmente sem alterar sua fachada pública;
- opções de criação receberam um contrato nomeado e imports e retornos foram organizados;
- composição entre registro, proxy, reprodução, áudio e preparação ficou explícita no módulo;
- a inicialização entre registro e resolução de proxy deixou de depender de uma variável ainda
  não atribuída;
- a ordem de destruição foi conferida e documentada: elementos e grafos individuais são
  liberados antes do fechamento do `AudioContext` compartilhado;
- não foi criada uma abstração adicional, pois a fachada restante apenas coordena os serviços;
- `git diff --check` passou;
- a checagem TypeScript e os testes do runtime continuam pendentes porque as dependências locais
  não estão instaladas; nenhuma dependência foi baixada.

Não há outra extração estrutural indicada neste domínio. Quando as dependências estiverem
disponíveis, a próxima ação é validar as etapas 15 a 20 com a checagem TypeScript e os testes de
ciclo de vida, preview, áudio, proxy e renderização antes de considerar o pacote entregue.

Não houve sincronização com o GitHub, build, empacotamento ou commit.
