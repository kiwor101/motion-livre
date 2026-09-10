# Presets de efeitos XML

O Motion Livre 0.0.1 salva ajustes reutilizáveis no formato aberto `.motion-effect.xml`.

O preset inclui brilho, contraste, saturação, matiz, desfoque, escala de cinza, sépia, inversão, RGB, glow, vinheta, nitidez, chroma key, motion blur, opacidade, mesclagem, gradiente, transições, máscaras, contorno, recorte e espelhamento. Para usar, selecione uma camada, abra **Efeitos** e escolha **Salvar preset de efeitos XML** ou **Importar preset XML**.

Exemplo:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<motion-livre-effect version="1">
  <metadata name="Meu efeito" created-at="2026-09-03T18:00:00.000Z"/>
  <visual brightness="110" contrast="125" saturation="140" hue="0" blur="2" grayscale="0" sepia="0" invert="0"/>
  <appearance opacity="100" blend="normal" radius="0" stroke="0" strokeColor="#000000" cropX="0" cropY="0" flipX="false" flipY="false"/>
</motion-livre-effect>
```

O formato do Motion Livre é documentado e independente, permitindo criar e compartilhar presets entre projetos.

O formato mostrado acima é a versão nativa inicial e deve continuar importável. A evolução do escritor de presets deve reutilizar a estrutura de propriedades, keyframes e efeitos compatível com o XML do Alight Motion sempre que houver equivalente validado. Informações exclusivas do Motion Livre devem usar extensão documentada, sem inventar outra representação para um mesmo conceito já coberto pelo esquema compatível.

Presets continuam passando pelo modelo tipado e pelos mesmos comandos de efeitos; o XML não deve conter uma implementação paralela das regras do editor.

O arquivo `.motion-effect.xml` é um preset nativo de uma camada. Para trocar cenas completas com o ecossistema Alight Motion, use **Projeto → Importar/Exportar cena XML compatível**. Consulte [COMPATIBILIDADE_ALIGHT_XML.md](COMPATIBILIDADE_ALIGHT_XML.md).
