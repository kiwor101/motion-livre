<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface EffectStackItem {
  key: string
  label: string
}

const items = ref<EffectStackItem[]>([])
const hasSelection = ref(false)

function updateItems(event: Event) {
  const detail = (event as CustomEvent<{ items: EffectStackItem[]; hasSelection: boolean }>).detail
  items.value = detail.items
  hasSelection.value = detail.hasSelection
}

function act(action: 'up' | 'down' | 'remove', key: string) {
  window.dispatchEvent(new CustomEvent('motion:effect-stack-action', { detail: { action, key } }))
}

onMounted(() => window.addEventListener('motion:effect-stack-update', updateItems))
onBeforeUnmount(() => window.removeEventListener('motion:effect-stack-update', updateItems))
</script>

<template>
  <div id="effectStack" class="effect-stack">
    <div v-if="hasSelection && !items.length" class="empty">Nenhum ajuste ativo</div>
    <div v-for="(item, index) in items" :key="item.key" class="effect-chip">
      <span>{{ item.label }}</span>
      <span>
        <button type="button" :data-up="item.key" :disabled="index === 0" aria-label="Mover efeito para cima" @click="act('up', item.key)">↑</button>
        <button type="button" :data-down="item.key" :disabled="index === items.length - 1" aria-label="Mover efeito para baixo" @click="act('down', item.key)">↓</button>
        <button type="button" :data-remove-fx="item.key" aria-label="Remover efeito" @click="act('remove', item.key)">×</button>
      </span>
    </div>
  </div>
</template>

<style scoped>
.effect-stack {
  margin: 10px 0;
}

.effect-chip {
  display: flex;
  justify-content: space-between;
  gap: 7px;
  margin: 4px 0;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--panel2);
  font-size: 11px;
}

.effect-chip > span:last-child {
  display: flex;
  flex: 0 0 auto;
}

.effect-chip button {
  border: 0;
  background: transparent;
  color: #ff9ca5;
  cursor: pointer;
}
</style>
