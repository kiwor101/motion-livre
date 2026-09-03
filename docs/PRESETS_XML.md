# Presets de efeitos XML

O Motion Livre 0.7.0 salva ajustes reutilizáveis no formato aberto `.motion-effect.xml`.

O preset inclui brilho, contraste, saturação, matiz, desfoque, escala de cinza, sépia, inversão, opacidade, mesclagem, cantos, contorno, recorte e espelhamento. Para usar, selecione uma camada, abra **Efeitos** e escolha **Salvar preset de efeitos XML** ou **Importar preset XML**.

Exemplo:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<motion-livre-effect version="1">
  <metadata name="Meu efeito" created-at="2026-09-03T18:00:00.000Z"/>
  <visual brightness="110" contrast="125" saturation="140" hue="0" blur="2" grayscale="0" sepia="0" invert="0"/>
  <appearance opacity="100" blend="normal" radius="0" stroke="0" strokeColor="#000000" cropX="0" cropY="0" flipX="false" flipY="false"/>
</motion-livre-effect>
```

Os pacotes internos `.ta` encontrados no APK são binários proprietários, não XML legível. Por isso, o formato do Motion Livre é documentado e independente, permitindo criar e compartilhar presets sem depender do aplicativo Android.
