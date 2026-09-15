# Compatibilidade Alight Motion XML

O Motion Livre 0.0.1 inclui uma implementação independente do formato de cenas XML usado pelo Alight Motion. Ela foi desenvolvida para interoperabilidade a partir de documentação pública.

Referência técnica utilizada: [alight-motion-xml-schema](https://github.com/boiniArun2006/alight-motion-xml-schema), disponibilizada sob licença MIT.

## Papel do XML na arquitetura

O estado central do editor pertence ao modelo TypeScript do Motion Livre. Projetos nativos completos são salvos em `.motion.json`; XML é a representação oficial de interoperabilidade e pode ser usado em presets quando sua estrutura trouxer vantagem.

Ao gerar XML, cenas, camadas, propriedades, keyframes e efeitos com equivalente conhecido devem seguir a hierarquia, os nomes e a semântica do esquema compatível do Alight Motion. Dados exclusivos do Motion Livre devem ser extensões documentadas e identificáveis, sem redefinir elementos compatíveis. Essa regra permite aproveitar o formato como parte da arquitetura do Motion Livre sem prender o modelo interno às limitações de outro aplicativo.

A compatibilidade é independente e baseada em documentação pública e testes. Ela não inclui código, shaders nem outros componentes proprietários.

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

Efeitos não reconhecidos são mantidos como dados estruturados na camada para poderem ser reexportados, mas não recebem uma prévia visual idêntica. O relatório lista esses casos. O identificador interno remove apenas o namespace `com.alightcreative.effects.` (ou `com.alightcreative.` quando aplicável); o identificador original completo continua armazenado para o round-trip.

A pilha preserva a ordem e efeitos repetidos. Também são conservados `hidden`, `locallyApplied`, atributos adicionais, tipos de propriedade e keyframes de parâmetros — inclusive tempos negativos ou acima de `1` e curvas `cubicBezier`. Esses contratos preparam implementações futuras sem afirmar equivalência visual antes que cada efeito tenha seu próprio motor.

## Limites reais

- Um XML sozinho normalmente não carrega os arquivos de vídeo, imagem e áudio. Referências `am-internal:///` pertencem a pacotes `.alight`; a mídia precisa ser religada/importada no computador.
- O Motion Livre não redistribui shaders ou efeitos proprietários. Um efeito preservado no XML pode aparecer somente ao abrir o arquivo em uma ferramenta que possua o motor original.
- Camadas e recursos desconhecidos são importados com uma representação aproximada e seus metadados compatíveis são preservados quando possível.
- Esta função não converte bytecode Android em código Windows. Ela implementa o comportamento e o formato de projeto de forma independente.

## Limites de importação

- limite de 10 MB por XML;
- limite de 5.000 camadas e 10.000 keyframes por propriedade;
- rejeição de `DOCTYPE` e entidades externas;
- URLs HTTP/HTTPS de mídia não são carregadas automaticamente.
- a importação valida a cena inteira antes de substituir o projeto aberto; falhas não devem deixar camadas parcialmente importadas.

## Formatos diferentes

- `.motion.json`: projeto nativo editável do Motion Livre;
- `.motion-effect.xml`: preset visual nativo aplicado a uma camada;
- `.xml` com raiz `<scene>`: intercâmbio compatível com Alight Motion.
