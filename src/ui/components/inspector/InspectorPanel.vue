<script setup lang="ts">
import AppearanceProperties from './AppearanceProperties.vue'
import LayerActions from './LayerActions.vue'
import StyleProperties from './StyleProperties.vue'
import TransformProperties from './TransformProperties.vue'
import AnimationPanel from '../library/AnimationPanel.vue'
import AudioPanel from '../library/AudioPanel.vue'
import CutPanel from '../library/CutPanel.vue'
import EffectActions from '../library/EffectActions.vue'
import EffectControls from '../library/EffectControls.vue'
import AppIcon from '../base/AppIcon.vue'
</script>

<template>
  <aside class="inspector">
    <div id="noSelection" class="empty"><strong>Nada selecionado</strong><span>Selecione um clipe ou camada para editar.</span></div>
    <div id="properties" hidden>
      <nav class="property-tabs" aria-label="Categorias de propriedades"><button class="active" title="Transformação"><AppIcon name="open-with" :size="16" /></button><button title="Estilo"><AppIcon name="opacity" :size="16" /></button><button title="Animação"><AppIcon name="animation" :size="16" /></button></nav>
      <div class="property-content">
        <details class="transform-section" open><summary>Transformação <AppIcon name="expand-more" :size="15" /></summary><section><TransformProperties /></section></details>
        <details class="appearance-section" open><summary>Aparência <AppIcon name="expand-more" :size="15" /></summary><section><AppearanceProperties /></section></details>
        <details class="style-section" open><summary>Conteúdo e tipografia <AppIcon name="expand-more" :size="15" /></summary><section><StyleProperties /></section></details>
        <details><summary>Corte e tempo <AppIcon name="expand-more" :size="15" /></summary><section><CutPanel /></section></details>
        <details><summary>Áudio <AppIcon name="expand-more" :size="15" /></summary><section><AudioPanel /></section></details>
        <details><summary>Animação <AppIcon name="expand-more" :size="15" /></summary><section><AnimationPanel /></section></details>
        <details><summary>Efeitos <AppIcon name="expand-more" :size="15" /></summary><section><EffectControls /><EffectActions /></section></details>
        <details><summary>Camada <AppIcon name="expand-more" :size="15" /></summary><section><LayerActions /></section></details>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.inspector :deep(.wide) {
  margin-top: 8px;
}
.inspector #properties:not([hidden]){padding:0!important;display:grid;grid-template-columns:42px minmax(0,1fr);align-items:start}
.property-tabs{position:sticky;top:0;min-height:100%;display:flex;flex-direction:column;gap:2px;padding:5px;border-right:1px solid var(--line);background:var(--bg)}
.property-tabs button{width:32px;height:32px;padding:0;display:grid;place-items:center;border:0;border-radius:5px;background:transparent;color:#727278}.property-tabs button.active{background:#102b3b;color:#23b5ef}
.property-content{min-width:0}.property-content details{border-bottom:1px solid var(--line)}.property-content summary{height:42px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;color:var(--text);font-size:12px;font-weight:600;cursor:pointer;list-style:none}.property-content details[open]>summary :deep(.app-icon){transform:rotate(180deg)}.property-content details>section{padding:0 14px 15px}.property-content :deep(.panel){display:block!important}.property-content :deep(.panel>h2),.property-content :deep(.panel>p){display:none}.property-content :deep(label){margin:9px 0;font-size:10px}.property-content :deep(input),.property-content :deep(select){min-height:29px!important;border-radius:5px!important}
.property-content :deep(input[type='file']){display:none!important}
.inspector #properties[data-kind] .property-content{display:flex;flex-direction:column}.inspector #properties[data-kind='text'] .style-section{order:-3}.inspector #properties[data-kind='text'] .transform-section{order:-2}.inspector #properties[data-kind='text'] .appearance-section{order:-1}
</style>
