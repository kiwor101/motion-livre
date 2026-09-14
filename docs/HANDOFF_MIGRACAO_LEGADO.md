# Registro de conclusão — migração do legado da interface

Conferido em: 2026-09-10
Branch: `dev/emanueltk7`
Situação: migração dos adaptadores concluída no clone local, com alterações ainda sem commit. Preserve o trabalho existente.

## Escopo concluído

Os sete adaptadores JavaScript foram removidos da carga e do empacotamento:

- `app.js` → `src/ui/app-controller.ts`, com serviços de mídia, reprodução e palco nas respectivas pastas de `src/ui/`.
- `timeline.js` → controladores de seleção, faixas, gestos, ações, navegação, renderização e demais funções em `src/ui/timeline/`.
- `pro-editor.js` → controladores em `src/ui/editing/` e `src/ui/export/`.
- `advanced.js` → `src/ui/editing/advanced-controller.ts`.
- `desktop-integration.js` → `src/ui/platform/desktop-controller.ts`.
- `studio.js` → `src/ui/presentation/studio-controller.ts`.
- `alight-compat.js` → `src/ui/compat/alight-controller.ts`.

O bootstrap está em `src/ui/main.ts`, compilado pelo Vite. Não foram encontradas referências a `motionLegacyContext`, `loadScript(` ou `globalThis` em `src/`, `index.html` e `package.json`. A busca em `src/ui/` também não encontrou `any`, `@ts-ignore` ou `@ts-nocheck`.

Os controladores recebem dependências do bootstrap. A API pública tipada `window.motionEditor` permanece disponível e é usada pelos testes de integração; isso não significa ausência de toda exposição global. Os módulos `Motion*` deixaram de ser publicados globalmente.

## Validação desta conferência

Passaram no estado local em 2026-09-10:

- `pnpm check:ui`.
- `pnpm build:ui`.
- `pnpm test:core`, incluindo compilação do núcleo/renderer e testes reais de áudio, proxy e encoder FFmpeg.
- Os três testes de `test:renderer`, executados individualmente com `pnpm exec electron`: `test-renderer-contracts.cjs`, `test-editing-commands.cjs` e `test-alight-xml.cjs`.
- `pnpm exec electron tools/smoke-renderer.cjs`: workflows, áudio com proxy, recuperação de contexto e encoder de produção em 640×360, 2 segundos e 48 frames.
- `git diff --check` e `git diff --cached --check`.

As primeiras tentativas de checagem e build receberam EPERM no sandbox; ambas passaram após execução autorizada fora dele. O teste de edição emitiu mensagens de diagnóstico de GPU, mas terminou aprovado. Não foi repetida nesta conferência a exportação 4K nem a totalidade dos testes avulsos em `tools/`.

## Limites e próxima etapa

A conclusão se refere à substituição dos adaptadores JavaScript por controladores TypeScript. Os objetivos mais amplos de shaders dedicados, render graph e evolução mobile continuam descritos em `docs/ARQUITETURA_ALVO.md`.

Ao implementar ou ampliar efeitos visuais, é obrigatório seguir a seção “Requisito obrigatório para efeitos visuais” de `docs/ARQUITETURA_ALVO.md`: representar a cadeia no render graph, usar shaders quando aplicável e manter preview e exportação no mesmo caminho gráfico. Não introduzir implementações paralelas exclusivas de Canvas, DOM, preview ou exportação.

Toda continuação também deve preservar o “Objetivo obrigatório de desempenho e qualidade” da arquitetura: preview adaptativo e responsivo, efeitos acelerados pela GPU, proxies e cache controlados, além de exportação 2K/4K pelas mídias originais com qualidade, timestamps e sincronização verificáveis.

A arquitetura agora também exige planejamento de exportação rápida por trecho, com cópia/remux, processamento apenas do áudio, cache, renderização parcial ou completa e encoder de hardware conforme a segurança de cada caso. A interoperabilidade Alight Motion XML continua obrigatória, atômica e coberta por round-trip, preservação de metadados e relatório de recursos não suportados.

Na persistência, o modelo TypeScript é a autoridade, `.motion.json` permanece como projeto nativo completo e o XML segue a estrutura compatível do Alight Motion para conceitos equivalentes. Extensões próprias devem ser documentadas e formatos XML antigos do Motion Livre devem permanecer importáveis ou receber migração explícita.

Não retomar as antigas instruções de migrar `app.js`, `timeline.js` ou `pro-editor.js`: esses arquivos já foram removidos. Para continuar, escolher um objetivo pendente da arquitetura, preservar a árvore local e seguir `AGENTS.md` e `CONTRIBUTING.md`.

Esta conferência corrigiu somente a documentação. Não houve commit, push, PR, merge, publicação ou alteração da versão `0.0.1`.
