# Resumo da migração da interface

## O que existia antes

A interface do Motion Livre era formada por arquivos JavaScript grandes, como `app.js`, `timeline.js` e `pro-editor.js`. Esses arquivos compartilhavam funções e estado por variáveis globais e eram carregados em sequência.

Esse modelo funcionava, mas tornava difícil saber qual parte controlava cada comportamento. Uma mudança na timeline, nos efeitos ou na mídia podia afetar outra área sem uma ligação clara no código.

## Principais problemas enfrentados

- dependências implícitas entre scripts e ordem obrigatória de carregamento;
- estado do projeto alterado diretamente por várias partes da interface;
- arquivos grandes reunindo responsabilidades diferentes;
- risco de perder comportamento ao separar edição, áudio, histórico e exportação;
- necessidade de manter cortes, keyframes, mídias, nomes, faixas e propriedades ao salvar, reabrir, desfazer ou refazer;
- preservação da importação e exportação XML compatível com Alight Motion;
- validação de exportação, áudio, proxies e recuperação de falhas com ferramentas reais.

## O que mudou

Os antigos adaptadores JavaScript foram substituídos por controladores TypeScript organizados por função:

```text
Antes                           Agora
app.js                          src/ui/app-controller.ts
timeline.js                     src/ui/timeline/
pro-editor.js                   src/ui/editing/ e src/ui/export/
advanced.js                     controlador avançado tipado
desktop-integration.js          controlador de plataforma
studio.js                       controlador de apresentação
alight-compat.js                controlador de compatibilidade XML
```

A interface agora inicia pelo bundle TypeScript. Os controladores recebem suas dependências de forma explícita e as regras centrais ficam em comandos e modelos compartilhados. Foram removidos `motionLegacyContext`, `loadScript()` e os módulos globais `Motion*`.

Os comportamentos válidos não foram descartados. Edição, cortes, áudio, histórico, mídias, timeline, exportação e compatibilidade XML foram transferidos para a estrutura nova.

## Como a migração foi conferida

Passaram a checagem TypeScript, o build da interface, os testes do núcleo, os testes Electron de integração e o smoke com FFmpeg. Esses testes cobrem fluxos importantes como cortes, undo/redo, keyframes, áudio, proxies, projetos, XML e exportação.

Isso reduz o risco da migração, mas não significa que toda combinação possível da interface tenha sido testada manualmente. Casos raros ainda devem ser avaliados durante o uso real.

## Vantagens da estrutura nova

- código menor e organizado por responsabilidade;
- dependências visíveis e verificadas pelo TypeScript;
- menos risco de uma área alterar outra acidentalmente;
- testes mais diretos para regras do editor;
- base adequada para preview adaptativo, cache e proxies;
- caminho preparado para render graph e efeitos em shaders;
- evolução da exportação rápida, 2K e 4K sem depender dos scripts antigos;
- preview e exportação orientados pelo mesmo modelo de projeto;
- JSON mantido como formato nativo e XML como interoperabilidade compatível.

## Situação atual

A migração dos adaptadores da interface está concluída no código local. A partir daqui, novas funcionalidades devem ser implementadas na arquitetura TypeScript atual, sem recriar scripts globais ou caminhos paralelos.

Render graph, shaders dedicados, exportação inteligente por trechos e outras otimizações são as próximas evoluções. Elas não fazem parte da migração já encerrada.

## Orientação obrigatória para continuar o projeto

Antes de planejar ou alterar código, leia integralmente [ARQUITETURA_ALVO.md](ARQUITETURA_ALVO.md) e consulte [HANDOFF_MIGRACAO_LEGADO.md](HANDOFF_MIGRACAO_LEGADO.md). Esses documentos definem o modelo planejado e devem orientar as decisões de implementação, mesmo quando uma solução isolada parecer mais rápida.

Todo novo código deve respeitar especialmente:

- o modelo TypeScript como fonte central do projeto;
- dependências explícitas, sem recriar pontes ou módulos globais;
- o mesmo caminho de avaliação para preview e exportação;
- preview adaptativo, proxies, cache e controle de memória;
- render graph e shaders para a evolução dos efeitos;
- planejamento de exportação rápida sem comprometer qualidade e sincronização;
- JSON para projetos nativos e XML compatível para interoperabilidade e presets quando adequado;
- funcionamento offline e preservação dos comportamentos já validados.

Se uma implementação entrar em conflito com a arquitetura documentada, atualize a proposta antes de codificar. Uma exceção somente deve ser adotada quando estiver justificada, limitada e registrada em [ARQUITETURA_ALVO.md](ARQUITETURA_ALVO.md), para que não se transforme em um novo caminho legado.
