# Inventário funcional e paridade — Motion Livre

Este inventário foi produzido por análise estática do APK fornecido: manifesto, 9 arquivos DEX, 2.654 classes próprias, assets e bibliotecas nativas. “Identificado” significa que há evidência estrutural no binário; não significa que cada fluxo foi executado.

| Área | Funções identificadas no APK | Situação na versão Windows |
|---|---|---|
| Projetos | criar/renomear, lista, persistência, backup, duplicação, templates, presets, pacotes de elementos, importar XML | criar/renomear, salvar local, importar/exportar JSON e duplicar camadas implementados; formatos proprietários catalogados |
| Composição | resolução, proporção, FPS, duração, fundo, cenas aninhadas e precompose | resolução, proporção, FPS, duração e fundo implementados; agrupamento como equivalente inicial de precompose |
| Camadas | imagem, vídeo, áudio, texto, desenho, forma, câmera, objeto nulo e cena aninhada | imagem, vídeo, áudio, texto, desenho e formas implementados; câmera/nulo/cena aninhada no roadmap do motor desktop |
| Transformação | posição 2D/3D, escala, rotação/quaternion, anchor, opacidade | posição 2D, escala, rotação e opacidade implementados; 3D/quaternion e anchor catalogados |
| Animação | keyframes, easing, curvas, splines, motion paths, gráficos de velocidade | keyframes e interpolação linear implementados; easing, curvas e paths catalogados |
| Tempo | entrada/saída, trim, retiming, velocidade e cenas retimed | entrada/saída implementadas; retiming/velocidade catalogados |
| Vetores | retângulo, elipse, desenho, splines cúbicas, nós/handles, edge decoration | formas e desenho livre implementados; edição de nós e splines catalogada |
| Aparência | cor sólida, gradiente, media fill, contorno, cantos, fill type | cor, contorno e cantos implementados; gradientes/media fill catalogados |
| Composição visual | blending modes, máscaras, clipping, parenting e grupos | blending, máscara simples, grupos e ordem de camadas implementados; parenting/clipping avançado catalogados |
| Texto | navegador de fontes, estilo, tamanho, cor e animação | cinco famílias, tamanho, cor, contorno e animação por transform implementados |
| Cor | color picker, ranges, filtros e ajustes | seletor de cor e dez filtros implementados |
| Efeitos | effect browser, visual effects, parâmetros, presets e preview | catálogo e filtros CSS implementados; motor completo de efeitos depende de shaders/WebGPU |
| Áudio | navegador, camada de áudio, preview e sincronização | importação, player e sincronização básica implementados |
| Mídia | navegadores de imagem/vídeo, thumbnails, cache e compartilhamento | importação local e preview implementados |
| Exportação | preview, formatos, parâmetros, progresso, salvar/compartilhar | WebM experimental implementado; MP4/GIF/PNG/alpha dependem de FFmpeg |
| Interface | onboarding, tutorial, settings, about e novidades | mapa de recursos e configurações de projeto implementados; onboarding dispensável |
| Online/social | conta, perfil, ranking, creator program, recompensas, feed e backup | removidos por decisão da versão aberta/offline |
| Monetização | paywall, assinatura, ofertas, billing e licença | removidos por decisão da versão aberta |
| Publicidade/telemetria | redes de anúncios, attribution, analytics, Crashlytics e push | removidos por decisão da versão aberta |

## Complementos técnicos encontrados

- Renderização nativa para ARM, GIF/WebP, filtros e transformação de imagem.
- Motor JavaScript V8/Javet e scripting de cena.
- Serialização XML e pacotes de projeto/template.
- Cache de bitmaps e thumbnails.
- Firebase, serviços de conta, anúncios e monetização, deliberadamente excluídos.

## Limite de equivalência

O protótipo agora expõe toda a arquitetura funcional relevante em uma matriz verificável e implementa uma parcela maior do editor. Paridade real com centenas de efeitos, codecs, renderização 3D, scripts e formatos proprietários exige um motor desktop próprio (WebGPU/Skia + FFmpeg), testes de referência e desenvolvimento incremental. O código do APK não foi copiado para o projeto.
