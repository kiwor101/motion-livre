<script setup lang="ts">
const presets = [
  ['none', 'Original'], ['grayscale(1)', 'P&B'], ['sepia(.8)', 'Sépia'],
  ['blur(3px)', 'Desfoque'], ['contrast(1.5)', 'Contraste'], ['saturate(1.8)', 'Vibrante'],
  ['brightness(1.35)', 'Luz'], ['hue-rotate(90deg)', 'Matiz'], ['invert(1)', 'Inverter'],
  ['drop-shadow(8px 8px 8px #000)', 'Sombra'],
]

const sliders = [
  { label: 'Brilho', output: 'outBrightness', id: 'fxBrightness', min: 0, max: 250, value: 100, text: '100%' },
  { label: 'Contraste', output: 'outContrast', id: 'fxContrast', min: 0, max: 250, value: 100, text: '100%' },
  { label: 'Saturação', output: 'outSaturation', id: 'fxSaturation', min: 0, max: 300, value: 100, text: '100%' },
  { label: 'Matiz', output: 'outHue', id: 'fxHue', min: -180, max: 180, value: 0, text: '0°' },
  { label: 'Desfoque', output: 'outBlur', id: 'fxBlur', min: 0, max: 30, value: 0, text: '0px' },
  { label: 'Escala de cinza', output: 'outGrayscale', id: 'fxGrayscale', min: 0, max: 100, value: 0, text: '0%' },
  { label: 'Sépia', output: 'outSepia', id: 'fxSepia', min: 0, max: 100, value: 0, text: '0%' },
  { label: 'Inverter', output: 'outInvert', id: 'fxInvert', min: 0, max: 100, value: 0, text: '0%' },
  { label: 'Glow', output: 'outGlow', id: 'fxGlow', min: 0, max: 100, value: 0, text: '0%' },
  { label: 'Vinheta', output: 'outVignette', id: 'fxVignette', min: 0, max: 100, value: 0, text: '0%' },
  { label: 'Nitidez', output: 'outSharpen', id: 'fxSharpen', min: 0, max: 100, value: 0, text: '0%' },
  { label: 'Tolerância chroma', output: 'outChromaTolerance', id: 'fxChromaTolerance', min: 0, max: 100, value: 0, text: '0%' },
  { label: 'Motion blur', output: 'outMotionBlur', id: 'fxMotionBlur', min: 0, max: 30, value: 0, text: '0px' },
  { label: 'Canal vermelho', output: 'outRedGain', id: 'fxRedGain', min: 0, max: 200, value: 100, text: '100%' },
  { label: 'Canal verde', output: 'outGreenGain', id: 'fxGreenGain', min: 0, max: 200, value: 100, text: '100%' },
  { label: 'Canal azul', output: 'outBlueGain', id: 'fxBlueGain', min: 0, max: 200, value: 100, text: '100%' },
]
</script>

<template>
  <div id="panel-effects" class="panel">
    <h2>Efeitos</h2><p>Aplicados à camada selecionada.</p>
    <div class="effect-list"><button v-for="preset in presets" :key="preset[0]" :data-effect="preset[0]">{{ preset[1] }}</button></div>
    <hr>
    <template v-for="slider in sliders.slice(0, 9)" :key="slider.id">
      <label>{{ slider.label }} <output :id="slider.output">{{ slider.text }}</output><input :id="slider.id" type="range" :min="slider.min" :max="slider.max" :value="slider.value"></label>
    </template>
    <label>Cor do glow<input id="fxGlowColor" type="color" value="#ffffff"></label>
    <template v-for="slider in sliders.slice(9, 11)" :key="slider.id">
      <label>{{ slider.label }} <output :id="slider.output">{{ slider.text }}</output><input :id="slider.id" type="range" :min="slider.min" :max="slider.max" :value="slider.value"></label>
    </template>
    <label>Cor do chroma key<input id="fxChromaColor" type="color" value="#00ff00"></label>
    <template v-for="slider in sliders.slice(11)" :key="slider.id">
      <label>{{ slider.label }} <output :id="slider.output">{{ slider.text }}</output><input :id="slider.id" type="range" :min="slider.min" :max="slider.max" :value="slider.value"></label>
    </template>
    <div id="effectStack" class="effect-stack"></div>
    <button id="resetEffects" class="wide">Restaurar efeitos</button>
    <hr>
    <button id="saveEffectXml" class="wide">Salvar preset de efeitos XML</button>
    <button id="openEffectXml" class="wide">Importar preset XML</button>
  </div>
</template>
