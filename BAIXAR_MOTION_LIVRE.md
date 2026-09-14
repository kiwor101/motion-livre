# ⬇️ Baixar Motion Livre 0.0.1

## [BAIXAR INSTALADOR PARA WINDOWS](https://github.com/kiwor101/motion-livre/releases/download/v0.0.1/Motion-Livre-Setup-0.0.1-x64.exe)

Instala o programa, permite escolher a pasta e cria atalhos no Windows.

## [BAIXAR VERSÃO PORTÁTIL](https://github.com/kiwor101/motion-livre/releases/download/v0.0.1/Motion-Livre-Portable-0.0.1-x64.exe)

Pode ser executada diretamente, sem instalação. O Portable ainda usa extração temporária, configurações e caches no perfil do Windows; mantenha espaço livre em disco.

Requisitos: Windows 10 ou Windows 11 de 64 bits. Os pacotes incluem Electron, FFmpeg e FFprobe; o usuário não precisa instalar Node.js, Rust ou ferramentas de desenvolvimento.

[Ver os dois executáveis e as notas da versão 0.0.1](https://github.com/kiwor101/motion-livre/releases/tag/v0.0.1). Os arquivos **Source code** são o código-fonte, não os executáveis.

Os links acima são da versão **oficial**. Builds de branches pessoais, quando publicadas, são identificadas como **Pre-release** para testes e devem aparecer em uma seção separada, com links próprios. Cada atualização do aplicativo deve entregar os dois formatos; veja as [orientações de publicação](CONTRIBUTING.md#setup-e-portable-fazem-parte-da-entrega).


## Prévia anterior — emanueltk7

Snapshot anterior para QA da timeline. Não inclui a correção de waveform `9b9cf74` nem os ajustes da revisão de integração. Para usar a build oficial atualizada, prefira os downloads destacados acima.
Commit compilado: `2294f32530b10d82ad70d54689f575f9992d0861`.

- [Motion-Livre-Portable-0.0.1-x64.exe](https://github.com/kiwor101/motion-livre/releases/download/preview-emanueltk7-2294f32/Motion-Livre-Portable-0.0.1-x64.exe)
- [Motion-Livre-Setup-0.0.1-x64.exe](https://github.com/kiwor101/motion-livre/releases/download/preview-emanueltk7-2294f32/Motion-Livre-Setup-0.0.1-x64.exe)

As validações e limitações desse snapshot estão nas notas da pré-release. A revisão de integração corrigiu o falso positivo do teste de cursor (comparação textual de `0.05` e `.05`); isso não modifica retroativamente os binários dessa prévia.
