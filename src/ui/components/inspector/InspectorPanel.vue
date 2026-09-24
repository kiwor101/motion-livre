<script setup lang="ts">
import { ref } from 'vue'
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

type PropertyTab = 'transform' | 'appearance' | 'style' | 'cut' | 'audio' | 'animation' | 'effects' | 'layer'
const activeTab = ref<PropertyTab>('transform')
const tabs: Array<{ id: PropertyTab; icon: string; label: string }> = [
  { id: 'transform', icon: 'open-with', label: 'Transformação' },
  { id: 'appearance', icon: 'opacity', label: 'Aparência' },
  { id: 'style', icon: 'title', label: 'Conteúdo e tipografia' },
  { id: 'cut', icon: 'content-cut', label: 'Corte e tempo' },
  { id: 'audio', icon: 'music-note', label: 'Áudio' },
  { id: 'animation', icon: 'animation', label: 'Animação' },
  { id: 'effects', icon: 'auto-awesome', label: 'Efeitos' },
  { id: 'layer', icon: 'layers', label: 'Camada' },
]
</script>

<template>
  <aside class="inspector">
    <div id="noSelection" class="empty"><strong>Nada selecionado</strong><span>Selecione um clipe ou camada para editar.</span></div>
    <div id="properties" hidden>
      <nav class="property-tabs" aria-label="Categorias de propriedades">
        <button v-for="tab in tabs" :key="tab.id" type="button" :class="{ active: activeTab === tab.id }" :title="tab.label" :aria-label="tab.label" :aria-pressed="activeTab === tab.id" @click="activeTab = tab.id"><AppIcon :name="tab.icon" :size="19" /></button>
      </nav>
      <div class="property-content">
        <details v-show="activeTab === 'transform'" class="transform-section" open><summary>Transformação <AppIcon name="expand-more" :size="15" /></summary><section><TransformProperties /></section></details>
        <details v-show="activeTab === 'appearance'" class="appearance-section" open><summary>Aparência <AppIcon name="expand-more" :size="15" /></summary><section><AppearanceProperties /></section></details>
        <details v-show="activeTab === 'style'" class="style-section" open><summary>Conteúdo e tipografia <AppIcon name="expand-more" :size="15" /></summary><section><StyleProperties /></section></details>
        <details v-show="activeTab === 'cut'" open><summary>Corte e tempo <AppIcon name="expand-more" :size="15" /></summary><section><CutPanel /></section></details>
        <details v-show="activeTab === 'audio'" open><summary>Áudio <AppIcon name="expand-more" :size="15" /></summary><section><AudioPanel /></section></details>
        <details v-show="activeTab === 'animation'" open><summary>Animação <AppIcon name="expand-more" :size="15" /></summary><section><AnimationPanel /></section></details>
        <details v-show="activeTab === 'effects'" open><summary>Efeitos <AppIcon name="expand-more" :size="15" /></summary><section><EffectControls /><EffectActions /></section></details>
        <details v-show="activeTab === 'layer'" open><summary>Camada <AppIcon name="expand-more" :size="15" /></summary><section><LayerActions /></section></details>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.inspector { height:100%; min-height:0; padding:0; overflow:hidden; border:1px solid var(--panel-border); border-radius:6px; background:var(--panel-background); }
.inspector>.empty { height:100%; min-height:180px; padding:42px 24px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; color:var(--muted-foreground); text-align:center; }
.inspector>.empty strong { color:var(--panel-foreground); font-size:12px; }
.inspector>.empty span { max-width:180px; font-size:11px; }
.inspector :deep(.wide) {
  margin-top: 8px;
}
.inspector #properties:not([hidden]){height:100%;min-height:0;padding:0!important;display:grid;grid-template-columns:48px minmax(0,1fr);overflow:hidden}
.property-tabs{height:100%;min-height:0;display:flex;flex-direction:column;gap:2px;padding:5px;border-right:1px solid var(--panel-border);background:var(--panel-background);overflow-y:auto}
.property-tabs button{width:36px;height:36px;padding:0;display:grid;place-items:center;border:0;border-radius:5px;background:transparent;color:var(--muted-foreground)}.property-tabs button.active{background:var(--secondary);color:var(--secondary-foreground)}
.property-content{min-width:0;height:100%;min-height:0;overflow-y:auto}.property-content details{border-bottom:1px solid var(--panel-border)}.property-content summary{height:48px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;color:var(--panel-foreground);font-size:13px;font-weight:600;cursor:pointer;list-style:none}.property-content details[open]>summary :deep(.app-icon){transform:rotate(180deg)}.property-content details>section{padding:0 16px 16px}.property-content :deep(.panel){display:block!important}.property-content :deep(.panel>h2),.property-content :deep(.panel>p){display:none}.property-content :deep(label){margin:10px 0;font-size:12px}.property-content :deep(input),.property-content :deep(select){min-height:28px!important;border-radius:5px!important}
.property-content :deep(input[type='file']){display:none!important}
.inspector #properties[data-kind] .property-content{display:block}
</style>
