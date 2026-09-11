# Motion Livre — instruções para agentes

## Antes de alterar

- Leia `CONTRIBUTING.md` e `package.json`. Trabalhe no clone atual, sem criar uma segunda cópia do projeto.
- Confira `git status`, a branch ativa, o remoto e as alterações existentes. Preserve trabalho local e commits de outras pessoas.
- `dev/kiwor101` pertence a `kiwor101`; `dev/emanueltk7` pertence a `emanueltk7`. Use apenas a branch da pessoa atendida. Não deduza a conta autenticada pelo autor do último commit.
- `main` recebe entregas por PR, integrado somente por `kiwor101`. Não faça commit/push direto nela nem altere as regras do GitHub sem autorização explícita.
- Com a árvore limpa, atualize a própria branch com `git fetch origin --prune`, `git pull --ff-only` e `git merge origin/main`, verificando cada resultado. Nunca use force push, reset destrutivo ou rebase de commits publicados para sincronizar.
- Uma tarefa de edição ativa por pasta; não inicie agentes paralelos sem pedido explícito.

## Escopo e colaboração

- Entregue um pacote pequeno por PR e informe as funções/telas envolvidas. Não faça reformatações ou refatorações amplas fora do pedido.
- Não escreva na branch do colega. Se houver conflito no mesmo comportamento, preserve as duas intenções e solicite direção quando não puder conciliá-las.
- Antes do commit, revise o diff e adicione somente os arquivos da tarefa. Commit, push, criação/merge de PR e publicação exigem autorização compatível com o pedido atual.
- Nas branches pessoais permanentes, use merge commits e não exclua a branch após integrar.

## Economia de contexto e tokens

- Trate tokens como recurso limitado sem reduzir a qualidade da correção. Comece pelo pedido atual, pelo handoff específico do bug e pelos arquivos diretamente citados; não releia toda a documentação nem remapeie a arquitetura a cada chat.
- Antes de buscar amplamente, escreva uma hipótese verificável e procure apenas símbolos, chamadas e testes relacionados. Amplie para módulos vizinhos somente quando a evidência contrariar a hipótese ou mostrar que o fluxo atravessa esses módulos.
- Reaproveite resultados registrados no handoff e no Git. Não repita testes aprovados quando o código coberto não mudou. Não reabra decisões já comprovadas sem sintoma novo, mudança relacionada ou resultado contraditório.
- Para correção localizada, siga esta ordem: reproduzir de forma mínima, localizar a causa, revisar se o algoritmo corresponde ao comportamento desejado, aplicar o menor patch coerente, executar o teste específico e registrar causa/mudança/validação/pendência.
- Valide em camadas. Comece com sintaxe ou compilação do projeto afetado e o teste específico. Rode a suíte do subsistema quando o teste passar. Use suíte completa, smoke com mídia real ou empacotamento somente quando a alteração cruzar subsistemas, afetar runtime/exportação, ou quando uma regressão justificar o custo.
- Não use testes amplos como substituto de diagnóstico. Uma falha de ambiente deve ser confirmada uma vez pela alternativa adequada; não repita indefinidamente o mesmo comando. Preserve a mensagem original e registre a limitação.
- Evite saídas extensas: limite buscas por extensão/diretório, leia trechos relevantes, use `git diff --stat` antes do diff completo e resuma logs volumosos. Não despeje arquivos inteiros quando uma busca e poucas linhas bastarem.
- Não faça refatoração, documentação longa ou novos testes genéricos durante um bug pequeno. Crie regressão permanente quando ela diferencia o comportamento incorreto do correto e protege uma regra importante.
- Se faltar mídia, projeto salvo ou estado necessário para reproduzir, conclua tudo que puder com um caso mínimo e registre exatamente a evidência ausente. Não consuma a sessão em causas especulativas.
- Em tarefas longas, atualize um único handoff compacto antes de o contexto se esgotar. Registre apenas: sintoma, fatos confirmados, alterações locais, comandos que passaram/falharam e próximo passo. O chat seguinte deve continuar desse ponto, sem reiniciar a investigação.
- Preserve margem de contexto para implementar e validar. Se a investigação crescer além do bug pedido, interrompa a expansão, registre o novo achado como pendência e termine primeiro o pacote autorizado, salvo quando o achado bloquear a correção ou indicar risco de perda de dados.

## Aplicativo e validação

- Projeto Electron para Windows, com interface JavaScript/CSS local. Preserve o funcionamento offline, fontes/ícones locais e FFmpeg/FFprobe incorporados.
- `pnpm install --frozen-lockfile` prepara dependências; `pnpm setup:ffmpeg` prepara os binários quando ausentes; `npm run dev` abre o editor; `pnpm dist` gera Setup e Portable.
- Consulte os testes existentes em `tools/` antes de validar a área alterada. Faça `git diff --check`, `node --check` nos JavaScript alterados e testes relevantes. Informe limitações reais, sem inventar resultados.
- Edições de corte devem preservar áudio, volume, pan, mute, velocidade, origem e fades. Desfazer/refazer, remoção de camadas e salvar/reabrir não devem perder mídias, nomes ou organização.

## Versão e arquivos

- Mantenha `0.0.1` neste ciclo, até o mantenedor autorizar outra versão. `package.json.version` é a fonte única do número usado no runtime e nos executáveis.
- Publicações oficiais partem da `main` validada e são responsabilidade de `kiwor101`. Não publique executáveis a cada commit.
- Não versione `node_modules/`, `vendor/ffmpeg/*.exe`, `dist/`, `.build/`, `.runtime-data/`, mídias, credenciais ou resultados temporários de testes.
- Preserve os scripts de teste já versionados e o histórico de contribuições. Limpe apenas artefatos conhecidos, dentro do projeto; mantenha somente os executáveis da versão atual depois de validar a nova compilação.
