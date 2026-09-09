# Bugs: controles sobrepostos e exportação travada

Data do registro: 2026-09-09

## Resumo

Foram observados dois problemas durante uma exportação MP4:

1. Os controles de reprodução aparecem sobre a janela de configurações de exportação, com z-index incorreto.
2. A exportação falha uma vez e, nas tentativas seguintes, retorna `Error invoking remote method 'export:begin': Error: Já existe uma exportação em andamento`.

## Evidência

- Screenshot 1: a barra de transporte (`00:00.00 / 00:31.79`, play, volume etc.) fica sobre a janela `Configurações de exportação`.
- Screenshot 2: toast exibindo `Falha na exportação: Error invoking remote method 'export:begin': Error: Já existe uma exportação em andamento`.

## Reprodução provável

1. Abrir um projeto com vídeo.
2. Abrir as configurações de exportação.
3. Iniciar uma exportação MP4.
4. Provocar ou encontrar uma falha no início/processamento do FFmpeg.
5. Tentar exportar novamente.
6. Observar que a primeira tentativa falha e a seguinte é bloqueada como se ainda houvesse uma exportação ativa.

## Hipóteses técnicas

### Controles sobrepostos

O elemento `.transport` está em um contexto de empilhamento acima dos modais ou possui `position`/`z-index` maior que `.modal`. A janela de exportação precisa ter uma camada superior previsível, e os controles devem ficar atrás enquanto qualquer modal de exportação estiver aberto.

Não corrigir aumentando z-index de forma aleatória: verificar os contextos de empilhamento de `.stage-area`, `.transport`, `.modal`, `.modal-card`, `.popup` e elementos Vue montados com `display: contents`.

### Exportação travada

O processo principal bloqueia uma nova exportação quando `frameExport` ou `exportProcess` ainda existe. Se o FFmpeg falhar, fechar com erro ou o renderer abandonar a sequência depois de `export:begin`, o estado pode não ser liberado.

O fluxo precisa limpar o estado em todos os caminhos:

- erro ao iniciar o processo;
- processo FFmpeg encerrado com código diferente de zero;
- erro ao escrever um frame;
- cancelamento explícito;
- erro no renderer depois de `export:begin`;
- fechamento da janela;
- finalização normal.

Também é necessário garantir que `export:cancel` seja chamado no `catch` do renderer quando uma sessão já tiver sido iniciada.

## Critérios de aceite

- A barra de transporte nunca fica acima de `#exportSettings`, `#exportProgress` ou outros modais.
- A primeira exportação bem-sucedida gera o arquivo correto.
- Uma exportação que falha libera o lock imediatamente.
- É possível iniciar uma nova exportação sem reiniciar o aplicativo.
- Cancelar uma exportação libera o lock.
- Fechar a janela durante a exportação não deixa processo FFmpeg órfão.
- O erro original do FFmpeg continua visível no toast/log; não deve ser mascarado por `Já existe uma exportação em andamento`.
- Teste automatizado cobre falha, cancelamento, retry e sucesso.

## Prompt para correção

```text
Corrija os bugs registrados em docs/BUG_EXPORTACAO_CONTROLES_2026-09-09.md no projeto Motion Livre.

Bug 1: os controles de reprodução (`.transport`) aparecem sobre a janela de configurações de exportação. Audite os contextos de empilhamento e z-index de `.transport`, `.stage-area`, `.modal`, `.modal-card`, `.popup` e dos pontos de montagem Vue. Faça o modal de exportação ficar acima de toda a área de edição sem quebrar interação, acessibilidade ou tela cheia. Não resolva apenas adicionando z-index arbitrário; elimine o contexto de empilhamento que causa a sobreposição e adicione um teste visual/DOM que confirme a ordem.

Bug 2: depois de uma falha de exportação, novas tentativas retornam `Já existe uma exportação em andamento`. Audite `desktop/main.cjs`, `desktop/preload.cjs` e `desktop-integration.js`, especialmente `frameExport`, `exportProcess`, `export:begin`, `export:frame`, `export:finish` e `export:cancel`. Garanta limpeza idempotente em erro do FFmpeg, erro de IPC, erro de escrita de frame, cancelamento, fechamento da janela e sucesso. No renderer, se `beginFrameExport` já tiver criado uma sessão e qualquer etapa posterior falhar, chame `cancelExport` no catch/finally antes de exibir o erro. Evite matar ou limpar uma sessão pertencente a outra exportação.

Preserve a exportação determinística direta ao FFmpeg, o mix de áudio e o uso do compositor WebGL2. Não reintroduza MediaRecorder, captureStream ou WebM intermediário. Preserve a resolução escolhida pelo usuário e a fidelidade do áudio.

Adicione testes para:
1. exportação bem-sucedida;
2. falha do processo FFmpeg seguida de retry bem-sucedido;
3. cancelamento seguido de retry;
4. erro ao enviar frame seguido de retry;
5. fechamento da janela com processo de exportação ativo;
6. ordem de camadas/z-index do modal sobre os controles.

Depois execute node --check nos arquivos JavaScript alterados, pnpm check:ui, pnpm test:core e pnpm test:smoke. Não faça commit, push ou sincronização com GitHub.
```
