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
.proxy-toggle { margin-left: auto; white-space: nowrap; color: var(--text); background: var(--panel2); border: 1px solid var(--line); border-radius: 6px; padding: 5px 8px; cursor: pointer; }
.proxy-toggle[aria-pressed="true"] { color: var(--accent2); border-color: var(--accent); }
.proxy-toggle:disabled { color: var(--muted); cursor: default; }
</style>
