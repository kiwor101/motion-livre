# Alterações pendentes

Lista de solicitações para implementação futura. Registrar novos pontos e manter o histórico de status; implementar quando o usuário solicitar.

## 1. Restaurar a lista do painel Mídia ao reabrir o projeto

- **Registrado em:** 08/09/2026.
- **Status:** implementado e validado em 08/09/2026.
- **Relato:** ao salvar um projeto, fechar e abrir novamente, as mídias parecem continuar vinculadas aos clipes, mas não aparecem listadas no painel **Mídia**.
- **Comportamento esperado:** restaurar a lista de mídias do projeto ao abri-lo, permitindo acessar e reutilizar os arquivos no painel.
- **Validação futura:** importar mídias, salvar, fechar e reabrir o projeto; verificar os vínculos dos clipes e a presença das mídias no painel. Investigar também a preservação de mídias importadas que ainda não foram usadas na timeline.
- **Observação:** a biblioteca não era serializada nem reconstruída na abertura. Agora é salva separadamente, com reconstrução a partir dos clipes para projetos antigos.

## 2. Duplicar em nova camada acima e adicionar botão na timeline

- **Status:** implementado e validado em 08/09/2026.
- **Relato:** o duplicado fica escondido atrás do vídeo principal.
- **Comportamento esperado:** duplicar cria automaticamente uma nova camada/faixa acima da original, com o conteúdo duplicado. Adicionar um botão com ícone de duplicar na barra de ferramentas acima da timeline.
- **Observação:** o usuário pediu um atalho visual na barra; não especificou uma combinação de teclas.

## 3. Mover camadas verticalmente por arraste

- **Status:** implementado e validado em 08/09/2026.
- **Comportamento esperado:** arrastar com o mouse para cima ou para baixo permite mudar a posição de uma camada na timeline, inclusive criando uma nova camada/faixa de destino onde ainda não exista uma. Permitir também reordenar pelo painel de camadas.
- **Validação futura:** mover para faixas existentes e para posições novas acima e abaixo; confirmar a ordem visual da composição e a correspondência entre timeline e painel de camadas.

## 4. Renomear camadas

- **Status:** implementado e validado em 08/09/2026.
- **Comportamento esperado:** permitir renomear a camada e exibir o nome de forma consistente na timeline e no painel de camadas.

## 5. Preservar a organização das camadas no arquivo do projeto

- **Status:** implementado e validado em 08/09/2026.
- **Comportamento esperado:** salvar os nomes, a ordem, os vínculos entre clipes e faixas e as novas camadas criadas por duplicação ou arraste. Ao reabrir ou importar o projeto salvo, restaurar esses detalhes.
- **Validação futura:** duplicar, mover e renomear camadas; salvar, fechar e reabrir/importar o arquivo; comparar nomes, ordem, faixas, clipes e composição com o estado anterior.

## Histórico

- **08/09/2026:** registrado o ponto 1. Nenhuma correção aplicada nesta etapa.
- **08/09/2026:** registrados os pontos 2 a 5: duplicação acima, botão de duplicar, arraste vertical, renomeação e persistência no projeto. Nenhuma correção aplicada nesta etapa.

- **08/09/2026:** implementados os pontos 1 a 5 após autorização. Testes cobrem duplicação acima, cópia independente dos keyframes, renomeação, reordenação pelo painel, criação de faixa por arraste, reabertura/importação, mídias sem clipe e reconstrução de arquivos antigos.
