# Motion Livre — instruções para agentes

## Antes de alterar

- Leia `CONTRIBUTING.md` e `package.json`. Trabalhe no clone atual, sem criar uma segunda cópia do projeto.
- Confira `git status`, a branch ativa, o remoto e as alterações existentes. Preserve trabalho local e commits de outras pessoas.
- `dev/kiwor101` pertence a `kiwor101`; `dev/emanueltk7` pertence a `emanueltk7`. Use apenas a branch da pessoa atendida. Não deduza a conta autenticada pelo autor do último commit.
- `main` recebe entregas por PR, integrado somente por `kiwor101`. Não faça commit/push direto nela nem altere as regras do GitHub sem autorização explícita.
- Com a árvore limpa, atualize a própria branch com `git fetch origin --prune`, `git pull --ff-only` e `git merge origin/main`, verificando cada resultado. Nunca use force push em branches, reset destrutivo ou rebase de commits publicados para sincronizar. A exceção controlada de atualização da tag de release fixa está descrita em `CONTRIBUTING.md` e não se aplica a branches.
- Uma tarefa de edição ativa por pasta; não inicie agentes paralelos sem pedido explícito.

## Escopo e colaboração

- Entregue um pacote pequeno por PR e informe as funções/telas envolvidas. Não faça reformatações ou refatorações amplas fora do pedido.
- Não escreva na branch do colega. Se houver conflito no mesmo comportamento, preserve as duas intenções e solicite direção quando não puder conciliá-las.
- Antes do commit, revise o diff e adicione somente os arquivos da tarefa. A entrega de uma atualização solicitada do aplicativo inclui compilação e publicação dos dois executáveis conforme o fluxo abaixo, salvo se o usuário pedir explicitamente para não publicar. Consultas, diagnósticos e alterações exclusivamente documentais não autorizam publicar uma nova build do aplicativo. A integração de PRs na `main` continua exclusiva de `kiwor101`.
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

## Conclusão obrigatória de cada atualização do aplicativo

- Esta orientação vale para os dois colaboradores, incluindo `emanueltk7`. Ao concluir um pacote com mudanças no runtime, interface, assets, dependências ou empacotamento, execute `pnpm dist` (ou `npm run dist`) e entregue **Setup e Portable**. Um commit/push de código sozinho não conclui essa entrega. Não é necessário compilar cada commit intermediário.
- Prepare as dependências com o lockfile e FFmpeg/FFprobe quando ausentes. Não ignore erro de build: conclua os passos seguros possíveis e informe exatamente o impedimento; nunca apresente executáveis antigos como novos.
- Confirme os dois arquivos `dist/Motion-Livre-Setup-<version>-x64.exe` e `dist/Motion-Livre-Portable-<version>-x64.exe`, criados pela execução atual, não vazios e com a versão correta. Registre o SHA do código compilado e os SHA256 dos arquivos; faça smoke test do Portable com perfil isolado e os testes pertinentes à mudança.
- Publique os dois `.exe` como assets de uma release no GitHub, nunca como arquivos versionados. Código ainda na branch pessoal deve usar uma **pré-release de teste da própria branch**, sem alterar a release oficial ou marcá-la como Latest. A autorização para esta prévia já faz parte do fluxo de entrega de atualizações solicitado pelo mantenedor.
- Atualize `README.md` e `BAIXAR_MOTION_LIVRE.md` na própria branch com links reais dos dois arquivos publicados e identifique claramente se são oficiais ou de teste. Não substitua os links oficiais por uma prévia. A `main` recebe essas alterações somente por PR.
- Depois da integração por `kiwor101`, tanto `kiwor101` quanto `emanueltk7` podem executar a publicação oficial do código integrado e validado, com apenas um publicador por vez e seguindo `CONTRIBUTING.md`. A autorização não permite integrar PRs com a conta de Emanuel nem remover as proteções.
- Confira os downloads e hashes antes de limpar a build anterior do mesmo canal. Termine informando commit compilado, testes, os dois caminhos locais e links públicos. Se build, teste ou upload falhar, declare a entrega incompleta e o motivo, sem alegar sucesso.
- Exceção: mudanças somente de documentação/instruções, sem impacto nos arquivos empacotados, dispensam recompilação e troca dos executáveis; diga isso no PR e na resposta final. Estas instruções orientam o agente, não são um workflow automático do GitHub.

## Versão e arquivos

- Mantenha `0.0.1` neste ciclo, até o mantenedor autorizar outra versão. `package.json.version` é a fonte única do número usado no runtime e nos executáveis.
- Publicações oficiais partem de um commit integrado na `main` por `kiwor101`; os dois colaboradores podem compilar e publicar conforme o fluxo de entrega. Pré-releases da própria branch servem para QA antes da integração e não substituem a versão oficial.
- Não versione `node_modules/`, `vendor/ffmpeg/*.exe`, `dist/`, `.build/`, `.runtime-data/`, mídias, credenciais ou resultados temporários de testes.
- Preserve os scripts de teste já versionados e o histórico de contribuições. Limpe apenas artefatos conhecidos, dentro do projeto; mantenha somente os executáveis da versão atual depois de validar a nova compilação.
