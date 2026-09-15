<script setup lang="ts">
import ColorField from '../base/ColorField.vue'
import RangeField from '../base/RangeField.vue'

const sliders = [
  { label: 'Brilho', outputId: 'outBrightness', inputId: 'fxBrightness', min: 0, max: 250, value: 100, output: '100%' },
  { label: 'Contraste', outputId: 'outContrast', inputId: 'fxContrast', min: 0, max: 250, value: 100, output: '100%' },
  { label: 'Saturação', outputId: 'outSaturation', inputId: 'fxSaturation', min: 0, max: 300, value: 100, output: '100%' },
  { label: 'Matiz', outputId: 'outHue', inputId: 'fxHue', min: -180, max: 180, value: 0, output: '0°' },
  { label: 'Desfoque', outputId: 'outBlur', inputId: 'fxBlur', min: 0, max: 30, value: 0, output: '0px' },
  { label: 'Escala de cinza', outputId: 'outGrayscale', inputId: 'fxGrayscale', min: 0, max: 100, value: 0, output: '0%' },
  { label: 'Sépia', outputId: 'outSepia', inputId: 'fxSepia', min: 0, max: 100, value: 0, output: '0%' },
  { label: 'Inverter', outputId: 'outInvert', inputId: 'fxInvert', min: 0, max: 100, value: 0, output: '0%' },
  { label: 'Glow', outputId: 'outGlow', inputId: 'fxGlow', min: 0, max: 100, value: 0, output: '0%' },
  { label: 'Vinheta', outputId: 'outVignette', inputId: 'fxVignette', min: 0, max: 100, value: 0, output: '0%' },
  { label: 'Nitidez', outputId: 'outSharpen', inputId: 'fxSharpen', min: 0, max: 100, value: 0, output: '0%' },
  { label: 'Tolerância chroma', outputId: 'outChromaTolerance', inputId: 'fxChromaTolerance', min: 0, max: 100, value: 0, output: '0%' },
  { label: 'Motion blur', outputId: 'outMotionBlur', inputId: 'fxMotionBlur', min: 0, max: 30, value: 0, output: '0px' },
  { label: 'Canal vermelho', outputId: 'outRedGain', inputId: 'fxRedGain', min: 0, max: 200, value: 100, output: '100%' },
  { label: 'Canal verde', outputId: 'outGreenGain', inputId: 'fxGreenGain', min: 0, max: 200, value: 100, output: '100%' },
  { label: 'Canal azul', outputId: 'outBlueGain', inputId: 'fxBlueGain', min: 0, max: 200, value: 100, output: '100%' },
]
</script>

<template>
  <RangeField v-for="slider in sliders.slice(0, 9)" :key="slider.inputId" v-bind="slider" />
  <ColorField label="Cor do glow" input-id="fxGlowColor" value="#ffffff" />
  <RangeField v-for="slider in sliders.slice(9, 11)" :key="slider.inputId" v-bind="slider" />
  <ColorField label="Cor do chroma key" input-id="fxChromaColor" value="#00ff00" />
  <RangeField v-for="slider in sliders.slice(11)" :key="slider.inputId" v-bind="slider" />
</template>
