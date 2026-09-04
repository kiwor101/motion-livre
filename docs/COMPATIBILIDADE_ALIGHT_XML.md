# Compatibilidade Alight Motion XML

O Motion Livre 0.0.0.1 inclui uma implementação independente do formato de cenas XML usado pelo Alight Motion. Ela foi desenvolvida para interoperabilidade a partir de documentação pública, sem copiar o APK, código-fonte, shaders, chaves, anúncios ou recursos proprietários.

Referência técnica utilizada: [alight-motion-xml-schema](https://github.com/boiniArun2006/alight-motion-xml-schema), disponibilizada sob licença MIT.

## Como usar

No painel **Projeto**:

1. Clique em **Importar cena XML** para abrir um arquivo `<scene>`.
2. Confira o relatório de compatibilidade exibido após a importação.
3. Edite normalmente as camadas no Motion Livre.
4. Clique em **Exportar cena XML compatível** para salvar a cena.

As mesmas ações aparecem no menu **Projeto** e no menu nativo **Arquivo**.

## O que é convertido

- título, largura, altura, FPS, duração e fundo da composição;
- marcadores da timeline;
- formas retangulares e circulares, textos, caminhos, áudio, câmeras, nulos e grupos;
- posição, escala, rotação, âncora e opacidade;
- keyframes com tempo normalizado e curvas `cubicBezier`;
- cores, gradientes, contorno e modos de mesclagem compatíveis com Canvas/CSS;
- referências de mídia por `file:///` ou `am-internal:///`;
- brilho/contraste, saturação, matiz, desfoque, nitidez, motion blur, glow, vinheta, chroma key e inversão.

Efeitos não reconhecidos são mantidos como dados XML na camada para poderem ser reexportados, mas não recebem uma prévia visual idêntica. O relatório lista esses casos.

## Limites reais

- Um XML sozinho normalmente não carrega os arquivos de vídeo, imagem e áudio. Referências `am-internal:///` pertencem a pacotes `.alight`; a mídia precisa ser religada/importada no computador.
- O Motion Livre não redistribui os shaders e efeitos proprietários do APK. Um efeito preservado no XML pode aparecer somente ao abrir o arquivo em uma ferramenta que possua o motor original.
- Camadas e recursos desconhecidos são importados com uma representação aproximada e seus metadados compatíveis são preservados quando possível.
- Esta função não converte bytecode Android em código Windows. Ela implementa o comportamento e o formato de projeto de forma independente.

## Segurança

- limite de 10 MB por XML;
- limite de 5.000 camadas e 10.000 keyframes por propriedade;
- rejeição de `DOCTYPE` e entidades externas;
- URLs HTTP/HTTPS de mídia não são carregadas automaticamente.

## Formatos diferentes

- `.motion.json`: projeto nativo editável do Motion Livre;
- `.motion-effect.xml`: preset visual nativo aplicado a uma camada;
- `.xml` com raiz `<scene>`: intercâmbio compatível com Alight Motion.
