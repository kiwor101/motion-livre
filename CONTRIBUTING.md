# Trabalhando juntos no Motion Livre

## Responsabilidades

- `kiwor101` trabalha em `dev/kiwor101` e revisa e integra as entregas na `main`.
- `emanueltk7` trabalha em `dev/emanueltk7` e envia suas entregas por Pull Request para `main`.
- Os dois compilam Setup e Portable ao concluir cada atualização do aplicativo e publicam suas prévias para QA. Depois da integração por `kiwor101`, qualquer um dos dois pode fazer a publicação oficial do código integrado e validado, coordenando para que exista apenas um publicador por vez.
- `main` é a base integrada. Commits são feitos nas branches de desenvolvimento; somente `kiwor101` pode integrar os PRs. Nem o mantenedor faz push direto na `main` no fluxo configurado.
- As branches pessoais são permanentes. Cada uma só recebe atualizações de sua conta responsável. Exclusão e force push são bloqueados nas três branches.

As regras podem ser consultadas em [GitHub Rules](https://github.com/kiwor101/motion-livre/rules). Um administrador pode reconfigurar o repositório; não desative as regras para contornar um conflito.

## Uma pasta por computador

Use o clone que já existe; não copie o projeto para uma segunda pasta. As branches usam a mesma pasta local, trocando os arquivos versionados ao mudar de branch. Cada computador tem seu próprio clone; não é uma pasta compartilhada pela rede.

Antes de trocar de branch, confira `git status`. Se houver alterações ou commits locais ainda não publicados, preserve-os e verifique o que são antes de continuar. Não use reset, descarte automático ou cópia de arquivos por cima para sincronizar.

No computador de `kiwor101`, a pasta atual é `C:\Users\Ti\Documents\GitHub\Motion livre` e a branch de trabalho já está selecionada.

Para `emanueltk7` entrar na branch criada no GitHub, execute no clone dele, com a árvore de trabalho limpa:

```powershell
git fetch origin --prune
git switch --track origin/dev/emanueltk7
git config --local pull.ff only
git config --local push.default simple
```

Esse `switch --track` é usado só na primeira vez. Depois, use `git switch dev/emanueltk7`. Para `kiwor101`, a branch equivalente é `dev/kiwor101`. Configure a autenticação do GitHub com a própria conta; o nome/email do autor de um commit não concede permissão de push.

## Antes de cada pacote

Com a sua branch selecionada e `git status` limpo:

```powershell
git fetch origin --prune
git pull --ff-only
git merge origin/main
```

Execute um comando por vez. Se houver erro ou conflito, pare e resolva antes de continuar. O `pull --ff-only` atualiza sua branch pelo remoto sem criar um merge inesperado. O `merge origin/main` traz as entregas integradas, preservando seus commits. Não faça rebase de commits já publicados.

Se houver conflito, examine cada trecho e preserve os dois comportamentos necessários; não aceite todo um lado automaticamente. Teste o resultado antes do commit de resolução. Para desistir de um merge iniciado com a árvore limpa, use `git merge --abort`.

## Durante o trabalho

1. Combine um objetivo pequeno e as funções/telas envolvidas. Abra uma issue quando precisar registrar a tarefa antes do primeiro commit.
2. Faça apenas esse pacote na sua branch. Na mesma pasta, mantenha apenas uma tarefa de IA alterando arquivos por vez.
3. Faça commits focados. No primeiro push, abra um PR em rascunho para `main`, preenchendo o modelo de descrição. Isso informa ao outro o que está em andamento.
4. Quando estiver pronto, atualize novamente com `origin/main`, valide, compile Setup e Portable e publique a prévia de teste conforme abaixo. Atualize os links de teste na própria branch e no PR antes de marcá-lo como pronto para revisão. Se a publicação estiver bloqueada, informe isso explicitamente.

Exemplo de envio, selecionando explicitamente os arquivos desta mudança:

```powershell
git status
git diff
git add caminho/do/arquivo-alterado
git diff --cached
git commit -m "fix: descreve a correcao"
git push
```

Não faça push na branch do colega. Não misture um segundo pacote no PR que ainda está sendo revisado. Conflitos em uma mesma função precisam de coordenação, mesmo em branches diferentes.

## Integração por kiwor101

1. Confira os arquivos, o escopo e as validações do PR; solicite ajustes se necessário.
2. Se a `main` avançou em código relacionado, peça ao autor para mesclar `origin/main` na própria branch e testar novamente.
3. Use **Create a merge commit** no GitHub. A integração na `main` é reservada a `kiwor101`; o GitHub pode pedir que ele confirme o bypass da restrição de atualização ao integrar o PR.
4. Não exclua a branch pessoal após o merge. Combine no PR quem publicará os executáveis oficiais (`kiwor101` ou `emanueltk7`); essa pessoa atualiza sua própria branch com a `main` e recompila o código integrado, sem incluir mudanças novas não revisadas.
5. Os dois repetem os comandos de atualização antes de começar o próximo pacote.

Mantemos merge commits porque as branches são reutilizadas. Squash/rebase nessas entregas faria as branches pessoais conservarem commits que a `main` não reconhece como já integrados.

## Executar e validar

Preparação e compilação estão no [README](README.md). `pnpm dev` ou `npm run dev` abre o editor; `pnpm dist` gera os dois executáveis.

Antes de entregar, use `git diff --check`, verifique a sintaxe dos JavaScript alterados com `node --check` e execute os testes relevantes existentes em `tools/test-*.cjs`. Os testes de interface usam Playwright e Microsoft Edge; `PLAYWRIGHT_PATH` pode apontar para uma instalação local de Playwright disponível no ambiente. Não acrescente caminhos de outro computador ao código.

Valide também o comportamento alterado com mídia real quando envolver importação, cortes, áudio ou exportação. Descreva no PR o que foi testado e o que não foi. Não declare a suíte inteira aprovada se apenas parte foi executada.

## Setup e Portable fazem parte da entrega

Esta é uma orientação permanente para os dois desenvolvedores e suas IAs. Ao terminar um pacote que muda o aplicativo, não pare no commit/push. Execute:

```powershell
pnpm install --frozen-lockfile
pnpm dist
```

Execute um comando por vez e pare no erro. Se FFmpeg/FFprobe estiverem ausentes, execute `pnpm setup:ffmpeg` antes do build. `npm run dist` também executa o empacotamento depois da preparação.

Confira que a execução atual produziu **os dois** arquivos não vazios com a versão de `package.json`, abra o Portable com perfil de teste isolado e calcule o SHA256 dos dois arquivos. Não use apenas a existência de um `.exe` em `dist/` como prova de sucesso: ele pode ser de uma compilação anterior. Identifique o commit exato do código empacotado; se mudar arquivos de runtime após compilar, recompile.

Atualizações só de documentação/instruções, sem alterar o pacote do aplicativo, dispensam recompilação; registre essa exceção. Falta de ferramenta, autenticação, permissão, falha de teste ou build deve aparecer como impedimento, não como entrega concluída. Esta regra não instala uma automação de CI nem altera um chat já aberto em outro computador.

### Antes do merge: prévia da própria branch

1. Registre e envie o código final na sua branch e anote o SHA completo do commit compilado. Preserve arquivos locais alheios à tarefa.
2. Crie uma tag nova no commit compilado, no padrão `preview-<login>-<sha-curto>`, e uma release em rascunho. Os sufixos identificam builds de teste; a versão do aplicativo continua `0.0.1`. Não mova tags de prévias já publicadas.
3. Envie Setup e Portable para esse rascunho, confira tamanho e SHA256 e publique como **Pre-release**, com `prerelease=true` e `make_latest=false`. Informe branch, commit e testes nas notas. Não altere os assets, a tag ou o Latest da release oficial nessa etapa.
4. Após confirmar os dois downloads, adicione/atualize uma seção separada **Build de teste — <login>** em `README.md` e `BAIXAR_MOTION_LIVRE.md` da sua branch, com os URLs reais retornados pelo GitHub. Preserve o destaque dos downloads oficiais. Esse commit documental posterior não exige rebuild; as notas continuam apontando ao commit de código efetivamente compilado.
5. Inclua os dois links e o commit compilado no PR. Mantenha apenas a prévia atual do seu próprio canal; remova as anteriores desse canal apenas depois de conferir a substituta e atualizar referências em uso. Nunca apague as prévias do colega ou a release oficial como parte dessa limpeza.

### Depois do merge: atualizar os downloads oficiais

1. Somente após `kiwor101` integrar o PR, o publicador combinado atualiza a própria branch com `origin/main`. Confirme que o código a empacotar corresponde ao commit integrado, sem arquivos locais ou novos commits de runtime não revisados. Compile e valide novamente, pois o merge pode incluir mudanças do outro desenvolvedor.
2. Preserve os dois downloads oficiais atuais até os substitutos estarem enviados e conferidos. Na release fixa `v0.0.1`, envie os novos assets com nomes temporários e compare hashes. Registre os IDs/nomes e o SHA da tag anterior; renomeie os assets anteriores como backups temporários e atribua os nomes definitivos aos novos, sem excluir os backups ainda. A troca dos dois assets não é atômica: coordene uma janela curta e, se algum passo falhar, restaure os dois nomes anteriores, preserve a tag anterior e informe o bloqueio.
3. Alinhe a tag oficial ao commit integrado efetivamente compilado e registre esse SHA, data e hashes nas notas da release. Para substituir a mesma versão fixa, a atualização controlada dessa tag faz parte da publicação autorizada: confira o valor remoto imediatamente antes e use uma condição de SHA esperado (`--force-with-lease` apenas para a referência da tag). Se ela mudou, pare; não force por cima. Isso não autoriza force push em nenhuma branch. Se a release/tag for imutável ou protegida contra substituição, preserve-a e consulte o mantenedor sobre uma nova versão.
4. Confira a tag, os hashes e os dois URLs públicos definitivos antes de remover os backups temporários. Se a tag não puder ser alinhada ao commit compilado, restaure os downloads anteriores, sem alegar que a publicação terminou. Revise `README.md` e `BAIXAR_MOTION_LIVRE.md`; mantendo versão e nomes, os URLs podem continuar iguais, mas os assets precisam ter sido realmente substituídos. Se a documentação precisar mudar, envie pela própria branch e PR para `main`; não faça push direto nela.
5. Anote a publicação no PR integrado e retire links para prévias que forem removidas. Mantenha somente os executáveis atuais em `dist/`; não apague projetos ou mídias do usuário. Não publique simultaneamente com o colega nem substitua uma build oficial mais recente por uma anterior.

### Para o chat do Emanuel receber a orientação

Na branch `dev/emanueltk7`, preserve/registre primeiro qualquer trabalho local, faça `git fetch origin --prune`, atualize com `git pull --ff-only` e mescle `origin/main`. Então peça ao chat já aberto para **reler `AGENTS.md` e `CONTRIBUTING.md`** ou inicie uma nova tarefa nessa pasta. Não suponha que uma conversa em outro computador recebeu automaticamente as instruções novas. [Referência do Codex](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

## Versão e limpeza

- A base deste ciclo é `0.0.1`. Não aumente a versão a cada correção; mudanças de versão dependem de `kiwor101`. A publicação das builds segue a autorização e os canais definidos acima.
- A versão do aplicativo e os nomes dos executáveis derivam de `package.json`. Documentação, tag e release devem corresponder ao código publicado.
- A release oficial contém somente código integrado e validado. Pré-releases identificadas da própria branch permitem testar antes do merge. Uma alteração na branch não atualiza automaticamente nenhum executável.
- `dist/` guarda somente o Setup e o Portable atuais. `.build/runtime/` é temporária e removida após a compilação bem-sucedida.
- Releases antigas só são removidas depois de confirmar os novos downloads. Preserve o histórico Git e os créditos dos colaboradores.
- Não versione executáveis, dependências, mídias de teste, credenciais, caches, capturas ou relatórios temporários. Preserve os testes de regressão que já fazem parte do código.
