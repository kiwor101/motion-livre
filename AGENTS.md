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
