<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import CompositionAspectSelect from './CompositionAspectSelect.vue'
import ResolutionControl from './ResolutionControl.vue'
const proxyAvailable = ref(false)
const proxyEnabled = ref(true)
function updateProxyStatus(event: Event) {
  const status = (event as CustomEvent<{ available: boolean; enabled: boolean }>).detail
  proxyAvailable.value = status.available
  proxyEnabled.value = status.enabled
}
onMounted(() => window.addEventListener('motion:proxy-status', updateProxyStatus))
onBeforeUnmount(() => window.removeEventListener('motion:proxy-status', updateProxyStatus))
function toggleProxy() {
  window.dispatchEvent(new CustomEvent('motion:toggle-proxy', { detail: !proxyEnabled.value }))
}
</script>

<template>
  <div class="stage-toolbar">
    <span>Composição</span>
    <CompositionAspectSelect />
    <ResolutionControl />
    <button type="button" class="proxy-toggle" :disabled="!proxyAvailable" :aria-pressed="proxyAvailable && proxyEnabled" :title="proxyAvailable ? 'Alternar entre proxy e vídeo original' : 'Proxy disponível apenas para vídeos acima de 1080p'" @click="toggleProxy">
      {{ !proxyAvailable ? 'Original · sem proxy' : proxyEnabled ? 'Proxy ativo' : 'Vídeo original' }}
    </button>
  </div>
</template>

<style scoped>
.stage-toolbar { position:relative; z-index:300; display:flex; align-items:center; gap:10px; width:100%; height:40px; padding:0 12px; border:0; border-bottom:1px solid var(--panel-border); background:transparent; color:var(--panel-foreground); font-size:12px; }
.stage-toolbar > span { margin-right:0; font-size:12px; font-weight:600; line-height:1.35; }
.stage-toolbar :deep(select option) { background: var(--panel2); color: var(--text); }
.proxy-toggle { height:28px; margin-left:auto; padding:0 8px; white-space:nowrap; color:var(--panel-foreground); background:var(--panel-input); border:1px solid var(--panel-border); border-radius:5px; font-size:10px; cursor:pointer; }
.proxy-toggle[aria-pressed="true"] { color: var(--accent2); border-color: var(--accent); }
.proxy-toggle:disabled { color: var(--muted); cursor: default; }
</style>
