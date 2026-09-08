# Trabalhando juntos no Motion Livre

## Responsabilidades

- `kiwor101` trabalha em `dev/kiwor101`, revisa e integra as entregas na `main` e publica versões.
- `emanueltk7` trabalha em `dev/emanueltk7` e envia suas entregas por Pull Request para `main`.
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
4. Quando estiver pronto, atualize novamente com `origin/main`, valide e marque o PR como pronto para revisão.

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
4. Não exclua a branch pessoal após o merge.
5. Os dois repetem os comandos de atualização antes de começar o próximo pacote.

Mantemos merge commits porque as branches são reutilizadas. Squash/rebase nessas entregas faria as branches pessoais conservarem commits que a `main` não reconhece como já integrados.

## Executar e validar

Preparação e compilação estão no [README](README.md). `pnpm dev` ou `npm run dev` abre o editor; `pnpm dist` gera os dois executáveis.

Antes de entregar, use `git diff --check`, verifique a sintaxe dos JavaScript alterados com `node --check` e execute os testes relevantes existentes em `tools/test-*.cjs`. Os testes de interface usam Playwright e Microsoft Edge; `PLAYWRIGHT_PATH` pode apontar para uma instalação local de Playwright disponível no ambiente. Não acrescente caminhos de outro computador ao código.

Valide também o comportamento alterado com mídia real quando envolver importação, cortes, áudio ou exportação. Descreva no PR o que foi testado e o que não foi. Não declare a suíte inteira aprovada se apenas parte foi executada.

## Versão e limpeza

- A base deste ciclo é `0.0.1`. Não aumente a versão a cada correção; mudanças de versão e publicação dependem de `kiwor101`.
- A versão do aplicativo e os nomes dos executáveis derivam de `package.json`. Documentação, tag e release devem corresponder ao código publicado.
- Publique somente código integrado e validado. Uma alteração na branch não atualiza automaticamente o download do aplicativo.
- `dist/` guarda somente o Setup e o Portable atuais. `.build/runtime/` é temporária e removida após a compilação bem-sucedida.
- Releases antigas só são removidas depois de confirmar os novos downloads. Preserve o histórico Git e os créditos dos colaboradores.
- Não versione executáveis, dependências, mídias de teste, credenciais, caches, capturas ou relatórios temporários. Preserve os testes de regressão que já fazem parte do código.
