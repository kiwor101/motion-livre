# Mapeamento funcional do APK AMZ_ORI_12JUL

## Identificação

- Aplicativo exibido: **After Motion Z+**
- Pacote Android: `com.alightcreative.motion`
- Versão declarada: `5.0.273.1028421` (`versionCode 9999999`)
- SDK: mínimo 24, alvo 36
- Entrada: `com.alightcreative.app.motion.activities.main.MainActivity`
- Estrutura: 9 DEX, 90 activities, 14 services, 14 receivers e 8 providers
- Código nativo ARM 32/64 bits, incluindo renderização, GIF/WebP, V8/Javet e bibliotecas de efeitos.

## Fluxo funcional recuperado

1. Onboarding e tela principal.
2. Lista/criação de projetos.
3. Editor principal por composição e camadas.
4. Navegadores de mídia, áudio, fontes e efeitos.
5. Ferramentas de cor, texto, formas, presets e preview.
6. Importação de projetos/pacotes XML e templates.
7. Pré-visualização e exportação/salvamento no dispositivo.

## Componentes excluídos da versão aberta

- Paywall, assinatura, Google Play Billing e verificação de licença.
- Redes de anúncios (Google, AppLovin, Fyber, Vungle e correlatas).
- Conta, ranking, recompensas, creator program, pesquisas e ofertas.
- Firebase Analytics/Crashlytics, attribution, push e telemetria externa.

## Arquitetura proposta para Windows

- Interface desktop offline com palco, biblioteca, inspetor e timeline.
- Modelo de projeto baseado em camadas: mídia, texto e formas.
- Propriedades: posição, escala, rotação, opacidade, cor e filtros.
- Persistência local no navegador e exportação experimental WebM.
- Evolução recomendada: Tauri + TypeScript para janela/instalador; FFmpeg para codecs e exportação; Skia/WebGPU para renderização; SQLite para projetos.

## Cobertura do protótipo

O protótipo entregue implementa importação de imagem/vídeo/áudio, composição visual, manipulação de camadas, texto, formas, seis filtros, timeline, reprodução, proporções de tela, salvamento local e exportação WebM. Ele não incorpora código proprietário, serviços online, anúncios ou pagamentos do APK.

## Limites da análise

O APK é um binário compilado e parcialmente ofuscado; portanto, não equivale ao projeto-fonte original. A análise é estática e o APK não foi executado. URLs de bibliotecas de terceiros encontradas no binário não significam necessariamente uso em todos os fluxos.
